import { writable, derived } from 'svelte/store';

const camera = writable(localStorage.camera ? JSON.parse(localStorage.camera) : {}); // || {"Id":"d3f5ceb340cf8ddbec8422380bc32693a8b284a453e3aa76b67b8f6a423bc2f5","label":"HP HD Camera (0408:5373)"});
camera.subscribe((value) => localStorage.camera = JSON.stringify(value));

const accounts = writable(localStorage.credentials ? JSON.parse(localStorage.credentials) : {});
accounts.subscribe((value) => localStorage.credentials = JSON.stringify(value))

const currentAccountId = writable(localStorage.selectedCredentialId);
currentAccountId.subscribe((value) => localStorage.selectedCredentialId = value);

const currentAccount = derived(
    [accounts, currentAccountId], ([$credentials, $selectedCredentialId]) => $credentials[$selectedCredentialId]
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
    group: null,
    label: null,
    site: null,
    timeRange: 0,
    clientStatus: 'CONNECTED',
    network: null,
    serial: null,
    swarmId: null,
    clusterId: null,
    band: null,
    stackId: null,
    osType: null,
    field: [],
    additionalFields: ['usage', 'manufacturer', 'signal_db'],
};

const selectedFilter = writable(localStorage.selectedFilter ? JSON.parse(localStorage.selectedFilter) : { ...selectedFilterDefaults });
selectedFilter.subscribe((value) => localStorage.selectedFilter = JSON.stringify(value));

const selectedSortingOrder = writable('');

export {
    camera as cameraStore,
    accounts as accountsStore,
    currentAccountId as currentAccountIdStore,
    currentAccount as currentAccountStore,
    selectedFilterNames,
    selectedFilterDefaults,
    selectedFilter,
    selectedSortingOrder,
    timeRanges,
};

