import * as winston from 'winston';
import * as fs from 'fs-extra';

import { LogLevelService } from './logLevel.service';
import { LOG_PATH_REQUESTS, LOG_PATH_SERVICES } from '../constants/directories';

export class LoggerService {


  private logLevelService: LogLevelService;

  private requestLoggers: { [key: string]: winston.Logger };
  private serviceLoggers: { [key: string]: winston.Logger };


  constructor(logLevelService: LogLevelService) {
    this.logLevelService = logLevelService;

    this.requestLoggers = {};
    this.serviceLoggers = {};
  }


  async createRequestLogger(request: string) {
    const logLevelData = await this.logLevelService.getLogLevel('__REQUEST__');
    const level = logLevelData ? logLevelData.level : 'warn';

    const exists = await fs.pathExists(LOG_PATH_REQUESTS);
    if (!exists) {
      await fs.mkdirp(LOG_PATH_REQUESTS);
    }

    const format = winston.format.combine(
      winston.format.metadata(),
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message, metadata }) => {
        return `[${timestamp}] - [${metadata.service}] - [${level}]: ${message}`;
      }),
    );

    const fileTransport = new winston.transports.File({
      filename: `${request}.log`,
      dirname: LOG_PATH_REQUESTS,
    });

    let transports: any = [fileTransport];
    if (process.env.NODE_ENV !== 'production') {
      const consoleTransport = new winston.transports.Console();
      transports = [...transports, consoleTransport];
    }

    const logger = winston.createLogger({
      format,
      level,
      transports,
    });

    this.requestLoggers[request] = logger;

    logger.log('info', 'Request log file created', { request, service: 'logger-service' });
    return logger;
  }

  async removeRequestLogger(request: string) {
    if (!this.requestLoggers[request]) return;
    this.requestLoggers[request].log('info', 'Request log file closed', { request, service: 'logger-service' });

    this.requestLoggers[request].close();
    delete this.requestLoggers[request];
  }


  async createServiceLogger(service: string) {
    const logLevelData = await this.logLevelService.getLogLevel(service);
    const level = logLevelData ? logLevelData.level : 'warn';

    const exists = await fs.pathExists(LOG_PATH_SERVICES);
    if (!exists) {
      await fs.mkdirp(LOG_PATH_SERVICES);
    }

    const format = winston.format.combine(
      winston.format.metadata(),
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message, metadata }) => {
        return `[${timestamp}] - [${metadata.request}] - [${level}]: ${message}`;
      }),
    );

    const fileTransport = new winston.transports.File({
      filename: `${service}.log`,
      dirname: LOG_PATH_SERVICES,
    });

    let transports: any = [fileTransport];
    if (process.env.NODE_ENV !== 'production') {
      const consoleTransport = new winston.transports.Console();
      transports = [...transports, consoleTransport];
    }

    const logger = winston.createLogger({
      format,
      level,
      transports,
    });

    this.serviceLoggers[service] = logger;

    logger.log('info', 'Service log file opened', { service: 'logger-service', request: 'STARTUP' });
    return logger;
  }

  async removeServiceLogger(service: string) {
    if (!this.serviceLoggers[service]) return;
    this.serviceLoggers[service].log('info', 'Service log file closed', { service: 'logger-service', request: 'SHUTDOWN' });

    this.serviceLoggers[service].close();
    delete this.serviceLoggers[service];
  }


  updateLogLevel(service: string, logLevel: string) {
    if (service === '__REQUEST__') {
      Object.keys(this.requestLoggers).forEach((key) => {
        this.requestLoggers[key].level = logLevel;
      });
    } else {
      if (!this.serviceLoggers[service]) return;
      this.serviceLoggers[service].level = logLevel;
    }
  }

  async log(service: string, request: string, message: string, level: string) {

    let requestLogger = this.requestLoggers[request];
    if (!requestLogger) {
      requestLogger = await this.createRequestLogger(request);
    }


    let serviceLogger = this.serviceLoggers[service];
    if (!serviceLogger) {
      serviceLogger = await this.createServiceLogger(service);
    }

    requestLogger.log(level, message, { service, request });
    serviceLogger.log(level, message, { service, request });
  }

}
