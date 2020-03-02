function drawChart() {

	d3.csv("/static/data/ohlc.csv").then(function (prices) {

		// Define month names
		const months = { 0: 'Jan', 1: 'Feb', 2: 'Mar', 3: 'Apr', 4: 'May', 5: 'Jun', 6: 'Jul', 7: 'Aug', 8: 'Sep', 9: 'Oct', 10: 'Nov', 11: 'Dec' }

		// define dateFormat function
		var dateFormat = d3.timeParse("%Y-%m-%d");

		// Parse dates
		for (var i = 0; i < prices.length; i++) {
			prices[i]['Date'] = dateFormat(prices[i]['Date'])
		}

		// define margin bounds for focus & context regions
		const margin = { top: 15, right: 65, bottom: 235, left: 50 },
			margin2 = { top: 680, right: 65, bottom: 80, left: 50 },
			w = 1190 - margin.left - margin.right,
			h = 820 - margin.top - margin.bottom,
			h2 = 820 - margin2.top - margin2.bottom;

		// define svg dimensions
		var svg = d3.select("#container").attr("width", w + margin.left + margin.right)
					                     .attr("height", h + margin.top + margin.bottom);

		// define chart dimensions
		var focus = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// get array of dates from data
        let dates = prices.map(function(d,i){return d[0];});

		// get min and max dates from data
        // getTime return number of milliseconds of date objects
		var xmin = d3.min(prices.map(row => row.Date.getTime()));
		var xmax = d3.max(prices.map(row => row.Date.getTime()));

		// define linear x-axis scale for positioning of candles
		var xScale = d3.scaleLinear().domain([-1, dates.length]).range([0, w]);

		// define banded x-axis scale to account for padding between candles
        // band scale accounts for padding between candles; range consists of x positions of candles
		let xBand = d3.scaleBand().domain(d3.range(-1, dates.length)).range([0, w]).padding(0.3);

		// define x-axis, apply scale and tick formatting
		var xAxis = d3.axisBottom().scale(xScale).tickFormat((d) => dateFormatter(d));
		
		// append clipPath to focus
		focus.append("defs").append("clipPath").attr("id", "clip")
                            .append("rect").attr("width", w)
			                               .attr("height", h);

		// Draw chart frame
		focus.append("rect").attr("id", "chartFrame")
			                .attr("width", w)
			                .attr("height", h)
			                .style("pointer-events", "all")
			                .attr("clip-path", "url(#clip)");
		
		// Add x-axis to chart
		var gX = focus.append("g").attr("class", "axis x-axis") //Assign "axis" class
					              .attr("transform", "translate(0," + h + ")")
					              .call(xAxis);
		
		// adjust width of x labels
		gX.selectAll(".tick text").call(wrap, xBand.bandwidth());
		
		// Get min and max prices from data
		var ymin = d3.min(prices.map(row => row.Low));
		var ymax = d3.max(prices.map(row => row.High));

		// define linear y-axis scale
		var yScale = d3.scaleLinear().domain([ymin, ymax]).range([h, 0]).nice();

		// define y-axis and apply scale
		var yAxis = d3.axisLeft().scale(yScale);
		
		// Add y-axis to chart
		var gY = focus.append("g").attr("class", "axis y-axis")
			                      .call(yAxis);
		
        // Define x gridlines
        var xGrid = d3.axisBottom().tickFormat("").tickSize(h).scale(xScale);
        
        // Add x gridlines to chart
        focus.append("g").attr("class", "grid").call(xGrid);
        
        // Define y gridlines
        var yGrid = d3.axisLeft().tickFormat("").tickSize(-w).scale(yScale);
        
        // Add y gridlines to chart
        focus.append("g").attr("class", "grid").call(yGrid);

		// add clip-path to chart body
		var chartBody = focus.append("g").attr("class", "chartBody")
			                             .style("pointer-events", "all")
			                             .attr("clip-path", "url(#clip)");

		// draw candles in chart body
        // candles are rect elements
		let candles = chartBody.selectAll(".candle")
			.data(prices)
			.enter()
			.append("rect")
			.attr("class", "candle")
             // xBand.bandwidth() returns width of each candle (each band) 
			.attr('x', (d, i) => xScale(i) - xBand.bandwidth())
			.attr('y', d => yScale(Math.max(d.Open, d.Close)))
			.attr('width', xBand.bandwidth())
             // yScale returns higher positions for lower prices
			.attr('height', d => (d.Open === d.Close) ? 1 : yScale(Math.min(d.Open, d.Close)) - yScale(Math.max(d.Open, d.Close)))
			.attr("fill", d => (d.Open === d.Close) ? "silver" : (d.Open > d.Close) ? "red" : "green");

		// draw high-low lines in chart body
		let stems = chartBody.selectAll("g.line")
			.data(prices)
			.enter()
			.append("line")
			.attr("class", "stem")
			.attr("x1", (d, i) => xScale(i) - xBand.bandwidth() / 2)
			.attr("x2", (d, i) => xScale(i) - xBand.bandwidth() / 2)
			.attr("y1", d => yScale(d.High))
			.attr("y2", d => yScale(d.Low))
			.attr("stroke", d => (d.Open === d.Close) ? "white" : (d.Open > d.Close) ? "red" : "green");
        
        // Define format of x labels
		function dateFormatter(d) {
			var d = dates[d]
			if (d !== undefined) {
				var hours = d.getHours();
				var minutes = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
				var amPM = hours < 13 ? 'am' : 'pm';
				return hours + ':' + minutes + amPM + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
			}
		}

	});
}

// Adjust width of x labels
function wrap(text, width) {
	text.each(function () {
            // get label element
		var text = d3.select(this),
            // get text of label element
            // split text by spaces
            // reverse resulting array
			words = text.text().split(/\s+/).reverse(),
			word,
			line = [],
			lineNumber = 0,
			lineHeight = 1.1, // ems
			y = text.attr("y"),
			dy = parseFloat(text.attr("dy")),
			tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
		// loop over words array
        while (word = words.pop()) {
            // add word to array
			line.push(word);
			tspan.text(line.join(" "));
            // create tspan element with so many words that its width < limit
			if (tspan.node().getComputedTextLength() > width) {
				line.pop();
				tspan.text(line.join(" "));
				line = [word];
				tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber*lineHeight + dy + "em").text(word);
			}
		}
	});
}

drawChart();
