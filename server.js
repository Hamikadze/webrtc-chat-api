const express = require('express');
const app = express();
const signaling = require('./signalling-server')
const bodyParser = require("body-parser");
const http = require("http");
const cors = require("cors");
const port = process.env.PORT || 4001;

const server = http.createServer(app);

app.use(cors())

signaling(server);

app.get('/', (req,res) => {
    res.send('App Works !!!!');
});

server.listen(port, () => {
    console.log(`Server listening on the port::${port}`);
});