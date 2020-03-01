
data = [{date: 1578661200.0, open: 1.10978, high: 1.10985, low: 1.10965, close: 1.10984},
        {date: 1578661260.0, open: 1.10982, high: 1.10985, low: 1.10980, close: 1.10980},
        {date: 1578661320.0, open: 1.10981, high: 1.10988, low: 1.10979, close: 1.10983},
        {date: 1578661380.0, open: 1.10982, high: 1.10990, low: 1.10979, close: 1.10985},
        {date: 1578661440.0, open: 1.10984, high: 1.10987, low: 1.10967, close: 1.10967},
        {date: 1578661500.0, open: 1.10966, high: 1.10978, low: 1.10966, close: 1.10974},
        {date: 1578661560.0, open: 1.10975, high: 1.10981, low: 1.10969, close: 1.10969},
        {date: 1578661620.0, open: 1.10967, high: 1.10980, low: 1.10967, close: 1.10978}]


sl.series.ohlc = function () {

    var xScale = d3.time.scale(),
        yScale = d3.scale.linear();

    var ohlc = function (selection) {
        selection.each(function (data) {
            // bind data to ohlc selection
            // d3.select(this) returns current selection
            series = d3.select(this).selectAll('.ohlc-series').data([data]);
        		// create g element for candle
            series.enter().append('g').classed('ohlc-series', true);
        		// select all bars and bind them with data
            bars = series.selectAll('.bar')
            						 .data(data, function (d) {return d.date;});
						// create g elements for dates
						bars.enter().append('g').classed('bar', true);
						// put up/down attribute to candles
						bars.classed({
    					'up-day': function(d) {return d.close > d.open;},
    					'down-day': function (d) {return d.close <= d.open;}
    				});
						// remove old elements ??
						bars.exit().remove();
        });
        
        var line = d3.svg.line()
            .x(function (d) { return d.x; })
            .y(function (d) { return d.y; });
    };

    ohlc.xScale = function (value) {
        // if called without argument, return internal xScale object
        if (!arguments.length) {
            return xScale;
        }
        // if called with argument, set xScale to it and return ohlc function
        xScale = value;
        return ohlc;
    };

    ohlc.yScale = function (value) {
        // Similar to xScale above.
    };

    return ohlc;
};

// Create series and bind x and y scales
var series = sl.series.ohlc()
               .xScale(xScale)
               .yScale(yScale);

// Bind data to a selection and call the series.
d3.select('.series')
  // bind data to series element
  .datum(data)
  // call series to series element with data
  .call(series);

// function to create/update candle's high-low lines
var highLowLines = function (bars) {

		// bind data to high-low lines elements
    var paths = bars.selectAll('.high-low-line')
        						.data(function (d) {return [d];});

		// create svg path vectors according to data
    paths.enter().append('path');

    // specify vector coordinates from scales
    paths.classed('high-low-line', true)
         .attr('d', function (d) {
						return line([{ x: xScale(d.date), y: yScale(d.high) },
                				 { x: xScale(d.date), y: yScale(d.low) }]); });
    };
 
// function to create/update candle's rectangles
var rectangles = function (bars) {
    var rectangleWidth = 5;

		// join data with all rect elements
    var rect = bars.selectAll('rect').data(function (d) {return [d];});

		// create rect elements according to data
    rect.enter().append('rect');

				 // set x positions
    rect.attr('x', function (d) {return xScale(d.date) - rectangleWidth;})
         // set y positions according to candle directions
        .attr('y', function (d) {return isUpDay(d) ? yScale(d.close) : yScale(d.open);})
        // set rect widths
        .attr('width', rectangleWidth * 2)
        // set rect height according to close-open prices
        .attr('height', function (d) {return isUpDay(d)
                							 						 ? yScale(d.open) - yScale(d.close)
                													 : yScale(d.close) - yScale(d.open);} );
};

// set width, height, margins
var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 660 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// set scales
var xScale = d3.time.scale(),
    yScale = d3.scale.linear();

// set x axis
var xAxis = d3.svg.axis()
    							.scale(xScale)
    							.orient('bottom')
    							.ticks(5);

// set y axis
var yAxis = d3.svg.axis()
    							.scale(yScale)
    							.orient('left');

// set series instance
var series = sl.series.ohlc().xScale(xScale)
    												 .yScale(yScale);

// Create svg element
var svg = d3.select('#chart').classed('chart', true).append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

// Create g element
var g = svg.append('g')
    			 .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// Make sure only chart inside rect with given dimensions will be shown
// by clipping g element
var plotArea = g.append('g');
plotArea.append('clipPath')
    		.attr('id', 'plotAreaClip')
    		.append('rect')
    		.attr({ width: width, height: height });
plotArea.attr('clip-path', 'url(#plotAreaClip)');

// Set scale domains
var maxDate = d3.max(data, function (d) {return d.date;});

// Set domain of xScale
// There are 8.64e7 milliseconds in a day
xScale.domain([new Date(maxDate.getTime() - (8.64e7 * 31.5)),
    					 new Date(maxDate.getTime() + 8.64e7)]);

// Set domain of yScale
yScale.domain([d3.min(data, function (d) {return d.low;}),
        			 d3.max(data, function (d) {return d.high;})]).nice();

// Set scale ranges
xScale.range([0, width]);
yScale.range([height, 0]);

// Draw x axis
g.append('g').attr('class', 'x axis')
    				 .attr('transform', 'translate(0,' + height + ')')
    				 .call(xAxis);

// Draw y axis
g.append('g').attr('class', 'y axis')
    				 .call(yAxis);

// Draw the series
plotArea.append('g').attr('class', 'series').datum(data).call(series);
