var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
var _ = require('lodash');
var requiresLogin = require('../requiresLogin');
var Event = require('../models/Event');
var Team = require('../models/Team');
var TeamMember = require('../models/TeamMember');
var Promise = require("bluebird");
var join = Promise.join;
var request = Promise.promisify(require("request"));

var hbs = require('hbs');

router.get('/', function (req, res) {
  var returnTo = process.env['AUTH0_CALLBACK_URL'].split('/callback')[0];
  res.render('index', { registerReturnUrl: returnTo });
});

router.get('/login', function (req, res) {
  res.render('login');
});

router.get('/logout', function (req, res) {
  var returnTo = process.env['AUTH0_CALLBACK_URL'].split('/callback')[0];
  res.redirect("https://" + process.env['AUTH0_DOMAIN'] + "/v2/logout?returnTo=" + returnTo);
});

// Auth0 callback handler
router.get('/callback',
  passport.authenticate('auth0', {
    failureRedirect: '/failure'
  }),
  function (req, res) {
    if (!req.user) {
      throw new Error('user null');
    }
    res.redirect("/success");
  });

router.get('/failure', function (req, res) {
  res.render('failure');
});

router.get('/success', function (req, res) {
  res.render('success');
});

router.get('/user', requiresLogin, function (req, res) {
  console.log(req.user);
  res.render('user', {
    user: req.user
  });
});

router.get('/upcoming', function (req, res) {

  hbs.registerHelper('classRowHelper', function(index) {
    if (index === 0) {
      return 'row';
    } else {
      return 'row inner-top-md';
    }
  });

  hbs.registerHelper('class1helper', function(index) {
    if (index === 0) {
      return 'col-sm-6 inner-right-xs text-right';
    } else if (index === 1) {
      return 'col-sm-6 col-sm-push-6 inner-left-xs';
    } else if (index === 2) {
      return 'col-sm-6 inner-right-xs text-right';
    }
  });

  hbs.registerHelper('class2helper', function(index) {
    if (index === 0) {
      return 'col-sm-6 inner-top-xs inner-left-xs';
    } else if (index === 1) {
      return 'col-sm-6 col-sm-pull-6 inner-top-xs inner-right-xs';
    } else if (index === 2) {
      return 'col-sm-6 inner-top-xs inner-left-xs';
    }
  });

  Event.find({}, function (err, events) {
    if (err)
      res.status(500).json(err);
    res.render('upcoming', { events: events });
  });

});

router.get('/:eventId', function (req, res) {
  Event.findById(req.params.eventId, function (err, event) {
    if (err)
      res.send(err);
    res.render('event', {
      event: event,
      signedId: req.user ? true : false
    });
  });
});

router.get('/:eventId/register', requiresLogin, function (req, res) {
  Event.findById(req.params.eventId, function (err, event) {
    if (err)
      res.send(err);
    res.render('register', {
      event: event,
      defaultInfo: req.session.registerInfo
    });
  });
});

router.post('/:eventId/register', requiresLogin, function (req, res) {

  // clear any registration info from their session
  req.session.registerInfo = null;

  // create an array of all members handles so we can check & get images
  var members = [req.user.member.handle];
  _.forEach(req.body.teamHandles.split(','), function(handle) {
    if (handle.trim() != '')
      members.push(handle.trim());
  });

  Promise.map(members, function(handle) {
      return request("http://api.topcoder.com/v2/users/" + handle)
        .then(function(resp) {
          var body = JSON.parse(resp[0].request.response.body);
          if (resp[0].request.response.statusCode === 200) {
            return {
              handle: body.handle,
              pic: body.photoLink
            }
          } else {
            return '';
          }
        })
        .catch(SyntaxError, function(e) {
            e.handle = handle;
            throw e;
        });
  }).then(function(validMembers) {
    // remove the invalid handles
    missingHandles = _.remove(validMembers, function(handle) {
      return handle === '';
    });

    // if at least 1 handle not found... return an error
    if (missingHandles.length) {

      // remove the leader from the array to return to the form
      validMembers.shift();
      req.session.registerInfo = {
        teamName: req.body.teamName,
        teamOverview: req.body.teamOverview,
        teamHandles: _.map(validMembers, 'handle').join(", "),
        error: "At least one topcoder handle not found! Check your team list."
      }
      res.redirect('/' + req.params.eventId + '/register');

    } else {

      var team = new Team({
        name: req.body.teamName,
        leader: req.user.member.handle,
        overview: req.body.teamOverview
      });

      // add all of the members to the team
      _.forEach(validMembers, function(member, index) {
          // make sure they have a valid picture
          var pic = member.pic;
          if (pic.substr(0,1) === '/')
            pic = "http://community.topcoder.com" + pic;

          // create the team member object to add
          var teamMember = new TeamMember({
            handle: member.handle,
            pic: pic,
            isTeamLeader: index === 0
          });
          // add the team members
          team.members.push(teamMember);

      });

      // save the new team
      Event.findById(req.params.eventId, function (err, event) {
        if (err)
          res.send(err);

        // save the new toam to the event
        event.teams.push(team);
        event.save();
        res.redirect('/' + req.params.eventId + '/teams/' + team.id);
      });

    }

  }).catch(SyntaxError, function(e) {

    req.session.registerInfo = {
      teamName: '',
      teamOverview: '',
      error: "Drat! Something really bad happened. Contact us for assistance."
    }
    res.redirect('/' + req.params.eventId + '/register');

  });

});

router.get('/:eventId/teams/:teamId', function (req, res) {
  Event.findById(req.params.eventId, function (err, event) {
    if (err)
      res.send(err);
    // find the team
    var team = _.find(event.teams, function (t) {
      return t.id === req.params.teamId;
    });

    var isTeamLeader = false;
    if (req.user)
      isTeamLeader = team.leader === req.user.member.handle

    var isTeam = false;
    if (team.members.length > 1)
      isTeam = true

    res.render('team', {
      event: event,
      team: team,
      isTeamLeader: isTeamLeader,
      isTeam: team.members.length > 1,
      isLoggedIn: req.user ? 'yes' : 'no'
    });
  });
});

router.get('/:eventId/teams/:teamId/spin', requiresLogin, function (req, res) {
  Event.findById(req.params.eventId, function (err, event) {
    if (err || !event){
      res.render('error', {
        error: err || new Error('Event does not exists')
      });
      return;
    }
    // find the team
    var team = _.find(event.teams, function (t) {
      return t.id === req.params.teamId;
    });
    if(!team){
      res.render('error', {
        error: new Error('Team does not exists')
      });
      return;
    }

    var canSpin = false;
    var apiSpins = team.apiSpins;
    var allowedSpins = process.env.NUMBER_OF_SPINS || 3;

    if (team.leader === req.user.member.handle && apiSpins.length < allowedSpins) {
      canSpin = true;
    }

    if (!canSpin) {
      res.redirect("/" + req.params.eventId + "/teams/" + req.params.teamId);
    } else {

      res.render('spin', {
        event: event,
        team: team,
        canSpin: canSpin,
        spins: allowedSpins - apiSpins.length,
        apiSpins: apiSpins
      });

    }

  });
});

/* adds some sample data */
router.get('/tmp/load', function (req, res) {

  var team1 = new Team({
    name: 'jeffdonthemic',
    leader: 'jeffdonthemic'
  });
  team1.save(function (err, result) {
    if (err) console.log(err);
    if (!err) console.log(result);
  });


  var event1 = new Event({
    _id: 'tco15-russia',
    name: 'TCO15 Russia Event',
    location: 'St. Petersburg, Russia',
    dates: '31 May, 2015',
    teams: [team1]
  });

  event1.save(function (err, result) {
    if (err) console.log(err);
    if (!err) console.log(result);
  });

  var team2 = new Team({
    name: 'Cool Guys',
    leader: 'jeffdonthemic',
    apiSpins: ['Google', 'Twilio', 'Force.com']
  });
  team2.save(function (err, result) {
    if (err) console.log(err);
    if (!err) console.log(result);
  });

  var team3 = new Team({
    name: 'The Other Cool Guys',
    leader: 'thicks34',
    apiSpins: ['Force.com', 'Pick Any', 'Bluemix']
  });
  team3.save(function (err, result) {
    if (err) console.log(err);
    if (!err) console.log(result);
  });

  var event2 = new Event({
    _id: 'tco15-japan',
    name: 'TCO15 Japan Event',
    location: 'Tokyo, Japan',
    dates: '1 July, 2015',
    teams: [team2, team3]
  });

  event2.save(function (err, result) {
    if (err) console.log(err);
    if (!err) console.log(result);
  });

  res.json({
    message: "data loaded"
  });
});

module.exports = router;
