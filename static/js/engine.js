function serverRequest(requestName, messageArray) {
    return fetch('/'+requestName, {headers: {'Content-Type': 'application/json'},
                                   method: 'POST',
                                   body: JSON.stringify(messageArray)})
          .then((response) => response.json())
          .then(function(data) {
                    console.log(typeof data, data);
                    return data;
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
		var pars = {};
        $.each($(this).serializeArray(), function(i, field) {
            if (field.name == "initDt") {
                let dt = moment.utc(field.value, 'DD.MM.YYYY HH:mm');
                pars[field.name] = dt.format('YYYY-MM-DDTHH:mm:SS[Z]');
            } 
			else { 
				pars[field.name] = field.value; 
			}
        });
        console.log(pars);
        
        // Call initData request
        serverRequest('initData', pars);

        // Create message for loading data
		var message = {};
		message['dtLimit'] = pars['initDt'];
		message['dir'] = 'left';
        console.log(message);
		
        // Call loadNewData request
		var promise = serverRequest('loadNewData', message);
        
        // After loadNewData finishes
        serverRequest('loadNewData', message).then(function(){
        // move initial form
        initForm.remove();
        // draw candlestick chart
        drawChart(pars);
        });
    });
});
