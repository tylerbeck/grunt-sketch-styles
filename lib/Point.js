var Vector = require('./Vector');

/**
 * Point Class
 * @param x
 * @param y
 * @returns {Point}
 * @constructor
 */
var Point = function( x, y ){

    /**
     * x coordinate
     * @type {Number}
     */
    this.x = x == undefined ? 0 : x;

    /**
     * y coordinate
     * @type {Number}
     */
    this.y = y == undefined ? 0 : y;

    return this;
};

/**
 * Point class prototype
 * @type {{x: Number, y: Number, toVector: toVector, toString: toString, copy: copy, operate: operate, add: add, subtract: subtract, multiply: multiply, divide: divide, pow: pow, offsetPoint: offsetPoint, distance: distance}}
 */
Point.prototype = {

    /**
     * converts point to vector
     * @return {Vector}
     */
    toVector: function(){
        var a = Math.atan2( this.y, this.x );
        var v = Math.sqrt( this.x*this.x + this.y*this.y );
        return new Vector(v,a);
    },

    /**
     * converts point to object notation
     * @return {String}
     */
    toString: function(){
        return "{x:"+this.x+",y:"+this.y+"}";
    },

    /**
     * returns a copy of this point
     */
    copy: function(){
        return new Point( this.x, this.y );
    },

    /**
     * performs function on point
     * @param fn
     * @param args
     */
    operate: function( fn, args ){
        //console.groupCollapsed( 'operate' );
        var r = this.copy();
        //console.log('start with: ', r);
        var len =  args.length;
        //console.log('there are',len,'arguments');
        for (var i=0; i<len; i++) {
            var arg = args[i];
            if (typeof arg == "number") {
                //console.log('arg is number: ', arg);
                r.x = fn(r.x,arg);
                r.y = fn(r.y,arg);
            }
            else {
                //console.log('arg is point: ', arg);
                r.x = fn(r.x,arg.x);
                r.y = fn(r.y,arg.y);
            }
        }
        //console.log('end with: ', r);
        //console.groupEnd();
        return r;
    },

    /**
     * adds arguments to point (returns new point)
     * @return {Point}
     */
    add: function( /*...arguments*/ ){
        return this.operate( function(a,b){return a+b;}, arguments );
    },

    /**
     * subtracts arguments from point (returns new point)
     * @return {Point}
     */
    subtract: function( /*...arguments*/ ){
        return this.operate( function(a,b){return a-b;}, arguments );
    },

    /**
     * multiplies point by arguments (returns new point)
     * @return {Point}
     */
    multiply: function( /*...arguments*/ ){
        return this.operate( function(a,b){return a*b;}, arguments );
    },

    /**
     * divides point by arguments (returns new point)
     * @return {Point}
     */
    divide: function( /*...arguments*/ ){
        return this.operate( function(a,b){return a/b;}, arguments );
    },

    /**
     * raises point by arguments (returns new point)
     * @return {Point}
     */
    pow: function( /*...arguments*/ ){
        return this.operate( function(a,b){return Math.pow(a,b);}, arguments );
    },

    /**
     * raises point by arguments (returns new point)
     * @return {Point}
     */
    modulus: function( /*...arguments*/ ){
        return this.operate( function(a,b){return a % b;}, arguments );
    },

    /**
     * offsets point at the specified angle by the specified distance
     * @param {Point} p
     * @param {Number} angle angle in radians
     * @param {Number} distance
     */
    offsetPoint: function( angle, distance ){
        var offset = this.copy();
        offset.x += Math.cos( angle ) * distance;
        offset.y += Math.sin( angle ) * distance;
        return offset;
    },

    /**
     * calculates the absolute distance to point
     * @param {Point} p
     * @return {Number}
     */
    distance: function( p ) {
        return Math.sqrt( Math.pow(p.x-this.x,2) + Math.pow(p.y-this.y,2)  );
    }
};

module.exports = Point;
