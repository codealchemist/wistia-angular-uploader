'use strict';

/**
 * @ngdoc overview
 * @name examApp
 * @description
 * # examApp
 *
 * Main module of the application.
 */
angular
    .module('examApp', [
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'ui.bootstrap',
        'app.service.settings',
        'app.service.upload',
        'app.service.wistia',
        'app.directive.main-menu',
        'app.directive.progress-bar',
        'app.directive.fileUploader'
    ])

    .config(function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'views/main.html',
                controller: 'MainController',
                controllerAs: 'main'
            })
            .when('/about', {
                templateUrl: 'views/about.html',
                controller: 'AboutController',
                controllerAs: 'about'
            })
            .when('/upload', {
                templateUrl: 'views/upload.html',
                controller: 'UploadController',
                controllerAs: 'upload'
            })
            .otherwise({
                redirectTo: '/'
            });
    });
