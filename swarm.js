BOID_RADIUS = 3;
SHOW_BOID_HEADING = false;
BOID_COUNT = 100;
MAX_SPEED = 5;

SEPARATION = 1.0;
SEPARATION_DISTANCE = 10;
ALIGNMENT = 1.0;
COHESION = 0.2;
AVOIDANCE = 1.0;
VISIBILITY = 100;

DEBUG = true;
DEBUG_COUNT = 0;


function debug(m) {
    if (DEBUG === true) {
        DEBUG = false;
        console.debug(m);
    }
};


/**
    Vector: Represents a vector in 2D space.
    
    d: Vector direction, in radians
    m: Vector magnitude or length
*/
function Vector(d, m) {
    // If `d` is outside [0, 2PI), bring it back into the correct range.
    this.direction = d % (2 * Math.PI);
    this.magnitude = m;
};
// Factory that returns a vector using the given x and y coordinates.
Vector.fromCartesian = function(pt) {
    var dir;
    var mag = Math.sqrt((pt.x * pt.x) + (pt.y * pt.y));
    
    if (pt.x >= 0) {
        dir = ((2 * Math.PI) + Math.asin(pt.y / mag)) % (2 * Math.PI);
    } else {
        dir = Math.PI - Math.asin(pt.y / mag);
    }
    
    // Value of `dir` should *always* be in [0, 2PI)
    if (dir < 0 || dir >= (2 * Math.PI)) {
        console.error('Error, angle out of range: ', dir, pt);
    }

    return new Vector(
        dir,
        mag
    );
};
// Returns the vector represented as cartesian coordinates: {x:_, y:_}.
Vector.prototype.asCartesian = function() {
    return {
        x: Math.cos(this.direction) * this.magnitude,
        y: Math.sin(this.direction) * this.magnitude
    };
};
// Returns a copy of the vector.
Vector.prototype.copyOf = function() {
    return new Vector(
        this.direction,
        this.magnitude
    );
};
// Returns the result of adding `vec`.
Vector.prototype.addVector = function(vec) {
    var self = this.asCartesian();
    var other = vec.asCartesian();
    return Vector.fromCartesian({
        x: self.x + other.x,
        y: self.y + other.y
    });
};
// Returns the result of subtracting `vec`.
Vector.prototype.subtractVector = function(vec) {
    var self = this.asCartesian();
    var other = vec.asCartesian();
    return Vector.fromCartesian({
        x: self.x - other.x,
        y: self.y - other.y
    });
};
// Returns the vector multiplied by a scalar.
Vector.prototype.scaledBy = function(scl) {
    return new Vector(
        this.direction,
        this.magnitude * scl
    );
};
// Returns a relative vector to the given vector or point.
Vector.prototype.vectorTo = function(other) {
    var vec = other;
    if (! (other instanceof Vector)) {
        vec = Vector.fromCartesian(other);
    }
    return vec.subtractVector(this);
};
// Returns the angle to the vector or point.
Vector.prototype.directionTo = function(other) {
    return this.vectorTo(other).direction;
};
// Returns the distance to the vector or point.
Vector.prototype.distanceTo = function(other) {
    return this.vectorTo(other).magnitude;
};


/**
    Boid: Represents a simulation unit.
    
    p: position vector
    h: heading vector, should be relative to the position vector
    i: identifier for the given boid (unused)
*/
function Boid(p, h, i) {
    this.position = p.copyOf();
    this.heading = h.copyOf();
    this.id = i;
    this.adjustments = [];
};
// Factory function that creates a random boid within the given constraints
Boid.randomBoid = function(mx, my, mhm) {
    var position = Vector.fromCartesian({
        x: Math.random() * mx,
        y: Math.random() * my
    });
    var heading = new Vector(
        Math.random() * (2 * Math.PI),
        Math.random() * mhm
    );
    return new Boid(position, heading);
};
// Draws the boid on the given graphics context.
Boid.prototype.draw = function(ctx) {
    var pt = this.position.asCartesian();
    var tar = this.position.addVector(this.heading.scaledBy(5)).asCartesian();
    // Draw the direction vector
    if (SHOW_BOID_HEADING === true) {
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(tar.x, tar.y);
        ctx.stroke();
    }

    // Draw the dot
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, BOID_RADIUS, 0, Math.PI*2);
    ctx.fill();
}
// Apply adjustments to heading then merge heading into position.
Boid.prototype.flip = function() {
    if (this.adjustments.length > 0) {
        var adjVector = this.adjustments.reduce(function(prev, next) {
            return prev.addVector(next);
        });
        this.adjustments = [];
        
        this.heading = this.heading.addVector(adjVector);
    }
    
    // TODO: We mutate the heading vector here, maybe not a good idea...
    if (this.heading.magnitude > MAX_SPEED) {
        this.heading.magnitude = MAX_SPEED;
    }
    this.position = this.position.addVector(this.heading);
};
// Adds an adjustment vector.
Boid.prototype.adjustHeading = function(vec) {
    // Limit magnitude of adjustment vectors to avoid crazy course changes
    // TODO: Shouldn't mutate vectors
    if (vec.magnitude > MAX_SPEED) {
        vec.magnitude = MAX_SPEED;
    }
    this.adjustments.push(vec.copyOf());
};


function Swarm(n) {
    this.size = n;
    this.width = canvas.width;
    this.height = canvas.height;
    
    this.boids = [];
    for (var i=0; i<n; i++) {
        this.boids.push(Boid.randomBoid(this.width, this.height, MAX_SPEED));
    }
};
Swarm.prototype.run = function(ctx) {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    this.drawAll(ctx);
    this.advance();
    this.flipAll();
};
Swarm.prototype.drawAll = function(ctx) {
    for (var i=0; i<this.boids.length; i++) {
        this.boids[i].draw(ctx);
    }
};
Swarm.prototype.flipAll = function() {
    this.boids.forEach(function(boid) {
        boid.flip();
    });
};
Swarm.prototype.advance = function() {
    for (i in this.boids) {
        var boid = this.boids[i];
        
        var visible = this.boids.filter(function(b) {
            return boid.position.distanceTo(b.position) <= VISIBILITY && 
            boid !== b;
        });
        
        //debug(visible);
        
        // Cohesion
        if (visible.length > 0) {
            var cohAvgPos = visible.reduce(function(prev, next) {
                var pt = next.position.asCartesian();
                return {
                    x: prev.x + (pt.x / visible.length),
                    y: prev.y + (pt.y / visible.length)
                };
            }, {x: null, y: null});
            boid.adjustHeading(
                boid.position.vectorTo(cohAvgPos)
                .scaledBy(COHESION)
            );
        }
        
        // Alignment
        if (visible.length > 0) {
            var alignAvgVector = visible.reduce(function(prev, next) {
                return prev.addVector(next.heading);
            }, new Vector(0, 0));
            boid.adjustHeading(
                alignAvgVector
                .scaledBy(ALIGNMENT)
            );
        }
        
        // Separation
        // TODO: Magnitude of the effect should be inversely proportional to distance
        var tooClose = visible.filter(function(b) {
            return boid.position.distanceTo(b.position) <= SEPARATION_DISTANCE;
        });
        
        if (tooClose.length > 0) {
            var sepAvgPos = tooClose.reduce(function(prev, next) {
                var pt = next.position.asCartesian();
                return {
                    x: prev.x + (pt.x / tooClose.length),
                    y: prev.y + (pt.y / tooClose.length)
                };
            }, {x: null, y: null});
            boid.adjustHeading(
                boid.position.vectorTo(sepAvgPos)
                .scaledBy(-1)
                .scaledBy(SEPARATION)
            );
        }
        
        // Avoidance
        var boidPt = boid.position.asCartesian();
        
        if (boidPt.x < VISIBILITY || boidPt.x > (this.width - VISIBILITY)) {
            boid.adjustHeading(
                boid.position.vectorTo(Vector.fromCartesian({
                    x: this.width / 2,
                    y: boidPt.y
                }))
                .scaledBy(AVOIDANCE)
            );
        }
        
        if (boidPt.y < VISIBILITY || boidPt.y > (this.height - VISIBILITY)) {
            boid.adjustHeading(
                boid.position.vectorTo(Vector.fromCartesian({
                    x: boidPt.x,
                    y: this.height / 2
                }))
                .scaledBy(AVOIDANCE)
            );
        }
    }
};


function run(ctx) {
    var swarm = new Swarm(BOID_COUNT);
    ctx.fillStyle = 'rgb(200, 50, 200)';
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
    
    requestAnimationFrame = window.requestAnimationFrame || 
                            window.mozRequestAnimationFrame ||
                            window.webkitRequestAnimationFrame || 
                            window.msRequestAnimationFrame;
    var start = Date.now();

    function step(timestamp) {
        var progress = timestamp - start;
        swarm.run(ctx);
        if (progress < 20000) {
            requestAnimationFrame(step);
        }
    }
    requestAnimationFrame(step);
}



