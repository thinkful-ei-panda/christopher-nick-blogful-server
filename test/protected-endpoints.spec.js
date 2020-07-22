const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');
const supertest = require('supertest');

describe('Protected endpoints', function() {
  let db;

  const {
    testUsers,
    testArticles,
    testComments,
  } = helpers.makeArticlesFixtures();

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));    

  describe('GET /api/articles/:article_id', () => {
    beforeEach('insert artciles', () => 
      helpers.seedArticlesTables(
        db,
        testUsers,
        testArticles,
        testComments
      )
    );

    it('responds with 401 \'Missing basic token\' when no basic token', () => {
      return supertest(app)
        .get('/api/articles/123')
        .expect(401, {error: 'Missing basic token'});
    });

    it('responds 401 \'Unauthorized request\' when no credentials in token', () => {
      const userNoCreds = { user_name: '', password: ''};
      return supertest(app)
        .get('/api/articles/123')
        .set('Authorization', helpers.makeAuthHeader(userNoCreds))
        .expect(401, {error: 'Unauthorized request'});
    });

    it('responds 401 \'Unauthorized request\' when invalid user', () => {
      const userInvalidCreds = { user_name: 'user-not', password: 'existy' };
      return supertest(app)
        .get('/api/articles/1')
        .set('Authorization', helpers.makeAuthHeader(userInvalidCreds))
        .expect(401, { error: 'Unauthorized request' });
    });
  });
});