const express = require('express');
const webpush = require('web-push');
const bodyparser = require('body-parser');
const axios = require('axios').default;
var cors = require('cors')


const vapidDetails = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT
};


function sendNotifications(subscriptions) {
    // Create the notification content.
    const notification = JSON.stringify({
        title: "Hello, Notifications!",
        options: {
            body: `ID: ${Math.floor(Math.random() * 100)}`
        }
    });
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
                console.log(`Endpoint ID: ${id}`);
                console.log(`Result: ${result.statusCode}`);
            })
            .catch(error => {
                console.log(`Endpoint ID: ${id}`);
                console.log(`Error: ${error} `);
            });
    });
}

subs = {};

const app = express();
app.use(cors())
app.use(bodyparser.json());
app.use(express.static('www'));

app.post('/add-subscription', (request, response) => {
    console.log(`Subscribing ${request.body.endpoint}`);
    subs[request.body.endpoint] = request.body
    response.sendStatus(200);
});

app.post('/remove-subscription', (request, response) => {
    console.log(`Unsubscribing ${request.body.endpoint}`);
    delete subs[request.body.endpoint];
    response.sendStatus(200);
});

app.post('/notify-me', (request, response) => {
    console.log(`Notifying ${request.body.endpoint}`);
    const subscription =
        subs[request.body.endpoint];
    sendNotifications([subscription]);
    response.sendStatus(200);
});

app.post('/notify-all', (request, response) => {
    console.log('Notifying all subscribers');
    console.log(subs);
    console.log(typeof subs);
    const subscriptions =
        Object.values(subs);
    if (subscriptions.length > 0) {
        sendNotifications(subscriptions);
        response.sendStatus(200);
    } else {
        response.sendStatus(409);
    }
});

app.post('/api-proxy', async (request, response) => {
    console.log(request.body);

    let centralResponse;
    try {
        centralResponse = await axios.request({
            // baseURL: request.body.baseURL,
            url: request.body.url,
            body: request.body.body,
            headers: request.body.headers,
            params: request.body.params,
            method: request.body.method,
        });

        console.log(centralResponse);
    } catch (e) {
        console.log(e)
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
