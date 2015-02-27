var Point = require('./Point');

var Vector = function( velocity, angle ){
    /**
     * velocity or length of the vector
     * @type {Number}
     */
    this.velocity = velocity;

    /**
     * angle of vector (horizontal pointing right is 0 radians)
     * @type {Number}
     */
    this.angle = angle;
    return this;
};

Vector.prototype = {
    /**
     * returns a copy of this vector
     */
    copy: function(){
        return new Vector( this.velocity, this.angle );
    },

    /**
     * adds two vectors
     * @param v
     */
    add: function( v ){
        var c = this.copy();
        c.velocity += v.velocity;
        c.angle += v.angle;
        return c;
    },

    /**
     * converts a vector to a (0,0) based point
     * @return {Point}
     */
    toPoint: function() {
        return new Point(
                Math.cos(this.angle)*this.velocity,
                Math.sin(this.angle)*this.velocity
        )
    },

    /**
     * converts vector to object notation
     * @return {String}
     */
    toString: function(){
        return "{v:"+this.velocity+",a:"+this.angle+"}";
    }
};

module.exports = Vector;
