'use strict';

angular.module('app.service.wistia', [])

.service('Wistia', [
    '$http',
    'Settings',

    function($http, Settings){
        console.log('- wistia service INIT');

        var wistiaSettings = Settings.get('wistia'),
            masterToken = wistiaSettings.masterToken,
            mediaUrl = wistiaSettings.api.mediaUrl;

        // public interface
        return {
            getMedia: getMedia
        };

        //-----------------------------------------------------------------

        function getMedia(hashedId) {
            var params = {
                api_password: masterToken,
                hashed_id: hashedId
            };

            // make request
            var promise = $http.get(mediaUrl, {params: params});
            promise.then(success, error);

            return promise;

            //-----------------------------------------------------------------
            // log

            function success(response) {
                console.log('[ WISTIA ]--> success: ', response);

            }

            function error(response) {
                console.log('[ WISTIA ]--> error: ', response);
            }
        }
    }
])
;
