/*
 * grunt-if
 * https://github.com/tylerbeck/grunt-sketch-styles
 *
 * Copyright (c) 2015 Tyler Beck
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function( grunt ) {

    var q = require( 'q' );
    var _ = require( 'lodash' );
    var path = require( 'path' );
    var spawn = require( 'child_process' ).spawn;

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    function objProp( obj, props ){
        var list = typeof props === "string" ?  props.split('.') : props;
        if ( list.length > 0 ){
            var prop = list.shift();
            if ( obj.hasOwnProperty( prop ) ){
                return objProp( obj[ prop ], list );
            }
            else{
                return undefined;
            }
        }
        else {
            return obj;
        }
    }

    function getSources( file ){
        var files = file.src;
        if ( !files ){
            files = file.orig.src;
        }

        return files;
    }

    function getDestination( file ){
        return file.dest;
    }

    function getJSON( source ){
        var deferred = q.defer();

        var proc = spawn( 'sketchtool', ['dump', source] );
        var out = "";
        var error = "";
        proc.stdout.on( 'data', function( data ) {
            out += data;
        });

        proc.stderr.on( 'data', function( data ) {
            error += data;
        });

        proc.on('close', function( code ) {
            console.log( 'sketchtool dump exited with code: '+code );
            if ( error !== "" ){
                deferred.reject( error );
            }
            else{
                var json = JSON.parse( out );
                deferred.resolve( json );
            }

        });

        return deferred.promise;
    }

    function getFills( obj ){
        return objProp( obj, 'value.fills.<items>' );
    }

    function getAngle( obj ){
        var from = objProp( obj, 'gradient.from' );
        var to = objProp( obj, 'gradient.to' );
        var angle = 0;
        if ( from && to ){
            var x = to.x - from.x;
            var y = to.y - from.y;
            var rads = Math.atan2( x, y );
            angle = Math.round( 1000 * (rads * 180 / Math.PI) ) / 1000;
        }

        return angle;
    }

    function getGradient( obj ){
        var gradient = {};

    }

    function getFirstFillColor( obj ){
        var backgrounds = getBackgrounds( obj );
        var value;
        backgrounds.forEach( function( background ){
            if ( !value && background.type === 'solid' ){
                value = background.value;
            }
        });
        return value;
    }

    function getBackgrounds( obj ){

        var list = [];
        var fills = getFills( obj );
        if ( fills ){
            for ( var i= 0, l=fills.length; i<l; i++ ){
                var fill = fills[ i ];
                if ( fill && fill.isEnabled ){
                    switch( fill.fillType ){
                        case 0:
                            //solid fill
                            var color = objProp( fill, 'color.value' );
                            if ( color ){
                                list.push({
                                    type: 'solid',
                                    value: color
                                });
                            }
                            break;
                        case 1:
                            list.push( {
                                type: 'linear',
                                value: {
                                    angle: getAngle( fill ),
                                    gradient: getGradient( fill )
                                }
                            } );
                            break;
                    }
                }
            }
        }

        return list;
    }

    function parseLayerStyle( obj, parsers ){
        var context = {};
        var value = obj.value;
        var name = obj.name;
        var nameParts = name.split("-");

        switch ( nameParts[0] ){
            case "color":
                //for color layers, set value to first enabled fill color.
                var color = getFirstFillColor( obj );
                if ( color ){
                    context.colors = {};
                    context.colors[ name.replace("color-","") ] = color;
                }
                break;

            case "background":
                var bgs = getBackgrounds( obj );
                if ( bgs.length ){
                    context.backgrounds = {};
                    context.backgrounds[ name.replace("background-","") ] = bgs;
                }
                break;
        }

        return context;

    }

    function parseTextStyle( obj ){
        return {};
    }

    function parseStyles( obj ){
        var context = {};

        var layerStyles = objProp( obj, "layerStyles.objects.<items>" ) || [];
        var layerTextStyles = objProp( obj, "layerTextStyles.objects.<items>" ) || [];

        layerStyles.forEach( function( item ){
            _.merge( context, parseLayerStyle( item ) );
        });

        layerTextStyles.forEach( function( item ){
            _.merge( context, parseTextStyle( item ) );
        });

        return context;
    }

    function outputStyles( dest ){

        var ext = path.extname( dest ).replace(/^\./,'');
        var templatePath = path.join('templates',ext+'.template');
        if ( !grunt.file.exists( templatePath ) ){
            grunt.warn( "The destination file type \""+ext+"\"is not supported");
            return function(){
                //do nothing
            };
        }
        else{
            var template = _.template( grunt.file.read( templatePath ), {variable: 'data'} );
            return function ( results ){
                var context = {};
                results.forEach( function( result ){
                    _.merge( context, parseStyles( result ) );
                } );
                grunt.file.write( dest, template( context ) );
            };
        }

    }

    //TODO: verify sketchtool exists.

    //TODO: verify sketchtool version is within supported range.


    grunt.registerMultiTask( 'sketch-styles', 'Export sketch styles', function() {

        var done = this.async();
        var task = this;

        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options( {

        } );

        // iterate files and get styles
        task.files.forEach( function( file ){

            var sources = getSources( file );
            var dest = getDestination( file );
            var promises = [];

            sources.forEach( function( source ){
                if (!grunt.file.exists( source )){
                    grunt.warn( 'Source file "' + source + '" not found.' );
                }
                promises.push( getJSON( source ) );
            });

            q.all( promises )
                    .then( outputStyles( dest ) )
                    .fail( function( error ){
                        grunt.warn( error );
                    });

        });



        //get JSON from stdout

        //parse JSON

        //load template

        //output styles



    } );

};
