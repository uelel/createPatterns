// http://computationallyendowed.com/blog/2013/01/21/bounded-panning-in-d3.html

function myChart() {
  
	var random = d3.randomUniform(0,10);
	var data = d3.range(0, 928, 8).map(function(e) {return [e, (e / 1000.0) * 30 + 100 * random()];});
	var xmin = d3.min(data[0]),
	    xmax = d3.max(data[0]),
		ymin = d3.min(data[1]),
		ymax = d3.max(data[1]);
	 
	var width = 700,
        height = 400;
	var margin = {top: 50, right: 50, bottom: 50, left: 50};
	var w = width - margin.left - margin.right,
		h = height - margin.top - margin.bottom;

	var svg = d3.select("body").append("svg")
                  .attr("width", width)
				  .attr("height", height);
                
	svg.append("defs")
       .append("clipPath").attr("id", "clip")
	   .append("rect").attr("width", width)
			          .attr("height", height);

    var chart = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                   .attr("clip-path", "url(#clip)");
    
    var xscale = d3.scaleLinear().domain([xmin, xmax]).range([0, w]),
		yscale = d3.scaleLinear().domain([ymin, ymax]).range([h, 0]);
	  
	var xaxis = d3.axisBottom(xscale);
	var xg = chart.append("g").attr("class", "axis")
							.attr("transform", "translate(0," + h + ")")
							.attr('clip-path', 'url(#clip)')
							.call(xaxis);

	var yaxis = d3.axisLeft(yscale);
	var yg = chart.append("g").attr("class", "axis")
					          .call(yaxis);

	var line = d3.line().x(function(d) { return xscale(d[0]); })
						.y(function(d) { return yscale(d[1]); })
						.curve(d3.curveMonotoneX);

	chart.append('path').datum(data)
						.attr('class', 'line')
						.attr('d', line)
						.attr('clip-path', 'url(#clip)');

	// create zoom object
	// disable zooming (scale factor in one only)
	var zoom = d3.zoom().scaleExtent([1, 1]);

	function pan() {
		// get translated x scale
        var xscale_trans = d3.event.transform.rescaleX(xscale);
		// update x axis
        xg.call(xaxis.scale(xscale_trans));
        // update line
        line.x(function(d) { return xscale_trans(d[0]); });
        // render line
        chart.selectAll("path.line").datum(data).attr('d', line);
	}

	// register callback on zoom event that redraw data
	// call method that updates whole chart
	zoom.on('zoom', pan);
	  
	// 
	chart.call(zoom);

}

myChart();
