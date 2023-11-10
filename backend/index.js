import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import expressWs from 'express-ws';

try {
  // setup express
  const app = express();

  // enable websockets in express
  expressWs(app);

  const port = 3000;
  // CORS middleware for proper CORS handling
  app.use(cors());
  // JSON body parser (so we don't have to parse request bodies manually)
  app.use(bodyParser.json());



  // Websocket

  // array to store all known clients (after they have reistered with a username)
  const wsClients = [];

  // send a message to all known clients
  const broadcast = (msg) => {
    wsClients.forEach((client) => {
      client.ws.send(JSON.stringify(msg));
    });
  };

  // send participants list to all known clients
  const broadcastParticipants = () => {
    broadcast({
      type: 'participants',
      time: Date.now(),
      participants: wsClients.map(c => c.username).filter(name => !!name),
    });
  };

  // websocket endpoint, the callback function is called whenever a new websocket (client) connects
  app.ws('/chat', function (clientWs, req) {
    console.log('client connected');

    // add close handler for this specific client, called when this client disconnects
    clientWs.on('close', function () {
      console.log('connection closed');
      const idx = wsClients.findIndex(c => c.ws === clientWs);
      if (idx !== -1) { // check if this client was already registered (stored in wsClients)
        const username = wsClients[idx].username; // extract username
        wsClients.splice(idx, 1); // remove client from known/registered clients

        // send disconnected event
        broadcast({
          type: 'disconnected',
          time: Date.now(),
          author: username,
        });
        // send updated participants list
        broadcastParticipants();
      }
    });

    // add message handler for this specific client, called when this client sends a message
    clientWs.on('message', function (msg) {
      console.log('message received', msg);
      const data = JSON.parse(msg);
      // check type of message
      if (data.type === 'register') {
        const userExists = wsClients.find(c => c.username === data.author);
        if (userExists) { // if username is already taken, disconnect client
          // we send a status code and message
          // we can use any status code between 4000 and 4999, see https://www.rfc-editor.org/rfc/rfc6455.html#section-7.4.2
          clientWs.close(4000, 'Username already in use.');
          return;
        }
        // add client to known/registered clients
        wsClients.push({ ws: clientWs, username: data.author });
        // send connected event
        broadcast({
          type: 'connected',
          time: Date.now(),
          author: data.author,
        });
        // send updated participants list
        broadcastParticipants();
      } else {
        // when its a regular message, just forward it, but only if the client is known/registered
        const client = wsClients.find(c => c.ws === clientWs);
        if (client) {
          // forward/broadcast message, also add author name to it
          broadcast({ ...data, author: client.username });
        }
      }
    });
  });



  // Frontend endpoints

  // static routing for frontend - frontend is not using a router, so static routing is sufficient
  app.use('/', express.static('./frontend/dist'));

  // start server
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
} catch(e) {
  // output any errors on console
  console.error(e);
}
