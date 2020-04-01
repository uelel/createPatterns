function createInitForm(svg) {

    var initForm = svg.append("foreignObject").attr("id", "initObject")
                      .append("xhtml:form").attr("id", "initForm");
    
    var patternFile = initForm.append("xhtml:div").attr("class", "row form-group justify-content-start");
    patternFile.append("xhtml:label").attr("class", "col-sm-6 col-form-label text-right")
                                     .text("Pattern file:");
    var patternFileUpload = patternFile.append("xthml:div").attr("class", "fileUpload col-sm-5");
    patternFileUpload.append("xhtml:input").attr("type", "file")
                                           .attr("name", "patternFileUploadHidden")
                                           .attr("class", "fileUploadHidden");
    var patternFileUploadVisible = patternFileUpload.append("xhtml:div").attr("class", "input-group");
    patternFileUploadVisible.append("xhtml:span").attr("class", "input-group-prepend")
                            .append("xhtml:span").attr("class", "input-group-text")
                            .append("xhtml:i").attr("class", "fa fa-upload");
    patternFileUploadVisible.append("xhtml:input").attr("type", "text")
                                                  .attr("class", "form-control")
                                                  .attr("name", "patternFile");
    
    var patternLength = initForm.append("xhtml:div").attr("class", "row form-group justify-content-start");
    patternLength.append("xhtml:label").attr("class", "col-sm-6 col-form-label text-right")
                                       .text("Pattern length in minutes:");
    patternLength.append("xhtml:div").attr("class", "col-sm-2")
                 .append("xhtml:input").attr("type", "text")
                                       .attr("class", "form-control")
                                       .attr("value", "")
                                       .attr("name", "patternLength");
    
    var loadMethod = initForm.append("xhtml:div").attr("class", "row form-group justify-content-start");
    loadMethod.append("xhtml:label").attr("class", "col-sm-6  col-form-label text-right")
                                    .attr("for", "loadMethod")
                                    .text("Loading method:");
    var loadMethodSel = loadMethod.append("xhtml:div").attr("class", "col-sm-3")
                                  .append("xhtml:select").attr("name", "loadMethod")
                                                         .attr("class", "form-control")
                                                         .attr("id", "loadMethod");
    loadMethodSel.append("xhtml:option").attr("value", "influxdb").text("influxdb");
    loadMethodSel.append("xhtml:option").attr("value", "file").text("file");

    var loadName = initForm.append("xhtml:div").attr("class", "row form-group justify-content-start")
                                               .attr("id", "loadName");
    loadName.append("xhtml:label").attr("class", "col-sm-6 col-form-label text-right")
                                  .text("Database name:");
    loadName.append("xhtml:div").attr("class", "col-sm-4")
            .append("xhtml:input").attr("type", "text")
                                  .attr("class", "form-control")
                                  .attr("value", "oanda.eurusd.M1")
                                  .attr("name", "dbName");

    var noCandles = initForm.append("xhtml:div").attr("class", "row form-group justify-content-start");
    noCandles.append("xhtml:label").attr("class", "col-sm-6 col-form-label text-right")
                                   .text("Number of displayed candles:");
    noCandles.append("xhtml:div").attr("class", "col-sm-2")
             .append("xhtml:input").attr("type", "text")
                                   .attr("class", "form-control")
                                   .attr("value", "100")
                                   .attr("name", "noCandles");

    var xStep = initForm.append("xhtml:div").attr("class", "row form-group justify-content-start");
    xStep.append("xhtml:label").attr("class", "col-sm-6 col-form-label text-right")
                               .text("Number of minutes between x ticks:");
    xStep.append("xhtml:div").attr("class", "col-sm-2")
         .append("xhtml:input").attr("type", "text")
                               .attr("class", "form-control")
                               .attr("value", "15")
                               .attr("name", "xStep");

    var yRange = initForm.append("xhtml:div").attr("class", "row form-group justify-content-start");
    yRange.append("xhtml:label").attr("class", "col-sm-6 col-form-label text-right")
                                .text("y-axis range:");
    yRange.append("xhtml:div").attr("class", "col-sm-2")
          .append("xhtml:input").attr("type", "text")
                                .attr("class", "form-control")
                                .attr("value", "0.002")
                                .attr("name", "yRange");

    var yStep = initForm.append("xhtml:div").attr("class", "row form-group justify-content-start");
    yStep.append("xhtml:label").attr("class", "col-sm-6 col-form-label text-right")
                               .text("y-axis step:");
    yStep.append("xhtml:div").attr("class", "col-sm-2")
         .append("xhtml:input").attr("type", "text")
                               .attr("class", "form-control")
                               .attr("value", "0.0001")
                               .attr("name", "yStep");

    var yPrec = initForm.append("xhtml:div").attr("class", "row form-group justify-content-start");
    yPrec.append("xhtml:label").attr("class", "col-sm-6 col-form-label text-right")
                               .text("y-labels precision:");
    yPrec.append("xhtml:div").attr("class", "col-sm-2")
         .append("xhtml:input").attr("type", "text")
                               .attr("class", "form-control")
                               .attr("value", "5")
                               .attr("name", "yPrec");

    var buton = initForm.append("xhtml:div").attr("class", "text-center");
    buton.append("xhtml:button").attr("type", "submit")
                                .attr("class", "btn btn-primary")
                                .text("Load chart");
	
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
            loadName.append("xhtml:label").attr("class", "col-sm-6 col-form-label text-right")
                                          .text("Choose data file:");
            var fileUpload = loadName.append("xthml:div").attr("class", "fileUpload col-sm-5");
            fileUpload.append("xhtml:input").attr("type", "file")
                                            .attr("name", "fileUploadHidden")
                                            .attr("class", "fileUploadHidden");
            var fileUploadVisible = fileUpload.append("xhtml:div").attr("class", "input-group");
            fileUploadVisible.append("xhtml:span").attr("class", "input-group-prepend")
                             .append("xhtml:span").attr("class", "input-group-text")
                             .append("xhtml:i").attr("class", "fa fa-upload");
            fileUploadVisible.append("xhtml:input").attr("type", "text")
                                                   .attr("class", "form-control")
                                                   .attr("name", "fileUploadVisible")
                                                   .attr("value", "No file chosen...   ");
			
			// Change value of visible input to path of selected file
			$('input[name=fileUploadHidden]').change(function() {
				var fileName = $(this).val().replace(/C:\\fakepath\\/i, '');
				$('input[name=fileUploadVisible]').val(fileName);
            });
		}
		else if (selectedOption == "influxdb") {
            loadName.append("xhtml:label").attr("class", "col-sm-6 col-form-label text-right")
                                          .text("Database name:");
            loadName.append("xhtml:div").attr("class", "col-sm-4")
                    .append("xhtml:input").attr("type", "text")
                                          .attr("class", "form-control")
                                          .attr("value", "oanda.eurusd.M1")
                                          .attr("name", "dbName");
		}
    });
	
    // Change value of visible input to path of selected pattern file
    $('input[name=patternFileUploadHidden]').change(function() {
        var fileName = $(this).val().replace(/C:\\fakepath\\/i, '');
        $('input[name=patternFile]').val(fileName);
    });

    return initForm;
}								 
