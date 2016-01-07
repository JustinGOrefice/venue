'use strict';

(function() {

function UserResource($resource) {
  var User = $resource('/api/users/:id/:controller', {
    id: '@_id'
  }, {
    changePassword: {
      method: 'PUT',
      params: {
        controller:'password'
      }
    },
    get: {
      method: 'GET',
      params: {
        id:'me'
      }
    },
    getCourses: {
      method: 'GET',
      params: {
        controller:'courses'
      },
      isArray: true
    }
  });

  return User;
}

angular.module('venueApp.auth')
  .factory('User', UserResource);

})();
