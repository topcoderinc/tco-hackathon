var express = require('express');
var router = express.Router();
var passport = require('passport');
var _ = require('lodash');
var requiresLogin = require('../requiresLogin');
var Event = require('../models/Event');
var Team = require('../models/Team');
var mongoose = require('mongoose');

router.get('/', function(req, res) {

  Event.find({}, function(err, events) {
    if (err)
      res.status(500).json(err);
    res.render('index', { title: 'TCO Hacks', events: events });
  });

});

router.get('/login', function(req, res) {
  res.render('login', {
    domain: process.env['AUTH0_DOMAIN'],
    clientId: process.env['AUTH0_CLIENT_ID'],
    callbackUrl: process.env['AUTH0_CALLBACK_URL'] || 'http://localhost:8000/callback',
    scope: process.env['AUTH0_SCOPE'] || 'openid'
  });
});

// Auth0 callback handler
router.get('/callback',
  passport.authenticate('auth0', { failureRedirect: '/failure' }),
  function(req, res) {
    if (!req.user) {
      throw new Error('user null');
    }
    res.redirect("/success");
  });

router.get('/failure', function(req, res) {
  res.render('failure');
});

router.get('/success', function(req, res) {
  res.render('success');
});

router.get('/user', requiresLogin, function(req, res) {
  console.log(req.user);
  res.render('user', { user: req.user });
});

router.get('/:eventId', function(req, res) {
  Event.findById(req.params.eventId, function (err, event) {
    if (err)
      res.send(err);
    res.render('event', {event: event});
  });
});

router.get('/:eventId/teams/:teamId', function(req, res) {
  Event.findById(req.params.eventId, function (err, event) {
    if (err)
      res.send(err);
    // find the team
    var team = _.find(event.teams, function(t) {
      return t.id === req.params.teamId;
    });
    res.render('team', {event: event, team: team});
  });
});

router.get('/:eventId/teams/:teamId/spin', requiresLogin, function(req, res) {
  Event.findById(req.params.eventId, function (err, event) {
    if (err)
      res.send(err);
    // find the team
    var team = _.find(event.teams, function(t) {
      return t.id === req.params.teamId;
    });
    var canSpin = false;
    if (team.leader === req.user.member.handle && team.apiSpins.length === 0) {
      canSpin = true;
    }
    res.render('spin', {
      event: event,
      team: team,
      canSpin: canSpin
    });
  });
});

/* adds some sample data */
router.get('/tmp/load', function (req, res) {

  var team1 = new Team({
    name: 'jeffdonthemic',
    leader: 'jeffdonthemic'
  })

   var event1 =  new Event({
     _id: 'tco15-russia',
     name: 'TCO15 Russia Event',
     location: 'St. Petersburg, Russia',
     dates: '31 May, 2015',
     teams: [team1]
   });

  event1.save(function(err,result){
     if(err) console.log(err);
     if(!err) console.log(result);
   });

  var team2 = new Team({
    name: 'Cool Guys',
    leader: 'jeffdonthemic',
    memberHandles: ['mess', 'lazybaer'],
    apiSpins: ['Google', 'Twilio', 'Force.com']
  })

  var team3 = new Team({
    name: 'The Other Cool Guys',
    leader: 'thicks34',
    memberHandles: ['kbowerma', 'gaurav23', 'talesforce'],
    apiSpins: ['Force.com', 'Pick Any', 'Bluemix']
  })

  var event2 =  new Event({
    _id: 'tco15-japan',
    name: 'TCO15 Japan Event',
    location: 'Tokyo, Japan',
    dates: '1 July, 2015',
    teams: [team2, team3]
  });

  event2.save(function(err,result){
    if(err) console.log(err);
    if(!err) console.log(result);
  });

  res.json({message: "data loaded"});
});

module.exports = router;
