"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TeamMember = new Schema({
  handle: {
    type: String,
    required: true
  },
  pic: {
    type: String,
    required: true
  },
  isTeamLeader: {
    type: Boolean,
    required: true
  }
});

module.exports = mongoose.model('TeamMember', TeamMember);
