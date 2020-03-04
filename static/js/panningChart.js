function chart() {

  var width = 700, // default width
      height = 400; // default height
  
  // generate chart here, using `width` and `height`
  d3.json("/static/data/dataExample.json").then(function(data) {

  var svg = d3.select("#container").attr("width", width)
                                     .attr("height", height);

  var xscale = d3.scaleLinear().domain([0, 100]).range([0, width]),
      yscale = d3.scaleLinear().domain([0, 1000]).range([height, 0]);
  
  var xAxis = d3.axisBottom().scale(xscale);
  var xG = svg.append("g").attr("class", "axis")
                 .attr("transform", "translate(0," + height + ")")
                 .call(xAxis);

  var yAxis = d3.axisLeft().scale(yscale);
  var yG = svg.append("g").attr("class", "axis")
                   .call(yAxis);

  var line = d3.svg.line().x(function(d) { return xscale(d[0]); })
                          .y(function(d) { return yscale(d[1]); })
                          .interpolate('basis');

  svg.append('g').datum(data).append('path')
                             .attr('class', 'data')
                             .attr('d', line);

  // create zoom object
  // disable zooming (scale factor in one only)
  var zoom = d3.zoom().scaleExtent([1, 1]);

  // register callback on zoom event that redraw data
  // call method that updates whole chart
  zoom.on('zoom', pan);
  
  function pan() {
    a = d3.event.transform.rescaleX(xscale);
    xG.call(xAxis.scale(xscale));
  }
  
  // 
  svg.call(zoom);
    
    });

  return render;
}

myChart = chart();
myChart();
