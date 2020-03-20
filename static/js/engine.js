function createMessageForDataLoad(dtLimit, dir) {
    var message = {};
    if (typeof dtLimit === "string") { 
        let dt = moment.utc(dtLimit, 'DD.MM.YYYY HH:mm');
        message['dtLimit'] = dt.format('YYYY-MM-DD[T]HH:mm:SS[Z]');
    } else if (moment.isMoment(dtLimit)) { message['dtLimit'] = dtLimit.format('YYYY-MM-DD[T]HH:mm:SS[Z]'); }
    message['dir'] = dir;
    return message;
}

function serverRequest(requestName, messageArray) {
    return fetch('/'+requestName, {headers: {'Content-Type': 'application/json'},
                                   method: 'POST',
                                   body: JSON.stringify(messageArray)})
        .then((response) => response.json())
        .then((data) => { return data } );
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
        $.each($(this).serializeArray(), function(i, field) { pars[field.name] = field.value; });
        
        // Call initData request
        serverRequest('initData', pars).then(() => {
            // Create message for loading data
            var message = createMessageForDataLoad(pars['initDt'], 'left');
            
            // Call loadNewData request
            serverRequest('loadNewData', message).then((data) => {
                // remove initial form
                initForm.remove();
                // draw candlestick chart
                chart = new candleStick(svg, pars, width, height, data);
            });
        });
    });
});
