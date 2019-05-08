process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json'
    }
  }
};
