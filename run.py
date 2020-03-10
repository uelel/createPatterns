from flask import Flask, render_template, Response, request, jsonify
import json

# Specify whether data should be loaded from file instead of influxdb
loadFromFile = True
fileName = ''

# Specify number of preloaded candles
loadNoCandles = 2000

app = Flask(__name__, static_url_path='/static')

@app.route("/")
def home():
    return render_template('index.html')
	
@app.route("/getData")
def getData():
    # Return data from Python variable
    response = Response(response=python_variable, status=200, mimetype="application/json")
    return(response)

@app.route("/loadNewData", methods=['POST'])
def loadNewData():

	#print(request)
	#dateLimit = request.form.get['dateLimit']
	#direction = request.form.get['dir']
	
	return jsonify('message loaded')
	
	# Load new data from file/influxdb

@app.route("/barChart")
def barChart():
    return render_template("barChart.html")

@app.route("/barChart2")
def barChart2():
    return render_template("barChart2.html")

@app.route("/CChart")
def CChart():
    return render_template("candlestickChart.html")

@app.route("/animation")
def animation():
    return render_template("animation.html")

@app.route("/intBarChart")
def intBarChart():
    return render_template("intBarChart.html")

@app.route("/panningChart")
def panningChart():
    return render_template("panningChart.html")

if __name__ == "__main__":
    app.run(debug=True)
