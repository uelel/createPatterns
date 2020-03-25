function createMessageForDataLoad(dtLimit, dir) {
    var message = {};
    if (typeof dtLimit === "string") {
        let dt = moment.utc(dtLimit, 'DD.MM.YYYY HH:mm');
        if (dir === 'left') { dt.add(1, 'minutes'); }
        message['dtLimit'] = dt.format('YYYY-MM-DD[T]HH:mm:SS[Z]');
    } else if (moment.isMoment(dtLimit)) { message['dtLimit'] = dtLimit.format('YYYY-MM-DD[T]HH:mm:SS[Z]'); }
    message['dir'] = dir;
    return message;
}

function serverRequest(requestName, messageArray) {
    // create url
    var urlDict = {'initData': '/initData', 'loadNewData': '/loadNewData?'+$.param(messageArray), 'loadPatterns': '/loadPatterns'};
    // create request method
    var methodDict = {'initData': 'POST', 'loadNewData': 'GET', 'loadPatterns': 'GET'};
    // create request body
    var requestBody = undefined;
    if (methodDict[requestName] === 'POST') { requestBody = JSON.stringify(messageArray); }
    //
    return fetch(urlDict[requestName], {headers: {'Content-Type': 'application/json'},
                                        method: methodDict[requestName],
                                        body: requestBody})
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
        console.log(pars);        
        // Call initData request
        serverRequest('initData', pars).then(() => {
            // Create messages for loading data and call loadNewData request
            var messageLeft = createMessageForDataLoad(pars['initDt'], 'left');
            serverRequest('loadNewData', messageLeft).then((dataLeft) => {
                var messageRight = createMessageForDataLoad(pars['initDt'], 'right');
                serverRequest('loadNewData', messageRight).then((dataRight) => {
                    // remove initial form
                    initForm.remove();
                    // draw candlestick chart
                    chart = new candleStick(svg, pars, width, height, dataLeft, dataRight);
                });
            });
        });
    });
});
