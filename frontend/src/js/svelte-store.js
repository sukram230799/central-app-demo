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


export {
    camera as cameraStore,
    accounts as accountsStore,
    currentAccountId as currentAccountIdStore,
    currentAccount as currentAccountStore,
};

