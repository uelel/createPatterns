function drawChart(pricesArray) {

        // define margin bounds for focus & context regions
		var width = 1190,
			height = 820;
		
        var margin = { top: 15, right: 15, bottom: 80, left: 80 },
			w = width - margin.left - margin.right,
			h = height - margin.top - margin.bottom;
		
		//define number of candles displayed
		var noCandles = 160;
		
		// define range of y axis
        var yRange = 0.002;
		
		// define step of y ticks
		var yStep = 0.0001;
		
		// define number of decimal precision of y labels
		var yPrecision = 5;
        
		// Parse dates
		pricesArray = parseDates(pricesArray);

		// get array of dates from data
        var dtArray = pricesArray.map(function(d,i){return d.Date;});
		
		// calculate most common date
        var averDate = getAverDate(dtArray, dtArray.length - noCandles, dtArray.length);
		
        // define linear x-axis scale for positioning of candles
		// inital scale displays noCandles of most recent candles
		var xScale = d3.scaleLinear().domain([dtArray.length - noCandles, dtArray.length]).range([0, w]);

		// define banded x-axis scale to account for padding between candles
        // band scale accounts for padding between candles; range consists of x positions of candles
		let xBand = d3.scaleBand().domain(d3.range(dtArray.length - noCandles, dtArray.length)).range([0, w]).padding(0.3);
		
		// get initial limits of y axis
		var yLimitArray = getYLimits(pricesArray, xScale.domain()[0], xScale.domain()[1], yRange, yPrecision);
		console.log(yLimitArray);
		
		// create array with y labels
		var yLabelsArray = createYLabels(yLimitArray[0], yLimitArray[1], yStep, yPrecision);
		console.log(yLabelsArray);
		
		// define linear y-axis scale
		var yScale = d3.scaleLinear().domain([yLimitArray[0], yLimitArray[1]]).range([h, 0]);
		
        // define x-axis, apply scale and tick formatting
		var xAxis = d3.axisBottom().scale(xScale).tickFormat((d) => timeFormatter(d, dtArray));

		// define y-axis, apply scale and define label values and precision
		var yAxis = d3.axisLeft().scale(yScale).tickValues(yLabelsArray).tickFormat(d3.format(".5f"));
        
        // Define x gridlines
        var xGrid = d3.axisBottom().tickFormat("").tickSize(h).scale(xScale);
        
        // Define y gridlines
        var yGrid = d3.axisLeft().scale(yScale).tickValues(yLabelsArray).tickFormat("").tickSize(-w);
		
		// create zoom object
		// disable zooming (scale factor in one only)
		var zoom = d3.zoom().scaleExtent([1, 1]);
		
		// register callback on zoom event that redraw data
		// call method that updates chart during zoom event
		zoom.on('zoom', pan);
		
		// define what should be re-rendered during zoom event
		function pan() {
		// get translated x scale
		var xScaleTrans = d3.event.transform.rescaleX(xScale);
		// update x axis
		gX.call(xAxis.scale(xScaleTrans));	
		
		// update candle body
		candles.attr("class", d => (d.Open <= d.Close) ? "candleUp" : "candleDown")
			   .attr('x', (d, i) => xScaleTrans(i) - xBand.bandwidth())
			   .attr('y', d => yScale(Math.max(d.Open, d.Close)))
			   .attr('width', xBand.bandwidth())
			   .attr('height', d => (d.Open === d.Close) ? 1 : yScale(Math.min(d.Open, d.Close)) - yScale(Math.max(d.Open, d.Close)))
			   .attr("clip-path", "url(#clip)");

		// update candle stem
		stems.attr("class", d => (d.Open <= d.Close) ? "stemUp" : "stemDown")
			 .attr("x1", (d, i) => xScaleTrans(i) - xBand.bandwidth() / 2)
			 .attr("x2", (d, i) => xScaleTrans(i) - xBand.bandwidth() / 2)
			 .attr("y1", d => yScale(d.High))
			 .attr("y2", d => yScale(d.Low))
			 .attr("clip-path", "url(#clip)");
		}
        
		/* Draw chart*/
		
        // define svg dimensions
		var svg = d3.select("#container").attr("width", width)
					                     .attr("height", height);
										 
		// call zoom on entire svg element so that panning is possible from whole svg
		svg.call(zoom);

        // Draw outer frame
        svg.append("rect").attr("id", "outerFrame")
                          .attr("width", width)
                          .attr("height", height);
						  
		// create clip path that hides clipped elements outside of it
		svg.append("defs").append("clipPath").attr("id", "clip")
						  .append("rect").attr("width", w)
										 .attr("height", h);

		// define chart dimensions
		var focus = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// Draw inner frame
		focus.append("rect").attr("id", "innerFrame")
			                .attr("width", w)
			                .attr("height", h)
			                .style("pointer-events", "all")
			                .attr("clip-path", "url(#clip)");
		
		// Draw x axis
		var gX = focus.append("g").attr("class", "axis") //Assign "axis" class
					              .attr("transform", "translate(0," + h + ")")
					              .call(xAxis);

        // Draw x axis title
        focus.append("text").attr("transform", "translate(" + (w/2) + " ," + (h + margin.top + margin.bottom/2) + ")")
                          .style("text-anchor", "middle")
                          .text(dateFormatter(averDate));

		// adjust width of x labels
		//gX.selectAll(".tick text").call(wrap, xBand.bandwidth());
		
		// Draw y-axis
		var gY = focus.append("g").attr("class", "axis")
			                      .call(yAxis);
		
        // Draw x gridlines
        focus.append("g").attr("class", "grid").call(xGrid);
        
        // Draw y gridlines
        focus.append("g").attr("class", "grid").call(yGrid);

		// add clip-path to chart body
		var chartBody = focus.append("g").attr("class", "chartBody")
			                             .style("pointer-events", "all")
			                             .attr("clip-path", "url(#clip)");

		// draw candles in chart body
        // candles are rect elements
		var candles = chartBody.selectAll(".candle")
			.data(pricesArray)
			.enter()
			.append("rect")
			.attr("class", d => (d.Open <= d.Close) ? "candleUp" : "candleDown")
             // xBand.bandwidth() returns width of each candle (each band) 
			.attr('x', (d, i) => xScale(i) - xBand.bandwidth())
			.attr('y', d => yScale(Math.max(d.Open, d.Close)))
			.attr('width', xBand.bandwidth())
             // yScale returns higher positions for lower prices
			.attr('height', d => (d.Open === d.Close) ? 1 : yScale(Math.min(d.Open, d.Close)) - yScale(Math.max(d.Open, d.Close)))
			.attr("clip-path", "url(#clip)");

		// draw high-low lines in chart body
		var stems = chartBody.selectAll("g.line")
			.data(pricesArray)
			.enter()
			.append("line")
			.attr("class", d => (d.Open <= d.Close) ? "stemUp" : "stemDown")
			.attr("x1", (d, i) => xScale(i) - xBand.bandwidth() / 2)
			.attr("x2", (d, i) => xScale(i) - xBand.bandwidth() / 2)
			.attr("y1", d => yScale(d.High))
			.attr("y2", d => yScale(d.Low))
			.attr("clip-path", "url(#clip)");
    
}

// Function that rounds float to given precision and returns rounded float
function roundFloat(number, prec) { return parseFloat(number.toFixed(prec)); }

// Function that replaces Date strings in priceArray for Date objects 
function parseDates(pricesArray) {
	var dateFormat = d3.timeParse("%Y-%m-%d-%H:%M:%S%Z");
	for (var i = 0; i < pricesArray.length; i++) {
		pricesArray[i]['Date'] = dateFormat(pricesArray[i]['Date'])
	}
	return pricesArray;
}

// Function that returns middle date object from array of dates
function getAverDate(datesArray, startInd, endInd) {
	var arraySlice = datesArray.slice(startInd, endInd);
    return arraySlice[Math.floor(arraySlice.length / 2)];
    }

// Function that returns formatted labels of x axis
function timeFormatter(d, dtArray) {
    var dt = dtArray[d];
    if (dt !== undefined) {
		var hours = (dt.getUTCHours() < 10 ? '0' : '') + dt.getUTCHours();
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

// Function that calculates limits of y axis so that its length is equal to yRange and data is centered
function getYLimits(pricesArray, dtArrayStart, dtArrayEnd, yRange, yPrec) {
	var ohlcArray = [];
	for(let i = dtArrayStart; i < dtArrayEnd; i++){
		ohlcArray.push(parseFloat(pricesArray[i].Open), parseFloat(pricesArray[i].High), parseFloat(pricesArray[i].Low), parseFloat(pricesArray[i].Close));
	}
	var middlePrice = (d3.max(ohlcArray) - d3.min(ohlcArray))/2 + d3.min(ohlcArray);
	return [roundFloat(middlePrice - yRange/2, yPrec), roundFloat(middlePrice + yRange/2, yPrec)];
}

// function that creates array with y labels
function createYLabels(minValue, maxValue, step, prec) {
	var labelsArray = [];
	for (i = minValue; i <= maxValue; i += step) {
		labelsArray.push(roundFloat(i, prec));
	}
	return labelsArray;
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


d3.json("/static/data/data3.json").then(function(prices) { drawChart(prices); });
