"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var TeamMember = require('./TeamMember');

var Team = new Schema({
  name: {
    type: String,
    required: true
  },
  overview: {
    type: String,
    required: false
  },
  leader: {
    type: String,
    required: true
  },
  members: {
    type: [TeamMember.schema]
  },
  apiSpins: {
    type: [String]
  }
});

module.exports = mongoose.model('Team', Team);
