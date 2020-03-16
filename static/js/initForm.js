function createInitForm(svg) {

    var initForm = svg.append("foreignObject").attr("id", "initObject")
                      .append("xhtml:form").attr("id", "initForm");
                                 
    var loadMethod = initForm.append("xhtml:div");
    loadMethod.append("xhtml:label").text("Loading method:")
                                    .attr("for", "loadMethod");
    var loadMethodSel = loadMethod.append("xhtml:select").attr("name", "loadMethod")
														 .attr("id", "loadMethod");
    loadMethodSel.append("xhtml:option").attr("value", "influxdb").text("influxdb");
    loadMethodSel.append("xhtml:option").attr("value", "file").text("file");

    var loadName = initForm.append("xhtml:div").attr("class", "special")
											   .attr("id", "loadName");
	loadName.append("xhtml:label").text("Database name:");
    loadName.append("xhtml:input").attr("type", "text")
                                  .attr("value", "oanda.eurusd.M1")
                                  .attr("name", "dbName");
	
    
	var initDt = initForm.append("xhtml:div").attr("class", "special");
    initDt.append("xhtml:label").text("Initial date and time:")
                                .attr("class", "special");
    var initDtInput = initDt.append("xhtml:div");
    initDtInput.append("xhtml:label").attr("class", "inputIcon")
                                     .attr("for", "dateTimePicker")
               .append("xhtml:span").attr("class", "glyphicon glyphicon-calendar");
    initDtInput.append("xhtml:input").attr("type", "text")
                                     .attr("name", "initDt")
                                     .attr("id", "dateTimePicker");
                                     
    var noCandles = initForm.append("xhtml:div");
    noCandles.append("xhtml:label").text("Number of displayed candles:");
    noCandles.append("xhtml:input").attr("type", "text")
                                   .attr("value", "160")
                                   .attr("name", "noCandles");
                                     
    var xStep = initForm.append("xhtml:div");
    xStep.append("xhtml:label").text("Number of minutes between x ticks:");
    xStep.append("xhtml:input").attr("type", "text")
                                     .attr("value", "15")
                                     .attr("name", "xStep");

    var yRange = initForm.append("xhtml:div");
    yRange.append("xhtml:label").text("y-axis range:");
    yRange.append("xhtml:input").attr("type", "text")
                                     .attr("value", "0.002")
                                     .attr("name", "yRange");

    var yStep = initForm.append("xhtml:div");
    yStep.append("xhtml:label").text("y-axis step:");
    yStep.append("xhtml:input").attr("type", "text")
                                     .attr("value", "0.0001")
                                     .attr("name", "yStep");
                                     
    var yPrec = initForm.append("xhtml:div");
    yPrec.append("xhtml:label").text("y-labels precision:");
    yPrec.append("xhtml:input").attr("type", "text")
                                     .attr("value", "5")
                                     .attr("name", "yPrec");

    var buton = initForm.append("xhtml:div").attr("id", "initFormButton");
    buton.append("xhtml:button").attr("type", "submit")
                                .text("Show chart");
	
	// Handle on click event of loadMethod select input
    d3.select('#loadMethod')
      .on('change', function() {
        // load selected option
		var selectedOption = d3.select(this).property('value');
        
		// load up loadName node
		var loadName = d3.select("#loadName");
		
		// delete current content
		loadName.selectAll("*").remove();
		
		// create new content
		if (selectedOption == "file") {
			loadName.append("xhtml:label").text("Choose data file:")
										  .attr("class", "special");
			var fileUpload = loadName.append("xthml:div").attr("class", "fileUpload");
			fileUpload.append("xhtml:input").attr("type", "file")
											.attr("name", "fileUploadHidden")
											.attr("class", "fileUploadHidden");
			var fileUploadVisible = fileUpload.append("xhtml:div");
			fileUploadVisible.append("xhtml:label").attr("class", "inputIcon")
							 .append("xhtml:span").attr("class", "glyphicon glyphicon-folder-open");
			fileUploadVisible.append("xhtml:input").attr("type", "text")
												   .attr("name", "fileUploadVisible")
												   .attr("value", "No file chosen...   ");
			
			// Change value of visible input to path of selected file
			$('input[name=fileUploadHidden]').change(function() {
				var fileName = $(this).val().replace(/C:\\fakepath\\/i, '');
				$('input[name=fileUploadVisible]').val(fileName);
    });
		}
		else if (selectedOption == "influxdb") {
			loadName.append("xhtml:label").text("Database name:");
			loadName.append("xhtml:input").attr("type", "text")
										  .attr("value", "oanda.eurusd.M1")
										  .attr("name", "dbName");
		}
    });
	
	// Bind Bootstrap datetimepicker to input field
    $('#dateTimePicker').datetimepicker({format: 'DD.MM.YYYY HH:mm', defaultDate: new Date()});

    // Define input width to its default content
    $.each($('input:text'), function(){
        $(this).css('width',(($(this).val().length) * 6.5 + 20 + 'px'));
    });

    return initForm;
}								 
