import axios from 'axios';
import { get } from 'svelte/store';
import {
  currentAccountStore, accountsStore,
  selectedFilterStore, selectedFilterDefaults, timeRanges,
  groupCacheStore, labelCacheStore, siteCacheStore, currentAccountIdStore, notificationSettingsStore, webhookStore,
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
   * Send PATCH request via proxy
   * @param {string} path Path to request from central api
   * @param {{ data: {}, headers: {}, params: {} }} options Options to pass to central
   * @returns {Object}
   */
  async patch(path, options = {}) {
    return await this.request(path, { ...options, method: 'PATCH' });
  }

  /**
 * Send PUT request via proxy
 * @param {string} path Path to request from central api
 * @param {{ data: {}, headers: {}, params: {} }} options Options to pass to central
 * @returns {Object}
 */
  async put(path, options = {}) {
    return await this.request(path, { ...options, method: 'PUT' });
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

  refreshTokenPromise = new Promise((resolve) => resolve());

  async testToken(account, sucessCallback, failureCallback) {
    try {
      let refreshBody = {
        url: `${account.base_url}/oauth2/token`,
        method: 'POST',
        params: {
          client_id: account.client_id,
          client_secret: account.client_secret,
          grant_type: 'refresh_token',
          refresh_token: account.credential.refresh_token,
        }
      };
      let credentialResponse = await axios.post(this.proxy, refreshBody);

      if (credentialResponse.data.status === 200) {
        return {
          ...account,
          credential: {
            ...account.credential,
            access_token: credentialResponse.data.responseBody.access_token,
            refresh_token: credentialResponse.data.responseBody.refresh_token,
            expires_in: credentialResponse.data.responseBody.expires_in,
          }
        }
      }
      else throw { name: 'TokenNotUpdated', message: 'Token could not be updated.' };
    } catch (e) {
      throw { name: 'TokenNotUpdated', message: 'Token could not be updated.' };
    }
  }

  async refreshToken() {
    await this.refreshTokenPromise;
    let resolveMe;
    this.refreshTokenPromise = new Promise((resolve) => {
      resolveMe = resolve;
    });
    try {
      let refreshBody = {
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

          return value;
        });
      } else {
        resolveMe();
        throw { name: 'TokenNotUpdated', message: 'Token could not be updated.' };
      }
    }
    finally {
      console.log("Resolve refreshTokenPromise")
      resolveMe();
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

  sliceIntoChunks(arr, chunkSize) {
    const res = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      const chunk = arr.slice(i, i + chunkSize);
      res.push(chunk);
    }
    return res;
  }

  /*
   * ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   * ─██████████████─██████████████─██████████───────██████████████─██████████████─██████─────────██████─────────██████████████─
   * ─██░░░░░░░░░░██─██░░░░░░░░░░██─██░░░░░░██───────██░░░░░░░░░░██─██░░░░░░░░░░██─██░░██─────────██░░██─────────██░░░░░░░░░░██─
   * ─██░░██████░░██─██░░██████░░██─████░░████───────██░░██████████─██░░██████░░██─██░░██─────────██░░██─────────██░░██████████─
   * ─██░░██──██░░██─██░░██──██░░██───██░░██─────────██░░██─────────██░░██──██░░██─██░░██─────────██░░██─────────██░░██─────────
   * ─██░░██████░░██─██░░██████░░██───██░░██─────────██░░██─────────██░░██████░░██─██░░██─────────██░░██─────────██░░██████████─
   * ─██░░░░░░░░░░██─██░░░░░░░░░░██───██░░██─────────██░░██─────────██░░░░░░░░░░██─██░░██─────────██░░██─────────██░░░░░░░░░░██─
   * ─██░░██████░░██─██░░██████████───██░░██─────────██░░██─────────██░░██████░░██─██░░██─────────██░░██─────────██████████░░██─
   * ─██░░██──██░░██─██░░██───────────██░░██─────────██░░██─────────██░░██──██░░██─██░░██─────────██░░██─────────────────██░░██─
   * ─██░░██──██░░██─██░░██─────────████░░████───────██░░██████████─██░░██──██░░██─██░░██████████─██░░██████████─██████████░░██─
   * ─██░░██──██░░██─██░░██─────────██░░░░░░██───────██░░░░░░░░░░██─██░░██──██░░██─██░░░░░░░░░░██─██░░░░░░░░░░██─██░░░░░░░░░░██─
   * ─██████──██████─██████─────────██████████───────██████████████─██████──██████─██████████████─██████████████─██████████████─
   * ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── 
   */

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

  async listUnifiedClientsAutoFiltered() {
    let filters = {
      group: this.filters.group ? this.filters.group : null,
      site: this.filters.site ? this.filters.site : null,
      label: this.filters.label ? this.filters.label : null,
      client_status: this.filters.clientStatus, network: this.filters.network,
      serial: this.filters.serial, swarm_id: this.filters.swarmId, cluster_id: this.filters.clusterId, band: this.filters.band,
      stack_id: this.filters.stackId, os_type: this.filters.osType,

      client_type: this.filters.clientType,
      timerange: timeRanges[this.filters.timeRange],

      show_manufacturer: 'manufacturer' in this.filters.additionalFields,
      show_usage: 'usage' in this.filters.additionalFields,
      show_signal_db: 'signal_db' in this.filters.additionalFields,
    }
    return await this.listUnifiedClientsFiltered({ filters });
  }

  async listUnifiedClientsFiltered({ filters }) {
    if (this.filters.clientType === 'both') {
      const [wiredResponse, wirelsessResponse] = await Promise.all([
        this.listUnifiedClients({ ...filters, client_type: 'WIRED' }),
        this.listUnifiedClients({ ...filters, client_type: 'WIRELESS' }),
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
    return await this.listUnifiedClients(filters);
  }

  /**
   * Get Client Details
   * @param {*} param0 
   * @returns 
   * This is a unified form of Details APIs /monitoring/v1/clients/wired/{macaddr} and /monitoring/v1/clients/wireless/{macaddr} and it is backward compatible with these v1 apis.
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apiexternal_controllerget_v2_unified_client_detail
   */
  async getClientDetails({ macaddr }) {
    const clientDetailsResponse = await this.get(`monitoring/v2/clients/${macaddr}`)

    return this.handleResponse(clientDetailsResponse);
  }

  /**
   * List Access Points
   * @param {{params}} param0 Params
   * @returns {{  "count": number,  "total": 4,  "aps": []}}
   * Get access points. You can only specify one of group, swarm_id, label, site parameters.
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apiexternal_controllerget_aps_v2
   */
  async listAccessPoints({ filters } = {}) {
    let apsResponse = await this.get('monitoring/v2/aps', {
      params: filters
    });

    return this.handleResponse(apsResponse);
  }

  /**
   * List Gateways
   * @param {{params}} param0 Params
   * @returns {{  "count": number,  "total": 4,  "gateways": []}}
   * Get switches You can only specify one of group, label and stack_id parameters. 
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apiexternal_controllerget_switches
   */
  async listGateways({ filters } = {}) {
    let gatewaysResponse = await this.get('monitoring/v1/gateways', {
      params: filters
    });

    return this.handleResponse(gatewaysResponse);
  }

  /**
   * List Switches
   * @param {{params}} param0 Params
   * @returns {{  "count": number,  "total": 4,  "switches": []}}
   * 
   */
  async listSwitches({ filters } = {}) {
    let switchesResponse = await this.get('monitoring/v1/switches', {
      params: filters
    });

    return this.handleResponse(switchesResponse);
  }

  /**
   * Get Switch Details
   * @param {{serial: string}} param0 Serial of the switch
   * @returns {{"serial":"HP-2920-24G-PoEP","name":"HP-2920-24G-PoEP","macaddr":"c8:b5:ad:c3:b2:04","model":"HP2920-24G-PoE+ Switch(J9727A)","group_name":"dual_5GHz","status":"Up","public_ip_address":"10.29.31.251","ip_address":"10.29.31.251","firmware_version":"7.3.0.4-0.0098","default_gateway":"10.8.29.254","uptime":418814421,"updated_at":1518814421,"device_mode":0,"total_clients":2,"usage":56456456,"max_power":10,"power_consumption":19,"fan_speed":"Ok","temperature":"Ok","labels":[],"site":null,"uplink_ports":[],"chassis_type":true,"cpu_utilization":19,"mem_total":34234,"mem_free":23423,"nae_aggr_status":"CRITICAL","poe_consumption":3,"switch_type":"ArubaCX","stack_id":"01008030-e0cd2100"}}
   * Get Switch details
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apiexternal_controllerget_switch
   */
  async getSwitchDetails({ serial }) {
    let switchResponse = await this.get(`monitoring/v1/switches/${serial}`);

    return this.handleResponse(switchResponse);
  }

  /**
   * Get AccessPoint Details
   * @param {{serial: string}} param0 
   * @returns {{"serial":"Ap123456","name":"AP-345","macaddr":"1a:2s:3d:f3:4f:ge","swarm_id":"gjhkhguljhlkj12jh767687807676","group_name":"group1","ap_group":"ap_group2","cluster_id":"CN345677","ap_deployment_mode":"IAP","status":"Down","ip_address":"1.1.1.1","model":"AP-345","firmware_version":"8.3.0.0_63709","swarm_master":true,"cpu_utilization":56,"uptime":3600,"down_reason":"Disconnected from active controller","last_modified":45670089,"mem_total":80,"mem_free":20,"mesh_role":"Unknown","mode":"Auto","radios":[],"client_count":3,"ssid_count":16,"ethernets":[],"modem_connected":true,"current_uplink_inuse":"Ethernet","public_ip_address":"1.1.1.1","ip_address_v6":"12df:34tf:76f4:11ad:de45:12ea:11af:31dr","subnet_mask":"string","site_name":"string","swarm_name":"swarm_01","controller_name":"controller_01","sys_location":"Hardware Lab","sys_contact":"Hardwarelab.contact@noreply.com"}}
   * Get AP Details
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apiexternal_controllerget_ap
   */
  async getAPDetails({ serial }) {
    let apResponse = await this.get(`monitoring/v1/aps/${serial}`);

    return this.handleResponse(apResponse);
  }

  /**
   * Get Gateway Details
   * @param {{ serial: string, stats_metric: boolean }} param0 
   * @param param0.stats_metric If set, gets the uplinks and tunnels count
   * @returns {{"serial":"MC675878","name":"Controller2","macaddr":"c8:b5:ad:c3:b2:04","group_name":"dual_5GHz","status":"Up","ip_address":"10.29.31.251","model":"MC-2345","firmware_version":"7.2.3.4-4.5.678","labels":[],"site":null,"uplinks":[],"cpu_utilization":12,"uptime":8789789,"mem_total":676868,"mem_free":5657,"firmware_backup_version":"7.2.3.4-3.4.567","mac_range":"range","role":"access","ap_count":5,"usage":7687687,"reboot_reason":"User reboot","mode":"Auto","poe_budget":12,"poe_consumption":12,"poe_available":12,"poe_supported":true,"recommended_version":"7.3.4.5-4.5.678","location":{"gps":{"latitude":37.09808,"longitude":78.078},"street_address":{"address_1":"street1","city":"Chennai","country":"India","postal_code":600018,"state":"Tamil Nadu"}},"est_status":"Enrolled","est_cert_expiry_time":"2019-08-21T14:34:52.000Z","vgw_sys_bw_limit":1024,"vgw_sys_bw_usage":700,"ntp_server_info":{"server":"ntp.xtom.com.hk","sync":1},"modem_info":{"type":"HUAWEI Mobile","hwstate":"Connected"},"uplinks_metric":{"up":4,"down":3,"total":7},"tunnels_metric":{"up":4,"down":4,"total":8},"public_ip":"string","mm_hostname":"MM123","mobility_master":"BA0003755"}}
   * Get Gateway Details
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apiexternal_controllerget_gateway
   */
  async getGatewayDetails({ serial, stats_metric = true }) {
    let gatewayResponse = await this.get(`monitoring/v1/gateways/${serial}`, { params: { stats_metric } });

    return this.handleResponse(gatewayResponse);
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
   * @param groupProperties.group_attributes.group_properties.GwNetworkRole - "BranchGateway"|"VPNConcentrator"|"WLANGateway"
   * @returns 
   * Create new group given a group name, configuration mode(UI or template mode of configuration) to be set per device type and the user can also specify the following properties for the group
   * 
   * Device types(AccessPoints, Gateways, Switches) to be allowed in the group
   * 
   * Architecture(Instant / AOS10) for the access points and gateways in the group.
   * 
   * Network role(Standard / Microbranch) for access points in the group.
   * Standard network role is applicable for both AOS10 and Instant architecture.
   * Microbranch network role for access points is applicable only for AOS10 architecture.
   * 
   * Network role(BranchGateway / VPNConcentrator / WLANGateway) for gateways in the group.
   * BranchGateway and VPNConcentrator network role are applicable for both AOS10 and Instant architecture.
   * WLANGateway network role is applicable only for AOS10 architecture.
   * 
   * Switch device types (AOS_S, AOS_CX) to be allowed in the group if the group can have switches.
   * 
   * List of device types for which monitor only mode is to be enabled. Currently, this is available only for AOS_S switches in groups where switches are managed using UI mode of configuration.
   * If empty list - [] is passed as value, monitor only mode is disabled.
   * If AOS_S is passed in the list - ["AOS_S"], monitor only mode is enabled for AOS_S switches in the group.
   * 
   * Configuration mode can be set for Access points and Gateways under the 'Wireless' field and for switches under the 'Wired' field. The configuration mode is specified as a boolean value indicating if the device type is managed using the template mode of configuration or not.
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apigroupscreate_group_v3
   */
  async createGroupProperties({ groupDetails }) {
    let createGroupResponse = await this.post('configuration/v3/groups', { data: { ...groupDetails } });

    return this.handleResponse(createGroupResponse);
  }

  async updateGroupProperties({ groupName, groupDetails }) {
    let updateGroupPropertiesResponse = await this.patch(`configuration/v2/groups/${groupName}/properties`, {
      data:
        { group_properties: groupDetails.group_properties, template_info: groupDetails.template_info }
    });

    return this.handleResponse(updateGroupPropertiesResponse);
  }

  async updateGroupName({ oldGroupName, newGroupName }) {
    let updateGroupNameResponse = await this.patch(`configuration/v1/groups/${oldGroupName}/name`, { data: { group: newGroupName } });

    return this.handleResponse(updateGroupNameResponse);
  }

  /**
   * Get info whether a list of groups is in template mode
   * @param {[string]} groups - Groups to get info about
   * @returns {{data: [{group: string, template_details: {Wired: boolean, Wireless: boolean}}]}}
   * Get configuration mode(UI or template mode of configuration) set per device type for the given list of groups.
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apigroupsget_groups_template_data
   */
  async getGroupTemplateInfo({ groups }) {
    let groupsSlices = this.sliceIntoChunks(groups, 20);

    let templateInfoResponses = await Promise.all(groupsSlices.map(groupSlice => this.get('/configuration/v2/groups/template_info', { params: { groups: groupSlice.join() } })));

    let templateInfoResponse = templateInfoResponses.reduce((out, entry) => {
      return {
        ...out,
        headers: entry.headers,
        responseBody: {
          data: out.responseBody.data.concat(entry.responseBody.data),
        },
        status: entry.status,
      }
    }, { responseBody: { data: [] } });

    return this.handleResponse(templateInfoResponse);
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
   * Get properties set for groups
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
   * For each group in the provided list, the following properties for the group are returned
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apigroupsget_groups_properties
   */
  async getPropertiesOfGroups({ groups }) {
    let groupsSlices = this.sliceIntoChunks(groups, 20);

    let propertiesResponses = await Promise.all(groupsSlices.map(groupSlice => this.get('configuration/v1/groups/properties', { params: { groups: groupSlice.join() } })));

    let propertiesResponse = propertiesResponses.reduce((out, entry) => {
      return {
        ...out,
        headers: entry.headers,
        responseBody: {
          data: out.responseBody.data.concat(entry.responseBody.data),
        },
        status: entry.status,
      }
    }, { responseBody: { data: [] } });

    return this.handleResponse(propertiesResponse);
  }

  async moveDevicesToGroup({ group, serials }) {
    let moveDevicesResponse = await this.post('configuration/v1/devices/move', { data: { group, serials } });

    return this.handleResponse(moveDevicesResponse);
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


  /**
   * List Notification Types
   * @returns {{ "count": 1, "total": 68, "types": [{ "id": 1554, "name": "CFG_SET_ADVERTISEMENT_FAILURE", "desc": "CFG-SET advertisement failure", "category": "GATEWAY" }]}}
   * 
   * Get types. AutoPagination
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apinotifications_external_apiget_types_api
   */
  async listNotificationTypes() {
    let limit = 1000;
    let offset = 0;
    let nTypes = [];
    while (true) {
      let response = this.handleResponse(await this.get('central/v1/notifications/types', {
        params: { limit, offset }
      }));

      nTypes.push(...response.types);

      if (response.count < limit)
        // No more entries expected. Break loop
        break;

      offset += limit;
    }

    return {
      count: nTypes.length,
      total: nTypes.length,
      types: nTypes
    };
  }

  /**
   * List notifications
   * @param {{ customer_id, group, label, serial, site, from_timestamp, to_timestamp, severity, type, search, calculate_total: boolean, ack: boolean, fields, offset: int, limit: int }} params 
   * @returns {{"count":1,"total":84,"notifications":[{"id":"AWLTCw983zA1xiLvI9DF","severity":"Major","customer_id":"f28b6bc3e46c42a88bc27ff4713496fa","device_id":"SN1000012","details":{},"nid":"4","settings_id":"f28b6bc3e46c42a88bc27ff4713496fa-4","timestamp":1523958870,"group_name":"IAP 5GHz","labels":["dual_5GHz"],"type":"AP disconnected","acknowledged":false,"description":"AP with Name IAP_345_1 and MAC address c8:b5:ad:c3:b2:02 disconnected","state":"Open","acknowledged_by":"user1","acknowledged_timestamp":1523958870,"created_timestamp":1523958870}]}}
   * Get notifications. You can only specify one of group, label parameters.
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apinotifications_external_apiget_notifications_api
   */
  async listNotifications(params = {}) {
    let response = await this.get('central/v1/notifications', {
      params
    });

    return this.handleResponse(response)
  }

  /**
   * Acknowledge Notifications by ID List / All
   * @param {{notificationIds: [string]}} param0 
   * @returns 
   * Update notifications. This is used for acknowledging a list of notifications. This is an async operation.
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apinotifications_external_apiacknowledge_notifications
   */
  async acknowledgeNotifications({ notificationIds }) {
    let response = await this.post('central/v1/notifications', { data: notificationIds });

    return this.handleResponse(response);
  }

  /**
   * Acknowledge Notification
   * @param {{ notification_id: string, acknowledged: boolean }} param 
   * @param {boolean} param.acknowledged Notification acknowledgement status. Currently acknowledge is only supported and unacknowledge is not supported.
   * @returns 
   * Update a notification. This is used for acknowledging a notification.
   * 
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apinotifications_external_apiacknowledge_notification
   */
  async acknowledgeNotification({ notification_id, acknowledged }) {
    let response = await this.patch(`central/v1/notifications/${notification_id}`, { data: { acknowledged: acknowledged } });

    return this.handleResponse(response);
  }

  /* NOTIFICATION SETTINGS */

  /**
   * List Notification Settings
   * @param {{ search: string, limit: int, offset: int, sort}} params
   * @returns {{"count":1,"settings":[{"setting_id":"201610195243-1254","type":"CONNECTED_CLIENTS","rules":[{"severity":"Critical","delivery_options":["Email"],"emails":["someone@something.com","sometwo@something.com"],"webhooks":["e829a0f6-1e36-42fe-bafd-631443cbd581","e26450be-4dac-435b-ac01-15d8f9667eb8"],"group":["group-1","group-2"],"label":["label-1","label-2"],"site":["Arizona-Site","California-2"],"device_id":["SN7323721","SN8462537"],"transform_func":"percentage","conditions":[{"expression":{"value":50,"operator":">="},"severity":"Warning"}],"filters":[{"key":"band","values":"5 GHz","operator":"in"}],"duration":10,"aggr_context":"swarm","value":"string"}],"active":true,"created_ts":1523609395.009575,"created_by":"someone@something.com","updated_ts":1523612330.82353,"updated_by":"someone@something.com"}]}} 
   * Get a list of settings
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apinotifications_external_apiget_settings_api
   */
  async listNotificationSettings(params = {}) {
    let response = await this.get('central/v1/notifications/settings', { params });

    let result = this.handleResponse(response);

    notificationSettingsStore.update(result.settings);

    return result;
  }

  /**
   * Add Notification Setting
   * @param {{ type: string, rules: Array, active:boolean = true }} param0 
   * @returns {{ "result": "201610195243-1252" }}
   * Add Notification Setting
   * PLEASE DO REFRESH WITH `listNotificationSettings`
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apinotifications_external_apiadd_setting_api
   */
  async addNotificationSetting({ type, rules, active = true }) {
    let response = await this.post('central/v1/notifications/settings', {
      data: {
        type, rules, active
      }
    })

    return this.handleResponse(response)
  }

  /**
   * Delete Notification Setting
   * @param {{setting_id: string}} param0 
   * @returns 
   * Delete Notification Setting
   * PLEASE DO REFRESH WITH `listNotificationSettings`
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apinotifications_external_apidelete_setting_api
   */
  async deleteNotificationSetting({ settings_id }) {
    let response = await this.delete(`central/v1/notifications/settings/${settings_id}`);

    return this.handleResponse(response)
  }

  /**
   * Update Notification Settings
   * @param {{ settings_id: string, setting: { type: string, rules: Array, active:boolean = true } }} param0 
   * @returns 
   * Update Notification Settings
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apinotifications_external_apiupdate_setting_api
   */
  async updateNotificationSetting({ settings_id, setting }) {
    let response = await this.put(`central/v1/notifications/settings/${settings_id}`, { data: setting });

    return this.handleResponse(response)
  }


  /* WEBHOOKS */

  /**
   * List webhooks
   * @returns {{ "count": 1,  "settings": [{"wid": "e26450be-4dac-435b-ac01-15d8f9667eb8","name": "AAA","updated_ts": 1523956927,"urls": ["https://example.org/webhook1","https://example.org/webhook1"],"secure_token": {"token": "KEu5ZPTi44UO4MnMiOqz","ts": 1573461177}}]}}
   * Get a list of webhooks
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apidispatcher_external_apiget_webhooks_api
   * */
  async listWebhooks() {
    let response = await this.get('central/v1/webhooks');

    return this.handleResponse(response);
  }

  generateWebhookName() {
    return `Central Toolkit - ${get(currentAccountIdStore)}`
  }

  /**
   * Add Webhook
   * @param {{ url: string}} 
   * @returns {{ name: string, wid: string }}
   * Add webhook
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apidispatcher_external_apiadd_webhook_api
   */
  async addWebhook({ url }) {
    let response = await this.post('central/v1/webhooks', {
      data: {
        name: this.generateWebhookName(),
        urls: [url]
      }
    });

    return this.handleResponse(response);
  }

  /**
   * Update webhook settings
   * @param {{ wid: string, url: string}} 
   * @returns {{ data: { url: string} }}
   * Update webhook settings
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apidispatcher_external_apiupdate_webhook_api
   */
  async updateWebhook({ wid, url }) {
    let response = await this.put(`central/v1/webhooks/${wid}`, {
      data: {
        name: `Central Toolkit - ${get(currentAccountIdStore)}`,
        urls: [url]
      }
    });

    return this.handleResponse(response);
  }

  /**
   * Delete Webhook
   * @param {{ wid: string}}
   * @returns {{"wid": "e26450be-4dac-435b-ac01-15d8f9667eb8"}}
   * Delete Webhook
   * ---
   * https://developer.arubanetworks.com/aruba-central/reference/apidispatcher_external_apidelete_webhook_api
   */
  async deleteWebhook({ wid }) {
    let response = await this.delete(`central/v1/webhooks/${wid}`);

    return this.handleResponse(response);
  }

  /** Test Webhook */
  async testWebhook({ wid } = {}) {
    if (!wid) wid = get(webhookStore);
    let response = await this.get(`central/v1/webhooks/${wid}/ping`)

    return this.handleResponse(response);
  }

}

export const central = new Central();
