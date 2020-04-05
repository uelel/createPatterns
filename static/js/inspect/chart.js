class Chart {

    // Function that rounds float to given precision and returns rounded float
    roundFloat(number) { return parseFloat(number.toFixed(this.yPrec)); }

    // Function that replaces datetime strings in data array for moment objects 
    parseDates(data) {
        if (data.length && 'Date' in data[0]) {
            for (let i = 0; i <= data.length-1; i++) { data[i].Date = moment.utc(data[i].Date, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'); }
            return data;
        } else if (data.length && 'startDt' in data[0]) {
            for (let i = 0; i <= data.length-1; i++) { data[i].startDt = moment.utc(data[i].startDt, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
                                                       data[i].stopDt = moment.utc(data[i].stopDt, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'); }
            return data;
        } else { return data; }
    }
    
    // Function that creates dt array from data
    createDtArray() {
        this.dtArray = this.priceArray.map(function(d){return d.Date;});
    }

    // Function that returns middle date object from array of dates
    getAverDate() {
        this.averDate = this.dtArray[Math.floor(this.dtArray.length / 2)];
    }

    // Function that returns formatted date for x axis title
    dateFormatter(dt) {
        var date = (dt.date() < 10 ? '0' : '') + dt.date();
        var month = ((dt.month()+1) < 10 ? '0' : '') + (dt.month()+1);
        var year = dt.year();
        return date + '.' + month + '.' + year;
    }

    // Function that creates array of x axis ticks
    createXTicks() {
        // delete previous array content
        this.xTicksArray = [];
        
        // find first datetime with full hour
        var fullHourInd = 0;
        for (let i = 0; i < this.dtArray.length; i++) {
            if (this.dtArray[i].minute() === 0) { break; }
            fullHourInd += 1;
        }

        // create ticks left from full hour dt
        var noLabelCount = 1;
        for (let i = fullHourInd-1; i >= 0; i--) {
            if (noLabelCount === this.xStep) { this.xTicksArray.push(this.dtArray[i]); noLabelCount = 1; }
            else { noLabelCount += 1; }
        }

        // create ticks right from full hour dt
        var noLabelCount = this.xStep;
        for (let i = fullHourInd; i < this.dtArray.length; i++) {
            if (noLabelCount === this.xStep) { this.xTicksArray.push(this.dtArray[i]); noLabelCount = 1; }
            else { noLabelCount += 1; }
        }
        
        // sort resulting array
        this.xTicksArray.sort((a, b) => a - b);
    }
    
    // Function that returns formatted x values based on provided x ticks
    xValuesFormatter(dt) { return dt.format('HH:mm'); }

    // Function that calculates limits of y axis so that its length is equal to yRange and data is centered
    getYLimits() {
        var ohlcArray = [];
        for(let i = 0; i < this.dtArray.length; i++){
            ohlcArray.push(parseFloat(this.priceArray[i].Open), parseFloat(this.priceArray[i].High), parseFloat(this.priceArray[i].Low), parseFloat(this.priceArray[i].Close));
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

    

    // Function that returns  price array with removed missing candles
    filterPriceArray(startInd, stopInd) {
        return this.priceArray.filter((row) => { return row.Open != null;});
    }


    // Function that calculates pointed candle from d3.mouse coordinates and returns candle index in dtArray
    calculatePointedCandle(coord) {
        return Math.floor((coord[0] - this.xScale.step()*this.xScale.padding()/2)/this.xScale.step());
    }

    // Function that returns middle dt object of pattern with given pointer
    getPatternMiddleDt() {
        var startDt = this.patternArray[this.patternPointer]['startDt'];
        var stopDt = this.patternArray[this.patternPointer]['stopDt'];
        var noMinutes = Math.floor(stopDt.diff(startDt, 'minutes')/2);
        return startDt.clone().add(noMinutes, 'minutes');
    }

    // Function that calculates datetime for loading new data based on pattern with given pointer
    getDtForDataLoad() {
        return this.getPatternMiddleDt().add(Math.floor(this.noCandles/2), 'minutes');
    }

    // Function that returns chart title based on given pointer
    createChartTitle() {
        return (this.patternPointer+1) + "/" + this.patternArray.length;
    }

    drawPattern() {

        // calculate datetime for request
        var dt = this.getDtForDataLoad();
        // load data for given pattern
        serverRequest('loadNewData', 'inspect', createMessageForDataLoad(dt, 'left')).then((data) => {
            data = this.parseDates(data);
            this.priceArray = data;
            this.createDtArray();
            
            this.getAverDate();
            this.xScale.domain(this.dtArray);
            this.createXTicks();
            this.getYLimits();
            this.createYTicks();
            this.yScale.domain([this.yLimitArray[0], this.yLimitArray[1]]);
            this.xAxis.scale(this.xScale).tickValues(this.xTicksArray);
            this.yAxis.scale(this.yScale).tickValues(this.yTicksArray);
            this.xGrid.scale(this.xScale).tickValues(this.xTicksArray);
            this.yGrid.scale(this.yScale).tickValues(this.yTicksArray);

            this.xAxisCon.call(this.xAxis);
            this.yAxisCon.call(this.yAxis);
            this.xGridCon.call(this.xGrid);
            this.yGridCon.call(this.yGrid);
            this.xTitle.text(this.dateFormatter(this.averDate));

            d3.select("#candles").selectAll("rect").remove();
            this.candles.selectAll("rect")
                .data(this.filterPriceArray())
                .enter().append("rect").attr("class", d => (d.Open <= d.Close) ? "candleUp" : "candleDown")
                                       .attr('x', d => this.xScale(d.Date))
                                       .attr('y', d => this.yScale(Math.max(d.Open, d.Close)))
                                       .attr('width', this.xScale.bandwidth())
                                       .attr('height', d => (d.Open === d.Close) ? 1 : this.yScale(Math.min(d.Open, d.Close)) - this.yScale(Math.max(d.Open, d.Close)))
                                       .attr("clip-path", "url(#clip)");

            d3.select("#stems").selectAll("line").remove();
            this.stems.selectAll("line").data(this.filterPriceArray())
                      .enter().append("line").attr("class", d => (d.Open <= d.Close) ? "stemUp" : "stemDown")
                                             .attr("x1", d => this.xScale(d.Date) + this.xScale.bandwidth()/2)
                                             .attr("x2", d => this.xScale(d.Date) + this.xScale.bandwidth()/2)
                                             .attr("y1", d => this.yScale(d.High))
                                             .attr("y2", d => this.yScale(d.Low))
                                             .attr("clip-path", "url(#clip)");

            d3.select("#pattern").selectAll("rect").remove();
            this.pattern.append("rect").attr("class", this.rectClassDict[this.patternArray[this.patternPointer].dir])
                                         .attr("x", this.xScale(this.patternArray[this.patternPointer].startDt) - this.xScale.step()*this.xScale.padding()/2)
                                         .attr("y", 0)
                                         .attr("width", this.xScale(this.patternArray[this.patternPointer].stopDt) - this.xScale(this.patternArray[this.patternPointer].startDt) 
                                                                    + this.xScale.bandwidth() + this.xScale.step()*this.xScale.padding())
                                         .attr("height", this.chartBodyDim.h);
            
            d3.select("#patternLength").selectAll("text").remove();
            this.patternLength.append("text").attr("transform", "translate(" + this.xScale(this.getPatternMiddleDt()) + " , 0)")
                                             .text(this.patternArray[this.patternPointer].stopDt.diff(this.patternArray[this.patternPointer].startDt, 'minutes')+1);

            this.chartTitle.text(this.createChartTitle());
        });

    }

    // Function that handles pattern deletion
    deletePattern() {
        bootbox.confirm("Do you want to delete pattern No. " + (this.patternPointer+1) + "?", (result) => { 
            if (result === true) {
                serverRequest('deletePattern', 'inspect', {'pointer': this.patternPointer}).then(() => {
                    serverRequest('loadPatterns', 'inspect', null).then((patterns) => {
                        this.patternArray = this.parseDates(patterns);
                        while (this.patternArray[this.patternPointer] === undefined) { this.patternPointer--; }
                        this.drawPattern();
                    });
                });
            }
        });
    }

    // Function that toggles pattern adjustment and binds mouse events
    togglePatternAdjustment() {
        if (this.isAdjustingPattern) {
            // In case of active adjustment, inactivate it
            this.chartBody.on('mousemove', null);
            d3.select("#fixedPattern").selectAll("rect").remove();
            this.fixedPatternInitialized = false;
            this.chartBody.on('click', null);
        } else {
            // In case inactive adjustment, activate it
            this.chartBody.on('mousemove', (d, i, nodes) => this.showFixedPattern(d, i, nodes));
            this.chartBody.on('click', this.adjustPattern.bind(this));
        }
        this.isAdjustingPattern = !this.isAdjustingPattern;
    }

    // Function that plots fixed pattern at mousemove
    showFixedPattern(d, i, nodes) {
        var middleInd = this.calculatePointedCandle(d3.mouse(nodes[i]));
        if (this.dtArray[middleInd] &&
            this.dtArray[middleInd - Math.floor(this.fixedPatternLength/2) + 1] &&
            this.dtArray[middleInd + this.fixedPatternLength - Math.floor(this.fixedPatternLength/2)]) {

            this.fixedPatternStartInd = middleInd - Math.floor(this.fixedPatternLength/2) + 1;
            this.fixedPatternStopInd = middleInd + this.fixedPatternLength - Math.floor(this.fixedPatternLength/2);
            d3.select("#fixedPattern").selectAll("rect").remove();
            this.fixedPattern.append("rect").attr("class", this.rectClassDict[this.patternArray[this.patternPointer].dir])
                                            .attr("x", this.xScale(this.dtArray[this.fixedPatternStartInd]) - this.xScale.step()*this.xScale.padding()/2)
                                            .attr("y", 0)
                                            .attr("width", this.xScale(this.dtArray[this.fixedPatternStopInd]) - this.xScale(this.dtArray[this.fixedPatternStartInd]) 
                                                                    + this.xScale.bandwidth() + this.xScale.step()*this.xScale.padding())
                                            .attr("height", this.chartBodyDim.h);
            this.fixedPatternInitialized = true;
        } else {
            d3.select("#fixedPattern").selectAll("rect").remove();
            this.fixedPatternInitialized = false;
        }
        
    }
    
    // Function that handles pattern edit operations
    adjustPattern() {
        bootbox.confirm("Do you want to edit pattern No. " + (this.patternPointer+1) + "?", (result) => { 
            if (result === true) {
                if (this.fixedPatternInitialized) {
                    var startDt = this.dtArray[this.fixedPatternStartInd].format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
                    var stopDt = this.dtArray[this.fixedPatternStopInd].format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
                    serverRequest('editPattern', 'inspect', {'pointer': this.patternPointer, 'startDt': startDt, 'stopDt': stopDt}).then(() => {
                        serverRequest('loadPatterns', 'inspect', null).then((patterns) => {
                            this.patternArray = this.parseDates(patterns);
                            this.fixedPatternInitialized = false;
                            this.chartBody.on('mousemove', null);
                            d3.select("#fixedPattern").selectAll("rect").remove();
                            this.chartBody.on('click', null);
                            this.isAdjustingPattern = !this.isAdjustingPattern;
                            this.drawPattern();
                        });
                    });
                }
            }
        });
    }

    loadPattern(dir) {
        if (dir === 1 && this.patternPointer < this.patternArray.length-1) { this.patternPointer++; this.drawPattern(); }
        else if (dir === -1 && this.patternPointer > 0) { this.patternPointer--; this.drawPattern(); }
    }

    constructor(svg, pars, width, height, patterns) {
        
        this.patternPointer,
        this.isAdjustingPattern = false,
        this.fixedPatternInitialized = false,
        this.fixedPatternStartInd,
        this.fixedPatternStopInd,
        this.priceArray = [],
        this.dtArray,
        this.averDate,
        this.xTicksArray = [],
        this.yLimitArray,
        this.yTicksArray,
        this.rectClassDict = {'1': 'bullPattern', '-1': 'bearPattern', '0': 'negPattern'};
        this.patternArray = [];

		this.fixedPatternLength = parseFloat(pars['patternLength']);
		this.noCandles = parseFloat(pars['noCandles']);
        this.yRange = parseFloat(pars['yRange']);
        this.xStep = parseFloat(pars['xStep']);
		this.yStep = parseFloat(pars['yStep']);
		this.yPrec = parseFloat(pars['yPrec']);
        
        this.svg = svg;
        this.width = width,
        this.height = height;

        this.mainArea = this.svg.append("g").attr("transform", "translate(0, 0)");
        
        this.chartAreaMargin = { top: 50, right: 100, bottom: 100, left: 100 },
	    this.chartAreaDim = { w: this.width - this.chartAreaMargin.left - this.chartAreaMargin.right,
                              h: this.height - this.chartAreaMargin.top - this.chartAreaMargin.bottom },
        
        this.chartTitle = this.mainArea.append("g").attr("transform", "translate(" + this.chartAreaMargin.left + ", " + (this.chartAreaMargin.top - 10) + ")")
                                       .append("text").attr("transform", "translate(" + this.chartAreaDim.w/2 + " , 0)");
        
        this.chartArea = this.mainArea.append("g").attr("transform", "translate(" + this.chartAreaMargin.left + "," + this.chartAreaMargin.top + ")");
        
        this.chartArea.append("rect").attr("id", "outerFrame")
                                .attr("width", this.chartAreaDim.w)
                                .attr("height", this.chartAreaDim.h);
        
        this.prevButton = this.svg.append("foreignObject").attr("x", "0")
                                                          .attr("y", this.chartAreaMargin.top)
                                                          .attr("width", this.chartAreaMargin.left)
                                                          .attr("height", this.chartAreaDim.h)
                                  .append("xhtml:div").attr("class", "row h-100 align-items-center text-center")
                                  .append("xhtml:div").attr("class", "col")
                                  .append("xhtml:button").attr("type", "button")
                                                         .attr("class", "btn btn-primary")
                                                         .on("click", this.loadPattern.bind(this, -1))
                                  .append("xhtml:div").attr("class", "fa fa-arrow-left");
        
        this.nextButton = this.svg.append("foreignObject").attr("x", this.chartAreaMargin.left + this.chartAreaDim.w)
                                                          .attr("y", this.chartAreaMargin.top)
                                                          .attr("width", this.chartAreaMargin.right)
                                                          .attr("height", this.chartAreaDim.h)
                                  .append("xhtml:div").attr("class", "row h-100 align-items-center text-center")
                                  .append("xhtml:div").attr("class", "col")
                                  .append("xhtml:button").attr("type", "button")
                                                         .attr("class", "btn btn-primary")
                                                         .on("click", this.loadPattern.bind(this, 1))
                                  .append("xhtml:div").attr("class", "fa fa-arrow-right");
       
        this.downPanel = this.svg.append("foreignObject").attr("x", this.chartAreaMargin.left)
                                                          .attr("y", this.chartAreaMargin.top + this.chartAreaDim.h)
                                                          .attr("width", this.chartAreaDim.w)
                                                          .attr("height", this.chartAreaMargin.bottom)
                                  .append("xhtml:div").attr("class", "row h-100 align-items-center text-center")
                                  .append("xhtml:div").attr("class", "col");
        
        this.downPanel.append("xhtml:button").attr("type", "button")
                                             .attr("class", "btn btn-info")
                                             .style("margin-right", "5px")
                                             .text("Adjust")
                                             .on("click", this.togglePatternAdjustment.bind(this));
        this.downPanel.append("xhtml:button").attr("type", "button")
                                             .attr("class", "btn btn-warning")
                                             .style("margin-left", "5px")
                                             .text("Delete")
                                             .on("click", this.deletePattern.bind(this));

        this.chartBodyMargin = { top: 30, right: 30, bottom: 70, left: 80 },
	    this.chartBodyDim = { w: this.chartAreaDim.w - this.chartBodyMargin.left - this.chartBodyMargin.right,
                              h: this.chartAreaDim.h - this.chartBodyMargin.top - this.chartBodyMargin.bottom },
       

        
        this.chartBody = this.chartArea.append("g").attr("transform", "translate(" + this.chartBodyMargin.left + "," + this.chartBodyMargin.top + ")");
        
        this.chartBody.append("rect").attr("id", "innerFrame")
                                     .attr("width", this.chartBodyDim.w)
                                     .attr("height", this.chartBodyDim.h);
        
        this.chartBody.append("defs").append("clipPath").attr("id", "clip")
                               .append("rect").attr("x", 0)
                                              .attr("y", 0)
                                              .attr("width", this.chartBodyDim.w)
                                              .attr("height", this.chartBodyDim.h);
        
        this.xAxisCon = this.chartArea.append("g").attr("class", "axis")
                                                  .attr("transform", "translate(" + this.chartBodyMargin.left + "," + (this.chartBodyMargin.top + this.chartBodyDim.h) + ")");

        this.xTitle = this.chartArea.append("text").attr("transform", "translate(" + (this.chartBodyMargin.left + this.chartBodyDim.w/2) + " ,"
                                                                                   + (this.chartBodyMargin.top + this.chartBodyDim.h + 45) + ")")
                                                   .style("text-anchor", "middle");
        
        this.patternLength = this.chartArea.append("g").attr("transform", "translate(" + this.chartBodyMargin.left + ", " + (this.chartBodyMargin.top-4) + ")")
                                                       .attr("id", "patternLength")
                                                       .attr("class", "axis");
        
        this.xAxis = d3.axisBottom().tickFormat(this.xValuesFormatter);

        this.yAxisCon = this.chartArea.append("g").attr("class", "axis")
                                                  .attr("transform", "translate(" + this.chartBodyMargin.left + "," + this.chartBodyMargin.top + ")");
        
        this.yAxis = d3.axisLeft().tickFormat(d3.format("."+this.yPrec+"f"));

        this.xGridCon = this.chartBody.append("g").attr("class", "grid");
        
        this.xGrid = d3.axisBottom().tickFormat("").tickSize(this.chartBodyDim.h);
        
        this.yGridCon = this.chartBody.append("g").attr("class", "grid");
        
        this.yGrid = d3.axisLeft().tickFormat("").tickSize(-this.chartBodyDim.w);
        
        this.candles = this.chartBody.append("g").attr("id", "candles");

        this.stems = this.chartBody.append("g").attr("id", "stems");

        this.pattern = this.chartBody.append("g").attr("id", "pattern");
        
        this.fixedPattern = this.chartBody.append("g").attr("id", "fixedPattern");
        

        
        this.xScale = d3.scaleBand().range([0, this.chartBodyDim.w]).padding(0.3);
        this.yScale = d3.scaleLinear().range([this.chartBodyDim.h, 0]);

        // process patterns and call loading of first pattern
        this.patternArray = this.parseDates(patterns);
        
        this.patternPointer = parseFloat(pars['patternIndStart']);
        this.drawPattern();
    }

}

