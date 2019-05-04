import * as express from 'express';
import { LogLevelService } from '../services/logLevel.service';
import { LoggerService } from '../services/logger.service';
import { EntityNotFoundError } from '../errors/EntityNotFound.error';
import { get_error_data } from '../utils/get_error_data';
import { get_success_data } from '../utils/get_success_data';
import { UnsupportedError } from '../errors/Unsupported.error';
import { InvalidParameterValueError } from '../errors/InvalidParameterValue.error';
import { ParameterTooLongError } from '../errors/ParameterTooLong.error';
import { RequiredParameterNotSetError } from '../errors/RequiredParamterNotSet.error';


export class ConfigController {

  private logLevelService: LogLevelService;
  private loggerService: LoggerService;
  private router: express.Router;

  constructor(
    logLevelService: LogLevelService,
    loggerService: LoggerService,
  ) {
    this.logLevelService = logLevelService;
    this.loggerService = loggerService;

    this.router = express.Router();
  }


  public generateApi() {
    this.router.get('/config/levels/service', (req, res) => this.getLogLevels(req, res));
    this.router.post('/config/levels/service', (req, res) => this.upsertLogLevel(req, res));
    this.router.get('/config/levels/service/(:service)', (req, res) => this.getLogLevel(req, res));
    this.router.put('/config/levels/service/(:service)', (req, res) => this.upsertLogLevel(req, res));
    this.router.delete('/config/levels/service/(:service)', (req, res) => this.deleteLogLevel(req, res));
  }

  public getRouter() {
    return this.router;
  }


  private async getLogLevels(req: express.Request, res: express.Response) {
    try {
      const levels = await this.logLevelService.getLogLevels();
      res.status(200).json(get_success_data(levels));
    } catch (err) {
      const error = new UnsupportedError(err.message);
      res.status(500).json(get_error_data(error));
    }
  }

  private async getLogLevel(req: express.Request, res: express.Response) {
    try {
      const service: string = req.params.service;
      const logLevel = await this.logLevelService.getLogLevel(service);

      if (!logLevel) {
        const error = new EntityNotFoundError('Log level for service is not configured');
        res.status(404).json(get_error_data(error));
        return;
      }

      res.status(200).json(get_success_data({ logLevel }));
    } catch (err) {
      const error = new UnsupportedError(err.message);
      res.status(500).json(get_error_data(error));
    }
  }

  private async upsertLogLevel(req: express.Request, res: express.Response) {
    try {
      const service = req.body.service;
      const level = req.body.level;

      const logLevel = await this.logLevelService.upsertLogLevel(service, level);
      this.loggerService.updateLogLevel(service, level);

      res.status(200).json(get_success_data({ logLevel }));

    } catch (err) {

      if (err instanceof InvalidParameterValueError) {
        res.status(400).json(get_error_data(err));
        return;
      }

      if (err instanceof ParameterTooLongError) {
        res.status(400).json(get_error_data(err));
        return;
      }

      if (err instanceof RequiredParameterNotSetError) {
        res.status(400).json(get_error_data(err));
        return;
      }

      const error = new UnsupportedError(err.message);
      res.status(500).json(get_error_data(error));
    }
  }

  private async deleteLogLevel(req: express.Request, res: express.Response) {
    const service = req.params.service;

    try {
      const logLevel = await this.logLevelService.deleteLogLevel(service);
      res.status(200).json(get_success_data({ logLevel }));

    } catch (err) {
      if (err instanceof EntityNotFoundError) {
        res.status(404).json(get_error_data(err));
        return;
      }

      res.status(500).json(get_error_data(new UnsupportedError('Unknwon error')));
    }
  }

}
