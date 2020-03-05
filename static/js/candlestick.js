function drawChart(prices) {

        // define margin bounds for focus & context regions
		var width = 1190,
			height = 820;
		
        var margin = { top: 15, right: 15, bottom: 80, left: 80 },
			w = width - margin.left - margin.right,
			h = height - margin.top - margin.bottom;
		
        // define axes' ranges
        var xRange = 100,
            yRange = 500;
        
        // define dateFormat function
		var dateFormat = d3.timeParse("%Y-%m-%d-%H:%M:%S%Z");

		// Parse dates
		for (var i = 0; i < prices.length; i++) {
			prices[i]['Date'] = dateFormat(prices[i]['Date'])
		}

		// get array of dates from data
        var dtArray = prices.map(function(d,i){return d.Date;});
	    
        // calculate most common date
        var averDate = getAverDate(dtArray);

		// get min and max dates from data
        // getTime return number of milliseconds of date objects
		var xmin = d3.min(prices.map(row => row.Date.getTime()));
		var xmax = d3.max(prices.map(row => row.Date.getTime()));
        
		// Get min and max prices from data
		var ymin = d3.min(prices.map(row => row.Low));
		var ymax = d3.max(prices.map(row => row.High));
		
        // define linear x-axis scale for positioning of candles
		var xScale = d3.scaleLinear().domain([-1, dtArray.length]).range([0, w]);

		// define banded x-axis scale to account for padding between candles
        // band scale accounts for padding between candles; range consists of x positions of candles
		let xBand = d3.scaleBand().domain(d3.range(-1, dtArray.length)).range([0, w]).padding(0.3);

		// define linear y-axis scale
		var yScale = d3.scaleLinear().domain([ymin, ymax]).range([h, 0]).nice();
		
        // define x-axis, apply scale and tick formatting
		var xAxis = d3.axisBottom().scale(xScale).tickFormat((d) => timeFormatter(d, dtArray));

		// define y-axis, apply scale and define label precision
		var yAxis = d3.axisLeft().scale(yScale).tickFormat(d3.format(".5f"));
        
        // Define x gridlines
        var xGrid = d3.axisBottom().tickFormat("").tickSize(h).scale(xScale);
        
        // Define y gridlines
        var yGrid = d3.axisLeft().tickFormat("").tickSize(-w).scale(yScale);
        
        // define svg dimensions
		var svg = d3.select("#container").attr("width", width)
					                     .attr("height", height);

        // Draw outer frame
        svg.append("rect").attr("id", "outerFrame")
                          .attr("width", width)
                          .attr("height", height);

		// define chart dimensions
		var focus = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		
		// append clipPath to focus
		focus.append("defs").append("clipPath").attr("id", "clip")
                            .append("rect").attr("width", w)
			                               .attr("height", h);

		// Draw inner frame
		focus.append("rect").attr("id", "innerFrame")
			                .attr("width", w)
			                .attr("height", h)
			                .style("pointer-events", "all")
			                .attr("clip-path", "url(#clip)");
		
		// Add x-axis to chart
		var gX = focus.append("g").attr("class", "axis") //Assign "axis" class
					              .attr("transform", "translate(0," + h + ")")
					              .call(xAxis);

        // Draw x axis title
        focus.append("text").attr("transform", "translate(" + (w/2) + " ," + (h + margin.top + margin.bottom/2) + ")")
                          .style("text-anchor", "middle")
                          .text(dateFormatter(averDate));

		// adjust width of x labels
		//gX.selectAll(".tick text").call(wrap, xBand.bandwidth());
		
		// Render y-axis
		var gY = focus.append("g").attr("class", "axis")
			                      .call(yAxis);
		
        // Render x gridlines
        focus.append("g").attr("class", "grid").call(xGrid);
        
        // Render y gridlines
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
			.attr("class", d => (d.Open <= d.Close) ? "candleUp" : "candleDown")
             // xBand.bandwidth() returns width of each candle (each band) 
			.attr('x', (d, i) => xScale(i) - xBand.bandwidth())
			.attr('y', d => yScale(Math.max(d.Open, d.Close)))
			.attr('width', xBand.bandwidth())
             // yScale returns higher positions for lower prices
			.attr('height', d => (d.Open === d.Close) ? 1 : yScale(Math.min(d.Open, d.Close)) - yScale(Math.max(d.Open, d.Close)))

		// draw high-low lines in chart body
		let stems = chartBody.selectAll("g.line")
			.data(prices)
			.enter()
			.append("line")
			.attr("class", d => (d.Open <= d.Close) ? "stemUp" : "stemDown")
			.attr("x1", (d, i) => xScale(i) - xBand.bandwidth() / 2)
			.attr("x2", (d, i) => xScale(i) - xBand.bandwidth() / 2)
			.attr("y1", d => yScale(d.High))
			.attr("y2", d => yScale(d.Low))
			//.attr("stroke", d => (d.Open === d.Close) ? "white" : (d.Open > d.Close) ? "red" : "green");
    
}

// Function that returns most common date object from array of dates
/*
function getAverDate(dates) {
    var datesFreq = [];
    // calculate frequency of each date in dates array
    dates.forEach(function (dt, i) {
        var date = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
        if(datesFreq[date]) datesFreq[date]++; else datesFreq[date]=1;
    });
    // return date object with highest value in datesFreq dict
    return new Date(Object.keys(datesFreq).reduce((a, b) => datesFreq[a] > datesFreq[b] ? a : b));
    }
*/

// Function that returns middle date object from array of dates
function getAverDate(dates) {
    return dates[Math.floor(dates.length / 2)];
    }

// Function that returns formatted labels of x axis
function timeFormatter(d, dtArray) {
    var dt = dtArray[d];
    if (dt !== undefined) {
        var hours = dt.getUTCHours();
        var minutes = (dt.getUTCMinutes() < 10 ? '0' : '') + dt.getUTCMinutes();
        return hours + ':' + minutes;
    }
}

// Function that returns formatted date
function dateFormatter(dt) {
    var date = dt.getUTCDate();
    var month = (dt.getUTCMonth() < 10 ? '0' : '') + (dt.getUTCMonth()+1);
    var year = dt.getUTCFullYear();
    return date + '.' + month + '.' + year;
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


d3.json("/static/data/data2.json").then(function(prices) { drawChart(prices); })
