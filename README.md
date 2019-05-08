[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/a22beac2362849fdac8dc64133c8e13c)](https://www.codacy.com/app/stefanFCB94/musicplayer-logger-service?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=stefanFCB94/musicplayer-logger-service&amp;utm_campaign=Badge_Grade)
![Travis (.org) branch](https://img.shields.io/travis/stefanFCB94/musicplayer-logger-service/master.svg)
![Docker Pulls](https://img.shields.io/docker/pulls/stefanfcb94/musicplayer-logger-service.svg)
![GitHub package.json version](https://img.shields.io/github/package-json/v/stefanFCB94/musicplayer-logger-service.svg)

# Logger microservice

A microservice, which should be used for logging the messages of all other microservices in an environment.

## API endpoints

| Route | Method | Description |
| ----- | ------ | ----------- |
| /v1/logs | POST | Create a log message |
| /v1/service/(:service)/logger | POST | Create log file for a specific service |
| /v1/service/(:service)/logger | DELETE | Close file handle for log file of specific service |
| /v1/request/(:request)/logger | POST | Create log file for a specific request |
| /v1/request/(:request)/logger | DELETE | Close file handle for log file of specific request |

## Enviroment variables

The following environment variables could be set, to configure the microservice

### Variables for HTTPS configuration

| Variable | Default value | Description |
| -------- | ------------- | ----------- |
| USE_HTTPS | false | If set the service could be reached by HTTPS |
| CERTIFICATE_FILE | | The path, where the file for the certificate can be found |
| PRIVATE_KEY_FILE | | The path, where the file for the private key can be found |

### Variables for port configuration

| Variable | Default value | Description |
| -------- | ------------- | ----------- |
| LOGGER_HTTP_PORT | 80 | The port, on which the service could be reached via HTTP |
| LOGGER_HTTPS_PORT | 443 | The port, on which the service could be reached via HTTPS |
| LOGGER_HTTP_SOCKET_PORT | 8080 | The port, on which the websocket of the service could be reached via HTTP |
| LOGGER_HTTPS_SOCKET_PORT | 8443 | The port, on which the websocket of the service could be reached via HTTPS |

### Variables for the database connection

| Variable | Default value | Description |
| -------- | ------------- | ----------- |
| DB_HOST | db | The hostname, on which the database can be reached |
| DB_PORT | 4321 | The port, on which the database can be reached |
| LOGGER_DB_USERNAME | logger | The username, which should be used to connect to the database |
| LOGGER_DB_PASSWORD | logger | The password, which should be used to connect to the database |
| LOGGER_DB_DATABASE | logger | The name of the database, which should be used for the logger service |
