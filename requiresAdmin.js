var _ = require('lodash');

module.exports = function(req, res, next) {

  // only allow @appirio.com members to see this page
  var allowableDomain = process.env.ADMIN_EMAIL_DOMAIN || 'topcoder.com';
  // find the current user's topcoder email address
  process.stdout.write("******hello world********: \n");
  process.stdout.write("******hello world********: " + req.user.member + "\n");
  process.stdout.write("******hello world********: " + JSON.stringify(req.user) + "\n");
/*
  var adminUserEmail = _.result(_.findWhere(req.user.member.emails, { 'type': 'Primary', 'status': 'Active' }), 'email');

  // if their email is not part of the allowable domain, send to home page
  if (adminUserEmail.indexOf(allowableDomain) === -1) {
    return res.redirect('/');
  }
  */
  next();
}
