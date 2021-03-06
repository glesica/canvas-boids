BOID_RADIUS = 3;
SHOW_BOID_HEADING = false;
BOID_COUNT = 150;
MAX_SPEED = 15;
RUNNING = false;
ADJUSTMENT_MULTIPLIER = 0.05;

SEPARATION = 1.0;
SEPARATION_DISTANCE = 15;
ALIGNMENT = 1.0;
COHESION = 0.2;
AVOIDANCE = 1.0;
VISIBILITY = 50;

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
    // Precompute cartesian coords to speed shit up
    this.x = Math.cos(this.direction) * this.magnitude;
    this.y = Math.sin(this.direction) * this.magnitude;
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
    //return {
    //    x: Math.cos(this.direction) * this.magnitude,
    //    y: Math.sin(this.direction) * this.magnitude
    //};
    return {
        x: this.x,
        y: this.y
    }
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
// Updates the boid position and allows output. This version 
// outputs the boid to the given canvas context.
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
Boid.prototype.update = function() {
    if (this.adjustments.length > 0) {
        var adjVector = this.adjustments.reduce(function(prev, next) {
            return prev.addVector(next);
        });
        this.adjustments = [];
        
        this.heading = this.heading.addVector(adjVector);
    }
    
    // TODO: We mutate the heading vector here, maybe not a good idea...
    if (this.heading.magnitude > MAX_SPEED) {
        this.heading = new Vector(
            this.heading.direction,
            MAX_SPEED
        );
    }
    this.position = this.position.addVector(this.heading);
};
// Adds an adjustment vector.
Boid.prototype.adjust = function(vec) {
    // Limit magnitude of adjustment vectors to avoid crazy course changes
    // TODO: Shouldn't mutate vectors
    if (vec.magnitude > MAX_SPEED) {
        vec = new Vector(
            vec.direction,
            MAX_SPEED * ADJUSTMENT_MULTIPLIER
        );
    }
    this.adjustments.push(vec.copyOf());
};


function Swarm(n, mx, my) {
    this.size = n;
    this.width = mx;
    this.height = my;
    
    this.boids = [];
    for (var i=0; i<n; i++) {
        this.boids.push(Boid.randomBoid(this.width, this.height, MAX_SPEED));
    }
};
Swarm.prototype.advance = function() {
    // Adjust boid headings
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
            boid.adjust(
                boid.position.vectorTo(cohAvgPos)
                .scaledBy(COHESION)
            );
        }
        
        // Alignment
        if (visible.length > 0) {
            var alignAvgVector = visible.reduce(function(prev, next) {
                return prev.addVector(next.heading);
            }, new Vector(0, 0));
            boid.adjust(
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
            boid.adjust(
                boid.position.vectorTo(sepAvgPos)
                .scaledBy(-1)
                .scaledBy(SEPARATION)
            );
        }
        
        // Avoidance
        var boidPt = boid.position.asCartesian();
        
        if (boidPt.x < VISIBILITY || boidPt.x > (this.width - VISIBILITY)) {
            boid.adjust(
                boid.position.vectorTo(Vector.fromCartesian({
                    x: this.width / 2,
                    y: boidPt.y
                }))
                .scaledBy(AVOIDANCE)
            );
        }
        
        if (boidPt.y < VISIBILITY || boidPt.y > (this.height - VISIBILITY)) {
            boid.adjust(
                boid.position.vectorTo(Vector.fromCartesian({
                    x: boidPt.x,
                    y: this.height / 2
                }))
                .scaledBy(AVOIDANCE)
            );
        }
    }
    // Update boid positions now that they are all adjusted.
    for (var i in this.boids) {
        this.boids[i].update();
    };
};


function run(canvasID) {
    var canvas = document.getElementById(canvasID);
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgb(190,245,127)';
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
    
    var swarm = new Swarm(BOID_COUNT, canvas.width, canvas.height);
    
    var startTime = undefined;
    window.requestAnimFrame = (function() {
        return window.requestAnimationFrame || 
               window.webkitRequestAnimationFrame || 
               window.mozRequestAnimationFrame || 
               window.oRequestAnimationFrame || 
               window.msRequestAnimationFrame || 
               function(callback, element) {
                    window.setTimeout(callback, 1000 / 60);
                };
    })();

    // Updates the boid position and allows output. This version 
    // outputs the boid to the given canvas context.
    function drawBoid(boid) {
        var pt = boid.position.asCartesian();
        var tar = boid.position.addVector(boid.heading.scaledBy(5)).asCartesian();

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
    };

    
    function animate(time) {
        if (time === undefined) {
            time = Date.now();
        }
        if (startTime === undefined) {
            startTime = time;
        }
        swarm.advance();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (var i in swarm.boids) {
            swarm.boids[i].draw(ctx);
        }
    };
    
    function stop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    (function animloop(){
        if (RUNNING === true) {
            animate();
            requestAnimFrame(animloop);
        } else {
            stop();
        }
    })();   
};



