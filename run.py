from flask import Flask, render_template, Response, request, jsonify
import json
from influxdb import DataFrameClient
import pandas as pd


def loadDataFromInfluxdb(dtLimit, direction, client, noCandles):
    """Actual implementation of data loading from Influxdb"""
    if direction == 'left':
        query = 'SELECT "time", "open", "high", "low", "close" FROM "rates" WHERE time < \'%s\' AND ("status" = \'C\' OR "status" = \'A\') ORDER BY DESC LIMIT %i' % (dtLimit, noCandles)
    
    elif direction == 'right':
        query = 'SELECT "time", "open", "high", "low", "close" FROM "rates" WHERE time > \'%s\' AND ("status" = \'C\' OR "status" = \'A\') ORDER BY ASC LIMIT %i' % (dtLimit, noCandles)
    
    else: raise Exception('Direction unknown during loading new data!')
    
    try:
        rates = client.query(query)['rates']
    except KeyError:
        raise Exception('No such data exist in database!')
    
    return rates

def loadDataFromFile(dtLimit, direction, fileObject, noCandles):
    """Actual implementation of data loading from file"""
    pass

class data():
    """Class that creates universal data loading method used in requests"""

    loadMethod = None
    keyargs = dict()

    @classmethod
    def init(cls, pars):
        """Create arguments necessary to call loadMethod"""
        
        # Reset arguments
        cls.loadMethod = None
        cls.keyargs = dict()

        if pars['loadMethod'] == 'influxdb':
            # Specify method for actual data loading
            cls.loadMethod = loadDataFromInfluxdb
            cls.keyargs['client'] = DataFrameClient(host='127.0.0.1', port=8086, database=pars['dbName'])
            # specify number of preloaded candles
            cls.keyargs['noCandles'] = 2000
            
        elif pars['loadMethod'] == 'file':
            # Specify method for actual data loading
            cls.loadMethod = loadDataFromFile
            cls.keyargs['fileObject'] = open(pars['fileName'], 'r')
            # specify number of preloaded candles
            cls.keyargs['noCandles'] = 2000

        else:
            raise ValueError

    @classmethod
    def load(cls, dtLimit, direction):
        """Call loadMethod"""
        return cls.loadMethod(dtLimit, direction, **cls.keyargs)

def createResponse(status, message):
    """returns flask Response object"""
    return Response(json.dumps(message), status=status, mimetype='application/json')

app = Flask(__name__, static_url_path='/static')

@app.route("/")
def home():
    return render_template('index.html')

@app.route("/dataInit", methods=['POST'])
def dataInit():
    
    try:
        data.init(request.json)
        print(data.keyargs)
    except Exception as error:
        print(error)
        return createResponse(400, "Error during initiating data connection!")

    return createResponse(200, "Data connection successfully initialized!")

@app.route("/loadNewData", methods=['POST'])
def loadNewData():

    try:
        print(request.json)
        data.load(request.json['dtLimit'], request.json['dir'])
    
    except Exception as error:
        print(error)
        return createResponse(400, "Error during loading new data!")

    return createResponse(200, "New data successfully loaded!")

@app.route("/getData")
def getData():
    # Return data from Python variable
    response = Response(response=python_variable, status=200, mimetype="application/json")
    return(response)

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
