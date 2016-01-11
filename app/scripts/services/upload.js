'use strict';

angular.module('app.service.upload', [])

.service('UploadService', [
    '$timeout',

    function($timeout){

        // internal files list, allows for background uploads
        var files = {},
            trackers = {};

        /**
         * Keeps tracking of added files and active uploads for passed uploader id.
         * Having an uploader id allows for multiple uploaders to be tracked at the same time.
         *
         * Exposes the following methods:
         * - add: tracks a new file
         * - remove: removes a file from tracking
         * - deactivate: deactivates an active upload
         * - hasActiveUploads: returns true if has active uploads
         * - hasNewFiles: returns false if new files were added
         * - getNewFilesCount: returns amount of new files added
         * - getActiveUploadsCount: returns amount of active uploads
         *
         * @param {string} uploaderId identifies an uploader instance
         * @return {object}
         */
        var tracking = function(uploaderId) {

            function tracker() {
                var addedCount = 0,
                    activeCount = 0,
                    trackedFiles = {}; // {[uploadId]: [true|false]} true: active | false: inactive

                function add(id) {
                    trackedFiles[id] = true;
                    ++addedCount;
                    ++activeCount;
                }

                function remove(id) {
                    // ensure the removed file was a tracked file
                    // if it wasn't a tracked file is a pre-existing file
                    // and should not affect added count nor active count
                    if (id in trackedFiles) {
                        // check if it was active
                        // this could happen if the upload fails or if we decide to support cancelling
                        // update active count if required
                        if (trackedFiles[id]) --activeCount;

                        // remove file and update added count
                        delete trackedFiles[id];
                        --addedCount;
                    }
                }

                function deactivate(id) {
                    trackedFiles[id] = false;
                    --activeCount;
                }

                function hasNewFiles() {
                    if (addedCount) return true;
                    return false;
                }

                function hasActiveUploads(uploaderId) {
                    if (activeCount) return true;
                    return false;
                }

                function getNewFilesCount() {
                    return addedCount;
                }

                function getActiveUploadsCount() {
                    return activeCount;
                }

                /**
                 * Clears tracking, removing all stored data.
                 *
                 */
                function clear() {
                    addedCount = 0;
                    activeCount = 0;
                    trackedFiles = {};
                }

                return {
                    add: add,
                    remove: remove,
                    clear: clear,
                    deactivate: deactivate,
                    hasNewFiles: hasNewFiles,
                    hasActiveUploads: hasActiveUploads,
                    getNewFilesCount: getNewFilesCount,
                    getActiveUploadsCount: getActiveUploadsCount
                };
            }

            // return existing tracker
            if (uploaderId in trackers) return trackers[uploaderId];

            // create new tracker and return it
            trackers[uploaderId] = new tracker();
            return trackers[uploaderId];
        };

        /**
         * Adds file to files list.
         * If "percentage" is not passed defaults to zero.
         * If "active" is not passed defaults to true.
         *
         * @param {object} params {filename, uploadId, percentage, list, active}
         * @param {object} scope
         */
        function addFile(params, scope) {
            params.percentage = params.percentage || 0;
            params.active = params.active || true;
            var uploadId = params.uploadId,
                uploaderId = params.uploaderId;

            // create new file object
            var file = {
                data: params.data,
                original_name: params.filename,
                id: uploadId,
                uploadId: uploadId,
                uploaderId: uploaderId,
                percentage: Math.round(params.percentage),
                active: params.active,
                list: params.list,
                scope: scope,
                cancel: function() {
                    cancel(this);
                }
            };

            // update view
            params.list[params.uploadId] = file;
            scope.uploadScope.hasFiles = true;

            // keep internal files list
            files[uploaderId] = files[uploaderId] || {};
            files[uploaderId][uploadId] = file;

            // tracking
            tracking(uploaderId).add(file.id);
        }

        function setProgress(params, scope) {
            // update list
            var uploadId = params.uploadId,
                uploaderId = params.uploaderId,
                progress = params.progress;
            params.list[uploadId].percentage = Math.round(progress);

            // update internal files list
            files[uploaderId][uploadId].progress = progress;
        }

        function setDone(params, scope) {
            var result = params.result,
                uploadId = params.uploadId,
                uploaderId = params.uploaderId,
                list = params.list;

            // update list: set server id and change current file state
            var serverId = result.id;
            list[uploadId].id = serverId;
            list[uploadId].active = false;

            // update internal files list
            files[uploaderId][uploadId].id = serverId;
            files[uploaderId][uploadId].active = false;

            // tracking
            tracking(uploaderId).deactivate(uploadId);
        }

        function setError(params, scope) {
            params.error = params.error || 'Upload failed.';
            var uploadId = params.uploadId,
                uploaderId = params.uploaderId,
                uploadScope = scope.uploadScope;

            // update list
            uploadScope.files[uploadId].error = params.error;
            uploadScope.files[uploadId].percentage = -1; // hide percentage

            // update internal files list
            files[uploaderId][uploadId].error = params.error;
            files[uploaderId][uploadId].percentage = -1; // hide percentage
            files[uploaderId][uploadId].active = false; // allow manual removal

            // tracking
            tracking(uploaderId).remove(uploadId);
        }

        /**
         * Returns true if passed file id exists on internal files list.
         * False if not.
         *
         * @param {string} id file id
         * @param {string} uploaderId uploader id
         * @return {boolean}
         */
        function exists(id, uploaderId) {
            if (!id || !uploaderId || !files[uploaderId]) return false;
            if (id in files[uploaderId]) return true;
            return false;
        }

        /**
         * Removes passed file id from files list.
         * You can directly delete the file in your controller if you don't require tracking.
         *
         * @param  {int} id file id, uploadId or server id
         * @param  {object} list of files used with service and/or related directive.
         * @param {string} uploaderId identifies uploader instance; we might have several in parallel at the same or different times
         */
        function remove(id, list, uploaderId) {
            delete list[id];

            // remove from internal list
            // pre-existing files are not stored in the internal list
            // and aren't tracked
            if (files[uploaderId] && exists(id, uploaderId)) {
                // tracking
                tracking(uploaderId).remove(id);

                // callback
                var file = files[uploaderId][id],
                    uploadScope = file.scope.uploadScope;
                if (typeof uploadScope.onRemove === 'function') {
                    uploadScope.onRemove({
                        uploaderId: uploaderId,
                        uploadId: id
                    });
                }

                delete files[uploaderId][id];
            }
        }

        /**
         * Adds a new file.
         *
         * @param {event} event
         * @param {object} data
         * @param {object} scope
         */
        function add(data, scope) {
            var file = data.files[0],
                uploadId = (new Date()).getTime(), // create new upload id
                uploadScope = scope.uploadScope,
                uploaderId = uploadScope.uploaderId; // get uploader id, unique for all events of a same uploader element (input file)

            console.log('- upload service: added file: ', file);

            // inject upload id and uploder id in file, so they travels across events
            // sticking to the file
            file.id = uploadId;
            file.uploaderId = uploaderId; // for deleting files we only can access the file object and not the whole data

            var response = {
                data: data,
                filename: file.name,
                uploadId: uploadId,
                uploaderId: uploaderId,
                list: uploadScope.files
            };
            scope.$apply(function(){
                // add to documents list if list is provided
                addFile(response, scope);
            });

            // callback
            if (typeof uploadScope.onAdd === 'function') {
                response.file = file;
                uploadScope.onAdd(response);
            }

            // idea: configurable
            // start upload immediately
            data.submit();
        }

        function progress(data, scope) {
            var progress = parseInt(data.loaded / data.total * 100, 10),
                file = data.files[0],
                uploadId = file.id,
                uploadScope = scope.uploadScope,
                uploaderId = uploadScope.uploaderId; // get uploader id, unique for all events of a same uploader element (input file)

            var response = {
                progress: progress,
                uploadId: uploadId,
                uploaderId: uploaderId,
                list: uploadScope.files
            };
            scope.$apply(function(){
                setProgress(response, scope);
            });

            // callback
            if (typeof uploadScope.onProgress === 'function') {
                response.file = file;
                response.data = data;
                uploadScope.onProgress(response);
            }

            //---------------------------------------------
            /*
            //force fail
            if (progress >= 5) {
                console.log('FORCE FAIL');
                $timeout(function(){
                    data.xhr().abort(); //STOP upload
                });
                var params = {
                    error: 'FORCED ERROR',
                    file: file,
                    uploadId: uploadId,
                    uploaderId: uploaderId
                };
                setError(params, scope);
            }
            */
            //---------------------------------------------
        }

        function done(data, scope) {
            var file = data.files[0],
                uploadId = file.id,
                uploadScope = scope.uploadScope,
                uploaderId = uploadScope.uploaderId; // get uploader id, unique for all events of a same uploader element (input file)

            console.log('-- DONE: data: ', data);

            // get server result
            var result = JSON.parse(data.result);

            // check for backend errors
            if (!result.id) {
                // ERROR
                scope.$apply(function(){
                    var error = result.file || 'Upload failed: Undefined backend error.';
                    var response = {
                        error: error,
                        file: file,
                        uploadId: uploadId,
                        uploaderId: uploaderId
                    };
                    setError(response, scope);
                });

                // error callback
                if (typeof scope.onError === 'function') {
                    response.file = file;
                    response.data = data;
                    scope.onError(response);
                }
                return false;
            }

            // OK, done
            var response = {
                uploadId: uploadId,
                uploaderId: uploaderId,
                result: result,
                list: uploadScope.files
            };
            scope.$apply(function(){
                setDone(response, scope);
            });

            // callback
            if (typeof uploadScope.onDone === 'function') {
                response.file = file;
                response.data = data;
                uploadScope.onDone(response);
            }
        }

        function fail(data, scope) {
            var file = data.files[0],
                uploadId = file.id,
                uploadScope = scope.uploadScope,
                uploaderId = uploadScope.uploaderId; // get uploader id, unique for all events of a same uploader element (input file)

            //console.log('- FAIL: data:', data);
            var response = JSON.parse(data._response.jqXHR.responseText);
            //console.log('- RESPONSE ERROR: ', response);
            var error = response.error || 'Upload failed: connection error.';
            var response = {
                error: error,
                file: file,
                uploadId: uploadId,
                uploaderId: uploaderId
            };
            scope.$apply(function(){
                setError(response, scope);
            });

            // callback
            if (typeof uploadScope.onError === 'function') {
                response.file = file;
                response.data = data;
                uploadScope.onError(response);
            }
        }

        function getActiveUploads(uploaderId) {
            var activeUploads = {},
                collection = files[uploaderId];
            angular.forEach(collection, function(file) {
                file.resuming = true;
                if (file.active) activeUploads[file.uploadId] = file;
            });

            return activeUploads;
        }

        function cancel(file) {
            var uploaderId = file.uploaderId,
                uploadId = file.uploadId,
                scope = file.scope,
                uploadScope = file.scope.uploadScope,
                list = uploadScope.files;

            // abort upload (HTTP request lives in background and needs to be aborted)
            $timeout(function(){
                file.data.jqXHR.abort();

                scope.$apply(function(){
                    // remove from UI's list
                    remove(uploadId, list, uploaderId);
                    if (!list || !Object.keys(list).length) {
                        uploadScope.hasFiles = false;
                    }

                    // remove from internal list
                    delete files[uploaderId][uploadId];

                    // clear tracking
                    tracking(uploaderId).clear();
                });
            });

            // callback
            if (typeof uploadScope.onCancel === 'function') {
                uploadScope.onCancel(file);
            }
        }

        function cancelAll(uploadScope) {
            var uploaderId = uploadScope.uploaderId;

            // get active uploads and iterate them cancelling each one
            var activeUploads = getActiveUploads(uploaderId);
            angular.forEach(activeUploads, function(file) {
                cancel(file);
            });

            // callback
            if (typeof uploadScope.onCancelAll === 'function') {
                uploadScope.onCancelAll(uploadScope);
            }
        }

        // public interface
        return {
            add: add,
            remove: remove,
            progress: progress,
            done: done,
            fail: fail,
            tracking: tracking,
            getActiveUploads: getActiveUploads,
            cancelAll: cancelAll,
            cancel: cancel,
            exists: exists
        };
    }
]);
