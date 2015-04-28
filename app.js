var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var bodyParser = require('body-parser');
var passport = require('passport');
var Auth0Strategy = require('passport-auth0');
var Promise = require('bluebird');
var mongoose = Promise.promisifyAll(require('mongoose'));
var passportSocketIo = require("passport.socketio");
var hbs = require('hbs');
var socketCtrl = require('./controllers/socket.js');


hbs.registerHelper('json', JSON.stringify);

var routes = require('./routes/index');

var app = express();
app.set('port', process.env.PORT || 8000);

/**
 * Connect to MongoDB.
 */
mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost:27017/tcohacks');
mongoose.connection.on('error', function () {
  console.error('MongoDB Connection Error. Make sure MongoDB is running.');
});

var strategy = new Auth0Strategy({
  domain: process.env['AUTH0_DOMAIN'],
  clientID: process.env['AUTH0_CLIENT_ID'],
  clientSecret: process.env['AUTH0_CLIENT_SECRET'],
  callbackURL: process.env['AUTH0_CALLBACK_URL'] || 'http://localhost:8000/callback'
}, function (accessToken, refreshToken, extraParams, profile, done) {
  // add the jwt to their profile for stashing
  profile.jwt = extraParams.id_token;

  /* We'll eventually make a call to the topcoder api but for right now
   just hard code a 'member' object so we don't have wait for it. Add
   any handle you would like
   */
  var member = {
    uid: 22918949,
    handle: 'jeffdonthemic',
    country: 'United States',
    memberSince: '2011-01-26T17:43:00.000-0500',
    quote: 'Any sufficiently advanced technology is indistinguishable from magic.',
    photoLink: '/i/m/jeffdonthemic.jpeg',
    name: 'Jeff Douglas',
    gender: 'Male',
    shirtSize: 'Large',
    emails: [{email: 'jdouglas@appirio.com'}]
  };

  profile.member = member;
  return done(null, profile);
});

passport.use(strategy);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

app.locals.auth0 = {
  domain: process.env['AUTH0_DOMAIN'],
  clientId: process.env['AUTH0_CLIENT_ID'],
  callbackUrl: process.env['AUTH0_CALLBACK_URL'] || 'http://localhost:8000/callback',
  scope: process.env['AUTH0_SCOPE'] || 'openid',
  tcCallbackUrl: process.env['AUTH0_CALLBACK_URL'].split('/callback')[0]
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
var sstore = new MongoStore({
  mongooseConnection: mongoose.connection
});
app.use(session({
  key: 'tcohackathon',
  secret: 'iamsosecret',
  store: sstore
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var server = app.listen(app.get('port'), function () {
  console.log('Express server listening on port %d', server.address().port);
  // socket.io
  var io = require('socket.io')(server);
  var user;
  var onAuthorizeSuccess = function (data, accept) {
    console.log('socket connection successfully authorized');
    user = data.user;
    accept();
  };
  // Configure socket.io for session support.
  io.use(passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'tcohackathon',
    secret: 'iamsosecret',
    store: sstore,
    success: onAuthorizeSuccess
  }));
  io.on('connection', function (socket) {
    console.log('a user connected %s', socket.id);
    socketCtrl(socket, user);
    socket.on('disconnect', function () {
      console.log('user %s disconnected', socket.id);
    });
  });
});

module.exports = app;
