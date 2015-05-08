var express = require('express');
var router = express.Router();
var passport = require('passport');
var _ = require('lodash');
var requiresLogin = require('../requiresLogin');
var Event = require('../models/Event');
var Team = require('../models/Team');
var TeamMember = require('../models/TeamMember');
var Submission = require('../models/Submission');
var Promise = require("bluebird");
var join = Promise.join;
var request = Promise.promisify(require("request"));
var mongoose = Promise.promisifyAll(require('mongoose'));
var sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);

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
    if (req.session.returnToUrl) {
      res.redirect(req.session.returnToUrl);
    } else {
      res.redirect("/");
    }
  });

router.get('/failure', function (req, res) {
  res.render('failure');
});

router.get('/user', requiresLogin, function (req, res) {
   res.json(req.user);
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
    } else if (index === 1 || index === 3) {
      return 'col-sm-6 col-sm-push-6 inner-left-xs';
    } else if (index === 2) {
      return 'col-sm-6 inner-right-xs text-right';
    }
  });

  hbs.registerHelper('class2helper', function(index) {
    if (index === 0) {
      return 'col-sm-6 inner-top-xs inner-left-xs';
    } else if (index === 1 || index === 3) {
      return 'col-sm-6 col-sm-pull-6 inner-top-xs inner-right-xs';
    } else if (index === 2) {
      return 'col-sm-6 inner-top-xs inner-left-xs';
    }
  });

  Event.find({}, null, {sort: {startDate: 1}}, function (err, events) {
    if (err)
      res.status(500).json(err);
    res.render('upcoming', { events: events });
  });

});

router.get('/:eventId', function (req, res) {
  Event.findById(req.params.eventId, function (err, event) {
    if (err)
      res.send(err);

    // if there's a query param, the were already found to be
    // on a team and redirected back to this page. Show message.
    if (req.query.member)
      var message = "You are already registered!";

    res.render('event', {
      event: event,
      signedId: req.user ? true : false,
      message: message
    });
  });
});

router.get('/:eventId/teams/:teamId/submit', requiresLogin, function (req, res) {
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

    if (isTeamLeader) {
      res.render('submit', {
        event: event,
        team: team,
        isTeamLeader: isTeamLeader
      });
    } else {
      res.redirect('/' + req.params.eventId + '/teams/' + req.params.teamId);
    }

  });
});

router.post('/:eventId/teams/:teamId/submit', requiresLogin, function (req, res) {
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

    if (isTeamLeader) {

      var videoUrl = req.body.video;
      var videoHtml = '';

      var s = new Submission({
        event: req.params.eventId,
        team: req.params.teamId,
        teamName: team.name,
        repoUrl: req.body.repoUrl,
        video: videoUrl,
        videoHtml: videoHtml,
        comments: req.body.comments,
        totalReviews: 0
      });
      s.save(function(err, record) {
        if (err)
          res.send(err);
        if (!err)
          res.redirect('/' + req.params.eventId + '/teams/' + req.params.teamId);
      })
    } else {
      res.redirect('/' + req.params.eventId + '/teams/' + req.params.teamId);
    }

  });

});

router.get('/:eventId/register', requiresLogin, function (req, res) {
  Event.findById(req.params.eventId, function (err, event) {
    if (err)
      res.send(err);

    // create a unique array of all participantes to see who has registered
    var allMembers = [];
    _.forEach(event.teams, function(team) {
      allMembers = _.union(allMembers,_.map(team.members, 'handle'));
    })
    // if they are not one of the current participants, let them register
    if (allMembers.indexOf(req.user.member.handle) === -1) {
      res.render('register', {
        event: event,
        defaultInfo: req.session.registerInfo
      });
    } else {
      res.redirect('/' + req.params.eventId + '?member=true');
    }
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
    var missingHandles = _.remove(validMembers, function(handle) {
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

      // try and find the team leader's email since they are logged in
      var teamLeaderEmail = _.result(_.findWhere(req.user.member.emails, { 'type': 'Primary', 'status': 'Active' }), 'email');

      // add all of the members to the team
      _.forEach(validMembers, function(member, index) {
          // make sure they have a valid picture
          var pic = member.pic;
          if (pic.substr(0,1) === '/')
            pic = "http://community.topcoder.com" + pic;
          if (pic === '')
            pic = 'http://www.topcoder.com/wp-content/themes/tcs-responsive/i/default-photo.png';

          // create the team member object to add
          var teamMember = new TeamMember({
            handle: member.handle,
            pic: pic,
            isTeamLeader: index === 0,
            email: index === 0 ? teamLeaderEmail : undefined
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
        event.save(function(err, record) {
          if (err) {
            console.log(err);
            res.redirect('/');
          } else {
            // send emails out to everyone
            sendSignupEmails(event, team);            
            res.redirect('/' + req.params.eventId + '/teams/' + team.id);
          }
        });
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

  var getTeamData = Promise.join(

    // find the event
    Event.findByIdAsync(req.params.eventId),

    // find the submission for the team
    Submission.find({ 'team': req.params.teamId })
      .select('repoUrl video')
      .exec(),

    function (event, submission) {
      var r = [];
      r.push(event);
      r.push(
          _.find(event.teams, function (t) {
          return t.id === req.params.teamId;
        })
      );
      r.push(submission[0]);
      return r;
    }
  );

  getTeamData.then(function(data) {

    var event = data[0];
    var team = data[1];
    var submission = data[2];
    var isTeamLeader = false;
    var isTeam = false;
    var canSpin = false;

    if (req.user)
      isTeamLeader = team.leader === req.user.member.handle

    if (team.members.length > 1)
      isTeam = true;

    if (isTeamLeader && team.apiSpins.length < process.env.NUMBER_OF_SPINS && event.spinningOpen)
      canSpin = true;

    res.render('team', {
      event: event,
      team: team,
      submission: submission,
      isTeamLeader: isTeamLeader,
      isTeam: team.members.length > 1,
      canSpin: canSpin
    });

  })
  .catch(function(err) {
    res.send(err);
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

    if (team.leader === req.user.member.handle && apiSpins.length < allowedSpins && event.spinningOpen) {
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

function sendSignupEmails(event, team) {

  var teamLeaderEmail = _.result(_.findWhere(team.members, { 'isTeamLeader': true }), 'email');

  var participantEmail = new sendgrid.Email({
    to:       teamLeaderEmail,
    from:     event.supportEmail,
    fromname: 'Topcoder Hackathons',
    subject:  'Submission Received for ' + event.name,
    html:     '<p>'+ team.name +',</p><p>The registration for yourself or team has been successfully submitted to the Topcoder crew and we will verify that all members of your team are registered with the TopCoder Open event.</p><p>This process may take up to 24 hours, so please be patient in receiving the welcome email.</p><p>If you have not heard from us after 24 hours, you may send an email to ' + event.supportEmail + ' to inquire on the process.</p><p>Thank you and good luck!</p><p>Topcoder Hackathon Team</p>'
  });

  var staffEmail = new sendgrid.Email({
    to:       event.supportEmail,
    from:     event.supportEmail,
    fromname: 'Topcoder Hackathons',
    subject:  'Hackathon Team Entry - ' + event.id,
    html:     '<p>Event: '+event.name+'</p><p>Team name: '+team.name+'</p><p>Team leader: '+team.leader+'</p><p>All Team Members: '+_.pluck(team.members, 'handle').join(', ')+'</p><p>Please Crosscheck names with Jessie and Eventbrite.</p>'
  });

  if (process.env.SENDGRID_USERNAME) {

    sendgrid.send(participantEmail, function(err, json) {
      if (err) {
        console.log('Error sending participant email');
        return console.error(err);
      }
      console.log(json);
    });

    sendgrid.send(staffEmail, function(err, json) {
      if (err) {
        console.log('Error sending staff email');
        return console.error(err);
      }
      console.log(json);
    });

  } else {
    console.log('==========================');
    console.log('== EMAILING DISABLED ==');
    console.log('== PARTICIPANT EMAIL ==');
    console.log(participantEmail);
    console.log('== STAFF EMAIL ==');
    console.log(staffEmail);
    console.log('==========================');
  }

}

module.exports = router;
