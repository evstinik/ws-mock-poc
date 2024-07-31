var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);

app.get('/', function (req, res, next) {
  console.log('get route');
  res.end();
});

app.ws('/', function (ws, req) {
  ws.on('message', function (textMsg) {
    try {
      const msg = JSON.parse(textMsg);
      if (msg.action === 'ping') {
        const response = JSON.stringify({ action: 'pong' });
        ws.send(response);
        console.log('Sent: ', response);
      }
    } catch (e) {
      console.error(e);
    }
    console.log('Received: ', textMsg);
  });
});

app.listen(3007, function () {
  console.log('Listening on http://localhost:3007');
});
