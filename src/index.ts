import 'reflect-metadata';

import { Server } from './server';
import { Socket } from './socket';

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

let server: Server;
let websocket: Socket;

async function startServer() {
  server = new Server();
  await server.init();
  await server.start();

  websocket = new Socket();
  await websocket.init();
  await websocket.start();
}

process.on('SIGINT', async () => {
  await server.stop();
  await websocket.stopWebsocket();

  setTimeout(() => process.exit(0), 1000);
});



startServer();
