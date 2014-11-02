var fs = require( "fs" );
var jsdom_sync = require('./../server.js' );

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