var path = require('path');
var assert = require('chai').assert;

require('dotenv').config({
  path: path.join(__dirname, '../.env')
});

var Session = require('supertest-session')({
  app: require('../app.js')
});

describe('spinWheel tests', function () {

  before(function () {
    this.sess = new Session();
  });

  it('should export socket module as function', function () {
    var socketCtrl = require('../controllers/socket');
    assert.isFunction(socketCtrl);
  });

  it('app should be started', function (done) {
    this.sess.get('/')
      .expect(200)
      .end(done);
  });

  it('should serve client side js code', function (done) {
    this.sess.get('/js/spin_wheel.js')
      .expect(200)
      .expect('Content-Type', 'application/javascript')
      .end(done);
  });

  it('should redirect to login', function (done) {
    this.sess.get('/someE/teams/someT/spin')
      .expect(302)
      .end(done);
  });
});
