function createInitForm(svg) {

    var initForm = svg.append("foreignObject").attr("id", "initObject")
                      .append("xhtml:form").attr("id", "initForm");
                                 
    var loadMethod = initForm.append("xhtml:div");
    loadMethod.append("xhtml:label").text("Loading method:")
                                    .attr("for", "loadMethod");
    var loadMethodSel = loadMethod.append("xhtml:select").attr("name", "loadMethod");
    loadMethodSel.append("xhtml:option").attr("value", "influxdb").text("influxdb");
    loadMethodSel.append("xhtml:option").attr("value", "file").text("file");

    var name = initForm.append("xhtml:div").style("position", "relative")
										   .style("display", "flex");
    
	name.append("xhtml:label").text("Choose data file:")
							  .attr("for", "filePath")
							  .attr("class", "special");
	var fileUpload = name.append("xthml:div").attr("class", "fileUpload");
    fileUpload.append("xhtml:input").attr("type", "file")
							        .attr("name", "filePath")
							        .attr("class", "fileUploadHidden");
    var fileUploadVisible = fileUpload.append("xhtml:div");
    fileUploadVisible.append("xhtml:label").attr("class", "inputIcon")
                     .append("xhtml:span").attr("class", "glyphicon glyphicon-folder-open");
    fileUploadVisible.append("xhtml:input").attr("type", "text")
                                     .attr("value", "No file chosen...                    ");
	
	/* http://jsfiddle.net/spanndemic/5JRMt/
	name.append("xhtml:label").text("Database name:")
                                .attr("for", "dbName");
    name.append("xhtml:input").attr("type", "text")
                                .attr("value", "oanda.eurusd.M1")
                                .attr("name", "dbName");
	*/
    
	var initDt = initForm.append("xhtml:div").style("position", "relative")
                                             .style("display", "flex");
    initDt.append("xhtml:label").text("Initial date and time:")
                                .attr("for", "initDt")
                                .attr("class", "special");
    var initDtInput = initDt.append("xhtml:div");
    initDtInput.append("xhtml:label").attr("class", "inputIcon")
                                     .attr("for", "dateTimePicker")
               .append("xhtml:span").attr("class", "glyphicon glyphicon-calendar");
    initDtInput.append("xhtml:input").attr("type", "text")
                                     .attr("name", "initDt")
                                     .attr("id", "dateTimePicker");
                                     
    var noCandles = initForm.append("xhtml:div");
    noCandles.append("xhtml:label").text("Number of displayed candles:")
                                     .attr("for", "noCandles");
    noCandles.append("xhtml:input").attr("type", "text")
                                   .attr("value", "160")
                                   .attr("name", "noCandles");
                                     
    var xStep = initForm.append("xhtml:div");
    xStep.append("xhtml:label").text("Number of minutes between x ticks:")
                                .attr("for", "xStep");
    xStep.append("xhtml:input").attr("type", "text")
                                     .attr("value", "15")
                                     .attr("name", "xStep");

    var yRange = initForm.append("xhtml:div");
    yRange.append("xhtml:label").text("y-axis range:")
                                .attr("for", "yRange");
    yRange.append("xhtml:input").attr("type", "text")
                                     .attr("value", "0.002")
                                     .attr("name", "yRange");

    var yStep = initForm.append("xhtml:div");
    yStep.append("xhtml:label").text("y-axis step:")
                                .attr("for", "yStep");
    yStep.append("xhtml:input").attr("type", "text")
                                     .attr("value", "0.0001")
                                     .attr("name", "yStep");
                                     
    var yPrec = initForm.append("xhtml:div");
    yPrec.append("xhtml:label").text("y-labels precision:")
                                .attr("for", "yPrec");
    yPrec.append("xhtml:input").attr("type", "text")
                                     .attr("value", "5")
                                     .attr("name", "yPrec");

    var buton = initForm.append("xhtml:div").attr("id", "initFormButton");
    buton.append("xhtml:button").attr("type", "submit")
                                .text("Show chart");

    function updateNameField(nameField, methodValue) {
		var a = 2;
	}
	
	// Bind Bootstrap datetimepicker to input field
    $('#dateTimePicker').datetimepicker({format: 'DD.MM.YYYY HH:mm', defaultDate: new Date()});

    // Define input width to its default content
    $.each($('input:text'), function(){
        $(this).css('width',(($(this).val().length) * 6.5 + 20 + 'px'));
    });

    return initForm;
}								 
