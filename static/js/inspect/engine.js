// define margin bounds for focus & context regions
var width = 1190,
    height = 820;

// define svg dimensions
var svg = d3.select("#container").attr("width", width)
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
        
        // Call initData request
        serverRequest('initData', 'inspect', pars).then(() => {
            serverRequest('loadPatterns', 'inspect', null).then((patterns) => {
                // remove initial form
                initForm.remove();
                // draw candlestick chart
                chart = new Chart(svg, pars, width, height, patterns);
            });
        });
    });
});
