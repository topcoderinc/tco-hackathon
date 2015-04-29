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
    required: true,
    default: 'http://www.topcoder.com/wp-content/themes/tcs-responsive/i/default-photo.png'
  },
  isTeamLeader: {
    type: Boolean,
    required: true
  }
});

module.exports = mongoose.model('TeamMember', TeamMember);
