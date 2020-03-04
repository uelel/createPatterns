var xscale = d3.scale.linear().domain([0, max]).range([0, max]),
    yscale = d3.scale.linear().domain([0, 100]).range([height, 0]);

var line = d3.svg.line().x(function(d) { return xscale(d[0]); })
						.y(function(d) { return yscale(d[1]); })
						.interpolate('basis');

svg.append('g').datum(points).append('path')
							 .attr('class', 'data')
							 .attr('d', line);

// create zoom object
// disable zooming (scale factor in only one)
var zoom = d3.behavior.zoom().scaleExtent([1, 1]);

// implement panning of x axis
zoom.x(xscale);

// register callback on zoom event
zoom.on('zoom', function() { svg.select('.data').attr('d', line); });
