var readLine = require ("readline");
if (process.platform === "win32"){
    var rl = readLine.createInterface ({
        input: process.stdin,
        output: process.stdout
    });

    rl.on ("SIGINT", function (){
        process.emit ("SIGINT");
    });

}

process.on ("SIGINT", function(){
    //process.exit ();
});


var _ = require( "lodash" );
var jsdom = require( "jsdom" );
var fs = require( "fs" );

function start( options, onReady ) {

    var window = null;
    var changes = [];

    var src = [];
    src.push(fs.readFileSync("./jquery.min.js", "utf-8"));
    _.each(options.scripts, function(script) {
        src.push(fs.readFileSync(script, "utf-8" ));
    });

    jsdom.env( {
        html: "<html>" + (options.head || '<head></head>') + (options.body || '<body></body>') + "</html>",
        src: src,
        done: function() {
            window = arguments[1];
            var mutationEventTrackers = [
                { name: 'DOMAttrModified', path: function( e ) {
                    return [];
                }, diff: function( e ) {
                    return null;
                }, sync: false },
                { name: 'DOMAttributeNameChanged', path: function( e ) {
                    return [];
                }, diff: function( e ) {
                    return null;
                }, sync: false },
                { name: 'DOMCharacterDataModified', path: function( e ) {
                    var path = [];
                    var nit = e.originalEvent.target;
                    while( nit != window.document.body ) {
                        path.push( _.indexOf( nit._parentNode._childNodes, nit ) );
                        nit = nit._parentNode;
                    }
                    path.reverse();
                    return path;
                }, diff: function( e ) {
                    return e.originalEvent.target.__nodeValue;
                }, sync: true },
                { name: 'DOMElementNameChanged', path: function( e ) {
                    return [];
                }, diff: function( e ) {
                    return null;
                }, sync: false },
                { name: 'DOMNodeInserted', path: function( e ) {
                    var path = [];
                    var nit = e.originalEvent.target;
                    while( nit != window.document.body ) {
                        path.push( _.indexOf( nit._parentNode._childNodes, nit ) );
                        nit = nit._parentNode;
                    }
                    path.reverse();

                    return path;
                }, diff: function( e ) {
                    return e.originalEvent.target.outerHTML;
                }, sync: true },
                { name: 'DOMNodeInsertedIntoDocument', path: function( e ) {
                    return [];
                }, diff: function( e ) {
                    return e.originalEvent.target.outerHTML;
                }, sync: false },
                { name: 'DOMNodeRemoved', path: function( e ) {
                    return [];
                }, diff: function( e ) {
                    return null;
                }, sync: false },
                { name: 'DOMNodeRemovedFromDocument', path: function( e ) {
                    return [];
                }, diff: function( e ) {
                    return null;
                }, sync: false },
                { name: 'DOMSubtreeModified', path: function( e ) {
                    return [];
                }, diff: function( e ) {
                    return null;
                }, sync: false }
            ];
            _.each( mutationEventTrackers, function( mutationEventTracker ) {
                window.$(window.document.documentElement).on(mutationEventTracker.name, function( e ) {
                    changes.push( {
                        type: mutationEventTracker.name,
                        path: mutationEventTracker.path( e ),
                        diff: mutationEventTracker.diff( e )
                    } );
                });
            } );

            setInterval( function() {
                //todo: optimize changes: remove nodes which where added and then removed, and so on
                push();
            }, 25 );

            onReady(window);
        }
    } );

    function push() {
        if( !socket ) {
            return;
        }
        if( changes.length == 0 ) {
            return;
        }
        socket.emit( 'update', changes );
        changes = [];
    }

    function sync() {
        if( !socket ) {
            return;
        }
        socket.emit( 'sync', window.document.body.outerHTML );
        changes = [];
    }

    var socket = null;

    function host() {
        var app = require( 'http' ).createServer( function( rq, rs ) {
            rs.writeHead( 200 );
            rs.write( '<html><head><script type="application/javascript">' );
            rs.write( fs.readFileSync( "./socket.io-1.0.4.js", "utf-8" ) );
            rs.write( fs.readFileSync( "./client.js", "utf-8" ) );
            rs.write( '</script></head><body></body></html>' );
            rs.end();
        } );
        var io = require( 'socket.io' )( app );
        app.listen( 3334 );

        io.on( 'connection', function() {
            socket = arguments[0];
            sync();
            socket.on( 'error', function() {
                socket.destroy();
            } );
            socket.on( 'sync', function() {
                sync();
            } );
            socket.on( 'mouse', function( queue ) {
                _.each( queue, function( eventInfo ) {

                    if( eventInfo.path ) {
                        var nit = window.document.body;
                        for( var j = 0; j < eventInfo.path.length; j++ ) {
                            if( nit._childNodes[eventInfo.path[j]] ) {
                                nit = nit._childNodes[eventInfo.path[j]];
                            }
                        }
                    } else {
                        nit = window.document.documentElement;
                    }

                    var event = window.document.createEvent( 'MouseEvents' );

                    event.initMouseEvent(
                        eventInfo.type,
                        true,//canBubble
                        true,//cancelable,
                        window.document.defaultView,
                        1,//detail
                        eventInfo.screenX,
                        eventInfo.screenY,
                        eventInfo.clientX,
                        eventInfo.clientY,
                        eventInfo.ctrl,
                        eventInfo.alt,
                        eventInfo.shift,
                        eventInfo.meta,
                        eventInfo.button,
                        nit
                    );
                    nit.dispatchEvent( event );
                } );
            } );
        } );
        io.on( 'disconnect', function() {
        } );
    }

    host();
}
_.extend( module.exports, {
    start: start
} );