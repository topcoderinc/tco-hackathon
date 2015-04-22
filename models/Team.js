"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Team = new Schema({
  name: {
    type: String,
    required: true
  },
  leader: {
    type: String,
    required: true
  },
  memberHandles: {
    type: [String]
  },
  apiSpins: {
    type: [String]
  }
});

module.exports = mongoose.model('Team', Team);
