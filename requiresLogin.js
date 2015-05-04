module.exports = function(req, res, next) {
  if (!req.isAuthenticated()) {
    // track the route they were TRYING to access
    req.session.returnToUrl = req.protocol + '://' + req.get('host') + req.originalUrl   
    return res.redirect('/login');
  }
  next();
}