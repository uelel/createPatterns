function loadNewData(messageArray) {
    fetch('/loadNewData', {
        method: 'POST',
        body: JSON.stringify(messageArray)
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
        e.preventDefault();
        var values = {};
        $.each($(this).serializeArray(), function(i, field) {
            console.log(field);
            if (field.name == "initDt") {
                let dt = moment(field.value, 'DD.MM.YYYY HH:mm');
                dt.tz('UTC');
                values[field.name] = dt.format('YYYY-MM-DDTHH:mmZ');
                console.log(dt);
            } else { values[field.name] = field.value; }
        });       
        console.log(values);
    });
});
