function createMessageForDataLoad(dtLimit, dir) {
    var message = {};
    if (typeof dtLimit === "string") {
        let dt = moment.utc(dtLimit, 'DD.MM.YYYY HH:mm');
        if (dir === 'left') { dt.add(1, 'minutes'); }
        message['dtLimit'] = dt.format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
    } else if (moment.isMoment(dtLimit)) { message['dtLimit'] = dtLimit.format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'); }
    message['dir'] = dir;
    return message;
}

function createMessageForPatternSave(startDt, stopDt, dir) {
    var message = {};
    message['startDt'] = startDt.format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
    message['stopDt'] = stopDt.format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
    message['dir'] = dir
    return message;
}

function serverRequest(requestName, messageArray) {
    // create url
    var urlDict = {'initData': '/initData', 'loadNewData': '/loadNewData?'+$.param(messageArray), 'loadPatterns': '/loadPatterns', 'savePattern': '/savePattern'};
    // create request method
    var methodDict = {'initData': 'POST', 'loadNewData': 'GET', 'loadPatterns': 'GET', 'savePattern': 'POST'};
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
            var messageRight = createMessageForDataLoad(pars['initDt'], 'right');
            serverRequest('loadPatterns', messageRight).then((dataRight) => {
                // remove initial form
                initForm.remove();
                // draw candlestick chart
                chart = new candleStick(svg, pars, width, height, dataLeft, dataRight);
            });
        });
    });
});
