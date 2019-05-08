import * as request from 'supertest';
import { Client } from 'pg';


describe('Integration tests log level configuration', () => {

  let client: Client;

  beforeEach(async () => {
    client = new Client({
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      user: process.env.LOGGER_DB_USERNAME,
      password: process.env.LOGGER_DB_PASSWORD,
      database: process.env.LOGGER_DB_DATABASE,
    });

    await client.connect();
  });

  afterEach(async () => {
    await client.end();
  });


  describe('GET /v1/config/levels/service', () => {

    beforeEach(async () => {
      // Insert default test data
      await client.query("insert into log_level(service, level) values('service1', 'warn')");
      await client.query("insert into log_level(service, level) values('service2', 'info')");
    });

    afterEach(async () => {
      await client.query('delete from log_level');
    });


    it('should return the complete data with an status code 200', (done) => {
      request(`https://${process.env.APPL_HOST}:${process.env.LOGGER_HTTPS_PORT}`)
        .get('/v1/config/levels/service')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, data) => {
          if (err) return done(err);

          expect(data.body.errors.length).toEqual(0);
          expect(data.body.data.length).toEqual(2);

          expect(data.body.data[0].service).toEqual('service1');
          expect(data.body.data[0].level).toEqual('warn');

          expect(data.body.data[1].service).toEqual('service2');
          expect(data.body.data[1].level).toEqual('info');

          done();
        });
    });


  });

  describe('POST /v1/config/levels/service', () => {

    afterEach(async () => {
      await client.query('delete from log_level');
    });

    it('should insert the log level, if service is not defined', (done) => {
      request(`https://${process.env.APPL_HOST}:${process.env.LOGGER_HTTPS_PORT}`)
        .post('/v1/config/levels/service')
        .send({ service: 'service1', level: 'warn' })
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err, data) => {
          if (err) return done(err);

          expect(data.body.errors.length).toEqual(0);

          expect(typeof data.body.data === 'object').toBeTruthy();
          expect(typeof data.body.data.logLevel === 'object').toBeTruthy();

          expect(data.body.data.logLevel.service).toEqual('service1');
          expect(data.body.data.logLevel.level).toEqual('warn');


          const dbData = await client.query("select * from log_level where service = 'service1'");

          expect(dbData.rows.length).toEqual(1);
          expect(dbData.rows[0].level).toEqual('warn');
          expect(dbData.rows[0].created).not.toBeNull();
          expect(dbData.rows[0].updated).not.toBeNull();

          done();
        });
    });

    it('should update the log level, if service is already defined', (done) => {
      client.query("insert into log_level values('service1', 'info')")
        .then(() => {
          request(`https://${process.env.APPL_HOST}:${process.env.LOGGER_HTTPS_PORT}`)
            .post('/v1/config/levels/service')
            .send({ service: 'service1', level: 'warn' })
            .set('Accept', 'application/json')
            .expect(200)
            .end(async (err, data) => {
              if (err) return done(err);

              expect(data.body.errors.length).toEqual(0);

              expect(typeof data.body.data === 'object').toBeTruthy();
              expect(typeof data.body.data.logLevel === 'object').toBeTruthy();

              expect(data.body.data.logLevel.service).toEqual('service1');
              expect(data.body.data.logLevel.level).toEqual('warn');
              expect(data.body.data.logLevel.create).not.toEqual(data.body.data.logLevel.updated);

              const dbData = await client.query("select * from log_level where service = 'service1'");

              expect(dbData.rows.length).toEqual(1);
              expect(dbData.rows[0].level).toEqual('warn');
              expect(dbData.rows[0].created).not.toEqual(dbData.rows[0].updated);

              done();
            });
        });
    });

    it('should return 400 with correct error, if invalid log level is passed to api', (done) => {
      request(`https://${process.env.APPL_HOST}:${process.env.LOGGER_HTTPS_PORT}`)
        .post('/v1/config/levels/service')
        .send({ service: 'service1', level: 'invalid' })
        .set('Accept', 'application/json')
        .expect(400)
        .end((err, data) => {
          if (err) return done(err);

          expect(data.body.data).toBeNull();
          expect(data.body.errors.length).toEqual(1);

          expect(data.body.errors[0].type).toEqual('InvalidParameterValueError');

          done();
        });
    });

    it('should return 400 with correct error, if a too long service name is passed', (done) => {
      request(`https://${process.env.APPL_HOST}:${process.env.LOGGER_HTTPS_PORT}`)
        .post('/v1/config/levels/service')
        .send({ service: '123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789', level: 'info' })
        .set('Accept', 'application/json')
        .expect(400)
        .end((err, data) => {
          if (err) return done(err);

          expect(data.body.data).toBeNull();
          expect(data.body.errors.length).toEqual(1);
          expect(data.body.errors[0].type).toEqual('ParameterTooLongError');

          done();
        });
    });

    it('should return 400 with correct error, if parameter service is not passed to the api', (done) => {
      request(`https://${process.env.APPL_HOST}:${process.env.LOGGER_HTTPS_PORT}`)
        .post('/v1/config/levels/service')
        .send({ level: 'info' })
        .set('Accept', 'application/json')
        .end((err, data) => {
          if (err) return done(err);

          expect(data.body.data).toBeNull();
          expect(data.body.errors.length).toEqual(1);
          expect(data.body.errors[0].type).toEqual('RequiredParameterNotSetError');

          done();
        });
    });

    it('should return 400 with correct error, if parameter level is not passed to api', (done) => {
      request(`https://${process.env.APPL_HOST}:${process.env.LOGGER_HTTPS_PORT}`)
        .post('/v1/config/levels/service')
        .send({ service: 'service1' })
        .set('Accept', 'application/json')
        .end((err, data) => {
          if (err) return done(err);

          expect(data.body.data).toBeNull();
          expect(data.body.errors.length).toEqual(1);
          expect(data.body.errors[0].type).toEqual('RequiredParameterNotSetError');

          done();
        });
    });
  });

  describe('GET /v1/config/levels/service/(:service)', () => {

    beforeEach(async () => {
      await client.query("insert into log_level(service, level) values('service1', 'info')");
      await client.query("insert into log_level(service, level) values('service2', 'warn')");
    });

    afterEach(async () => {
      await client.query('delete from log_level');
    });

    it('should return 404 with correct error, if service is not found', (done) => {
      request(`https://${process.env.APPL_HOST}:${process.env.LOGGER_HTTPS_PORT}`)
        .get('/v1/config/levels/service/service3')
        .set('Accept', 'application/json')
        .expect(404)
        .end((err, data) => {
          if (err) return done(err);

          expect(data.body.data).toBeNull();
          expect(data.body.errors.length).toEqual(1);
          expect(data.body.errors[0].type).toEqual('EntityNotFoundError');

          done();
        });
    });

    it('should return 200 with the data of the service', (done) => {
      request(`https://${process.env.APPL_HOST}:${process.env.LOGGER_HTTPS_PORT}`)
        .get('/v1/config/levels/service/service1')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, data) => {
          if (err) return done(err);

          expect(data.body.errors.length).toEqual(0);

          expect(typeof data.body.data === 'object').toBeTruthy();
          expect(typeof data.body.data.logLevel === 'object').toBeTruthy();
          expect(data.body.data.logLevel.service).toEqual('service1');
          expect(data.body.data.logLevel.level).toEqual('info');

          done();
        });
    });

  });

  describe('PUT /v1/config/levels/service/(:service)', () => {

    afterEach(async () => {
      await client.query('delete from log_level');
    });

    it('should insert the log level, if service is not defined', (done) => {
      request(`https://${process.env.APPL_HOST}:${process.env.LOGGER_HTTPS_PORT}`)
        .put('/v1/config/levels/service/service1')
        .send({ service: 'service1', level: 'warn' })
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err, data) => {
          if (err) return done(err);

          expect(data.body.errors.length).toEqual(0);

          expect(typeof data.body.data === 'object').toBeTruthy();
          expect(typeof data.body.data.logLevel === 'object').toBeTruthy();

          expect(data.body.data.logLevel.service).toEqual('service1');
          expect(data.body.data.logLevel.level).toEqual('warn');


          const dbData = await client.query("select * from log_level where service = 'service1'");

          expect(dbData.rows.length).toEqual(1);
          expect(dbData.rows[0].level).toEqual('warn');
          expect(dbData.rows[0].created).not.toBeNull();
          expect(dbData.rows[0].updated).not.toBeNull();

          done();
        });
    });

    it('should update the log level, if service is already defined', (done) => {
      client.query("insert into log_level values('service1', 'info')")
        .then(() => {
          request(`https://${process.env.APPL_HOST}:${process.env.LOGGER_HTTPS_PORT}`)
            .put('/v1/config/levels/service/service1')
            .send({ service: 'service1', level: 'warn' })
            .set('Accept', 'application/json')
            .expect(200)
            .end(async (err, data) => {
              if (err) return done(err);

              expect(data.body.errors.length).toEqual(0);

              expect(typeof data.body.data === 'object').toBeTruthy();
              expect(typeof data.body.data.logLevel === 'object').toBeTruthy();

              expect(data.body.data.logLevel.service).toEqual('service1');
              expect(data.body.data.logLevel.level).toEqual('warn');
              expect(data.body.data.logLevel.create).not.toEqual(data.body.data.logLevel.updated);

              const dbData = await client.query("select * from log_level where service = 'service1'");

              expect(dbData.rows.length).toEqual(1);
              expect(dbData.rows[0].level).toEqual('warn');
              expect(dbData.rows[0].created).not.toEqual(dbData.rows[0].updated);

              done();
            });
        });
    });

    it('should return 400 with correct error, if invalid log level is passed to api', (done) => {
      request(`https://${process.env.APPL_HOST}:${process.env.LOGGER_HTTPS_PORT}`)
        .put('/v1/config/levels/service/service1')
        .send({ service: 'service1', level: 'invalid' })
        .set('Accept', 'application/json')
        .expect(400)
        .end((err, data) => {
          if (err) return done(err);

          expect(data.body.data).toBeNull();
          expect(data.body.errors.length).toEqual(1);

          expect(data.body.errors[0].type).toEqual('InvalidParameterValueError');

          done();
        });
    });

    it('should return 400 with correct error, if a too long service name is passed', (done) => {
      request(`https://${process.env.APPL_HOST}:${process.env.LOGGER_HTTPS_PORT}`)
        .put('/v1/config/levels/service/service1')
        .send({ service: '123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789', level: 'info' })
        .set('Accept', 'application/json')
        .expect(400)
        .end((err, data) => {
          if (err) return done(err);

          expect(data.body.data).toBeNull();
          expect(data.body.errors.length).toEqual(1);
          expect(data.body.errors[0].type).toEqual('ParameterTooLongError');

          done();
        });
    });

    it('should return 400 with correct error, if parameter service is not passed to the api', (done) => {
      request(`https://${process.env.APPL_HOST}:${process.env.LOGGER_HTTPS_PORT}`)
        .put('/v1/config/levels/service/service1')
        .send({ level: 'info' })
        .set('Accept', 'application/json')
        .end((err, data) => {
          if (err) return done(err);

          expect(data.body.data).toBeNull();
          expect(data.body.errors.length).toEqual(1);
          expect(data.body.errors[0].type).toEqual('RequiredParameterNotSetError');

          done();
        });
    });

    it('should return 400 with correct error, if parameter level is not passed to api', (done) => {
      request(`https://${process.env.APPL_HOST}:${process.env.LOGGER_HTTPS_PORT}`)
        .put('/v1/config/levels/service/service1')
        .send({ service: 'service1' })
        .set('Accept', 'application/json')
        .end((err, data) => {
          if (err) return done(err);

          expect(data.body.data).toBeNull();
          expect(data.body.errors.length).toEqual(1);
          expect(data.body.errors[0].type).toEqual('RequiredParameterNotSetError');

          done();
        });
    });
  });

  describe('DELETE /v1/config/levels/service/(:service)', () => {

    beforeEach(async () => {
      await client.query("insert into log_level(service, level) values('service1', 'warn')");
      await client.query("insert into log_level(service, level) values('service2', 'info')");
    });

    afterEach(async () => {
      await client.query('delete from log_level');
    });

    it('should return 200 and deletes the service from the database', (done) => {
      request(`https://${process.env.APPL_HOST}:${process.env.LOGGER_HTTPS_PORT}`)
        .delete('/v1/config/levels/service/service1')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err, data) => {
          if (err) return done(err);

          expect(data.body.errors.length).toEqual(0);

          expect(typeof data.body.data === 'object').toBeTruthy();
          expect(typeof data.body.data.logLevel === 'object').toBeTruthy();

          expect(data.body.data.logLevel.service).toEqual('service1');
          expect(data.body.data.logLevel.level).toEqual('warn');

          const dbData = await client.query('select * from log_level');

          expect(dbData.rows.length).toEqual(1);
          expect(dbData.rows[0].service).toEqual('service2');

          done();
        });
    });

    it('should return 404, if service could not be found', (done) => {
      request(`https://${process.env.APPL_HOST}:${process.env.LOGGER_HTTPS_PORT}`)
        .delete('/v1/config/levels/service/service3')
        .set('Accept', 'application/json')
        .expect(404)
        .end((err, data) => {
          if (err) return done(err);

          expect(data.body.data).toBeNull();
          expect(data.body.errors[0].type).toEqual('EntityNotFoundError');

          done();
        });
    });

  });

});
