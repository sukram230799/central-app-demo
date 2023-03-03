const express = require('express');
const webpush = require('web-push');
const bodyparser = require('body-parser');
const axios = require('axios').default;
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('.data/db.json');
const db = low(adapter);

const centralBaseUrlObject = require('./central-base-url.json');

const centralBaseUrl = Object.values(centralBaseUrlObject)

const vapidDetails = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT
};

const host = process.env.HOST;

db.defaults({
    subscriptions: []
}).write();

function sendNotifications(subscriptions, notification) {
    // Customize how the push service should attempt to deliver the push message.
    // And provide authentication information.
    const options = {
        TTL: 10000,
        vapidDetails: vapidDetails
    };
    // Send a push message to each client specified in the subscriptions array.
    subscriptions.forEach(subscription => {
        const endpoint = subscription.endpoint;
        const id = endpoint.substr((endpoint.length - 8), endpoint.length);
        webpush.sendNotification(subscription, notification, options)
            .then(result => {
                if (process.env.NODE_ENV !== "production") {
                    console.log(`Endpoint ID: ${id}`);
                    console.log(`Result: ${result.statusCode}`);
                }
            })
            .catch(error => {
                if (process.env.NODE_ENV !== "production") {
                    console.log(`Endpoint ID: ${id}`);
                    console.log(`Error: ${error} `);
                }
            });
    });
}

const app = express();
// app.use(cors());
app.use(bodyparser.json());
app.use(express.static('www'));
app.use('/onboard', express.static('onboard'));

app.post('/webhook-register', (request, response) => {
    if (process.env.NODE_ENV !== "production") {
        console.log(`Subscribing ${request.body.endpoint}`);
        db.get('subscriptions')
            .push(request.body)
            .write();
    }

    response.send({ url: `https://${host}/webhook/` + Buffer.from(JSON.stringify(request.body)).toString("base64") })
});

app.post('/webhook-unregister', (request, response) => {
    if (process.env.NODE_ENV !== "production") {
        console.log(`Unsubscribing ${request.body.endpoint}`);
        db.get('subscriptions')
            .remove({ endpoint: request.body.endpoint })
            .write();
    }

    response.sendStatus(200);
});

app.post('/webhook-test', (request, response) => {
    if (process.env.NODE_ENV !== "production") {
        console.log(`Notifying ${request.body.endpoint}`);
        const subscription =
            db.get('subscriptions').find({ endpoint: request.body.endpoint }).value();
        sendNotifications([subscription], JSON.stringify({
            "timestamp": 1677862473,
            "nid": 1250,
            "alert_type": "AP_CPU_OVER_UTILIZATION",
            "severity": "Major",
            "details": {
                "threshold": "20"
            },
            "description": "This is a sample webhook message. Please ignore this",
            "text": "This is a sample webhook message. Please ignore this",
            "setting_id": "CID-1250",
            "device_id": "TEST123456",
            "state": "Open",
            "operation": "create",
            "webhook": "38853888-3391-40af-b7a8-470828512428",
            "cluster_hostname": "internal-ui.central.arubanetworks.com"
        }));
    }
    
    response.sendStatus(200);
});

function checkIfStringStartsWith(str, substrs) {
    return substrs.some(substr => str.startsWith(substr));
}

app.post('/webhook/:endpoint', async (request, response) => {
    if (process.env.NODE_ENV !== "production")
        console.log(request.params.endpoint);
    const endpoint = JSON.parse(Buffer.from(request.params.endpoint, 'base64').toString('utf-8'));
    if (process.env.NODE_ENV !== "production")
        console.log(endpoint);

    sendNotifications([endpoint]);
    response.sendStatus(200);
});

app.post('/api-proxy', async (request, response) => {
    if (!checkIfStringStartsWith(request?.body?.url, centralBaseUrl))
        return response.sendStatus(403);
    if (process.env.NODE_ENV !== "production")
        console.log(request.body);

    let centralResponse;
    try {
        centralResponse = await axios.request({
            // baseURL: request.body.baseURL,
            url: request.body.url,
            data: request.body.data,
            headers: request.body.headers,
            params: request.body.params,
            method: request.body.method,
        });
        if (process.env.NODE_ENV !== "production")
            console.log(centralResponse);
    } catch (e) {
        if (process.env.NODE_ENV !== "production")
            console.error(e)
        centralResponse = e.response;
    }

    let transformedResponse = {
        status: centralResponse.status,
        headers: centralResponse.headers,
        responseBody: centralResponse.data,
    }

    response.send(transformedResponse);
});

app.get('/', (request, response) => {
    response.sendFile(__dirname + '/views/index.html');
});

const listener = app.listen(26799, () => {
    console.log(`Listening on port ${listener.address().port}`);
});
