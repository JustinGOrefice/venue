'use strict';
export function SectionFormController($scope, $location, $routeParams, Auth, User, Course, Section){
    "ngInject";

    Auth.getCurrentUser((user) => {
      $scope.creating = $scope.updating != "true";
      $scope.user = user;
      Course.get({
        id: $routeParams.id,
        studentid: user._id,
        checkRoles: true,
        withSections: true
      }, course => {
        $scope.isSupervisor = course.roleDict['supervisor'];
        $scope.isInstructor = course.roleDict['instructor'];
        $scope.isStudent = course.roleDict['student'];
        $scope.course = course;
        if(!$scope.creating){
          setCurrentSection();
        }
        $scope.noInstructors = true;
        $scope.instructorCount = 0;
        
        User.getAllInstructors({
          validOnly: true
        }, allInstructors => {
          allInstructors.sort(i => i.name);
          $scope.allInstructors = allInstructors.map(instructor => {
            instructor.name = instructor.firstName + " " + instructor.lastName;
            instructor.current = false;
            instructor.orderNum = -1;
            if (!$scope.creating){
              angular.forEach($scope.section.instructors, function(current) {
                // check if instructor is an instructor of this section
                if (instructor._id==current._id || instructor._id==current) {
                  $scope.noInstructors = false;
                  instructor.current = true;
                  instructor.orderNum = $scope.instructorCount;
                  $scope.instructorCount += 1;
                }
              });
            } else {
              if (instructor._id==user._id && $scope.isInstructor) {
                instructor.current=true;
              }
            }
            return instructor;
          })
        })
      });

    });

    function setCurrentSection(){
      var currentSection;
      $scope.course.sections.forEach((section, index)=>{
        if(section._id == $routeParams.sectionId){
          currentSection = index;
        }
      });
      $scope.section = $scope.course.sections.splice(currentSection, 1)[0];
      $scope.section.sectionNumbersText = $scope.section.sectionNumbers.toString();
      $scope.$watch('section.sectionNumbers', function(newValue, oldValue) {
        $scope.section.sectionNumbersText = $scope.section.sectionNumbers.toString();
      });
    }

    $scope.submitForm = (form)=>{
      $scope.submitted = true;
      var sectionNumbers = $scope.section.sectionNumbersText.split(',').map(Number);
      angular.forEach(sectionNumbers, function(sectionNum) {
        var section = {
          course: $scope.course._id,
          sectionNumbers:[sectionNum],
          enrollmentPolicy: $scope.section.enrollmentPolicy
        }
        if (form.$valid && $scope.section.enrollmentPolicy) {
          var promise;
          section.instructors = [];
          angular.forEach($scope.allInstructors, function(instructor) {
            if (instructor.current) {
              section.instructors.push(instructor._id);
            }
          });
          if ($scope.updating == "true"){
            promise = Section.update({id:$routeParams.sectionId}, section).$promise;
          }else{
            promise = Section.create(section).$promise;
          }
          promise
            .then((section) => {
              if (sectionNumbers.length > 1) {
                $location.path('/courses/' +  $routeParams.id);
              } else {
                $location.path('/instructor/courses/' +  $routeParams.id + "/sections/" +  section._id);
              }
            })
            .catch(err => {
              alert("You do not have permission.");
              err = err.data;
              $scope.errors = {};
              // Update validity of form fields that match the mongoose errors
              angular.forEach(err.errors, (error, field) => {
                form[field].$setValidity('mongoose', false);
                $scope.errors[field] = error.message;
              });
            });
        }
      });
    };

    $scope.removeCurrent = function(instructor){
      if (confirm("Are you sure you want to remove " + instructor.name + " from this section?")){
        instructor.current = false;
      }
    }

    $scope.filterSearch = function(searchText){
      // Creates an array of instructors that matches the input string
      // searchText is the input string
      $scope.showAddButton = false;
      $scope.showInstructorList = searchText.length > 0;
      $scope.filteredInstructors = [];
      angular.forEach($scope.allInstructors, function(instructor){
        if(instructor.name.toLowerCase().indexOf(searchText.toLowerCase()) >= 0){
          $scope.filteredInstructors.push(instructor);
        }
      });
    }

    $scope.selectInstructor = function(instructor){
      // Select an instructor
      $scope.searchText = instructor.name;
      $scope.showAddButton = true;
      $scope.loadedInstructor = instructor;
      $scope.showInstructorList = false;
    }

    $scope.addInstructor = function(){
      // Add the selected instructor to the section
      $scope.loadedInstructor.current = true;
      $scope.loadedInstructor.orderNum = $scope.instructorCount;
      $scope.instructorCount += 1;
      $scope.searchText = "";
      $scope.showAddButton = false;
    }

    $scope.deleteSection = (section) => {
      if (confirm("Are you sure you'd like to delete this section? Submissions from this section will be lost!")){
        Section.delete({
          id: section._id,
          course: $scope.course._id
        }, (res) => {
          // TODO show a page showing the delete was successful
          $location.path("/courses/" + $scope.course._id);
        });
      }
    };

  };
