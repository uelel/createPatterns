function serverRequest(requestName, messageArray) {
    fetch(requestName, {
        headers: {'Content-Type': 'application/json'},
        method: 'POST',
        body: JSON.stringify(messageArray)
    }).then((response) => {
    return response.json();
  })
  .then((data) => {
    console.log(data);
  });
}

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
		var values = {};
        $.each($(this).serializeArray(), function(i, field) {
            if (field.name == "initDt") {
                let dt = moment.utc(field.value, 'DD.MM.YYYY HH:mm');
                values[field.name] = dt.format('YYYY-MM-DDTHH:mm:SS[Z]');
            } 
			else { 
				values[field.name] = field.value; 
			}
        });       
        
        // Call dataInit request
        var response = serverRequest('\dataInit', values);

        // Create message for loading data
		var message = {};
		message['dtLimit'] = values['initDt'];
		message['dir'] = 'left';
        console.log(message);
		
        // Call loadNewData request
		var response = serverRequest('\loadNewData', message);
    });
});
