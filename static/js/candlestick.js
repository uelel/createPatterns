class candleStick {

    // Function that rounds float to given precision and returns rounded float
    roundFloat(number) { return parseFloat(number.toFixed(this.yPrec)); }

    // Function that replaces datetime strings in data array for moment objects 
    parseDates(data) {
        for (let i = 0; i <= data.length-1; i++) { data[i].Date = moment.utc(data[i].Date, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'); }
        return data;
    }

    // Function that returns middle date object from array of dates
    getAverDate(startInd, endInd) {
        var arraySlice = this.dtArray.slice(startInd, endInd);
        this.averDate = arraySlice[Math.floor(arraySlice.length / 2)];
    }

    // Function that returns formatted date for x axis title
    dateFormatter(dt) {
        var date = (dt.date() < 10 ? '0' : '') + dt.date();
        var month = ((dt.month()+1) < 10 ? '0' : '') + (dt.month()+1);
        var year = dt.year();
        return date + '.' + month + '.' + year;
    }

    // Function that creates array of x axis ticks
    createXTicks(startInd, stopInd) {
        // delete previous array content
        this.xTicksArray = [];
        
        // find first datetime with full hour
        var fullHourInd = startInd;
        for (let i = startInd; i < stopInd-1; i++) {
            if (this.dtArray[i].minute() === 0) { break; }
            fullHourInd += 1;
        }

        // create ticks left from full hour dt
        var noLabelCount = 1;
        for (let i = fullHourInd-1; i >= startInd; i--) {
            if (noLabelCount === this.xStep) { this.xTicksArray.push(this.dtArray[i]); noLabelCount = 1; }
            else { noLabelCount += 1; }
        }

        // create ticks right from full hour dt
        var noLabelCount = this.xStep;
        for (let i = fullHourInd; i < stopInd-1; i++) {
            if (noLabelCount === this.xStep) { this.xTicksArray.push(this.dtArray[i]); noLabelCount = 1; }
            else { noLabelCount += 1; }
        }
        
        // sort resulting array
        this.xTicksArray.sort((a, b) => a - b);
    }
    
    // Function that returns formatted x values based on provided x ticks
    xValuesFormatter(dt) { return dt.format('HH:mm'); }

    // Function that calculates limits of y axis so that its length is equal to yRange and data is centered
    getYLimits(dtArrayStart, dtArrayEnd) {
        var ohlcArray = [];
        for(let i = dtArrayStart; i < dtArrayEnd; i++){
            ohlcArray.push(parseFloat(this.pricesArray[i].Open), parseFloat(this.pricesArray[i].High), parseFloat(this.pricesArray[i].Low), parseFloat(this.pricesArray[i].Close));
        }
        var middlePrice = (d3.max(ohlcArray) - d3.min(ohlcArray))/2 + d3.min(ohlcArray);
        this.yLimitArray = [this.roundFloat(middlePrice - this.yRange/2), this.roundFloat(middlePrice + this.yRange/2)];
    }

    // Function that creates array with y ticks
    createYTicks() {
        var labelsArray = [];
        for (let i = this.yLimitArray[0]; i <= this.yLimitArray[1]; i += this.yStep) {
            labelsArray.push(this.roundFloat(i));
        }
        this.yTicksArray = labelsArray;
    }

    // Function that calculates how many candles are translated from d3.event.transform object
    // Positive value means right shift
    // Negative value means left shift
    calcNoCandlesTranslated(transform) {
        return Math.floor((this.noCandles/this.w) * transform.x);
    }

    // Function that renders weekend line when data from two weeks exist
    drawWeekendLine(startInd, stopInd) {

        // find start-of-week date if exists
        var weekStartDt = null;
        for (let i = startInd; i < stopInd-1; i++) {
            if (this.dtArray[i+1].date() - this.dtArray[i].date() > 1) { weekStartDt = this.dtArray[i+1]; break; }
        }
        
        // draw weekend line if weekStartDt exists, remove it otherwise
        d3.select("line.weekendLine").remove();
        if (weekStartDt) {
            this.chartBody.append("line").attr("class", "weekendLine")
                                         .attr("x1", this.xScale(weekStartDt) - this.xBand.bandwidth()/1.5)
                                         .attr("y1", 0)
                                         .attr("x2", this.xScale(weekStartDt) - this.xBand.bandwidth()/1.5)
                                         .attr("y2", this.h);
        }
    }

    // Function that checks whether it is necessary to load new data
    // Loads news data if necessary
    // Returns correct noCandlesTrans
    checkAvailData(noTransCandles) {
        
        return new Promise((resolve, reject) => {
        // check if it is necessary to load new data
        if (this.pricesArray.length-this.noCandles-noTransCandles < 0) {
            var dir = 'left';
            var message = createMessageForDataLoad(this.dtArray[0], dir);
            console.log('reached left limit of array');
        } else if (this.pricesArray.length-noTransCandles > this.pricesArray.length-1) {
            var dir = 'right';
            var message = createMessageForDataLoad(this.dtArray.slice(-1)[0], dir);
            console.log('reached right limit of array');
        } else { console.log('translation within array limits'); return resolve(noTransCandles); }
        console.log('continuing to serverRequest'); 
        // load new data if necessary
        serverRequest('loadNewData', message).then(() => {
                    serverRequest('getData', null).then((data) => {  
                        console.log(data);
                        if (dir === 'left') { 
                            noTransCandles += data.length;
                            data = this.parseDates(data);
                            this.pricesArray = data.concat(this.pricesArray);
                            this.dtArray = this.pricesArray.map(function(d){return d.Date;});
                        } else if (dir === 'right') {
                            data = this.parseDates(data);
                            this.pricesArray = this.pricesArray.concat(data);
                            this.dtArray = this.pricesArray.map(function(d){return d.Date;});
                        }
                        return resolve(noTransCandles);
                    });
                });
        });
    }

    // Function that loads prices from getData request and process data
    processData() {

        return serverRequest('getData', null).then((data) => {
            
            // Parse dates to moment objects
            data = this.parseDates(data);
            
            this.pricesArray = data;
            
            // get array of dates from data
            this.dtArray = this.pricesArray.map(function(d){return d.Date;});

            // calculate most common date for x axis title
            this.getAverDate(this.dtArray.length - this.noCandles, this.dtArray.length);
            
            // define linear x-axis scale for positioning of candles
            // inital scale displays noCandles of most recent candles
            this.xScale = d3.scalePoint().domain(this.dtArray.slice(this.dtArray.length-this.noCandles, this.dtArray.length)).range([0, this.w]);

            // define banded x-axis scale to account for padding between candles
            // band scale accounts for padding between candles; range consists of x positions of candles
            this.xBand = d3.scaleBand().domain(d3.range(this.dtArray.length-this.noCandles, this.dtArray.length)).range([0, this.w]).padding(0.3);
            
            // create array with x ticks
            this.createXTicks(this.dtArray.length-this.noCandles, this.dtArray.length);

            // get initial limits of y axis
            this.getYLimits(this.dtArray.length-this.noCandles, this.dtArray.length);
            
            // create array with y labels
            this.createYTicks();
            
            // define linear y-axis scale
            this.yScale = d3.scaleLinear().domain([this.yLimitArray[0], this.yLimitArray[1]]).range([this.h, 0]);
            
            // define x-axis, apply scale and tick formatting
            //this.xAxis = d3.axisBottom().scale(this.xScale).ticks(d3.timeMinute.every(this.xStep)).tickFormat(this.timeFormatter);
            this.xAxis = d3.axisBottom().scale(this.xScale).tickValues(this.xTicksArray).tickFormat(this.xValuesFormatter);

            // define y-axis, apply scale and define label values and precision
            this.yAxis = d3.axisLeft().scale(this.yScale).tickValues(this.yTicksArray).tickFormat(d3.format("."+this.yPrec+"f"));
            
            // Define x gridlines
            this.xGrid = d3.axisBottom().scale(this.xScale).tickValues(this.xTicksArray).tickFormat("").tickSize(this.h);
            
            // Define y gridlines
            this.yGrid = d3.axisLeft().scale(this.yScale).tickValues(this.yTicksArray).tickFormat("").tickSize(-this.w);
        
        });
    }

    // define what should be re-rendered during zoom event
    pan() {
        
        // calculate number of candles translated
        var noTransCandles = this.calcNoCandlesTranslated(d3.event.transform);

        // check if data is available for given translation
        this.checkAvailData(noTransCandles).then((noTransCandles) => {
            console.log(noTransCandles);
            // update x scale
            this.xScale = d3.scalePoint().domain(this.dtArray.slice(this.dtArray.length-this.noCandles-noTransCandles, this.dtArray.length-noTransCandles)).range([0, this.w]);

            // create new x ticks
            this.createXTicks(this.dtArray.length-this.noCandles-noTransCandles, this.dtArray.length-noTransCandles);

            // update x axis
            this.gX.call(this.xAxis.scale(this.xScale).tickValues(this.xTicksArray));

            // update x grid
            this.gGX.call(this.xGrid.scale(this.xScale).tickValues(this.xTicksArray));
            
            // get limits of y axis
            this.getYLimits(this.dtArray.length-this.noCandles-noTransCandles, this.dtArray.length-noTransCandles);

            // get value of y ticks
            this.createYTicks();

            // update yScale
            this.yScale = d3.scaleLinear().domain([this.yLimitArray[0], this.yLimitArray[1]]).range([this.h, 0]);

            // update yAxis
            this.gY.call(this.yAxis.scale(this.yScale).tickValues(this.yTicksArray));

            // update yGrid
            this.gGY.call(this.yGrid.scale(this.yScale).tickValues(this.yTicksArray));
            
            // calculate most common date
            this.getAverDate(this.dtArray.length-this.noCandles-noTransCandles, this.dtArray.length-noTransCandles);

            // update x title
            this.xTitle.text(this.dateFormatter(this.averDate));

            // update candle body
            this.candles.data(this.pricesArray.slice(this.dtArray.length-this.noCandles-noTransCandles, this.dtArray.length-noTransCandles))
                        .attr("class", d => (d.Open <= d.Close) ? "candleUp" : "candleDown")
                        .attr('x', d => this.xScale(d.Date) - this.xBand.bandwidth()/2)
                        .attr('y', d => this.yScale(Math.max(d.Open, d.Close)))
                        .attr('width', this.xBand.bandwidth())
                        .attr('height', d => (d.Open === d.Close) ? 1 : this.yScale(Math.min(d.Open, d.Close)) - this.yScale(Math.max(d.Open, d.Close)))
                        .attr("clip-path", "url(#clip)");

            // update candle stem
            this.stems.data(this.pricesArray.slice(this.dtArray.length-this.noCandles-noTransCandles, this.dtArray.length-noTransCandles))
                      .attr("class", d => (d.Open <= d.Close) ? "stemUp" : "stemDown")
                      .attr("x1", d => this.xScale(d.Date))
                      .attr("x2", d => this.xScale(d.Date))
                      .attr("y1", d => this.yScale(d.High))
                      .attr("y2", d => this.yScale(d.Low))
                      .attr("clip-path", "url(#clip)");

            // draw weekend line if necessary
            this.drawWeekendLine(this.dtArray.length-this.noCandles-noTransCandles, this.dtArray.length-noTransCandles);
        });
    }

    drawChart() {
    
        // create clip path that hides clipped elements outside of it
        this.svg.append("defs").append("clipPath").attr("id", "clip")
                               .append("rect").attr("width", this.w)
                                              .attr("height", this.h);

        // define chart dimensions
        this.focus = this.svg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        // Draw inner frame
        this.focus.append("rect").attr("id", "innerFrame")
                                 .attr("width", this.w)
                                 .attr("height", this.h)
                                 .style("pointer-events", "all")
                                 .attr("clip-path", "url(#clip)");
        
        // add clip-path to chart body
        this.chartBody = this.focus.append("g").attr("class", "chartBody")
                                               .style("pointer-events", "all")
                                               .attr("clip-path", "url(#clip)");
        
        // create zoom object
        // disable zooming (scale factor of one only)
        this.zoom = d3.zoom().scaleExtent([1, 1]);
        
        // call method that updates chart during zoom event
        //.on('start', xxx) // on mousedown
        this.zoom.on('zoom', () => { this.pan(); }); // on mousemove
        //.on('end', zoomEndFunction) // on mouseup
        
        // call zoom on entire svg element so that panning is possible from whole svg
        this.svg.call(this.zoom);
        
        // Draw x axis
        this.gX = this.focus.append("g").attr("class", "axis")
                                        .attr("transform", "translate(0," + this.h + ")")
                                        .call(this.xAxis);

        // Draw x axis title
        this.xTitle = this.focus.append("text").attr("transform", "translate(" + (this.w/2) + " ," + (this.h + this.margin.top + this.margin.bottom/2) + ")")
                                               .style("text-anchor", "middle")
                                               .text(this.dateFormatter(this.averDate));

        // Draw y-axis
        this.gY = this.focus.append("g").attr("class", "axis").call(this.yAxis);
        
        // Draw x gridlines
        this.gGX = this.focus.append("g").attr("class", "grid").call(this.xGrid);
        
        // Draw y gridlines
        this.gGY = this.focus.append("g").attr("class", "grid").call(this.yGrid);

        // draw candles in chart body
        // candles are rect elements
        this.candles = this.chartBody.selectAll(".candle")
            .data(this.pricesArray.slice(this.dtArray.length-this.noCandles, this.dtArray.length))
            .enter()
            .append("rect")
            .attr("class", d => (d.Open <= d.Close) ? "candleUp" : "candleDown")
             // xBand.bandwidth() returns width of each candle (each band) 
            .attr('x', d => this.xScale(d.Date) - this.xBand.bandwidth()/2)
            .attr('y', d => this.yScale(Math.max(d.Open, d.Close)))
            .attr('width', this.xBand.bandwidth())
             // yScale returns higher positions for lower prices
            .attr('height', d => (d.Open === d.Close) ? 1 : this.yScale(Math.min(d.Open, d.Close)) - this.yScale(Math.max(d.Open, d.Close)))
            .attr("clip-path", "url(#clip)");

        // draw high-low lines in chart body
        this.stems = this.chartBody.selectAll("g.line")
            .data(this.pricesArray.slice(this.dtArray.length-this.noCandles, this.dtArray.length))
            .enter()
            .append("line")
            .attr("class", d => (d.Open <= d.Close) ? "stemUp" : "stemDown")
            .attr("x1", d => this.xScale(d.Date))
            .attr("x2", d => this.xScale(d.Date))
            .attr("y1", d => this.yScale(d.High))
            .attr("y2", d => this.yScale(d.Low))
            .attr("clip-path", "url(#clip)");
        
        // draw weekend line if necessary
        this.drawWeekendLine(this.dtArray.length-this.noCandles, this.dtArray.length);

    }

    constructor(svg, pars) {
        
        // declare variables for data processing
        this.pricesArray = [];
        this.dtArray,
        this.averDate,
        this.xScale,
        this.xBand,
        this.xTicksArray = [],
        this.yLimitArray,
        this.yTicksArray,
        this.yScale,
        this.xAxis,
        this.xGrid,
        this.yAxis,
        this.yGrid;

        // declare variables for rendering
        this.focus,
        this.chartBody,
        this.zoom,
        this.gX,
        this.xTitle,
        this.gY,
        this.gGX,
        this.gGY,
        this.candles,
        this.stems,
        this.weekendLine;

        // create svg backbone
        this.svg = svg;

        this.width = width,
        this.height = height;

        // define margins
        this.margin = { top: 15, right: 30, bottom: 80, left: 80 },
	    this.w = this.width - this.margin.left - this.margin.right,
		this.h = this.height - this.margin.top - this.margin.bottom;
		
		// define number of candles displayed
		this.noCandles = parseFloat(pars['noCandles']);
		
		// define range of y axis
        this.yRange = parseFloat(pars['yRange']);

        // define number of minutes between x ticks
        this.xStep = parseFloat(pars['xStep']);
		
		// define step of y ticks
		this.yStep = parseFloat(pars['yStep']);
		
		// define number of decimal points of y labels
		this.yPrec = parseFloat(pars['yPrec']);
        
        // load up data and then draw chart
        this.processData().then(() => { this.drawChart(); });

    }

}

