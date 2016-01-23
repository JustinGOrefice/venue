'use strict';

var mongoose = require('bluebird').promisifyAll(require('mongoose'));
var Schema = mongoose.Schema;
import Event from '../sectionevent/sectionevent.model';
var async = require('async');

var SectionSchema = new Schema({
  course: {type : Schema.Types.ObjectId, ref: 'Course'},
  instructors: [{type : Schema.Types.ObjectId, ref: 'User'}],
  students: [{type : Schema.Types.ObjectId, ref: 'User'}],
  pendingStudents: [{type : Schema.Types.ObjectId, ref: 'User'}],
  sectionNumbers: [Number],
  enrollmentPolicy: {type: String, enum: ['open', 'closed', 'approvalRequired']},
});

/**
 * Methods
 */
SectionSchema.methods = {
};

module.exports = mongoose.model('Section', SectionSchema);