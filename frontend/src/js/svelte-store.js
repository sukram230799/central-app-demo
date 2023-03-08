import { writable, derived, get } from 'svelte/store';

const newUserStore = writable(localStorage.credentials ? !Object.keys(JSON.parse(localStorage.credentials)).length : true);
// newUserStore.subscribe((value) => localStorage.newUser = JSON.stringify(value));

const needRefreshStore = writable({ updateAvailable: false, updateSW: null });
const doRefreshStore = writable({ doRefresh: false });
const offlineReadyStore = writable({ offlineReady: false });

const cameraStore = writable(localStorage.camera ? JSON.parse(localStorage.camera) : {}); // || {"Id":"d3f5ceb340cf8ddbec8422380bc32693a8b284a453e3aa76b67b8f6a423bc2f5","label":"HP HD Camera (0408:5373)"});
cameraStore.subscribe((value) => localStorage.camera = JSON.stringify(value));

const accountsStore = writable(localStorage.credentials ? JSON.parse(localStorage.credentials) : {});
accountsStore.subscribe((value) => localStorage.credentials = JSON.stringify(value))

const currentAccountIdStore = writable(localStorage.selectedCredentialId);
currentAccountIdStore.subscribe((value) => localStorage.selectedCredentialId = value);

const currentAccountStore = derived(
    [accountsStore, currentAccountIdStore], ([$accounts, $currentAccountId]) => $accounts[$currentAccountId]
);

const timeRanges = ["3H", "1D", "1W", "1M", "3M"];

const selectedFilterNames = {
    clientType: 'Client Type',
    group: 'Group',
    label: 'Label',
    site: 'Site',
    timeRange: 'Time Range',
    clientStatus: 'Connection Status',
    network: 'Network Name',
    serial: 'Serial',
    swarmId: 'Swarm Id',
    clusterId: 'Cluster Id',
    band: 'Band',
    stackId: 'Stack Id',
    osType: 'OS Type',
    field: 'Field Filter',
    additionalFields: 'Additional Fields'
}

const selectedFilterDefaultsOld = {
    clientType: 'both',
    group: '',
    label: '',
    site: '',
    timeRange: 0,
    clientStatus: 'CONNECTED',
    network: '',
    serial: '',
    swarmId: '',
    clusterId: '',
    band: '',
    stackId: '',
    osType: '',
    field: [],
    additionalFields: ['usage', 'manufacturer', 'signal_db'],
};

const selectedFilterDefaults = {
    clientType: 'both',
  group: undefined,
  label: undefined,
  site: undefined,
    timeRange: 0,
    clientStatus: 'CONNECTED',
  network: undefined,
  serial: undefined,
  swarmId: undefined,
  clusterId: undefined,
  band: undefined,
  stackId: undefined,
  osType: undefined,
    field: [],
    additionalFields: ['usage', 'manufacturer', 'signal_db'],
};

const selectedFilterStore = writable(localStorage.selectedFilter ? JSON.parse(localStorage.selectedFilter) : { ...selectedFilterDefaults });
selectedFilterStore.subscribe((value) => localStorage.selectedFilter = JSON.stringify(value));

const selectedSortingOrderStore = writable('');

const groupCacheStore = writable(localStorage.groups ? JSON.parse(localStorage.groups) : {});
groupCacheStore.subscribe((value) => localStorage.groups = JSON.stringify(value));
const groupStore = derived([groupCacheStore, currentAccountIdStore], ([$groupCache, $currentAccountId]) => $currentAccountId in $groupCache ? $groupCache[$currentAccountId].groups : []);
groupStore.delete = (groupName) => {
    groupCacheStore.update((groupCache) => {
        const currentAccountId = get(currentAccountIdStore);
        console.log(currentAccountId);
        console.log(groupCache);
        let groupArray = groupCache[currentAccountId].groups;
        console.log(groupArray);
        groupArray.splice(groupArray.indexOf(groupName));
        groupCache[currentAccountId].groups = groupArray;
        return groupCache;
    });
};
groupStore.add = (groupName) => {
    groupCacheStore.update((groupCache) => {
        const currentAccountId = get(currentAccountIdStore);
        groupCache[currentAccountId].groups.push(groupName);
        return groupCache;
    });
};

const siteCacheStore = writable(localStorage.sites ? JSON.parse(localStorage.sites) : {});
siteCacheStore.subscribe((value) => localStorage.sites = JSON.stringify(value));
const siteStore = derived([siteCacheStore, currentAccountIdStore], ([$siteCache, $currentAccountId]) => $currentAccountId in $siteCache ? $siteCache[$currentAccountId].sites : []);

const labelCacheStore = writable(localStorage.labels ? JSON.parse(localStorage.labels) : {});
labelCacheStore.subscribe((value) => localStorage.labels = JSON.stringify(value));
const labelStore = derived([labelCacheStore, currentAccountIdStore], ([$labelCache, $currentAccountId]) => $currentAccountId in $labelCache ? $labelCache[$currentAccountId].labels : []);

const pinnedClientsAllStore = writable(localStorage.pinnedClients ? JSON.parse(localStorage.pinnedClients) : {});
pinnedClientsAllStore.subscribe((value) => localStorage.pinnedClients = JSON.stringify(value))
const pinnedClientsStore = derived([pinnedClientsAllStore, currentAccountIdStore], ([$pinnedClientsAll, $currentAccountId]) => $currentAccountId in $pinnedClientsAll ? $pinnedClientsAll[$currentAccountId] : {});
pinnedClientsStore.add = (client) => {
    pinnedClientsAllStore.update((pinnedClientAll) => {
        const currentAccountId = get(currentAccountIdStore);
        if (!pinnedClientAll[currentAccountId]) pinnedClientAll[currentAccountId] = {};
        pinnedClientAll[currentAccountId][client.macaddr] = { macaddr: client.macaddr, ip_address: client.ip_address, name: client.name, icons: client.icons, client_type: client.client_type };
        return pinnedClientAll;
    });
}
pinnedClientsStore.delete = (client_macaddr) => {
    pinnedClientsAllStore.update((pinnedClientsAll) => {
        const currentAccountId = get(currentAccountIdStore);
        if (pinnedClientsAll[currentAccountId]) delete pinnedClientsAll[currentAccountId][client_macaddr];
        return pinnedClientsAll;
    });
}

const notificationSettingsCacheStore = writable(localStorage.notificationSettings ? JSON.parse(localStorage.notificationSettings) : {});
notificationSettingsCacheStore.subscribe((value) => localStorage.notificationSettings = JSON.stringify(value));
const notificationSettingsStore = derived([notificationSettingsCacheStore, currentAccountIdStore], ([$notificationSettingsCacheStore, $currentAccountId]) => $currentAccountId in $notificationSettingsCacheStore ? $notificationSettingsCacheStore[$currentAccountId] : {});
notificationSettingsStore.update = (notificationSettings) => {
    notificationSettingsCacheStore.update((notificationSettingsCache) => {
        const currentAccountId = get(currentAccountIdStore);
        notificationSettingsCache[currentAccountId] = notificationSettings;
        return notificationSettingsCache;
    });
}

const webhookCacheStore = writable(localStorage.webhooks ? JSON.parse(localStorage.webhooks) : {})
webhookCacheStore.subscribe((value) => localStorage.webhooks = JSON.stringify(value));
const webhookStore = derived([webhookCacheStore, currentAccountIdStore], ([$webhookCacheStore, $currentAccountId]) => $currentAccountId in $webhookCacheStore ? $webhookCacheStore[$currentAccountId] : null);
webhookStore.update = (webhook) => {
    webhookCacheStore.update((webhookCache) => {
        const currentAccountId = get(currentAccountIdStore);
        webhookCache[currentAccountId] = webhook;
        return webhookCache;
    });
}

export {
    newUserStore,
    needRefreshStore as needRefreshStore,
    doRefreshStore,
    offlineReadyStore as offlineReadyStore,
    cameraStore as cameraStore,
    accountsStore as accountsStore,
    currentAccountIdStore as currentAccountIdStore,
    currentAccountStore as currentAccountStore,
    selectedFilterNames,
    selectedFilterDefaults,
    selectedFilterStore as selectedFilterStore,
    selectedSortingOrderStore as selectedSortingOrderStore,
    timeRanges,
    groupCacheStore as groupCacheStore,
    siteCacheStore as siteCacheStore,
    labelCacheStore as labelCacheStore,
    groupStore,
    siteStore,
    labelStore,
    pinnedClientsStore,
    notificationSettingsStore,
    webhookStore,
};

