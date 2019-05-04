import * as express from 'express';
import * as enableWs from 'express-ws';
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs-extra';
import * as compression from 'compression';
import * as helmet from 'helmet';
import * as bodyParser from 'body-parser';

import { WatcherService } from './services/watcher.service';
import { ExtWebSocket } from './interfaces/ExtWebSocket';



export class Socket {

  private app: express.Application;
  private server: http.Server | https.Server;

  private wss: enableWs.Instance;
  private pingInterval: NodeJS.Timeout;

  private httpPort: number;
  private httpsPort: number;
  private useHttps: boolean;
  private certificate: string;
  private privateKey: string;


  private watcherService: WatcherService;


  constructor() {
    this.httpPort = +process.env.LOGGER_HTTP_SOCKET_PORT || 8080;
    this.httpsPort = +process.env.LOGGER_HTTPS_SOCKET_PORT || 8443;

    // HTTPS is used, when, the environment variable is set
    this.useHttps = false;
    if (process.env.USE_HTTPS) {
      this.useHttps = true;
    }

    this.certificate = process.env.CERTIFICATE_FILE;
    this.privateKey = process.env.PRIVATE_KEY_FILE;
  }



  public init() {
    this.watcherService = new WatcherService();
  }


  public async start() {
    this.app = express();
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(compression());
    this.app.use(helmet());


    // Initialize server vor the websocket
    if (this.useHttps) {
      const key = await fs.readFile(this.privateKey);
      const cert = await fs.readFile(this.certificate);
      const options: https.ServerOptions = { key, cert };

      this.server =  https.createServer(options, this.app);
    } else {
      this.server = http.createServer(this.app);
    }

    this.wss = enableWs(this.app, this.server);

    await this.startServiceWebsocket();
    await this.startRequestWebsocket();
    await this.startPingInterval();


    this.server.listen(this.httpsPort, () => {
      console.log(`Websocket ist listening on port ${this.httpsPort}`);
    });
  }


  private async startServiceWebsocket() {
    this.wss.app.ws('/service/(:service)', async (ws: ExtWebSocket, req) => {
      try {
        const id = await this.watcherService.createServiceWatcher(req.params.service, (line: string) => {
          ws.send(line);
        });

        ws.on('close', () => {
          this.watcherService.stopWatcher(id);
        });

        ws.on('pong', () => {
          ws.isAlive = true;
        });

        ws.isAlive = true;
      } catch (err) {
        ws.close(1003, err.message);
      }
    });
  }

  private async startRequestWebsocket() {
    this.wss.app.ws('/request/(:request)', async (ws: ExtWebSocket, req) => {
      try {
        const id = await this.watcherService.createRequestWatcher(req.params.request, (line: string) => {
          ws.send(line);

          ws.on('close', () => {
            this.watcherService.stopWatcher(id);
          });

          ws.on('pong', () => {
            ws.isAlive = true;
          });

          ws.isAlive = true;
        });
      } catch (err) {
        ws.close(1003, err.message);
      }
    });
  }

  private async startPingInterval() {
    this.pingInterval = setInterval(() => {
      this.wss.getWss().clients.forEach((client: ExtWebSocket) => {
        if (!client.isAlive) return client.terminate();

        client.isAlive = false;
        client.ping(null, false);
      });
    },                              10000);
  }


  public async stopWebsocket() {
    return new Promise<void>((resolve) => {
      if (!this.server) return resolve();

      clearInterval(this.pingInterval);

      this.wss.getWss().clients.forEach((ws: ExtWebSocket) => {
        ws.terminate();
      });

      this.wss.getWss().close(() => {
        this.wss = null;

        this.server.close(() => {
          this.server = null;
          resolve();
        });
      });
    });
  }


}
