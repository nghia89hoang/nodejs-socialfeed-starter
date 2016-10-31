require('songbird')
const Twitter = require('twitter')
const request = require('request')
let _ = require('lodash')
const fakePost = [
  {
    id: 1,
    image: "https://pbs.twimg.com/profile_images/466720390664830976/gg9oO5w0_bigger.jpeg",
    text: `Gearing up for a vacation with the family to Europe! <a href="http://www.oktoberfest.de/en/">Oktoberfest</a> here we come!`,
    name: "Clark Griswold",
    username: "@ClarkG",
    liked: true,
    network: {
      icon: 'facebook',
      name: 'Facebook',
      class: 'btn-primary'
    }
  },
  {
    id: 1,
    image: "https://pbs.twimg.com/profile_images/466720390664830976/gg9oO5w0_bigger.jpeg",
    text: `Gearing up for a vacation with the family to Europe! <a href="http://www.oktoberfest.de/en/">Oktoberfest</a> here we come!`,
    name: "Clark Griswold",
    username: "@ClarkG",
    liked: true,
    network: {
      icon: 'google-plus',
      name: 'Google',
      class: 'btn-danger'
    }
  },
  {
    id: 1,
    image: "https://pbs.twimg.com/profile_images/466720390664830976/gg9oO5w0_bigger.jpeg",
    text: `Gearing up for a vacation with the family to Europe! <a href="http://www.oktoberfest.de/en/">Oktoberfest</a> here we come!`,
    name: "Clark Griswold",
    username: "@ClarkG",
    liked: true,
    network: {
      icon: 'twitter',
      name: 'Twitter',
      class: 'btn-info'
    }
  },
]
// const cachePosts = []
function configureTwitter(user, config){
  let conf = {
      consumer_key: config['twitter'].consumerKey,
      consumer_secret: config['twitter'].consumerSecret,
      access_token_key: user['twitter'].token,
      access_token_secret: user['twitter'].secret
    }
  console.log(`Creating Twitter with conf: ${JSON.stringify(conf)}`)
  let twitter = new Twitter(conf)
  return twitter
}
function tweetToPost(tweet) {
  return{
    id: tweet.id_str,
    image: tweet.user.profile_image_url,
    text: tweet.text,
    name: tweet.user.name,
    username: "@" + tweet.user.screen_name,
    liked: tweet.favorited,
    timeStamp: tweet.created_at,
    network: {
      icon: 'twitter',
      name: 'Twitter',
      class: 'btn-info'
    }
  }
}
module.exports = {
  // cachePosts,
  fakePost,
  getTweets: async (user, config) => {
    const twitter = configureTwitter(user, config)
    let posts = []
    // console.log('Get tweets Begin')
    if (twitter && user.twitter) {
      // console.log('Getting tweets...')
      const tweets = await twitter.promise.get('statuses/home_timeline', {count: 20})      
      // console.log(`Tweets: ${JSON.stringify(tweets[0])}`)
      posts = tweets.map(tweet => {
        return tweetToPost(tweet)       
      })
      // _.union(cachePosts, posts)
    }
    return posts
  },
  reTweet: async (user, config, id, content) => {
    console.log(`Retweet with content: ${content}`)
    const twitter = configureTwitter(user, config)
    if (!twitter || !user.twitter) {
      console.log('Something Wrong')
      throw new Error('can not retweet')
    }
    const ret = await twitter.promise.post('statuses/retweet/'+id)
    return ret
  },
  reply: async (user, config, id, content) => {
    console.log(`Reply with content: ${content}`)    
    const twitter = configureTwitter(user, config)
    if (!twitter || !user.twitter) {
      console.log('Something Wrong')
      return      
    }    
    if (id != null) {
      return await twitter.promise.post('statuses/update/', {status: content, in_reply_to_status_id: id, quoted_status : content})
    } 
    return await twitter.promise.post('statuses/update/', {status: content})
  },
  getTweet: async (user, config, id) => {
    const twitter = configureTwitter(user, config)
    let tweet = null
    if (twitter && user.twitter) {
      tweet = await twitter.promise.get('statuses/show/' + id)      
      console.log(`Tweets: ${JSON.stringify(tweet)}`)
      console.log(``)
    }    
    return tweetToPost(tweet)
  },
  likeTweet: async (user, config, id) => {
    const twitter = configureTwitter(user, config)
    if (twitter && user.twitter) {
      await twitter.promise.post('favorites/create', {id: id})
    }
  },
  unlikeTweet: async (user, config, id) => {
    const twitter = configureTwitter(user, config)
    if (twitter && user.twitter) {
      await twitter.promise.post('favorites/destroy', {id: id})
    }
  }
}
