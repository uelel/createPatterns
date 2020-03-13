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
    
    # Move date indices to new column
    rates['Date'] = rates.index
    # Reset index to numerical one
    rates = rates.reset_index(drop=True)
    # Move Date column in front
    rates = rates.loc[:, ['Date', 'open', 'high', 'low', 'close']]
    # Rename other columns
    rates.columns = ['Date', 'Open', 'High', 'Low', 'Close']
    
    return rates

def loadDataFromFile(dtLimit, direction, fileObject, noCandles):
    """Actual implementation of data loading from file"""
    pass

class data():
    """Class that creates universal data loading method used in requests"""

    loadMethod = None
    keyargs = dict()
    container = pd.DataFrame(columns=['Date', 'Open', 'High', 'Low', 'Close'])

    @classmethod
    def init(cls, pars):
        """Create arguments necessary to load new data"""
        
        # Reset arguments
        cls.loadMethod = None
        cls.keyargs = dict()
        cls.container = pd.DataFrame(columns=['Date', 'Open', 'High', 'Low', 'Close'])

        if pars['loadMethod'] == 'influxdb':
            # Specify method for actual data loading
            cls.loadMethod = loadDataFromInfluxdb
            # Specify necessary arguments for loadMethod
            cls.keyargs['client'] = DataFrameClient(host='127.0.0.1', port=8086, database=pars['dbName'])
            # specify number of preloaded candles
            cls.keyargs['noCandles'] = 1000
            
        elif pars['loadMethod'] == 'file':
            # Specify method for actual data loading
            cls.loadMethod = loadDataFromFile
            # Specify necessary arguments for loadMethod
            cls.keyargs['fileObject'] = open(pars['fileName'], 'r')
            # specify number of preloaded candles
            cls.keyargs['noCandles'] = 1000

        else:
            raise ValueError

    @classmethod
    def load(cls, dtLimit, direction):
        """Call loadMethod
           Load data into container"""

        rates = cls.loadMethod(dtLimit, direction, **cls.keyargs)

        if direction == 'left': cls.container = pd.concat([rates, cls.container])
        elif direction == 'right': cls.container = pd.concat([cls.container, rates])
        else: raise Exception('Direction unknown during loading new data!')

    @classmethod
    def get(cls):
        """Returns data container"""
        return cls.container

def createResponse(status, message):
    """returns flask Response object"""
    if type(message) == str:
        message = json.dumps(message)
    elif type(message) == pd.DataFrame:
        message = message.to_json(date_format='iso', orient='records')
    return Response(message, status=status, mimetype='application/json')

app = Flask(__name__, static_url_path='/static')

@app.route("/")
def home():
    return render_template('index.html')

@app.route("/initData", methods=['POST'])
def initData():
    
    try:
        data.init(request.json)
        return createResponse(200, "Data connection successfully initialized!")
    except Exception as error:
        print(error)
        return createResponse(400, "Error during initiating data connection!")

@app.route("/loadNewData", methods=['POST'])
def loadNewData():

    try:
        data.load(request.json['dtLimit'], request.json['dir'])
        return createResponse(200, "New data successfully loaded!")
    except Exception as error:
        print(error)
        return createResponse(400, "Error during loading new data!")

@app.route("/getData", methods=['POST'])
def getData():
    
    return createResponse(200, data.get())

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
