const axios = require('axios')
const port = 3000
require('dotenv').config();
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');


async function tweetBTC() {
    
    const oauth = OAuth({
  consumer: {
    key: process.env.TWITTER_CONSUMER_KEY,
    secret: process.env.TWITTER_CONSUMER_SECRET,
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto
      .createHmac('sha1', key)
      .update(base_string)
      .digest('base64');
  },
});
    
    
    // const url = 'https://inscribe.news/api/data/ord-news'
    const url = 'https://twitter-bot-inscriptions-api.onrender.com'
    
    const requestData = {
  url: 'https://api.twitter.com/1.1/statuses/update.json',
  method: 'POST',
  data: {
    status: 'Hello, Twitter from my bot!',
  },
};

// Generate the authorization headers
const token = {
  key: process.env.TWITTER_ACCESS_TOKEN,
  secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
};
const headers = oauth.toHeader(oauth.authorize(requestData, token));
    
    let last_tweet_name = ""
    let last_tweet_id = ""

    try {
        const response = await axios.get(url)
        const len = response['data']['keys'].length

        last_tweet_name = response['data']['keys'][len - 1]['name']
        console.log(last_tweet_name)
        last_tweet_id = response['data']['keys'][len - 1]['metadata']['id']
        console.log(last_tweet_id)

        // tweet 

        const tweet_body_resp = await axios.get('https://inscribe.news/api/data/' + last_tweet_id)

        const tweet_body = tweet_body_resp['data']['body']
        console.log(tweet_body_resp['data']['body'])
        const tweet_url = tweet_body_resp['data']['url']
        console.log(tweet_url)

        let tweet_body_trimmed

        if (typeof (tweet_body) == 'string' && typeof(tweet_url) == 'string' )
            tweet_body_trimmed = tweet_body.length > (260 - tweet_url.length) ? tweet_body.slice(0, (260 - tweet_url.length)) + "..." : tweet_body;

        let tweet_b_text = tweet_body_trimmed + " " + tweet_url
        tweet_b_text = tweet_b_text.replace("undefined", "");
        const body = {
            "text": tweet_b_text
        }

        try {
            const res = await axios.post('https://api.twitter.com/2/tweets', body, {
                headers: {
                    'Authorization': process.env.AUTHORIZATION
                }
            })
        } catch (error) {
            console.log(error)
        }

        setInterval(async () => {

            const response = await axios.get(url)
            const len = response['data']['keys'].length
            let resp_last_tweet_name = response['data']['keys'][len - 1]['name']
            let resp_last_tweet_id = response['data']['keys'][len - 1]['metadata']['id']

            if (resp_last_tweet_name == last_tweet_name) {
                console.log("no new tweets " + resp_last_tweet_name + last_tweet_name)
            }

            else if (resp_last_tweet_name != last_tweet_name) {
                console.log("new tweet!" + resp_last_tweet_name + last_tweet_name)

                let i = 1

                while (resp_last_tweet_name != last_tweet_name) {

                    console.log("tweet : " + resp_last_tweet_name)

                    const tweet_body_resp = await axios.get('https://inscribe.news/api/data/' + resp_last_tweet_id)

                    let tweet_body_trimmed_local = ""

                    if (typeof (tweet_body_resp['data']['body']) == "string")
                        tweet_body_trimmed_local = tweet_body_resp['data']['body'].substring(0, tweet_body_resp['data']['body'].indexOf(".") + 1);


                    let tweet_b_text = tweet_body_trimmed_local + " " + tweet_body_resp['data']['url']
                    tweet_b_text = tweet_b_text.replace("undefined", "");

                    const body = {
                        "text": tweet_body_trimmed_local + " " + tweet_body_resp['data']['url']
                    }

                    try {
                        const res = await axios.post('https://api.twitter.com/2/tweets', body, {
                            headers: {
                                'Authorization': process.env.AUTHORIZATION
                            }
                        })
                    } catch (error) {
                        console.log(error)
                    }

                    resp_last_tweet_name = response['data']['keys'][len - 1 - i]['name']
                    resp_last_tweet_id = response['data']['keys'][len - 1 - i]['metadata']['id']
                    i = i + 1

                }

                last_tweet_name = response['data']['keys'][len - 1]['name']

            }

        }, 15000);

    } catch (error) {
        console.log(error)
    }
}

tweetBTC()
