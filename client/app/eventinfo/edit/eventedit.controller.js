'use strict';
export default class EditEventsCtrl {

  /*@ngInject*/
  constructor($scope, $location, $routeParams, EventInfo, Auth) {
    Auth.getCurrentUser((user) => {$scope.user = user});

    $scope.event = {info:{}};
    $scope.assignment = {};
    $scope.eventId = $routeParams.id;

    $scope.updateEvent = function(){
      EventInfo.get({
        id: $scope.eventId,
        withAuthor: true
      },
      event => {
        $scope.event = {info:event};
      },
      err => {
        $scope.err = err;
        if (err.status == 401 || err.status == 500){
          $location.path("/");
        }
      });
    };

    $scope.doneEdit = function(){
      $location.path("/eventInfo/" + $scope.eventId);
    }
    $scope.updateEvent();

  }
}
