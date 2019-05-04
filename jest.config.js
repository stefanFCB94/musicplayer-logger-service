process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

process.env.DB_HOST='localhost';
process.env.DB_PORT=5432;
process.env.LOGGER_DB_USERNAME='logger';
process.env.LOGGER_DB_PASSWORD='0JjV5(G26,^{a&L8';
process.env.LOGGER_DB_DATABASE='logger';

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json'
    }
  }
}
