# tco-hackathon

A barebones starter application for Auth0 and the topcoder API. Provides login functionality, security and viewing user info.

## Auth0 Settings

Setup for Auth0 is extremely fast and easy. Just [sign up for a free account at Auth0](https://auth0.com/) and then [open the Dashboard](https://manage.auth0.com). Click on the "Default App" from the Apps/APIs section and enter your callback URLs: `http://localhost:8000/callback` in the list of Available Callback URLs. You'll need some of the settings from this page when configuring up your app.

In app.js, after a successfuly login with Auth0, we are hardcoding a member object that will eventually be
returned from calling the topcoder API. This just makes development easier for now. Feel free to change 
the handle to whatever you'd like.

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
  export APIs=Comma delimeted list of APIs to play with the spinn wheel (Google, Twitter ...)
  export NUMBER_OF_SPINS=The # of spins a team leader could spinn the wheel. This is also the # of APIs per team.
  ```
  3. Start the server with `node app.js`
  4. Point your browser to: [http://localhost:8000](http://localhost:8000)
  
### Running the tests
Before running the tests make sure you have `.env` file in the root of the project folder. to create one follow the `env_sample` file.

To run the tests type:

`npm test`

in the root project folder.

## Contributors
* Jeff Douglas -> [jeffdonthemic](https://github.com/jeffdonthemic)
* Kiril Kartunov -> [colorfullyme](https://github.com/ColorfullyMe)
