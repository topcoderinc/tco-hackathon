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
  }
});

module.exports = mongoose.model('Event', Event);
