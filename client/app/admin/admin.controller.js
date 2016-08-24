'use strict';

export default class AdminController {
  /*@ngInject*/
  constructor($scope, User, Upload, $http, $route) {
    $scope.users = User.query();

    $scope.uploadUserCSV = function(file){

      if (!file){
        console.log("null file");
        return;
      }

      Upload.upload({
          url: '/api/users/csv',
          data: {
            files: [file]
          },
          objectKey: '.k',
          arrayKey: '[i]'
      }).success(((response) => {
        $scope.csvResults = response.join("<br/>");
        $scope.users = User.query();
        $scope.users.sort(( a , b) => {
          return a.lastName > b.lastName;
        })
      }));
    }
  }

  delete(user) {
    user.$remove();
    this.users.splice(this.users.indexOf(user), 1);
  }

  addInstr(user) {
    User.promoteToInstructor({userId: user._id}, () => {
      this.users = User.query();
      this.users.sort(( a , b) => {
        return a.lastName > b.lastName;
      })
    })
  }

  reseed() {
      if (confirm("This clear the database, are you sure?") &&
          confirm("You cannot revert this operation, are you really sure?")){

          $http.post("/api/misc/reseed",{}, () => {
              $route.reload();
          });

      }
  }
}
