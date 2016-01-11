'use strict';

/*
 * Twixt Progress Bar
 */
angular.module('app.directive.progress-bar', [])

/**
 * @ngdoc directive
 * @name progressBar
 * @restrict E
 *
 * @description
 * Generic progress bar.
 * Receives params to update shown %, numerically and graphically (bar size),
 * and text to show before and after completion.
 * Allows displaying an action icon after completion to call a callback function.
 */
.directive('progressBar', [
    '$timeout',
    '$compile',

    function($timeout, $compile) {
        /**
         * Animates an integer value on a rendered element.
         * Sample:
         * var params = {
         *         start: 0,
         *         end: 65,
         *         $el: $element.find('.percentage-value'),
         *         throtling: {
         *             high: {
         *                 value: 90,
         *                 seconds: 2
         *             },
         *             low: {
         *                 value: 10,
         *                 seconds: 2
         *             }
         *         }
         *     };
         *
         * @param  {object} params {start, end, seconds, immediate, $el}
         */
        function animateInteger(params) {
            var start = params.start || 0,
                end = params.end,
                seconds = params.duration * 1000 || 1000 * 1,
                immediate = params.immediate || false,
                throtling = params.throtling || {high: null, low: null},
                $el = params.$el;

            //handle immediate display
            if (immediate) {
                $el.text(end);
                return true;
            }

            //edge throtling; make it slower when reaching the edge
            if (throtling.high) {
                if (end >= throtling.high.value) {
                    seconds = throtling.high.seconds * 1000;
                }
            }
            if (throtling.low) {
                if (end <= throtling.low.value) {
                    seconds = throtling.low.seconds * 1000;
                }
            }

            $({val:start}).animate({val:end},
                {
                    duration: seconds,
                    easing: 'linear',
                    step: function(){
                        var val = Math.round(this.val);
                        $el.text(val); //render value
                    },
                    complete: function(){
                        var val = Math.round(this.val);
                        $el.text(end); //ensure final value
                    }
                }
            );
        }

        function link($scope, $element, $attrs) {
            var previousPercentage = 0,
                timeoutRef; //used for animation

            // initialize with set percentage
            if ($attrs.init && !$attrs.error) {
                $element.find('.progress').width($attrs.percentage + '%');
            }

            if ($attrs.error) {
                addTooltip($element, $attrs.error);
            }

            $scope.$watch('error', function(value, oldValue){
                if (!value) return;
                if (value === oldValue) return;

                $element.addClass('error');
                addTooltip($element, value);
            });

            $scope.$watch('percentage', function(value, oldValue){
                // $watch gets called too frequently
                // do nothing if value didn't change
                if (value === oldValue) return;

                $element.find('.progress').width(value + '%');

                //animate percentage
                var params = {
                    start: previousPercentage,
                    end: value,
                    $el: $element.find('.percentage-value'),
                    throtling: {
                        high: {value: 90, seconds: 2}
                    }
                };
                animateInteger(params);

                //update previous percentage value, used for animation
                previousPercentage = value;
            });

            $scope.$on('$destroy', function(){
                // remove timeout if set
                if (timeoutRef) {
                    $timeout.cancel(timeoutRef);
                }
            });
        }

        function addTooltip($el, value) {
            $el.attr('uib-tooltip', value);
        }

        return {
            restrict: 'E',
            templateUrl: 'partials/progress-bar.html',
            link: link,
            transclude: true,
            scope: {
                percentage: '@',
                text: '@?',
                active: '=?',
                error: '@?'
            }
        };
    }
])
;
