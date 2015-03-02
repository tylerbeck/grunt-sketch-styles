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
    var Point = require( '../lib/Point' );
    var Vector = require( '../lib/Vector' );

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
            grunt.verbose.writeln( 'sketchtool dump exited with code: '+code );
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

    function getGradientData( obj ){
        var gradient = {
            angle: 0,
            stops: [],
            from: {
                x: 0.5,
                y: 0.5
            }
        };

        var p1 = objProp( obj, 'gradient.from' );
        var p2 = objProp( obj, 'gradient.to' );
        var stops = objProp( obj, 'gradient.stops.<items>' ) || [];


        if ( p1 && p2 && stops.length > 0 ){
            var from = new Point( p1.x, p1.y );
            var to = new Point( p2.x, p2.y );
            var v = to.subtract( from ).toVector();
            gradient.from.x = p1.x;
            gradient.from.y = p1.y;
            gradient.angle = Math.round( 1000 * (90 + v.angle * 180 / Math.PI) ) / 1000;
            gradient.stops = [];
            stops.forEach( function( stop ) {
                var obj = {};
                obj.color = objProp( stop, 'color.value' ) || 'rgba(0,0,0,0)';
                obj.position = Math.round( 100 * parseFloat( objProp( stop, 'position' ) ) );
                gradient.stops.push( obj );
            });

        }

        return gradient;
    }

    function getLinearGradient( obj ){
        grunt.verbose.writeln('getLinearGradient');

        var gradient = getGradientData( obj );

        if ( gradient.stops.length > 0 ){
            var parts = [ "linear-gradient("+ gradient.angle+ "deg" ];
            gradient.stops.forEach( function( stop ){
                parts.push( stop.color + " " + stop.position +"%" );
            });

            return parts.join(",")+")";
        }

        return "";

    }

    function getRadialGradient( obj ){
        grunt.verbose.writeln('getRadialGradient');

        var gradient = getGradientData( obj );
        var x = (gradient.from.x * 100) + "%";
        var y = (gradient.from.y * 100) + "%";

        if ( gradient.stops.length > 0 ){
            var parts = [ "radial-gradient( ellipse farthest-side at "+x+" "+y ];
            gradient.stops.forEach( function( stop ){
                parts.push( stop.color + " " + stop.position +"%" );
            });

            return parts.join(",")+")";
        }

        return "";

    }

    function getFillColor( obj ){
        return getBackgrounds( obj ).color;
    }

    function getBackgrounds( obj ){
        grunt.verbose.writeln('getBackgrounds');
        var list = [];
        var color;

        var fills = objProp( obj, 'value.fills.<items>' );
        if ( fills ){
            for ( var i= 0, l=fills.length; i<l; i++ ){
                grunt.verbose.writeln('fill: '+i);
                var fill = fills[ i ];
                grunt.verbose.writeln('fill.isEnabled: '+fill.isEnabled);
                if ( fill && fill.isEnabled ){
                    switch( fill.fillType ){
                        case 0:
                            //solid fill
                            grunt.verbose.writeln('solid');
                            var c = objProp( fill, 'color.value' ) || "rgba(0,0,0,0)";
                            if (!color) {
                                color = c;
                            }
                            list.unshift( "linear-gradient(0deg,"+c+","+c+")" );
                            break;
                        case 1:
                            //gradient
                            var gradientType = objProp( fill, 'gradient.gradientType' );
                            if ( gradientType === 0) {
                                //linear gradient
                                grunt.verbose.writeln( 'linear' );
                                var lgrad = getLinearGradient( fill );
                                if ( lgrad ) {
                                    list.unshift( lgrad );
                                }
                            } else if ( gradientType === 1) {
                                //radial gradient
                                grunt.verbose.writeln('radial');
                                var rgrad = getRadialGradient( fill );
                                if ( rgrad ){
                                    list.unshift( rgrad );
                                }
                            }

                            break;
                    }
                }
            }
        }

        return {
            gradients: list.join(","),
            color: color
        };
    }

    function getBorders( obj ){
        grunt.verbose.writeln('getBorders');
        var list = [];

        var borders = objProp( obj, 'value.borders.<items>' );
        if ( borders ){
            for ( var i= 0, l=borders.length; i<l; i++ ){
                grunt.verbose.writeln('border: '+i);
                var border = borders[ i ];
                grunt.verbose.writeln('border.isEnabled: '+border.isEnabled);
                if ( border && border.isEnabled ){
                    var bObj = {
                        thickness: objProp( border, 'thickness' ) || 0,
                        color: 'rgba( 0,0,0,0 )',
                        image: undefined
                    };

                    switch( border.fillType ){
                        case 0:
                            //solid fill
                            grunt.verbose.writeln('solid');
                            var c = objProp( border, 'color.value' ) || "rgba(0,0,0,0)";
                            bObj.color = c;
                            break;
                        case 1:
                            //gradient
                            var gradientType = objProp( border, 'gradient.gradientType' );
                            if ( gradientType === 0) {
                                //linear gradient
                                grunt.verbose.writeln( 'linear' );
                                var lgrad = getLinearGradient( border );
                                if ( lgrad ) {
                                    bObj.image = lgrad;
                                }
                            } else if ( gradientType === 1) {
                                //radial gradient
                                grunt.verbose.writeln('radial');
                                var rgrad = getRadialGradient( border );
                                if ( rgrad ){
                                    bObj.image = rgrad;
                                }
                            }

                            break;
                    }
                    list.push( bObj );
                }
            }
        }

        return list;
    }

    function parseLayerStyle( obj ){
        grunt.verbose.writeln('parseLayerStyle');
        var context = {};
        var value = obj.value;
        var name = obj.name;
        var nameParts = name.split("-");

        switch ( nameParts[0] ){
            case "color":
                //for color layers, set value to first enabled fill color.
                var color = getFillColor( obj );
                if ( color ){
                    context.colors = {};
                    context.colors[ name.replace("color-","") ] = color;
                }
                break;

            case "background":
                context.mixins = {};
                context.mixins[ name ] = {
                    backgrounds: getBackgrounds( obj )
                };
                break;

            default:
                context.mixins = {};
                context.mixins[ name ] = {
                    backgrounds: getBackgrounds( obj ),
                    borders: getBorders( obj )
                };
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
                grunt.verbose.writeln( 'context:\n'+ JSON.stringify( context, undefined, "   " ) );
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
