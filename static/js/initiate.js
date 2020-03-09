var width = 1190,
    height = 820;

var svg = d3.select("#container").attr("width", width)
                                 .attr("height", height);

svg.append("rect").attr("id", "outerFrame")
                  .attr("width", width)
                  .attr("height", height);
