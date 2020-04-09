// define margin bounds for focus & context regions
var width = 1190,
    height = 820;

// define svg dimensions
var svg = d3.select("#container").attr("width", width)
                                 .attr("height", height);

// Draw outer frame
svg.append("rect").attr("id", "outerFrame")
                  .attr("width", width)
                  .attr("height", height);

// Draw initial form
var initForm = createInitForm(svg);

// Define actions on form submit
$(document).ready(function() {
    $('#initForm').submit(function(e) {
        
        // Prevent reloading the page after submit
		e.preventDefault();
        
        // Serialize form values
		var pars = {};
        $.each($(this).serializeArray(), function(i, field) { pars[field.name] = field.value; });
        console.log(pars);        
        // Call initData request
        serverRequest('initData', 'create', pars).then(() => {
            // Create messages for loading data and call loadNewData request
            var messageLeft = createMessageForDataLoad(pars['initDt'], 'left');
            serverRequest('loadNewData', 'create', messageLeft).then((dataLeft) => {
                var messageRight = createMessageForDataLoad(pars['initDt'], 'right');
                serverRequest('loadNewData', 'create', messageRight).then((dataRight) => {
                    // remove initial form
                    initForm.remove();
                    // draw candlestick chart
                    chart = new Chart(svg, pars, width, height, dataLeft, dataRight);
                });
            });
        });
    });
});
