# tco-hackathon

A barebones starter application for Auth0 and the topcoder API. Provides login functionality, security and viewing user info.

## Auth0 Settings

Setup for Auth0 is extremely fast and easy. Just [sign up for a free account at Auth0](https://auth0.com/) and then [open the Dashboard](https://manage.auth0.com). Click on the "Default App" from the Apps/APIs section and enter your callback URLs: `http://localhost:8000/callback` in the list of Available Callback URLs. You'll need some of the settings from this page when configuring up your app.

## Obtaining Topcoder JWT

We want to make it easy for you to log in with Auth0 with your environment but still have access to your topcoder.com member info.
To do this we are going to hard-code your topcoder JWT token instead of using the one returned by Auth0.

First, make sure you are logged into topcoder.com. Then in Chrome go to Settings -> Show advanced settings... -> Content settings -> All cookies and site data.
Search your cookies for `topcoder.com`. Find the cookie named `tcjwt` and copy the `Content` string.

If you don't have a `tcjwt` cookie you will need to login first.

## Local Installation Instructions

From the command line type in:

```
git clone git@github.com:topcoderinc/tco-hackathon.git
cd tco-hackathon
npm install
```

### Running the Application Locally

1. Open terminal and change directory to tco-hackathon root
2. Export the following variables to your environment from Auth0.

```
export AUTH0_DOMAIN=YOUR-AUTH0-NAMESPACE
export AUTH0_CLIENT_ID=YOUR-AUTH0-CLIENT-ID
export AUTH0_CLIENT_SECRET=YOUR-AUTH0-CLIENT-SECRET
export AUTH0_CALLBACK_URL=http://localhost:8000/callback
export AUTH0_SCOPE='openid'
```

3. Start the server with `node app.js`
4. Point your browser to: [http://localhost:8000](http://localhost:8000)

## Contributors
* Jeff Douglas -> [jeffdonthemic](https://github.com/jeffdonthemic)
