const express = require('express');
const app = express();
const signaling = require('./signalling');
const http = require("http");
const cors = require("cors");
const Turn = require('node-turn');
const port = process.env.PORT || 4001;

const server = http.createServer(app);
app.use(cors())

/*
* Initializing a signaling server for:
*   the initial exchange of information between peers
*   authorization
*   text messaging
*/
signaling(server);

app.get('/', (req,res) => {
    res.send('App Works');
});

/* runs turn server for communication between peers throw NAT */
const turnServer = new Turn({
    // set options
    authMech: 'long-term',
    credentials: {
        username: 'turnclient',
        credential: '$0mep@$$w0rd'
    }
});
turnServer.start();

/* Launcher http and socket server */
server.listen(port, () => {
    console.log(`Server listening on the port::${port}`);
});