fetch('/loadNewData', {
    // Specify the method
    method: 'POST',
    // A JSON payload
    body: JSON.stringify({"dateLimit": "2019-01-19T08:50Z", "dir": "left"})
});