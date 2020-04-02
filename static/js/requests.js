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

function serverRequest(requestName, template, messageArray) {
    // create url
    var urlDict = {'initData': '/initData',
                   'loadNewData': '/loadNewData?'+'t='+template+'&'+$.param(messageArray),
                   'loadPatterns': '/loadPatterns?'+'t='+template,
                   'savePattern': '/savePattern',
                   'deletePattern': '/deletePattern',
                   'editPattern': '/editPattern'};
    // create request method
    var methodDict = {'initData': 'POST', 'loadNewData': 'GET', 'loadPatterns': 'GET', 'savePattern': 'POST', 'deletePattern': 'POST', 'editPattern': 'POST'};
    // create request body
    var requestBody = undefined;
    if (methodDict[requestName] === 'POST') { messageArray['t'] = template; requestBody = JSON.stringify(messageArray); }
    //
    return fetch(urlDict[requestName], {headers: {'Content-Type': 'application/json'},
                                        method: methodDict[requestName],
                                        body: requestBody})
        .then((response) => response.json())
        .then((data) => { return data } );
}
