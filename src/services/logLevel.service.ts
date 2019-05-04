import { DatabaseService } from '../database/database.service';
import { LogLevel } from '../database/models/LogLevel';
import { EntityNotFoundError } from '../errors/EntityNotFound.error';
import { ParameterTooLongError } from '../errors/ParameterTooLong.error';
import { RequiredParameterNotSetError } from '../errors/RequiredParamterNotSet.error';
import { InvalidParameterValueError } from '../errors/InvalidParameterValue.error';


export class LogLevelService {


  private database: DatabaseService;

  constructor(database: DatabaseService) {
    this.database = database;
  }



  async getLogLevel(service: string): Promise<LogLevel> {
    const repo = this.database.getConnection().getRepository(LogLevel);
    const logLevel =  await repo.findOne({ where: { service } });

    return logLevel;
  }

  async getLogLevels(): Promise<LogLevel[]> {
    const repo = this.database.getConnection().getRepository(LogLevel);
    const logLevels = await repo.find({ order: { service: 'ASC' } });

    return logLevels;
  }

  async upsertLogLevel(service: string, logLevel: string): Promise<LogLevel> {
    if (!service) {
      throw new RequiredParameterNotSetError("Paramter 'service' not set");
    }
    if (service.length > 128) {
      throw new ParameterTooLongError("Paramter 'service' can only be 128 characters long");
    }

    if (!logLevel) {
      throw new RequiredParameterNotSetError("Parameter 'logLevel' not set");
    }
    if (['error', 'warn', 'info', 'verbose', 'debug', 'silly'].indexOf(logLevel) < 0) {
      throw new InvalidParameterValueError("Invalid paramter for attribute 'logLevel' passed");
    }


    const repo = this.database.getConnection().getRepository(LogLevel);

    const entity = new LogLevel();
    entity.service = service;
    entity.level = logLevel;

    return repo.save(entity);
  }

  async deleteLogLevel(service: string): Promise<LogLevel> {
    const repo = this.database.getConnection().getRepository(LogLevel);

    const entity = await repo.findOne({ service });
    if (!entity) {
      throw new EntityNotFoundError(`Log level for service '${service}' not found`);
    }

    const ret = { ...entity };

    await repo.remove(entity);
    return ret;
  }

}
