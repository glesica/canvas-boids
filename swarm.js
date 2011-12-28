BOID_RADIUS = 5;
BOID_COUNT = 10;
MAX_SPEED = 5;

SEPARATION = 0.5;
SEPARATION_DISTANCE = 10;
ALIGNMENT = 0.5;
COHESION = 0.5;
AVOIDANCE = 0.5;
VISIBLE_RANGE = 50;


function Boid(x, y, d, m) {
    this.x = x;
    this.y = y;
    this.velocity = {
        direction: d, 
        magnitude: m
    };
    this.nextVelocity = {
        direction: d, 
        magnitude: m
    };
}
Boid.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, BOID_RADIUS, 0, Math.PI*2);
    ctx.fill();
}
/**
    Returns the distance from the current boid to `pos` 
    where `pos` is any object with `x` and `y` properties.
*/
Boid.prototype.distanceTo = function(pos) {
    return Math.sqrt(Math.pow(pos.x - this.x, 2) + Math.pow(pos.y - this.y, 2));
}
/**
    Returns the average distance from the target boid 
    to each position in `poss`. Each position can be 
    any object with `x` and `y` properties.
*/
Boid.prototype.distanceToAverage = function(poss) {
    return bs.reduce(function(prev, next) {
        return prev + this.distanceTo(next);
    }, null) / poss.length;
}
/**
    Returns the angle from the target boid to `pos` where 
    `pos` is any object with `x` and `y` properties.
*/
Boid.prototype.angleTo = function(pos) {
    return Math.atan((pos.y - this.y) / (pos.x - this.x))
}
/**
    Returns a vector from the target boid to `pos` where 
    `pos` is any object with `x` and `y` properties.
*/
Boid.prototype.vectorTo = function(pos) {
    return {
        direction: this.angleTo(pos),
        magnitude: this.distanceTo(pos)
    }
}
/**
    Adds the given velocity vector, `vel`, to the current 
    "next" velocity of the target boid.
*/
Boid.prototype.updateVelocity = function(vel) {
    var current = this.nextVelocity;
    currentX = Math.cos(current.direction) * current.magnitude;
    currentY = Math.sin(current.direction) * current.magnitude;
    
    addX = Math.cos(vel.direction) * vel.magnitude;
    addY = Math.cos(vel.direction) * vel.magnitude;
    
    
}


function Swarm(n) {
    this.size = n;
    this.width = canvas.width;
    this.height = canvas.height;
    
    this.boids = [];
    for (var i=0; i<n; i++) {
        var x = Math.random() * this.width;
        var y = Math.random() * this.height;
        var h = Math.random() * (2 * Math.PI);
        var s = Math.random() * MAX_SPEED;
        this.boids.push(new Boid(x, y, h, s));
    }
}
Swarm.prototype.draw = function(ctx) {
    this.boids.forEach(function(boid) {
        boid.draw(ctx);
    });
}
Swarm.prototype.update = function() {
    for (i in this.boids) {
        var boid = this.boids[i];
        
        var nearest = this.boids.filter(function(b) {
            return boid.closeTo(b, VISIBLE_RANGE);
        });
        
        /*
            Cohesion Heading
        */
        var cohesionVelocity = null;
        if (nearest.length) {
            var sumPos = nearest.reduce(
                function(prev, next) {
                    return {
                        x: prev.x + next.x,
                        y: prev.y + next.y
                    }
                }
            , {x: null, y: null});
            var avgPos = {
                x: sumPos.x / nearest.length,
                y: sumPos.y / nearest.length
            }
            var rawVelocity = boid.vectorTo(avgPos);
            cohesionVelocity = {
                direction: rawVelocity.direction,
                magnitude: rawVelocity.magnitude * COHESION
            }
        }
        
        
        // Cohesion Heading
        /* var dx = nearest.reduce(
            function(prev, next) { return prev + next.x; }
        , 0) / nearest.length - boid.x;
        var dy = nearest.reduce(
            function(prev, next) { return prev + next.y; }
        , 0) / nearest.length - boid.y;
        var dist = Math.sqrt(dx^2 + dy^2);
        
        var cohesionHeading = Math.acos(dx / dist); */
        
        // Alignment Heading
        /* var avgH = nearest.reduce(
            function(prev, next) { return prev + next.heading; }
        , null) / nearest.length;
        
        var alignmentHeading = avgH; */
        
        // Separation Heading
        // Filter the list of nearby boids to get only the ones 
        // close enough to require separation. Find their average 
        // position and set the separation heading to the 
        // opposite direction (add PI).
        /* colliders = nearest.filter(function(b) {
            return boid.closeTo(b, SEPARATION_DISTANCE);
        });
        
        var dx = colliders.reduce(
            function(prev, next) { return prev + next.x; }
        , 0) / colliders.length - boid.x;
        var dy = colliders.reduce(
            function(prev, next) { return prev + next.y; }
        , 0) / colliders.length - boid.y;
        var dist = Math.sqrt(dx^2 + dy^2);
        
        var separationHeading = Math.acos(dx / dist) + Math.PI; */
        
        // Avoidance Heading
        // If the boid is near a wall, move in the opposite 
        // direction.
        /* var avoidanceHeading = null;
        if (boid.x < VISIBLE_RANGE) {
            var avoidanceHeading = 0;
        } else if (boid.x > (this.width - VISIBLE_RANGE)) {
            var avoidanceHeading = Math.PI;
        } else {
            var xHeading = null;
        }
        
        if (boid.y < VISIBLE_RANGE) {
            var yHeading = 3 * Math.PI / 2;
        } else if (boid.y > (this.height - VISIBLE_RANGE)) {
            var yHeading = Math.PI / 2;
        } else {
            var yHeading = null;
        } */
        
        // Take the average direction and assign new coordinates 
        // to the boid.
        /* var heading = (cohesionHeading + alignmentHeading + separationHeading) / 3
        boid.nextX = boid.x + Math.cos(heading) * 5;
        boid.nextY = boid.y + Math.sin(heading) * 5;
        boid.nextHeading = heading; */
    }
    
    /*
        All boids have new coordinates. Update the current 
        positions.
    */
    for (i in this.boids) {
        var boid = this.boids[i];
        boid.x = boid.nextX;
        boid.y = boid.nextY;
        boid.heading = boid.nextHeading;
        boid.speed = boid.nextSpeed;
        
        
    }
}


function run(ctx) {
    var swarm = new Swarm(BOID_COUNT);
    swarm.draw(ctx);
    console.log(swarm);
    swarm.update();
    console.log(swarm);
    ctx.fillstyle = 'rgb(200, 50, 200)';
    swarm.draw(ctx);
}


