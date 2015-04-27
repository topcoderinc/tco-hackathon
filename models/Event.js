"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Team = require('../models/Team');

var Event = new Schema({
  _id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  dates: {
    type: String,
    required: true
  },
  teams: {
    type: [Team.schema]
  },
  overview: {
    type: String,
    required: true
  },
  rules: {
    type: String,
    required: true
  },
  prizes: {
    type: String,
    required: true
  },
  registration: {
    type: String,
    required: true
  },
  registrationOpen: {
    type: Boolean,
    required: true,
    default: false
  },
  teaser: {
    type: String,
    required: true
  },
  backgroundImageUrl: {
    type: String,
    required: true,
    default: "https://farm8.staticflickr.com/7468/15206973854_136c26a532_c.jpg"
  },
  flagImageUrl: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Event', Event);
