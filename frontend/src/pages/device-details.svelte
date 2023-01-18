<script>
    import {
        f7,
        f7ready,
        App,
        Panel,
        Views,
        View,
        Popup,
        Page,
        Navbar,
        Toolbar,
        NavRight,
        Link,
        Block,
        BlockTitle,
        LoginScreen,
        LoginScreenTitle,
        List,
        ListItem,
        ListInput,
        ListButton,
        BlockFooter,
    } from "framework7-svelte";

    export let device;

    const deviceAP = {
        ap_deployment_mode: "IAP",
        ap_group: null,
        cluster_id: "",
        controller_name: "",
        firmware_version: "10.4.0.0-10.4.0.0-beta_85756",
        gateway_cluster_id: "",
        gateway_cluster_name: "",
        group_name: "Home-AP-Group",
        ip_address: "192.168.0.211",
        labels: [],
        last_modified: 1672885294,
        macaddr: "80:8d:b7:aa:aa:aa",
        mesh_role: "Unknown",
        model: "315",
        name: "IAP-315",
        notes: null,
        public_ip_address: "91.23.84.37",
        radios: [
            {
                band: 1,
                index: 0,
                macaddr: "80:8d:b7:2a:aa:b0",
                radio_name: "Radio 5 GHz",
                radio_type: "802.11ac",
                spatial_stream: "4x4:4",
                status: "Up",
            },
            {
                band: 0,
                index: 1,
                macaddr: "80:8d:b7:2a:aa:a0",
                radio_name: "Radio 2.4 GHz",
                radio_type: "802.11n",
                spatial_stream: "2x2:2",
                status: "Up",
            },
        ],
        serial: "CNG0AP01FK",
        site: "BBN-Home",
        status: "Up",
        subnet_mask: "255.255.255.0",
        swarm_id: "",
        swarm_master: false,
        swarm_name: "IAP-315",
    };

    const deviceSwitch = {
        firmware_version: "16.10.0021",
        group_id: 38,
        group_name: "SW-Template",
        ip_address: "192.168.0.210",
        label_ids: [],
        labels: [],
        macaddr: "54:80:28:aa:aa:50",
        model: "Aruba2930F-8G-PoE+-2SFP+ Switch(JL258A)",
        name: "Aruba-2930F-8G-PoEP-2SFPP",
        public_ip_address: "91.23.84.37",
        serial: "CN8BSW01FK",
        site: "BBN-Home",
        site_id: 1,
        stack_id: null,
        status: "Up",
        switch_type: "AOS-S",
        uplink_ports: null,
        usage: 1112664,
    };

    console.log(device);

    let handledEntriesAP = {};
    let handledEntriesSwitch = {
        Details: {
            name: "Name",
            model: "Model",
            switch_type: "Type",
            ip_address: "IP",
            macaddr: "MAC",
            serial: "Serial",
            firmware_version: "Fimrware",
        },
        "Group / Site / Label": {
            group_name: "Group Name",
        },
    };
    let handledEntriesGateway = {};
</script>

<Page>
    <Navbar title="Client Details" backLink="Back" />

    {#each Object.entries(device?.switch_type ? handledEntriesSwitch : device?.ap_deployment_mode ? handledEntriesAP : handledEntriesGateway) as [title, data]}
        <BlockTitle>{title}</BlockTitle>
        <List>
            {#each Object.entries(data) as [key, description]}
                {#if typeof description === "object"}
                    <ListItem
                        title={description.title}
                        after={`${device[key]} ${description.unit}`}
                    />
                {:else}
                    <ListItem title={description} after={device[key]} />
                {/if}
            {/each}
        </List>
    {/each}

    <BlockTitle>All Info</BlockTitle>
    <List>
        {#each Object.entries(device) as [title, data]}
            <ListItem {title} after={data} />
        {/each}
    </List>
</Page>
