jsdom-sync: a jsdom server-client synchronization tool
======================================================

Purpose description
-------------------

There is module jsdom which can be used as server-side DOM model.
It's can be used to provide an operation context to certain front-end frameworks like jQuery or AngularJS.

However it's hard to use such a setup to implement web applications, because there should be a ui viewport which
renders a virtual dom content, applies dom updates and handles ui events.

This tool is very simple implementation of push-pull mechanism to sync DOM model with browser.

It's mostly targets simple desktop applications with browser as ui client, but it can be also used for other clients
like node-webkit or for multisession web apps.

Example
-----

A sample angular application is included as usage example.

    var fs = require( "fs" );
    var jsdom_sync = require('jsdom_sync' );
    
    jsdom_sync.start( {
        scripts: [ "./test/angular.min.js" ],
        body: fs.readFileSync( "./test/index.html", "utf-8" ) 
    }, function( window ) {
    
        window.angular.module( 'example', [] )
            .controller( 'Controller', ['$scope', '$interval', function( $scope, $interval ) {
                $scope.time = 1;
                $interval( function() {
                    $scope.time++;
                }, 1000 );
    
            }] ).directive( 'test', function() {
                return {
                    restrict: 'E',
                    template: '<button ng-click="pimp()">Clicked {{count}} times</button>',
                    link: function( $scope ) {
                        $scope.count = 0;
                        $scope.pimp = function() {
                            $scope.count += 1;
                        }
                    }
                }
            } );
    } );
    
Index page have this:

    <div ng-app="example"><div ng-controller="Controller">time: {{ time }}</div><test></test></div>
    
API
---

    jsdom_sync.start( {
        scripts: [ ], //array of scripts to be executed in DOM context
        head: "<head></head>", //app page head content
        body: fs.readFileSync( "./test/index.html", "utf-8" ) //app page body content
    },
    
Limitations
-----------

1. Jquery is required to be in DOM page (beacause it uses .on to trach mutation events). May be fixed by rewriting with addEventListener.
2. Heavy linked socket.io and jquery versions. May be fixed by adding proper dependencies.