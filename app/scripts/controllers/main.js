(function() {
    'use strict';

    angular
        .module('examApp')
        .controller('MainController', MainController);

    MainController.$inject = ['$scope'];

    function MainController($scope) {
        console.log('-- main controller INIT');
    }
})()
;
