require('songbird')
const nodeifyit = require('nodeifyit')

const passport = require('passport')  
  , LocalStrategy = require('passport-local').Strategy
  , FacebookStrategy = require('passport-facebook').Strategy
  , TwitterStrategy = require('passport-twitter').Strategy
const User = require('../models/user')

const registerProvider = (ProviderStrategy, config, providerName) => {
  config.passReqToCallback = true  
  function authCB(req, token, secretToken, profile, done) {
    return (async() => {
      let searchCond = {}
      searchCond[`${providerName}.id`] = profile.id      
      //
      let user = null
      if (req.user) {
        console.log('Link Account')
        user = await User.promise.findById(req.user.id)
        user.updateAccount(providerName, {profile, token, secretToken})
        await user.promise.save()
      } else {
        user = await User.promise.findOne(searchCond)
        if (!user) {
          console.log('Create Account')
          user = new User()
          user.updateAccount(providerName, {profile, token, secretToken})
          await user.promise.save()        
        }
      }
      return user
    })().then(user => done(null, user), err => done(err, false))
  }
  passport.use(providerName, new ProviderStrategy(config, authCB))
}

const localSignupCB = (email, password, done) => {
  return (async() => {
    email = (email || '').toLowerCase()
    let user = await User.promise.findOne({'local.email': email})
    if (user) {
      return Promise.reject('That email is already taken !!!')
    }
    user = new User()
    user.local.email = email
    user.local.password = await user.generateHash(password)
    await user.promise.save()
    return Promise.resolve(user)
  })().then(user => {
    done(null, user)
  }, errMsg => {
    console.log(`SIGNUP FAILED: ${errMsg}`);
    done(null, false, {message: errMsg})
  })
}
const localLoginCB = (email, password, done) => {
  return (async ()=> {
    let user = await User.promise.findOne({'local.email': email})
    if (!user) {
      return Promise.reject('Invalid email')
    } else if(!await user.validatePassword()) {
      return Promise.reject('Invalid Password')
    }
    return Promise.resolve(user)
  })().then(user => {
    done(null, user)
  }, errMsg => {
    console.log(`LOGIN FAILED: ${errMsg}`);
    done(null, false, {message: errMsg})
  })
}
module.exports = {
  configure: (auth) => {
    passport.serializeUser((user, done) => {
      return  done(null, user._id)
    })

    passport.deserializeUser( (async (id, done) => {
      const user = await User.promise.findById(id)
      return done(null, user)
    }))
    // LOCAL
    let localSignUpStrategy = new LocalStrategy({
      usernameField: 'email',
      failureFlash: true 
    }, localSignupCB)
    let localLoginStrategy = new LocalStrategy({
      usernameField: 'email',
      failureFlash: true 
    }, localLoginCB)
    passport.use('local-signup', localSignUpStrategy)
    passport.use('local-login', localLoginStrategy)
    // 
    registerProvider(FacebookStrategy, {
        clientID: auth['facebook'].consumerKey,
        clientSecret: auth['facebook'].consumerSecret,
        callbackURL: auth['facebook'].callbackUrl,        
        enableProof: true,
        profileFields: ['id', 'emails', 'displayName']
    }, 'facebook')

    registerProvider(TwitterStrategy, {
      consumerKey: auth['twitter'].consumerKey,
      consumerSecret: auth['twitter'].consumerSecret,
      callbackURL: auth['twitter'].callbackUrl,
      passReqToCallback: true      
    }, 'twitter')
  },
  passport
}
