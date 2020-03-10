function loadNewData(messageArray) {
    fetch('/loadNewData', {
        method: 'POST',
        body: JSON.stringify(messageArray)
    }).then((response) => {
    return response;
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

// Define action on form submit
$(document).ready(function() {
    $('#initForm').submit(function(e) {
        // Prevent reloading the page after submit
		e.preventDefault();
        // Serialize form values
		var values = {};
        $.each($(this).serializeArray(), function(i, field) {
            if (field.name == "initDt") {
                let dt = moment.utc(field.value, 'DD.MM.YYYY HH:mm');
                values[field.name] = dt.format('YYYY-MM-DDTHH:mmZ');
            } 
			else { 
				values[field.name] = field.value; 
			}
        });       
        // Create message for loading data
		var message = {};
		message['dateLimit'] = values['initDt'];
		message['dir'] = 'left';
		// Call loadingNewData
		var response = loadNewData(message);
    });
});
