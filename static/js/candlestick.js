class candleStick {

    // Function that rounds float to given precision and returns rounded float
    roundFloat(number) { return parseFloat(number.toFixed(this.yPrec)); }

    // Function that replaces Date strings in priceArray for Date objects 
    parseDates() {
        var dateFormat = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ");
        for (var i = 0; i < this.pricesArray.length; i++) {
            this.pricesArray[i]['Date'] = dateFormat(this.pricesArray[i]['Date'])
        }
    }

    // Function that returns middle date object from array of dates
    getAverDate(startInd, endInd) {
        var arraySlice = this.dtArray.slice(startInd, endInd);
        this.averDate = arraySlice[Math.floor(arraySlice.length / 2)];
    }

    // Function that formats UTC x axis labels
    timeFormatter(dt) { return moment(dt).tz('UTC').format('HH:mm'); }

    // Function that returns formatted date for x axis title
    dateFormatter(dt) {
        var date = (dt.getUTCDate() < 10 ? '0' : '') + dt.getUTCDate();
        var month = ((dt.getUTCMonth()+1) < 10 ? '0' : '') + (dt.getUTCMonth()+1);
        var year = dt.getUTCFullYear();
        return date + '.' + month + '.' + year;
    }

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

    // Function that loads prices from getData request and process data
    processData() {

        serverRequest('getData', null).then((data) => {
            
            this.pricesArray = data;
            console.log(this.pricesArray);

            // Parse dates
            this.parseDates();

            // get array of dates from data
            this.dtArray = this.pricesArray.map(function(d){return d.Date;});
            console.log(this.dtArray);
            
            // calculate most common date for x axis title
            this.getAverDate(this.dtArray.length - this.noCandles, this.dtArray.length);
            
            // define timeScale for relating between dates and their indices
            this.dateIndScale = d3.scaleTime().domain([this.dtArray[0], this.dtArray.slice(-1)[0]]).range([0, this.dtArray.length-1]);

            // define linear x-axis scale for positioning of candles
            // inital scale displays noCandles of most recent candles
            this.xScale = d3.scaleTime().domain([this.dateIndScale.invert(this.dtArray.length-this.noCandles), this.dtArray.slice(-1)[0]]).range([0, this.w]);

            // define banded x-axis scale to account for padding between candles
            // band scale accounts for padding between candles; range consists of x positions of candles
            this.xBand = d3.scaleBand().domain(d3.range(this.dtArray.length - this.noCandles, this.dtArray.length)).range([0, this.w]).padding(0.3);
            
            // get initial limits of y axis
            this.getYLimits(this.dtArray.length-this.noCandles, this.dtArray.length);
            
            // create array with y labels
            this.createYTicks();
            
            // define linear y-axis scale
            this.yScale = d3.scaleLinear().domain([this.yLimitArray[0], this.yLimitArray[1]]).range([this.h, 0]);
            
            // define x-axis, apply scale and tick formatting
            this.xAxis = d3.axisBottom().scale(this.xScale).ticks(d3.timeMinute.every(this.xStep)).tickFormat(this.timeFormatter);

            // define y-axis, apply scale and define label values and precision
            this.yAxis = d3.axisLeft().scale(this.yScale).tickValues(this.yTicksArray).tickFormat(d3.format("."+this.yPrec+"f"));
            
            // Define x gridlines
            this.xGrid = d3.axisBottom().scale(this.xScale).ticks(d3.timeMinute.every(this.xStep)).tickFormat("").tickSize(this.h);
            
            // Define y gridlines
            this.yGrid = d3.axisLeft().scale(this.yScale).tickValues(this.yTicksArray).tickFormat("").tickSize(-this.w);
        
        });
    }

    // define what should be re-rendered during zoom event
    pan() {
    
        // get translated x scale
        var xScaleTrans = d3.event.transform.rescaleX(this.xScale);
        //console.log(xScaleTrans.invert(w), dtArray.slice(-1)[0]);
        if (xScaleTrans.invert(this.w) > this.dtArray.slice(-1)[0]) { 
            console.log('Data is missing'); 
            // create loadNewData request
            // create getData request and get new prices array
        };

        // update x axis
        this.gX.call(this.xAxis.scale(xScaleTrans));

        // update x grid
        this.gGX.call(this.xGrid.scale(xScaleTrans));
        
        // get limits of y axis
        this.getYLimits(Math.floor(this.dateIndScale(xScaleTrans.domain()[0])), Math.floor(this.dateIndScale(xScaleTrans.domain()[1])));

        // get value of y ticks
        this.createYTicks();

        // update yScale
        var yScaleTrans = d3.scaleLinear().domain([this.yLimitArray[0], this.yLimitArray[1]]).range([this.h, 0]);

        // update yAxis
        this.gY.call(this.yAxis.scale(yScaleTrans).tickValues(this.yTicksArray));

        // update yGrid
        this.gGY.call(this.yGrid.scale(yScaleTrans).tickValues(this.yTicksArray));
        
        // calculate most common date
        this.getAverDate(Math.floor(this.dateIndScale(xScaleTrans.domain()[0])), Math.floor(this.dateIndScale(xScaleTrans.domain()[1])));

        // update x title
        this.xTitle.text(this.dateFormatter(this.averDate));

        // update candle body
        this.candles.attr("class", d => (d.Open <= d.Close) ? "candleUp" : "candleDown")
                    .attr('x', d => xScaleTrans(d.Date) - this.xBand.bandwidth())
                    .attr('y', d => yScaleTrans(Math.max(d.Open, d.Close)))
                    .attr('width', this.xBand.bandwidth())
                    .attr('height', d => (d.Open === d.Close) ? 1 : yScaleTrans(Math.min(d.Open, d.Close)) - yScaleTrans(Math.max(d.Open, d.Close)))
                    .attr("clip-path", "url(#clip)");

        // update candle stem
        this.stems.attr("class", d => (d.Open <= d.Close) ? "stemUp" : "stemDown")
                  .attr("x1", d => xScaleTrans(d.Date) - this.xBand.bandwidth() / 2)
                  .attr("x2", d => xScaleTrans(d.Date) - this.xBand.bandwidth() / 2)
                  .attr("y1", d => yScaleTrans(d.High))
                  .attr("y2", d => yScaleTrans(d.Low))
                  .attr("clip-path", "url(#clip)");
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
        this.zoom.on('zoom', this.pan);

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
            .data(this.pricesArray)
            .enter()
            .append("rect")
            .attr("class", d => (d.Open <= d.Close) ? "candleUp" : "candleDown")
             // xBand.bandwidth() returns width of each candle (each band) 
            .attr('x', d => this.xScale(d.Date) - this.xBand.bandwidth())
            .attr('y', d => this.yScale(Math.max(d.Open, d.Close)))
            .attr('width', this.xBand.bandwidth())
             // yScale returns higher positions for lower prices
            .attr('height', d => (d.Open === d.Close) ? 1 : this.yScale(Math.min(d.Open, d.Close)) - this.yScale(Math.max(d.Open, d.Close)))
            .attr("clip-path", "url(#clip)");

        // draw high-low lines in chart body
        this.stems = this.chartBody.selectAll("g.line")
            .data(this.pricesArray)
            .enter()
            .append("line")
            .attr("class", d => (d.Open <= d.Close) ? "stemUp" : "stemDown")
            .attr("x1", d => this.xScale(d.Date) - this.xBand.bandwidth() / 2)
            .attr("x2", d => this.xScale(d.Date) - this.xBand.bandwidth() / 2)
            .attr("y1", d => this.yScale(d.High))
            .attr("y2", d => this.yScale(d.Low))
            .attr("clip-path", "url(#clip)");

    }

    constructor(svg, pars) {
        
        // declare variables for data processing
        this.pricesArray = [];
        this.dtArray,
        this.averDate,
        this.dateIndScale,
        this.xScale,
        this.xBand,
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
        this.stems;

        // create svg backbone
        this.svg = svg;

        this.width = width,
        this.height = height;

        // define margins
        this.margin = { top: 15, right: 15, bottom: 80, left: 80 },
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
        
        // load up data
        this.processData();

        // draw chart
        this.drawChart();

    }

}

