(function() {
    'use strict';

    angular
        .module('examApp')
        .controller('AboutController', AboutController);

    AboutController.$inject = ['$scope'];

    function AboutController($scope) {
        console.log('-- about controller INIT');
    }
})()
;
