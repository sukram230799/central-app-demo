// import { credentials } from './svelte-store.js';
// const axios = require('axios');
import axios from 'axios';
import { currentAccountStore, accountsStore } from './svelte-store.js';

// const proxy = `${window.location.origin}/api-proxy`;
// const proxy = `http://localhost:26799/api-proxy`;
// const backend = 'https://internal-apigw.central.arubanetworks.com/';

export class Central {

    proxy;
    account;
    constructor() {
        currentAccountStore.subscribe((value) => this.account = value);
    this.proxy = `${window.location.origin}/api-proxy`;

    }

    async request(path, options) {
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

        console.log(response);

        return response.data;
    }

  /**
   * Send GET request via proxy
   * @param {string} path Path to request from central api
   * @param {obj} options Options to pass to central
   * @returns obj
   */
    async get(path, options = {}) {
        return await this.request(path, { ...options, method: 'GET' });
    }

  /**
   * Send POST request via proxy
   * @param {string} path Path to request from central api
   * @param {obj} options Options to pass to central
   * @returns obj
   */
  async post(path, options = {}) {
    return await this.request(path, { ...options, method: 'POST' });
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
      throw { name: 'TokenNotUpdated', message: 'Token could not be updated.' };
        }

        // return credentialResponse.data.responseBody.access_token;
    }

    async getDeviceFirmware(serial) {
        return (await this.get(`firmware/v1/devices/${serial}`)).responseBody;
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
        let clients = await this.get('monitoring/v1/clients/wireless', {
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
        console.log(clients);
        return clients.responseBody;
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
        let clients = await this.get('monitoring/v1/clients/wired', {
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
        console.log(clients);
        return clients.responseBody;
    }


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

        let clients = await this.get('monitoring/v2/clients', {
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
        console.log(clients);
        return clients.responseBody;
    }

    async listAccessPoints() {
        let aps = await this.get('monitoring/v2/aps', {
            params: {}
        });
        console.log(aps);
        if (aps.status === 404) return { count: 0, total: 0, aps: [] };
        return aps.responseBody;
    }

    async listGateways() {
        let gateways = await this.get('v1/gateways', {
            params: {}
        });
        console.log(gateways);
        if (gateways.status === 404) return { count: 0, total: 0, gateways: [] };
        return gateways.responseBody;
    }

    async listSwitches() {
        let switches = await this.get('monitoring/v1/switches', {
            params: {}
        });
        console.log(switches);
        if (switches.status === 404) return { count: 0, total: 0, switches: [] };
        return switches.responseBody;
    }
}

