(function(){
    'use strict';

    angular
        .module('app.directive.main-menu', [])

        /**
         * Directive used to upload files.
         */
        .directive('mainMenu', mainMenu);


    function mainMenu(UploadService) {
        var directive = {
            restrict: 'E',
            templateUrl: 'partials/main-menu.html',
            scope: {
                uploadScope: '=' // {id, url, files, hasFiles}
            },
            link: link,
            controller : MainMenuController,
            controllerAs: 'vm'
        };

        return directive;

        //------------------------------------------------------



        function link(scope, element, attrs) {
            console.log('- main menu: link');
        }
    }

    MainMenuController.$inject = ['$scope', '$location'];

    /**
     * Controller for twixt-budget-selector directive.
     *
     */
    function MainMenuController($scope, $location) {
        // view model (public interface)
        var vm = this;
        vm.getClass = getClass;

        // activate / initialize controller
        activate();

        //------------------------------------------

        function activate() {
            console.log('[ DIRECTIVE: main-menu ]--> activate');
        }

        function getClass(menuItemName) {
            var current = $location.path().substring(1);

            if (menuItemName === current) return 'active';
            if (!current && menuItemName === 'home') return 'active';
            return '';
        }
    }
})();
