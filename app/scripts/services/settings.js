'use strict';

angular.module('app.service.settings', [])

.service('Settings', [
    function(){
        console.log('- settings service INIT');

        var settings = {
            wistia: {
                masterToken: '2bbbde3b8685ba5aa962ca5155a33366665325d6977f9816cec0d531321eab4a',
                uploadUrl: 'https://upload.wistia.com/',
                projectId: 'n4egxt2y97',
                api: {
                    mediaUrl: 'https://api.wistia.com/v1/medias.json'
                }
            }
        };

        // public interface
        return {
            get: get
        };

        //-----------------------------------------------------------------

        function get(settingName) {
            if (!settingName in settings) {
                console.log('WARNING: setting not found: ', settingName);
                return null;
            }

            var setting = settings[settingName];
            return setting;
        }
    }
])
;
