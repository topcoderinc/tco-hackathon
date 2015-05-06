"use strict";
var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var Submission = new Schema({
    event: { type: String, required: true},
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    teamName: { type: String, required: true},
    repoUrl: { type: String, required: true},
    video: String,
    videoHtml: Schema.Types.Mixed,
    totalReviews: Number,
    score: Number,
    reviews: [{
        handle: String,
        date: Date,
        scores: [{
            question: String,
            score: Number
        }],
        feedback: String
    }],
    created: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Submission', Submission);
