$(function() {
    // Bind events
    $('#go-stop')
    .click(function() {
        RUNNING = ! RUNNING;
        if (RUNNING == true) {
            run('canvas');
            $(this).html('Stop');
        } else {
            $(this).html('Go');
        }
    });
    
    $('#number-boids')
    .val(BOID_COUNT)
    .change(function() {
        BOID_COUNT = $(this).val();
    });
    
    $('#separation')
    .val(SEPARATION)
    .change(function() {
        SEPARATION = $(this).val();
    });
    
    $('#separation-dist')
    .val(SEPARATION_DISTANCE)
    .change(function() {
        SEPARATION_DISTANCE = $(this).val();
    });
    
    $('#cohesion')
    .val(COHESION)
    .change(function() {
        COHESION = $(this).val();
    });
    
    $('#alignment')
    .val(ALIGNMENT)
    .change(function() {
        ALIGNMENT = $(this).val();
    });
    
    $('#avoidance')
    .val(AVOIDANCE)
    .change(function() {
        AVOIDANCE = $(this).val();
    });
    
    $('#visibility')
    .val(VISIBILITY)
    .change(function() {
        VISIBILITY = $(this).val();
    });
});
