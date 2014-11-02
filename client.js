(function() {

    var socket = io( 'http://localhost:3334' );

    socket.on( 'connection', function() {
        console.log( 'socket::connection' );
        socket.on( 'disconnect', function() {
            console.log( 'socket::disconnect' );
        } );
    } );

    socket.on( 'sync', function( html ) {
        console.log( 'socket::sync' );
        window.document.body.outerHTML = html;
    } );

    var tmpdiv = null;
    socket.on( 'update', function( update ) {
        console.log( 'socket::update' );
        for( var i = 0; i < update.length; i++ ) {
            var nit = window.document.body;
            for( var j = 0; j < update[i].path.length; j++ ) {
                if( nit.childNodes[update[i].path[j]] ) {
                    nit = nit.childNodes[update[i].path[j]];
                }
            }

            if( update[i].type == 'DOMNodeInserted' ) {
                tmpdiv = tmpdiv || document.createElement( 'div' );
                tmpdiv.innerHTML = update[i].diff;
                nit.appendChild( tmpdiv.firstChild );
            } else if( update[i].type == 'DOMCharacterDataModified' ) {
                nit.nodeValue = update[i].diff;
            }

        }
    } );


    function getPath( element ) {
        if( element.parentNode == window.document || element.parentNode == window.document.documentElement ) {
            return nit != window.document.body ? null : [];
        }

        var path = [], nit = element;
        while( nit != window.document.body || nit == null ) {
            for( var index = 0; nit.parentNode.childNodes[index] != nit; index++ ) {
                if( index > 100 ) {
                    console.log( '?' );
                }
            }
            path.push( index );
            nit = nit.parentNode;
        }
        path.reverse();
        return path;
    }

    var queue = [];

    function track( event ) {
        document.addEventListener( event, function( event ) {
            queue.push( {
                path: getPath( event.toElement ),
                type: event.type,
                screenX: event.screenX,
                screenY: event.screenY,
                clientX: event.clientX,
                clientY: event.clientY,
                ctrl: event.ctrl,
                alt: event.alt,
                shift: event.shift,
                meta: event.meta,
                button: event.button,
                x: event.x,
                y: event.y
            } );
        } );
    }

    track( 'click' );
    track( 'mousemove' );
    track( 'mousedown' );
    track( 'mouseup' );

    setInterval( function() {
        if( !socket.connected ) {
            return;
        }
        if( queue.length == 0 ) {
            return;
        }
        socket.emit( 'mouse', queue );
        queue = [];
    }, 25 )

})();
