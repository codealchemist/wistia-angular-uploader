(function() {
    'use strict';

    angular
        .module('examApp')
        .controller('UploadController', UploadController);

    UploadController.$inject = ['$scope', '$sce', '$timeout', 'Settings', 'Wistia'];

    function UploadController($scope, $sce, $timeout, Settings, Wistia) {
        //-----------------------------------------------------------------------------------------------------------
        //
        // private properties
        //
        //-----------------------------------------------------------------------------------------------------------


        //-----------------------------------------------------------------------------------------------------------
        //
        // public properties
        //
        //-----------------------------------------------------------------------------------------------------------
        $scope.locked = false; // allows editing
        $scope.videoName = '';
        $scope.videoDescription = '';
        $scope.uploaderIsEnabled = false; // deactivate uploader until name and description are set
        $scope.wistiaVideoClass = '';
        $scope.showPreview = false;
        $scope.videoIsReady = false;
        $scope.videoProcessingPercentage = 0;


        //-----------------------------------------------------------------------------------------------------------
        //
        // public api (define public functions here and assign to vm)
        //
        //-----------------------------------------------------------------------------------------------------------
        $scope.setUploaderState = setUploaderState;




        //-----------------------------------------------------------------------------------------------------------
        //
        // private api
        //
        //-----------------------------------------------------------------------------------------------------------

        function setFileUploaders() {
            var timestamp = (new Date()).getTime(),
                wistiaSettings = Settings.get('wistia');

            $scope.wistiaUploader = {
                files: {},
                hasFiles: false,
                url: wistiaSettings.uploadUrl,
                data: {
                    access_token: wistiaSettings.masterToken,
                    project_id: wistiaSettings.projectId,
                    name: $scope.videoName,
                    description: $scope.videoDescription
                },
                uploaderId: 'wistia-uploader-' + timestamp,
                onDone: function(params) {
                    console.log('-- Upload DONE! Params:', params);

                    $scope.showPreview = true;
                    embedWistiaVideo(params.result.hashed_id);
                    $scope.$apply(); // force refresh
                },
                onAdd: function(params) {
                    console.log('-- Upload added!');

                    // lock changes
                    $scope.locked = true;
                },
                onError: function(params) {
                    console.log('-- Upload failed!');

                    // unlock changes
                    $scope.locked = false;
                }
            };

            /*
            // test existing files
            $scope.wistiaUploader = {
                files: [
                    {original_name: 'Nice', active: true, percentage: 25},
                    {original_name: 'View', active: true, percentage: 75},
                    {original_name: 'Error', active: false, error: 'Oops!'},
                    {original_name: 'Error', active: false, error: 'Oops!'},
                    {original_name: 'Error', active: false, error: 'Oops!'},
                    {original_name: 'Done', active: false}
                ],
                hasFiles: true,
                url: wistiaSettings.uploadUrl,
                data: {
                    access_token: wistiaSettings.masterToken,
                    project_id: wistiaSettings.projectId,
                    name: $scope.videoName,
                    description: $scope.videoDescription
                },
                uploaderId: 'wistia-uploader-' + timestamp,
                onDone: function(params) {
                    console.log('-- Upload DONE!');
                    $scope.dirty.isSet = true;
                }
            };
            */
        }

        /**
         * Enables / disables uploader based on current input data.
         * Name and description params are required before being able to
         * upload a new video.
         */
        function setUploaderState() {
            if ($scope.videoName && $scope.videoDescription){
                setFileUploaders();
                $scope.uploaderIsEnabled = true;
                return;
            }
            $scope.uploaderIsEnabled = false;
        }

        function embedWistiaVideo(hashedId) {
            // var wistiaVideoClass = "wistia_embed wistia_async_" + hashedId + " " +
            //                   "videoFoam=true " +
            //                   "playerColor=ff0000 " +
            //                   "controlsVisibleOnLoad=false";

            // var iframe = '<iframe src="//fast.wistia.net/embed/iframe/' + hashedId + '" allowtransparency="true" frameborder="0" scrolling="no" class="wistia_embed" name="wistia_embed" allowfullscreen mozallowfullscreen webkitallowfullscreen oallowfullscreen msallowfullscreen width="640" height="360"></iframe>';
            // $scope.videoPreviewHtml = $sce.trustAsHtml(iframe);

            // check processing progress for the current video
            embedWhenDone(hashedId);
        }

        function embedWhenDone(hashedId) {
            console.log('- checkProgress: hashedId: ', hashedId);

            // check processing progress using Wistia service
            Wistia.getMedia(hashedId).then(success, error);

            function success(response) {
                console.log('- embedWhenDone: response:', response);

                // check progress
                var videoResponse = response.data[0],
                    progress = videoResponse.progress * 100;

                // display progress
                $scope.videoProcessingPercentage = progress;

                // recurse if not done
                if (progress < 100) {
                    console.log('- processing video @' + progress + '; check again in 5 sec');

                    // recurse until video processing completes
                    $timeout(function(){
                        embedWhenDone(hashedId);
                    }, 1000 * 5);

                    return;
                }

                // ok, processing completed!
                // embed video
                var iframeHtml = '<iframe src="https://fast.wistia.net/embed/iframe/' + hashedId + '" allowtransparency="true" frameborder="0" scrolling="no" class="wistia_embed" name="wistia_embed" width="700" height="380"></iframe>';
                $scope.videoPreviewHtml = $sce.trustAsHtml(iframeHtml);
                $scope.videoIsReady = true;
            }

            function error(response) {
                $scope.videoPreviewHtml = $sce.trustAsHtml('<b>Oops! Something broke when making a request to Wistia. Sorry about that.');
            }
        }

        /**
         * startup
         * Load list of reports/views for this rfp; fills Reports dropdown
         */
        function _activate() {
            setFileUploaders();
        }




        _activate();   // kicks off activate for this Controller

    }

})()
;
