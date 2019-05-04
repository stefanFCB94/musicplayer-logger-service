import * as express from 'express';
import { LoggerService } from '../services/logger.service';
import { get_error_data } from '../utils/get_error_data';


export class LoggerController {

  private loggerService: LoggerService;
  private router: express.Router;


  constructor(loggerService: LoggerService) {
    this.loggerService = loggerService;

    this.router = express.Router();
  }


  public generateApi() {
    this.router.post('/logs', (req, res) => this.log(req, res));

    this.router.post('/service/(:service)/logger', (req, res) => this.createServiceLogger(req, res));
    this.router.delete('/service/(:service)/logger', (req, res) => this.deleteServiceLogger(req, res));

    this.router.post('/request/(:request)/logger', (req, res) => this.createRequestLogger(req, res));
    this.router.delete('/request/(:request)/logger', (req, res) => this.deleteRequestLogger(req, res));
  }

  public getRouter() {
    return this.router;
  }



  private async log(req: express.Request, res: express.Response) {
    try {
      const service = req.body.service;
      const request = req.body.request;
      const message = req.body.message;
      const level = req.body.level;

      await this.loggerService.log(service, request, message, level);

      res.status(204).send();
    } catch (err) {
      res.status(500).json(get_error_data(err));
    }
  }


  private async createServiceLogger(req: express.Request, res: express.Response) {
    try {
      await this.loggerService.createServiceLogger(req.params.service);
      res.status(204).send();
    } catch (err) {
      res.status(500).json(get_error_data(err));
    }
  }

  private async deleteServiceLogger(req: express.Request, res: express.Response) {
    try {
      await this.loggerService.removeServiceLogger(req.params.service);
      res.status(204).send();
    } catch (err) {
      res.status(500).json(get_error_data(err));
    }
  }


  private async createRequestLogger(req: express.Request, res: express.Response) {
    try {
      await this.loggerService.createRequestLogger(req.params.request);
      res.status(204).send();
    } catch (err) {
      res.status(500).json(get_error_data(err));
    }
  }

  private async deleteRequestLogger(req: express.Request, res: express.Response) {
    try {
      await this.loggerService.removeRequestLogger(req.params.request);
      return res.status(204).send();
    } catch (err) {
      res.status(500).json(get_error_data(err));
    }
  }

}
