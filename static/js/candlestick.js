function drawChart(pars) {
		
        var margin = { top: 15, right: 15, bottom: 80, left: 80 },
			w = width - margin.left - margin.right,
			h = height - margin.top - margin.bottom;
		
		//define number of candles displayed
		var noCandles = parseFloat(pars['noCandles']);
		
		// define range of y axis
        var yRange = parseFloat(pars['yRange']);

        // define number of minutes between x ticks
        var xStep = parseFloat(pars['xStep']);
		
		// define step of y ticks
		var yStep = parseFloat(pars['yStep']);
		
		// define number of decimal points of y labels
		var yPrecision = parseFloat(pars['yPrec']);
        
        serverRequest('getData', null).then(function(pricesArray) {
           
            // Parse dates
            pricesArray = parseDates(pricesArray);

            // get array of dates from data
            var dtArray = pricesArray.map(function(d){return d.Date;});
            
            // calculate most common date for x axis title
            var averDate = getAverDate(dtArray, dtArray.length - noCandles, dtArray.length);
            
            // define timeScale for relating between dates and their indices
            var dateIndScale = d3.scaleTime().domain([dtArray[0], dtArray.slice(-1)[0]]).range([0, dtArray.length-1]);

            // define linear x-axis scale for positioning of candles
            // inital scale displays noCandles of most recent candles
            var xScale = d3.scaleTime().domain([dateIndScale.invert(dtArray.length-noCandles), dtArray.slice(-1)[0]]).range([0, w]);

            // define banded x-axis scale to account for padding between candles
            // band scale accounts for padding between candles; range consists of x positions of candles
            var xBand = d3.scaleBand().domain(d3.range(dtArray.length - noCandles, dtArray.length)).range([0, w]).padding(0.3);
            
            // get initial limits of y axis
            var yLimitArray = getYLimits(pricesArray, dtArray.length-noCandles, dtArray.length, yRange, yPrecision);
            
            // create array with y labels
            var yTicksArray = createYTicks(yLimitArray[0], yLimitArray[1], yStep, yPrecision);
            
            // define linear y-axis scale
            var yScale = d3.scaleLinear().domain([yLimitArray[0], yLimitArray[1]]).range([h, 0]);
            
            // define x-axis, apply scale and tick formatting
            var xAxis = d3.axisBottom().scale(xScale).ticks(d3.timeMinute.every(xStep)).tickFormat(timeFormatter);

            // define y-axis, apply scale and define label values and precision
            var yAxis = d3.axisLeft().scale(yScale).tickValues(yTicksArray).tickFormat(d3.format("."+yPrecision+"f"));
            
            // Define x gridlines
            var xGrid = d3.axisBottom().scale(xScale).ticks(d3.timeMinute.every(xStep)).tickFormat("").tickSize(h);
            
            // Define y gridlines
            var yGrid = d3.axisLeft().scale(yScale).tickValues(yTicksArray).tickFormat("").tickSize(-w);
            
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
                //console.log(xScaleTrans.invert(w), dtArray.slice(-1)[0]);
                if (xScaleTrans.invert(w) > dtArray.slice(-1)[0]) { console.log('Data is missing'); }

                // update x axis
                gX.call(xAxis.scale(xScaleTrans));

                // update x grid
                gGX.call(xGrid.scale(xScaleTrans));
                
                // get limits of y axis
                var yLimitArray = getYLimits(pricesArray, Math.floor(dateIndScale(xScaleTrans.domain()[0])), Math.floor(dateIndScale(xScaleTrans.domain()[1])), yRange, yPrecision);

                // get value of y ticks
                var yTicksArray = createYTicks(yLimitArray[0], yLimitArray[1], yStep, yPrecision);

                // update yScale
                var yScaleTrans = d3.scaleLinear().domain([yLimitArray[0], yLimitArray[1]]).range([h, 0]);

                // update yAxis
                gY.call(yAxis.scale(yScaleTrans).tickValues(yTicksArray));

                // update yGrid
                gGY.call(yGrid.scale(yScaleTrans).tickValues(yTicksArray));
                
                // calculate most common date
                var averDate = getAverDate(dtArray, Math.floor(dateIndScale(xScaleTrans.domain()[0])), Math.floor(dateIndScale(xScaleTrans.domain()[1])));

                // update x title
                xTitle.text(dateFormatter(averDate));

                // update candle body
                candles.attr("class", d => (d.Open <= d.Close) ? "candleUp" : "candleDown")
                       .attr('x', d => xScaleTrans(d.Date) - xBand.bandwidth())
                       .attr('y', d => yScaleTrans(Math.max(d.Open, d.Close)))
                       .attr('width', xBand.bandwidth())
                       .attr('height', d => (d.Open === d.Close) ? 1 : yScaleTrans(Math.min(d.Open, d.Close)) - yScaleTrans(Math.max(d.Open, d.Close)))
                       .attr("clip-path", "url(#clip)");

                // update candle stem
                stems.attr("class", d => (d.Open <= d.Close) ? "stemUp" : "stemDown")
                     .attr("x1", d => xScaleTrans(d.Date) - xBand.bandwidth() / 2)
                     .attr("x2", d => xScaleTrans(d.Date) - xBand.bandwidth() / 2)
                     .attr("y1", d => yScaleTrans(d.High))
                     .attr("y2", d => yScaleTrans(d.Low))
                     .attr("clip-path", "url(#clip)");
            }
            
            /* Draw chart*/
                                             
            // call zoom on entire svg element so that panning is possible from whole svg
            svg.call(zoom);
                              
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
            var gX = focus.append("g").attr("class", "axis") // Assign "axis" class
                                      .attr("transform", "translate(0," + h + ")")
                                      .call(xAxis);

            // Draw x axis title
            var xTitle = focus.append("text").attr("transform", "translate(" + (w/2) + " ," + (h + margin.top + margin.bottom/2) + ")")
                              .style("text-anchor", "middle")
                              .text(dateFormatter(averDate));

            // Draw y-axis
            var gY = focus.append("g").attr("class", "axis").call(yAxis);
            
            // Draw x gridlines
            var gGX = focus.append("g").attr("class", "grid").call(xGrid);
            
            // Draw y gridlines
            var gGY = focus.append("g").attr("class", "grid").call(yGrid);

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
                .attr('x', d => xScale(d.Date) - xBand.bandwidth())
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
                .attr("x1", d => xScale(d.Date) - xBand.bandwidth() / 2)
                .attr("x2", d => xScale(d.Date) - xBand.bandwidth() / 2)
                .attr("y1", d => yScale(d.High))
                .attr("y2", d => yScale(d.Low))
                .attr("clip-path", "url(#clip)");
    
        });
}

// Function that rounds float to given precision and returns rounded float
function roundFloat(number, prec) { return parseFloat(number.toFixed(prec)); }

// Function that replaces Date strings in priceArray for Date objects 
function parseDates(pricesArray) {
	var dateFormat = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ");
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

// Function that convert x labels to UTC timezone
function timeFormatter(dt) { return moment(dt).tz('UTC').format('HH:mm'); }

// Function that returns formatted date for x axis title
function dateFormatter(dt) {
    var date = (dt.getUTCDate() < 10 ? '0' : '') + dt.getUTCDate();
    var month = ((dt.getUTCMonth()+1) < 10 ? '0' : '') + (dt.getUTCMonth()+1);
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

// Function that creates array with y ticks
function createYTicks(minValue, maxValue, step, prec) {
	var labelsArray = [];
	for (i = minValue; i <= maxValue; i += step) {
		labelsArray.push(roundFloat(i, prec));
	}
	return labelsArray;
}
