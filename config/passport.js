const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');

const Users = mongoose.model('Users');

passport.use(new LocalStrategy({
  usernameField: 'user[login]',
  passwordField: 'user[password]',
}, (login, password, done) => {
  Users.findOne({ login })
      .then((user) => {
      if(!user || !user.validatePassword(password)) {
        return done(null, false, { errors: { 'login e/ou senha': 'são inválidos' } });
      }

      return done(null, user);
    }).catch(done);
}));
