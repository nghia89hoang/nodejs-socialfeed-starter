const isLoggedIn = require('./middlewares/isLoggedIn')
const feeder = require('../data/posts')
const requireDir = require('require-dir')
const bodyParser = require('body-parser')

const NODE_ENV = process.env.NODE_ENV
let config = requireDir('../config', {recurse: true})

module.exports = (app) => {
  const passport = app.passport
  const facebookScope = {scope: ['email', 'public_profile', 'user_posts']}
  app.get('/', (req, res) => res.render('index'))
  app.get('/login', (req, res) => {
    res.render('login', {message: req.flash('error')})
  })
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
  }))
  app.get('/signup', (req, res) => {
    res.render('signup', {message: req.flash('error')})
  })
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash: true
  }))
  app.get('/auth/facebook', passport.authenticate('facebook', facebookScope))
  app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/profile',
    failureRedirect: '/',
    failureFlash: true
  }), (err,req,res,next) => {
    if(err) {
      res.status(400);
      console.log('ERR_MSG: ' + err.message)
    }
  })
  app.get('/connect/facebook', passport.authorize('facebook', facebookScope))
  app.get('/connect/facebook/callback', passport.authorize('facebook', {
    successRedirect: '/profile',
    failureRedirect: '/profile',
    failureFlash: true
  }))
  app.get('/auth/twitter', passport.authenticate('twitter'))
  app.get('/auth/twitter/callback', passport.authenticate('twitter', {
    successRedirect: '/profile',
    failureRedirect: '/',
    failureFlash: true
  }), (err,req,res,next) => {
    if(err) {
      res.status(400);
      console.log('ERR_MSG: ' + err)
    }
  })
  app.get('/connect/twitter', passport.authorize('twitter', facebookScope))
  app.get('/connect/twitter/callback', passport.authorize('twitter', {
    successRedirect: '/profile',
    failureRedirect: '/profile',
    failureFlash: true
  }))
  app.get('/failure', (req, res) => {
    res.end('Something goes wrong!!! : ' + req.flash('error'))
  })
  app.get('/profile', isLoggedIn, (req, res) => {
    console.log('CURRENT USER: ' + JSON.stringify(req.user))
    // feeder.configure(req.user, config.auth[NODE_ENV])
    res.render('profile', {
      user: req.user || {},
      message: req.flash('error')
    })
  })
  app.get('/timeline', isLoggedIn, (req, res) => {
    return (async () => {      
      const posts = await feeder.getTweets(req.user, config.auth[NODE_ENV])
      console.log(`POST get: ${JSON.stringify(posts)}`)      
      res.render('timeline', {
        message: req.flash('error'),
        posts: posts
      })
    })().catch(err => {
      req.flash('error', JSON.stringify(err))
      res.redirect('/timeline')
    })
  })
  app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
  })
  app.get('/share/:id', isLoggedIn, (req, res) => {
    return (async() => {
      console.log('Get tweet Begin')
      const post = await feeder.getTweet(req.user, config.auth[NODE_ENV], req.params.id)
      res.render('share', {
        message: req.flash('error'),
        post: post
      })
    })().catch(err => {
      res.render('share', {
        message: err,
        post: {}
      })
    })
  })  
  app.post('/share/:id', isLoggedIn, bodyParser.json(), (req, res) => {
    return (async() => {
      console.log('ReTweeting ...' + req.body.share)
      const retweet = req.body.share + ` https://twitter.com/${req.user.twitter.userName}/status/${req.params.id}`
      const post = await feeder.reTweet(req.user, config.auth[NODE_ENV], req.params.id, retweet)
      await feeder.reply(req.user, config.auth[NODE_ENV], null, retweet)
      res.redirect('/timeline')
    })().catch(err => {
      req.flash('error', JSON.stringify(err))
      res.redirect('/share/' + req.params.id)
    })
  })
  app.get('/reply/:id', isLoggedIn, (req, res) => {
    return (async() => {
      console.log('Get tweet Begin')
      const post = await feeder.getTweet(req.user, config.auth[NODE_ENV], req.params.id)
      res.render('reply', {
        message: req.flash('error'),
        post: post
      })
    })().catch(err => {      
      res.render('reply', {
        message:JSON.stringify(err),
        post: {}
      })
    })
  })
  app.post('/reply/:id', isLoggedIn, bodyParser.json(), (req, res) => {
    return (async() => {
      console.log('Reply Begin')
      const post = await feeder.reply(req.user, config.auth[NODE_ENV], req.params.id, req.body.reply)
      res.redirect('/timeline')
    })().catch(err => {
      req.flash('error', JSON.stringify(err))
      res.redirect('/reply/' + req.params.id)
    })
  })
  app.get('/compose', isLoggedIn, (req, res) => {               
    res.render('compose', {
      message: req.flash('error')        
    })
  })
  app.post('/compose', isLoggedIn, bodyParser.json(), (req, res) => {
    return (async() => {
      const post = await feeder.reply(req.user, config.auth[NODE_ENV], null, req.body.reply)
      res.redirect('/timeline')
    })().catch(err => {      
      req.flash('error', JSON.stringify(err))
      res.redirect('/compose')
    })
  })
  app.post('/like/:id', isLoggedIn, (req, res) => {
    return (async() => {
      await feeder.likeTweet(req.user, config.auth[NODE_ENV], req.params.id)
      req.end()
    })()
  })
  app.post('/unlike/:id', isLoggedIn, (req, res) => {
    return (async() => {
      await feeder.unlikeTweet(req.user, config.auth[NODE_ENV], req.params.id)
      req.end()
    })()
  })
}