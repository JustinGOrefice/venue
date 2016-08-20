//@flow
/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/courses              ->  index
 * POST    /api/courses              ->  create
 * GET     /api/courses/:id          ->  show
 * PUT     /api/courses/:id          ->  update
 * DELETE  /api/courses/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
import Course from './course.model';
import fs from 'fs';
import mkdirp from 'mkdirp';
import config from '../../config/environment';
import imageUpload from '../../components/imageUpload';
import imageDownload from '../../components/imageDownload';
import path from 'path';

import async from 'async';

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function handleEntityNotFound(res) {
  return function(entity) {
    if (!entity) {
      res.status(404).json({});
      return null;
    }
    return entity;
  };
}

function saveUpdates(updates) {
  console.log("Saving"< updates);
  return function(entity) {
    var updated = _.merge(entity, updates);
    return updated.saveAsync()
      .then(updated => {
        return updated;
      });
  };
}

function removeEntity(res) {
  return function(entity) {
    if (entity) {
      return entity.removeAsync()
        .then(function() {
          res.status(204).end();
        });
    }
  };
}

function saveCourseImage(files, fields, cb){
  var imagePaths = [],
      asyncTasks = [];
  if (!files){
    return imagePaths;
  }
  files.files.forEach(function(file) {
    var path = config.imageUploadPath  + 'courses' + '/';
    asyncTasks.push( (callback) => {
      var imagePath = imageUpload.saveImage(file, path, function(err) {
        callback(err)
      });
      imagePaths.push("/api/courses/image/" + imagePath);
      });
    });

  async.parallel(asyncTasks, (error, results) => {
    // TODO: Handle Error
    cb(imagePaths);
  });
}

// Gets a list of Courses
export function index(req, res) {
  Course.findAsync()
    .then(responseWithResult(res))
    .catch(handleError(res));
}

// Gets a single Course from the DB
export function show(req, res) {
  var dbquery = Course.findById(req.params.id);
  dbquery.execAsync()
    .then(handleEntityNotFound(res))
    .then((course) => {
      // Return the query with the sections if requested
      if (!course){
        return null;
      }
      if (req.query.withSections){
        course.getSections({
          withInstructors: req.query.withSectionInstructors,
          withEnrollmentStatus: req.query.withSectionEnrollmentStatus,
          studentId: req.query.studentid
        }, (sections) => {
          course = course.toObject();
          course.sections = sections;
          responseWithResult(res)(course);
        })
      }else{
        responseWithResult(res)(course);
      }
    })
    .catch(handleError(res));
};

// Creates a new Course in the DB
export function create(req, res) {
  saveCourseImage(req.files, req.body, (imagePaths)=>{
    var course = req.body,
      date = new Date();
    course.imageURLs = imagePaths;
    course.active = true;
    if(date.getMonth() < 5){
      course.semester = "Spring" + (date.getYear() - 100).toString();
    }
    else{
      course.semester = "Fall" + (date.getYear() - 100).toString();
    }
    Course.createAsync(course)
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
  });
};

// Updates an existing Course in the DB
export function update(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Course.findByIdAsync(req.params.id)
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(responseWithResult(res))
    .catch((err,dat)=>{
      console.log(err, dat);
    })
    .catch(handleError(res));
};

// Deletes a Course from the DB
export function destroy(req, res) {
  Course.findByIdAsync(req.params.id)
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
};

export function image(req, res){
  // Prevents requesting arbitary files from the server
  if (req.params.name.indexOf('/') !== -1){
    return res.json(404);
  }

  // Doesn't have required parameters
  if (!req.params.name){
    return res.json(404);
  }

  return imageDownload.getImage(
    req.params.name,
    config.imageUploadPath + 'courses/',
    req.query.size,
    res);
};

export function imageSize(req, res){
  req.query.size = req.params.size;
  return exports.image(req, res);
};
