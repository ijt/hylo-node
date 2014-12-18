module.exports = function isModerator(req, res, next) {
  if (Admin.isSignedIn(req)) return next();
  Membership.find(req.session.user.id, req.param('id'))
  .then(function(membership) {
    if (membership && membership.hasModeratorRole()) {
      next();
    } else {
      sails.log.debug("Fail isModerator policy: " + req.user);
      res.forbidden();
    }
  });
};