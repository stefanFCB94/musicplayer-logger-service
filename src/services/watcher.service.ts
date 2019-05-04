import * as fs from 'fs-extra';
import * as uuid from 'uuid';
import { Tail } from 'tail';

import { LOG_PATH_SERVICES, LOG_PATH_REQUESTS } from '../constants/directories';
import { LogFileNotFoundError } from '../errors/LogFileNotFound.error';
import { PathNotAFileError } from '../errors/PathNotAFile.error';
import { WatcherNotFoundError } from '../errors/WatcherNotFound.error';



export class WatcherService {

  private listeners: { [key: string]: Tail } = {};


  constructor() {}


  private async createWatcher(type: 'service' | 'request', name: string, callback: Function) {

    let path: string;
    if (type === 'service') {
      path = `${LOG_PATH_SERVICES}/${name}.log`;
    } else {
      path = `${LOG_PATH_REQUESTS}/${name}.log`;
    }


    const stats = await fs.stat(path);
    if (!stats) {
      throw new LogFileNotFoundError(`Log file '${path}' not found`);
    }
    if (!stats.isFile()) {
      throw new PathNotAFileError(`Log file '${path}' is not a file`);
    }

    const tail = new Tail(path, { follow: true });

    tail.on('line', (data) => {
      callback(data);
    });


    const id = uuid.v4();
    this.listeners[id] = tail;

    return id;
  }

  async createServiceWatcher(serviceName: string, callback: Function) {
    return await this.createWatcher('service', serviceName, callback);
  }

  async createRequestWatcher(requestNumber: string, callback: Function) {
    return await this.createWatcher('request', requestNumber, callback);
  }


  async stopWatcher(listenerId: string) {
    if (!this.listeners[listenerId]) {
      throw new WatcherNotFoundError(`Watcher for with the id '${listenerId}' not found`);
    }

    // Unwatch file and delete the watcher from the registry
    this.listeners[listenerId].unwatch();
    delete this.listeners[listenerId];
  }



}
