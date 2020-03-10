function createInitForm(svg) {

    var initForm = svg.append("foreignObject").attr("id", "initObject")
                      .append("xhtml:form").attr("id", "initForm");
                                 
    var pair = initForm.append("xhtml:div");
    pair.append("xhtml:label").text("Pair:")
                              .attr("for", "pair");
    pair.append("xhtml:select").attr("name", "pair")
        .append("xhtml:option").attr("value", "eurusd").text("EURUSD");
                                     
    var gran = initForm.append("xhtml:div");
    gran.append("xhtml:label").text("Granularity:")
                              .attr("for", "gran");
    gran.append("xhtml:select").attr("name", "gran")
        .append("xhtml:option").attr("value", "m1").text("M1");

    var initDt = initForm.append("xhtml:div").style("position", "relative")
                                             .style("display", "flex");
    initDt.append("xhtml:label").text("Initial date and time:")
                                .attr("for", "initDt")
                                .style("line-height", "26px");
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

    // Bind Bootstrap datetimepicker to input field
    $('#dateTimePicker').datetimepicker({format: 'DD.MM.YYYY HH:mm', defaultDate: new Date()});

    // Define input width to its default content
    $.each($('input'), function(){
        $(this).css('width',(($(this).val().length) * 6.5 + 20 + 'px'));
    });

    return initForm;
}								 
