require('songbird')
const mongoose = require('mongoose')
const crypto = require('crypto')

let userSchema = mongoose.Schema({
  local: {
    email: String,
    password: String
  },
  facebook: {
    id: String,
    token: String,
    email: String,
    name: String
  },
  twitter: {
    id: String,
    token: String,
    secret: String,
    email: String,
    displayName: String,
    userName: String
  }
})
userSchema.methods.generateHash = async function(password) {
  let hash = await crypto.promise.pbkdf2(password, 'PEPPER', 4096, 512, 'sha256')
  return hash.toString('hex')
}

userSchema.methods.validatePassword = async function(password) {
  let hash = await crypto.promise.pbkdf2(password, 'PEPPER', 4096, 512, 'sha256')
  return hash.toString('hex') === this.local.password
}

userSchema.methods.facebookUpdateAccount = function ({profile, token, secretToken}) {  
  this.facebook.id = profile.id
  this.facebook.email = profile._json.email
  this.facebook.token = token
  this.facebook.name = profile.displayName
  return this
}
userSchema.methods.twitterUpdateAccount = function ({profile, token, secretToken}) {
  this.twitter.id = profile.id
  this.twitter.email = profile.email
  this.twitter.token = token
  this.twitter.secret = secretToken
  this.twitter.displayName = profile.displayName
  this.twitter.userName = profile.username
  return this
}
userSchema.methods.updateAccount = function (providerName, {profile, token, secretToken}) {
  let updateMethod = `${providerName}UpdateAccount`
  console.log(`${JSON.stringify(this)}`)
  return this[providerName + 'UpdateAccount']({profile, token, secretToken})
}


module.exports = mongoose.model('User', userSchema)