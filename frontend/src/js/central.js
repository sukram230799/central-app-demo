import axios from 'axios';
import {
  currentAccountStore, accountsStore,
  selectedFilterStore, selectedFilterDefaults, timeRanges,
  groupCacheStore, labelCacheStore, siteCacheStore,
} from './svelte-store.js';

// const proxy = `${window.location.origin}/api-proxy`;
// const proxy = `http://localhost:26799/api-proxy`;
// const backend = 'https://internal-apigw.central.arubanetworks.com/';

const rateBucketMax = 10;

class Central {

  rateBucket = rateBucketMax;
  _ready_promise;
  proxy;
  account;
  filters;
  log = process.env.NODE_ENV !== "production";
  constructor() {
    setInterval(() => {
      if (this.rateBucket < rateBucketMax) {
        this.pourMeSomeApi(1);
      }
    }, 2 * 1000);

    this.filters = selectedFilterDefaults;
    this._ready_promise = new Promise((resolve) => {
      currentAccountStore.subscribe((value) => {
        this.account = value;
        if (value?.credential?.access_token) {
          console.log('Central is Ready'); return resolve();
        } else {
          console.log('Central is not Ready');
        }
      });
    })
    selectedFilterStore.subscribe((value) => this.filters = value);
    this.proxy = `${window.location.origin}/api-proxy`;

  }

  /**
   * Await ready
   * @returns Promise
   * 
   * Resolves the promise when API Keys are available
   */
  ready(chargeRate = 0) {
    this.pourMeSomeApi(chargeRate - 1);
    return this._ready_promise;
  }

  pourMeSomeApi(chargeRate) {
    this.rateBucket += chargeRate;
    if (this.rateBucket > rateBucketMax) this.rateBucket = rateBucketMax;

    console.log('Pour me some API', this.rateBucket);
  }

  async request(path, options) {
    if (--this.rateBucket <= 0) {
      alert('Ratelimit Exceeded');
      // throw { message: "Ratelimit Exceeded" } // Don't throw yet. The alert should be blocking :D
    };
    let body = {
      headers: { 'Authorization': `Bearer ${this.account.credential.access_token}` },
      ...options,
      url: `${this.account.base_url}${path}`,

    };
    // debugger;

    let response = await axios.post(this.proxy, body);

    // debugger;

    if (response.data.status === 401) {
      await this.refreshToken();

      body.headers.Authorization = `Bearer ${this.account.credential.access_token}`;

      response = await axios.post(this.proxy, body);
    }

    if (this.log)
    console.log(response);

    return response.data;
  }

  /**
   * Send GET request via proxy
   * @param {string} path Path to request from central api
   * @param {{ data: {}, headers: {}, params: {} }} options Options to pass to central
   * @returns {Object}
   */
  async get(path, options = {}) {
    return await this.request(path, { ...options, method: 'GET' });
  }

  /**
   * Send POST request via proxy
   * @param {string} path Path to request from central api
   * @param {{ data: {}, headers: {}, params: {} }} options Options to pass to central
   * @returns {Object}
   */
  async post(path, options = {}) {
    return await this.request(path, { ...options, method: 'POST' });
  }

  /**
   * Send DELETE request via proxy
   * @param {string} path Path to request from central api
   * @param {{ data: {}, headers: {}, params: {} }} options Options to pass to central
   * @returns {Object}
   */
  async delete(path, options = {}) {
    return await this.request(path, { ...options, method: 'DELETE' });
  }
  async refreshToken() {
    let refreshBody = {
      // baseUrl: baseUrl,
      url: `${this.account.base_url}/oauth2/token`,
      method: 'POST',
      params: {
        client_id: this.account.client_id,
        client_secret: this.account.client_secret,
        grant_type: 'refresh_token',
        refresh_token: this.account.credential.refresh_token,
      }
    };
    let credentialResponse = await axios.post(this.proxy, refreshBody);

    if (credentialResponse.data.status === 200) {

      console.log(`Credentials Updated, expires in ${credentialResponse.data.responseBody.expires_in}`);

      accountsStore.update((value) => {
        value[this.account.id].credential.access_token = credentialResponse.data.responseBody.access_token;
        value[this.account.id].credential.refresh_token = credentialResponse.data.responseBody.refresh_token;
        value[this.account.id].credential.expires_in = credentialResponse.data.responseBody.expires_in;
        value[this.account.id].base_url = 'https://internal-apigw.central.arubanetworks.com/';

        return value;
      });
    } else {
      // throw { name: 'TokenNotUpdated', message: 'Token could not be updated.' };
    }

    // return credentialResponse.data.responseBody.access_token;
  }

  handleResponse(response, log = this.log) {
    if (log)
      console.log(response);
    if (response.status >= 200 && response.status < 300)
      return response.responseBody;
    else throw { name: 'HTTP Error', message: `HTTP Status ${response.status}`, options: response };
  }

  async getDeviceFirmware(serial) {
    let firmwareResponse = await this.get(`firmware/v1/devices/${serial}`);
    return this.handleResponse(firmwareResponse);
  }

  /**
   * List Wireless Clients
   * @deprecated works but listUnifiedClients is the way forward
   * @param {*} group 
   * @param {*} swarm_id 
   * @param {*} label 
   * @param {*} site 
   * @param {*} network 
   * @param {*} serial 
   * @param {*} os_type 
   * @param {*} cluster_id 
   * @param {*} band 
   * @param {*} fields 
   * @param {*} calculate_total 
   * @param {*} offset 
   * @param {*} limit 
   * @param {*} sort 
   * @param {*} last_client_mac 
   * @returns {} { "count": 3, "total": 4, "clients": [] }
   * 
   * Get a list of wireless clients. You can only specify one of group, swarm_id, label parameters.
   * 
   * ---
   * 
   * https://developer.arubanetworks.com/aruba-central/reference/apiexternal_controllerget_wireless_clients
   */
  async listWirelessClients(group = null, swarm_id = null, label = null, site = null, network = null, serial = null, os_type = null, cluster_id = null, band = null, fields = null, calculate_total = false, offset = null, limit = null, sort = null, last_client_mac = null) {
    let clientsResponse = await this.get('monitoring/v1/clients/wireless', {
      params: {
        group,
        swarm_id,
        label,
        site,
        network,
        serial,
        os_type,
        cluster_id,
        band,
        fields,
        calculate_total,
        offset,
        limit,
        last_client_mac,
      }
    });

    return this.handleResponse(clientsResponse);
  }

  /**
   * List Wired Clients
   * @deprecated works but listUnifiedClients is the way forward
   * @param {*} group 
   * @param {*} swarm_id 
   * @param {*} label 
   * @param {*} site 
   * @param {*} network 
   * @param {*} serial 
   * @param {*} cluster_id 
   * @param {*} stack_id 
   * @param {*} fields 
   * @param {*} calculate_total 
   * @param {*} offset 
   * @param {*} limit 
   * @param {*} sort 
   * @param {*} last_client_mac 
   * @returns 
   * Get a list of wired clients. You can only specify one of group, swarm_id, cluster_id, stack_id and label parameters.
   * 
   * ---
   * 
   * https://developer.arubanetworks.com/aruba-central/reference/apiexternal_controllerget_wired_clients
   */
  async listWiredClients(group = null, swarm_id = null, label = null, site = null, network = null, serial = null, cluster_id = null, stack_id = null, fields = null, calculate_total = false, offset = null, limit = null, sort = null, last_client_mac = null) {
    let clientsResponse = await this.get('monitoring/v1/clients/wired', {
      params: {
        group,
        swarm_id,
        label,
        site,
        network,
        serial,
        cluster_id,
        stack_id,
        fields,
        calculate_total,
        offset,
        limit,
        last_client_mac,
      }
    });

    return this.handleResponse(clientsResponse);
  }

  /**
   * 
   * @param {*} param0 
   * @returns 
   * This is a unified form of List APIs /monitoring/v1/clients/wired and /monitoring/v1/clients/wireless and it is backward compatible with these v1 apis.
   *
   * Get a list of unified clients. You can only specify one of group, swarm_id, cluster_id, network, site and
   * label parameters.
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apiexternal_controllerget_v2_unified_clients
   */
  async listUnifiedClients({
    group,
    swarm_id,
    label,
    site,
    network,
    serial,
    cluster_id,
    band,
    stack_id,
    os_type,
    fields,
    calculate_total = false,
    offset,
    limit,
    sort,
    last_client_mac,
    timerange = '3H',
    client_type = 'WIRELESS',
    client_status = "CONNECTED",
    show_usage,
    show_manufacturer,
    show_signal_db } = {}) {
    let clientsResponse = await this.get('monitoring/v2/clients', {
      params: {
        group,
        swarm_id,
        label,
        site,
        network,
        serial,
        cluster_id,
        band,
        stack_id,
        os_type,
        fields,
        calculate_total,
        offset,
        limit,
        last_client_mac,
        timerange,
        client_type,
        client_status,
        show_usage,
        show_manufacturer,
        show_signal_db
      }
    });

    return this.handleResponse(clientsResponse);
  }

  async listUnifiedClientsFiltered() {
    // debugger;
    let params = {
      group: this.filters.group, site: this.filters.site, label: this.filters.label,
      client_status: this.filters.clientStatus, network: this.filters.network,
      serial: this.filters.serial, swarm_id: this.filters.swarmId, cluster_id: this.filters.clusterId, band: this.filters.band,
      stack_id: this.filters.stackId, os_type: this.filters.osType,

      client_type: this.filters.clientType,
      timerange: timeRanges[this.filters.timeRange],

      show_manufacturer: 'manufacturer' in this.filters.additionalFields,
      show_usage: 'usage' in this.filters.additionalFields,
      show_signal_db: 'signal_db' in this.filters.additionalFields,
    }
    if (this.filters.clientType === 'both') {
      const [wiredResponse, wirelsessResponse] = await Promise.all([
        this.listUnifiedClients({ ...params, client_type: 'WIRED' }),
        this.listUnifiedClients({ ...params, client_type: 'WIRELESS' }),
      ]);
      return {
        count: wiredResponse.count + wirelsessResponse.count,
        last_clients_mac: [wiredResponse.last_client_mac, wirelsessResponse.last_client_mac],
        total: wiredResponse.total + wirelsessResponse.total,
        clients: [
          ...wirelsessResponse.clients,
          ...wiredResponse.clients,
        ]
      };
    }
    return await this.listUnifiedClients(params);
  }

  async listAccessPoints() {
    let apsResponse = await this.get('monitoring/v2/aps', {
      params: {}
    });

    if (apsResponse.status === 404) return { count: 0, total: 0, aps: [] };

    return this.handleResponse(apsResponse);
  }

  async listGateways() {
    let gatewaysResponse = await this.get('v1/gateways', {
      params: {}
    });

    if (gatewaysResponse.status === 404) return { count: 0, total: 0, gateways: [] };
    return this.handleResponse(gatewaysResponse);
  }

  async listSwitches() {
    let switchesResponse = await this.get('monitoring/v1/switches', {
      params: {}
    });

    if (switchesResponse.status === 404) return { count: 0, total: 0, switches: [] };
    return this.handleResponse(switchesResponse);
  }



  /**
   * 
   * @param {{ limit: string, offset: string, sku_type: string }} param0 
   * @returns {{ total: number, devices: [{ device_type: string, services: [ string ], mac: string, serial: string, model: string }]}}
   */
  async getDevicesFromDeviceInventory({ limit = 1000, offset = 0, sku_type = 'all' }) {
    let devicesResponse = await this.get('platform/device_inventory/v1/devices', { params: { limit, offset, sku_type } });

    return this.handleResponse(devicesResponse);
  }

  /**
   * Disconnect User
   * @param {{ serial: string, disconnect_user_mac: string, disconnect_user_all: boolean, disconnect_user_network: boolean }} param0 
   * @returns 
   * This API disconnects the clients from an IAP. Disconnect user command has following option:
   *
   * all : Disconnects all clients associated with an IAP.
   * mac : Allows you to disconnect a client by specifying the MAC address of the client.
   * network : Allows you to disconnect the clients connected to a specific network.
   * Use one of the above options.
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apiaction_commandsend_disconnect_user
   */
  async disconnectUser({ serial, disconnect_user_mac = null, disconnect_user_all, disconnect_user_network }) {
    let resultResponse = await this.post(`device_management/v1/device/${serial}/action/disconnect_user`, {
      data: {
        disconnect_user_mac,
        disconnect_user_all,
        disconnect_user_network,
      }
    });

    return this.handleResponse(resultResponse);
  }


  /**
   * Get Status of Task
   * @param {*} {task_id} 
   * @returns QUEUED, SUCCESS, FAILED, INVALID, EXPIRED
   * To get response of executed command using the respective task id.
   */
  async getStatus({ task_id }) {
    let statusResponse = await this.get(`device_management/v1/status/${task_id}`, {});

    return this.handleResponse(statusResponse);
  }

  async genericCommandsForDevice({ serial, command }) {
    let resultResponse = await this.post(`device_management/v1/device/${serial}/action/${command}`, {});

    return this.handleResponse(resultResponse);
  }

  async rebootDevice({ serial }) {
    return await this.genericCommandsForDevice({ serial, command: 'reboot' });
  }

  async blinkLEDOn({ serial }) {
    return await this.genericCommandsForDevice({ serial, command: 'blink_led_on' });
  }

  async blinkLEDOff({ serial }) {
    return await this.genericCommandsForDevice({ serial, command: 'blink_led_off' });
  }

  async blinkLED({ serial }) {
    return await this.genericCommandsForDevice({ serial, command: 'blink_led' });
  }

  async eraseConfiguration({ serial }) {
    return await this.genericCommandsForDevice({ serial, command: 'erase_configuration' });
  }

  async saveConfiguration({ serial }) {
    return await this.genericCommandsForDevice({ serial, command: 'save_configuration' });
  }

  async halt({ serial }) {
    return await this.genericCommandsForDevice({ serial, command: 'halt' });
  }

  async configSync({ serial }) {
    return await this.genericCommandsForDevice({ serial, command: 'config_sync' });
  }

  async listSites() {
    let sitesResponse = await this.get('central/v2/sites');
    if (sitesResponse.status === 200)
      siteCacheStore.update((sites) => {
        sites[this.account.id] = { time: Date.now(), sites: sitesResponse.responseBody.sites };
        return sites;
      });
    return this.handleResponse(sitesResponse);
  }

  /**
   * List Labels
   * @returns {{count: number, total: number, labels: [string]}}
   */
  async listLabels() {
    let labelsResponse = await this.get('central/v2/labels');
    if (labelsResponse.status === 200)
      labelCacheStore.update((labels) => {
        labels[this.account.id] = { time: Date.now(), labels: labelsResponse.responseBody.labels };
        return labels;
      });
    return this.handleResponse(labelsResponse);
  }

  /**
   * List Groups
   * @returns {{total: number, data: [[string]], groups: [string]}}
   */
  async listGroups() {
    let groupsResponse = await this.get('configuration/v2/groups', {
      params: {
        limit: 100,
        offset: 0,
      }
    });
    if (groupsResponse?.responseBody?.data && Array.isArray(groupsResponse.responseBody.data)) groupsResponse.responseBody.groups = groupsResponse.responseBody.data.flat();
    if (groupsResponse.status === 200)
      groupCacheStore.update((groups) => {
        groups[this.account.id] = { time: Date.now(), groups: groupsResponse.responseBody.data.flat() };
        return groups;
      });
    return this.handleResponse(groupsResponse);
  }
  getAllGroups = this.listGroups;

  async deleteGroup({ group }) {
    let deleteGroupResponse = await this.delete(`configuration/v1/groups/${group}`)

    return this.handleResponse(deleteGroupResponse)
  }

  async createGroup({ groupName }) {

    return this.handleResponse();
  }

  /**
   * 
   * @param {{ group: string, group_attributes: { template_info: { Wired: boolean, Wireless: boolean, }, group_properties: { AllowedDevTypes: [string], AllowedSwitchTypes: [string], MonitorOnly: [string], ApNetworkRole: string, GwNetworkRole: string}}}} groupProperties 
   * @param groupProperties.group_attributes.group_properties.AllowedDevTypes - ["AccessPoints"|"Gateways"|"Switches"]
   * @param groupProperties.group_attributes.group_properties.AllowedSwitchTypes - ["AOS_S"|"AOS_CX"]
   * @param groupProperties.group_attributes.group_properties.MonitorOnly - ["AOS_S"|"AOS_CX"]
   * @param groupProperties.group_attributes.group_properties.ApNetworkRole - "Standard"|"Microbranch"
   * @returns 
   */
  async createGroupProperties({ groupDetails }) {
    let createGroupResponse = await this.post('configuration/v3/groups', { data: { ...groupDetails } });

    return this.handleResponse(createGroupResponse);
  }

  /**
   * Get info whether a list of groups is in template mode
   * @param {[string]} groups - Groups to get info about
   * @returns {{data: [{group: string, template_details: {Wired: boolean, Wireless: boolean}}]}}
   */
  async getGroupTemplateInfo({groups}) {
    let groupTemplateInfoResponse = await this.get('/configuration/v2/groups/template_info', { params: { groups: groups.join(',') } });

    return this.handleResponse(groupTemplateInfoResponse)
  }

  /**
   * Clone Group
   * @param {{group: string, clone_group: string, upgrade_architecture: boolean}} cloneParams - Clone Parameters
   * @param {string} cloneParams.group - Name of group to be created.
   * @param {string} cloneParams.clone_group - Group to be cloned.
   * @param {boolean} cloneParams.upgrade_architecture - Upgrade group architecture during clone.
   * @returns {Object}
   * 
   * Clone and create new group from a given group with the given name. The configuration of the new group will be inherited from the given group.
   * For example:
   * Sample request body to create a group is as follows:
   * {
   *   "group": "Lorem",
   *   "clone_group": "Ipsum"
   * }
   * With the above body, a group named Lorem will be created with the attributes such as template-type & configurations cloned from Ipsum group.
   */
  async cloneGroup({ group, clone_group, upgrade_architecture = false }) {
    // debugger;
    let cloneResponse = await this.post('configuration/v2/groups/clone', {
      data: {
        group, clone_group, upgrade_architecture
      }
    });
    // debugger;

    return this.handleResponse(cloneResponse);
  }


  entry = { "AOSVersion": "AOS_8X", "AllowedDevTypes": ["AccessPoints", "Gateways", "Switches"], "AllowedSwitchTypes": ["AOS_S", "AOS_CX"], "ApNetworkRole": "Standard", "Architecture": "Instant", "GwNetworkRole": "BranchGateway", "MonitorOnly": [], "MonitorOnlySwitch": false, "NewCentral": false }
  /**
   * 
   * @param {{groups: [string]}} param0 
   * @returns {{data: [{group: string, properties: { 
   * "AOSVersion": "AOS_8X"|"AOS_10X", 
   * "AllowedDevTypes": ["AccessPoints", "Gateways", "Switches"], 
   * "AllowedSwitchTypes": ["AOS_S", "AOS_CX"], 
   * "ApNetworkRole": "Standard", 
   * "Architecture": "Instant", 
   * "GwNetworkRole": "BranchGateway", 
   * "MonitorOnly": [], 
   * "MonitorOnlySwitch": false, 
   * "NewCentral": false }}]}}
   */
  async getPropertiesOfGroups({ groups }) {
    let propertiesResponse = await this.get('configuration/v1/groups/properties', {
      params: {
        groups: groups.join()
      }
    });
    return this.handleResponse(propertiesResponse);
  }

  async listTroubleshootingCommands({ device_type }) {
    let troubleshootingCommandsResponse = await this.get('troubleshooting/v1/commands', { params: { device_type } });

    return this.handleResponse(troubleshootingCommandsResponse);
  }

  /**
   * Start Troubleshooting Session
   * @param {{ device_type: string , serial:string, commands: [{ command_id: number, arguments: { name: string, value: string } }] }} TroubleshootingDetails
   * @returns {{ serial: string, status: string, message: string, session_id: number }} 
   * 
   * Start troubleshooting session with list of commands for specific device. List of commands can have at most 10 commands.
   * If there is any troubleshooting session running already for device then you cannot start new session.
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apitroubleshooting_apistart_troubleshoot
   */
  async startTroubleshootingSession({ device_type, serial, commands }) {
    let sessionInfoResponse = await this.post(`troubleshooting/v1/devices/${serial}`, { data: { device_type, commands } });

    return this.handleResponse(sessionInfoResponse);
  }


  /**
   * Get Troubleshooting Output
   * @param {{ serial:string, session_id:number }} TroubleshootingSession Session Info
   * @returns {{ serial: string, hostname: string, output: string, status: string, message: string }} 
   * 
   * Get a troubleshooting output for the troubleshooting session of specific device. Troubleshooting output has hold time of 5 minutes after which it will be expired.
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apitroubleshooting_apiget_troubleshoot_output
   */
  async getTroubleshootingOutput({ serial, session_id }) {
    let outputResponse = await this.get(`troubleshooting/v1/devices/${serial}`, { params: { session_id } });

    return this.handleResponse(outputResponse);
  }

  /**
   * Export Troubleshooting Output
   * @param {{ serial:string, session_id:number }} TroubleshootingSession Session Info 
   * @returns {{ serial: string, hostname: string, status: string, message: string }} 
   * 
   * Export the output for troubleshooting session of the specific device.
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apitroubleshooting_apiexport_output
   */
  async exportTroubleshootingOutput({ serial, session_id }) {
    let outputResponse = await this.get(`troubleshooting/v1/devices/${serial}/export`, { params: { session_id } });

    return this.handleResponse(outputResponse);
  }
}

export const central = new Central();
