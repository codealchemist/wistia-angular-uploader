(function(){
    'use strict';

    angular
        .module('app.directive.fileUploader', [
            'app.service.upload'
        ])

        /**
         * Directive used to upload files.
         */
        .directive('fileUploader', fileUploader);


    function fileUploader(UploadService) {
        var directive = {
            restrict: 'E',
            template: '<input id="{{uploadScope.uploaderId}}" type="file" name="file" />',
            scope: {
                uploadScope: '=' // {id, url, files, hasFiles}
            },
            link: link,
            controller : FileUploaderController,
            controllerAs: 'vm'
        };

        return directive;

        //------------------------------------------------------



        function link(scope, element, attrs) {
            console.log('- file uploader: link');

            // get uploader id if set or create a new unique uploader id
            var uploadScope = scope.uploadScope;
            var uploaderId = uploadScope.uploaderId || (new Date()).getTime();

            // initialize files list
            if ( !angular.isObject(scope.uploadScope.files) ) {
                scope.uploadScope.files = {};
            }

            // restore active uploads
            if ( UploadService.tracking(uploaderId).hasActiveUploads() ) {
                var activeUploads = UploadService.getActiveUploads(uploaderId);

                // refresh files list on upload scope
                angular.forEach(activeUploads, function(file){
                    file.scope.uploadScope = scope.uploadScope;
                });

                // recover active uploads
                angular.extend(uploadScope.files, activeUploads);
                uploadScope.hasFiles = true;
            }

            /**
             * On some cases the upload scope is set after the view is parsed.
             * Since fileupload is initialized on load this will cause the URL
             * to remain undefined.
             * The solution for that problem is to watch the attribute for changes,
             * and when it is set update fileupload with its new value.
             *
             * @param  {string} value current URL value
             * @param  {string} oldValue previous URL value
             */
            scope.$watch('uploadScope.url', function(value, oldValue){
                if (value === oldValue) return;
                element.fileupload({url: value});
            });

            // update formData if needed
            scope.$watch('uploadScope.data', function(value, oldValue){
                if (value === oldValue) return;
                element.fileupload({formData: value});
            });

            element.fileupload({
                url: uploadScope.url,
                formData: uploadScope.data || null,
                dataType: 'text',
                //headers: {'X-CSRFToken': $cookies['XSRF-TOKEN']},
                add: function(e, data) {
                    UploadService.add(data, scope);
                },
                progress: function(e, data) {
                    UploadService.progress(data, scope);
                },
                done: function(e, data) {
                    UploadService.done(data, scope);
                },
                fail: function(e, data) {
                    UploadService.fail(data, scope);
                },

                // by default the whole document is a paste zone
                pasteZone: null
            });
        }
    }

    FileUploaderController.$inject = ['$scope'];

    /**
     * Controller for twixt-budget-selector directive.
     *
     */
    function FileUploaderController($scope) {
        // view model (public interface)
        var vm = this;

        // activate / initialize controller
        activate();

        //------------------------------------------

        function activate() {
            console.log('[ DIRECTIVE: file-uploader ]--> activate');
        }
    }
})();
