const express = require('express');
const https = require('https');
const app = express();
const fs = require('fs');
const port = 9000;
const path = require('path');
// const OSC = require('osc');
const OSC = require('osc-js');
//const Max = require('max-api');

// Serve static files with correct MIME types
app.use(express.static('public'));
app.use(express.static('libraries'));


app.get('/', (req, res) => {
    res.send(path.join(__dirname,'index.html'));
    //console.log('index.html served');
})


const options = {
    key: fs.readFileSync(path.join(__dirname,'cert','localhost+2-key.pem')),
    cert: fs.readFileSync(path.join(__dirname,'cert','localhost+2.pem')),
  };
  
const server = https.createServer(options, app);
  
server.listen(port, () => {
  console.log('server running at ' + port);
});

// OSC configs
const wssServer = https.createServer(options);

// wssServer.on("message", function incoming(message) {
//   const msgParsed = OSC.readPacket(message, { metadata: false});
//   console.log("received parsed : ", msgParsed);
  
//   //maxAPI.outlet('message', msgParsed)
// });


const config = { udpClient: { port: 9129} };
const osc = new OSC({ plugin: new OSC.BridgePlugin(config) });

osc.on('open', () => {
    console.log('new connection.'); // connection was established
  });
  
osc.on('close', () => {
  console.log('connection was closed.');// connection was closed
});

osc.on('error', (err) => {
  console.log('an error occurred'); // an error occurred
});

osc.on('message', (message) => {
  console.log('received message', message);
});

osc.on('open', () => {
  console.log('OSC Connection is open');
});

osc.open({wsServer:{ server: wssServer}}); // start a WebSocket server on port 8080

wssServer.listen(8080,() => {
  console.log('server running at ' + 8080);
});