'use strict';
export default class EventsCtrl {
  /*@ngInject*/
  constructor($scope, $location, $routeParams, SectionEvent, EventInfo, Auth, uiGmapGoogleMapApi, uiGmapIsReady) {  
    $scope.assignment = {};
    Auth.getCurrentUser((user) => {$scope.user = user});
    $scope.eventId = $routeParams.id;

    $scope.sectionStudent = false;
    $scope.sectionInstructor = false;

    $scope.updateEvent = function(){
      $scope.event = SectionEvent.get({
        id: $routeParams.id,
        withEventInfo: true,
        withEventInfoAuthor: true,
        withSectionCourse: true,
        withSectionInstructors: true,
        withAuthor: true,
        withSection: true
      },
        sectionEvent => {
          $scope.event = sectionEvent;
          if (sectionEvent.section.students.indexOf($scope.user._id) !== -1)
          {
            $scope.sectionStudent = true;
          }
          if (sectionEvent.section.instructors.map((elem)=>elem._id).indexOf($scope.user._id) !== -1)
          {
            $scope.sectionInstructor = true;
          }

        },
        err => {
          $scope.err = err;
          if (err.status == 401 || err.status == 500){
            $location.path("/");
          }
        });
    };

    $scope.eventChanged = function(){
      $scope.editting = false;
      $scope.updateEvent();
    };

    $scope.updateEvent();

    $scope.viewEventUpload = function(){
      return "/student/upload/" + $scope.eventId;
    };

    $scope.deleteEvent = function(event){
      $scope.confirm = true;
    };

    $scope.confirmDeleteEventAssignment = function(event){
      $scope.confirm = false;
      SectionEvent.delete({id:event._id}, (response)=>{
        $location.path("/instructor/events");
      })
    };

    $scope.cancelDeleteEventAssignment = function(event){
      $scope.confirm = false;
    };

    $scope.editAssignemnt = function(){
      $scope.assignment = { submissionInstructions : $scope.event.submissionInstructions.slice(0)};
      $scope.assignmentEdit = true;
    };
    $scope.cancelEdit = function(){
      $scope.assignment = {};
      $scope.assignmentEdit = false;
    };

    $scope.updateEventAssignment = function(form){
        $scope.submitted = true;
        if (form.$valid){
          var sectionEvent = {
            _id: $scope.event._id,
            submissionInstructions: $scope.assignment.submissionInstructions
          };
          SectionEvent.update(sectionEvent).$promise
          .then((course) => {
            $scope.assignmentEdit = false;
            $scope.updateEvent();
          })
          .catch(err => {
            err = err.data;
            $scope.errors = {};

            // Update validity of form fields that match the mongoose errors
            angular.forEach(err.errors, (error, field) => {
              form[field].$setValidity('mongoose', false);
              $scope.errors[field] = error.message;
            });
          });
        }
      };
    
    $scope.mapInit = function() {
      $scope.map = {
        control: {},
        center: {
          latitude:  42.7285023,
          longitude: -73.6839912
        },
        zoom: 12,
        dragging: false,
        drawing: false,
        bounds: {},
        markers: [],
        idkey: 'place_id',
        options: {scrollwheel: false}
      };
      $scope.mapLoaded = true;
    }
    
    uiGmapGoogleMapApi.then(function(maps) {
      $scope.mapLoaded = true;
      maps.visualRefresh = true;
      // Set default bounds to be RPI
      $scope.defaultBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(42.7766, -73.5380),
        new google.maps.LatLng(42.6757, -73.8292));
      
      $scope.map.bounds = {
        northeast: {
          latitude:$scope.defaultBounds.getNorthEast().lat(),
          longitude:$scope.defaultBounds.getNorthEast().lng()
        },
        southwest: {
          latitude:$scope.defaultBounds.getSouthWest().lat(),
          longitude:-$scope.defaultBounds.getSouthWest().lng()
        }
      };
      uiGmapIsReady.promise()
        .then(function(instances) {
          var eventCoords = [];
          angular.forEach($scope.event.info.location.geobounds.coordinates[0][0], function(point) {
            eventCoords.push({lat: point[1], lng: point[0]});
          });
          var eventPoly = new google.maps.Polygon({
            paths: eventCoords,
            strokeColor: '#00ff00',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#00ff00',
            fillOpacity: 0.35
          })
          eventPoly.setMap(instances[0].map);
        })
    });
    
    
    $scope.mapInit();
  }
}
