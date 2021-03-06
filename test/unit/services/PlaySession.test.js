var setup = require(require('root-path')('test/setup'));

var request = {
  headers: {
    cookie: 'lol=lol; PLAY_SESSION="6cb3b755aebf3bec7d792aa23e2d7651b55d0cba-pa.u.exp=1415742115467&pa.p.id=password&pa.u.id=l%40lw.io"; other=morelols'
  }
};

var validSession = function() {
  return new PlaySession(request, {secret: 'iamasecret'});
};


describe('PlaySession', function() {

  describe('#isValid', function() {

    it('is false when there is no cookie', function() {
      expect(new PlaySession({}).isValid()).to.be.false;
    });

    it('is false when the cookie signature does not match', function() {
      expect(new PlaySession(request, {secret: 'iamabadsecret'}).isValid()).to.be.false;
    });

    it('is true when the cookie signature matches', function() {
      expect(validSession().isValid()).to.be.true;
    });
  });

  describe('.data', function() {
    it('is a hash created from the query string in the session', function() {
      expect(validSession().data).to.eql({
        'pa.u.exp': '1415742115467',
        'pa.p.id': 'password',
        'pa.u.id': 'l@lw.io'
      });
    });
  });

  describe('#fetchUser', function() {

    var email = 'FoO@baR.com';

    beforeEach(function() {
      return setup.clearDb().then(function() {
        return new User({email: email, active: true}).save();
      });
    });

    it('is case-insensitive with emails', function() {
      var session = new PlaySession({});
      _.extend(session, {
        providerKey: function() { return 'password' },
        providerId: function() { return 'fOo@bAr.com' }
      });

      return session.fetchUser().then(function(user) {
        expect(user).not.to.be.null;
        expect(user.get('email')).to.equal(email);
      });
    });
  });

})