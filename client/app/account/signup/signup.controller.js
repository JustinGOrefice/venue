'use strict';
export default class SignupController {

  /*@ngInject*/
  constructor($scope, $location, Auth) {
      $scope.user = {};
      console.log($scope);
      $scope.errors = {};

      var email = $scope.user.email;
      console.log(email);
      $scope.register = (form)=>{
          console.log(form);
          $scope.submitted = true;
          console.log ($scope.user.email);
          if (form.$valid) {
            Auth.createUser({
              firstName: $scope.user.firstName,
              lastName: $scope.user.lastName,
              email: $scope.user.email,
              password: $scope.user.password,
              isInstructor: false
            })
            .then(() => {
              $location.path('/verify');
            })
            .catch(err => {
              err = err.data;
              $scope.errors = {};
              // Update validity of form fields that match the mongoose errors
              angular.forEach(err.errors, (error, field) => {
                // console.log("setting false!")
                form[field].$setValidity('mongoose', false);
                // console.log(form.$valid);
                $scope.errors[field] = error.message;
                // form[field].$setValidity('mongoose', true);
                // console.log(form.$valid);
              });
            });
          }
      };
  }
}
