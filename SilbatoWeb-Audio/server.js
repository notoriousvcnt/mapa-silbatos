const express = require('express');
const app = express();
const fs = require('fs');
const port = 9000;
const path = require('path');
const https = require('https');




// Serve static files
app.use(express.static(path.join(__dirname, 'web')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web','index.html'));
})


// app.listen(port, () => {
//     console.log(`WebSampler funcionando en puerto ${port}`)
//   })

  const options = {
    key: fs.readFileSync(path.join(__dirname,'cert','192.168.1.100-key.pem')),
    cert: fs.readFileSync(path.join(__dirname,'cert','192.168.1.100.pem')),
  };
  
const server = https.createServer(options, app);
  
server.listen(port, () => {
  console.log('server running at ' + port);
});