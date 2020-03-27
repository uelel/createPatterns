from flask import Flask, render_template, Response, request, jsonify
import json
import os
from influxdb import DataFrameClient
import numpy as np
import pandas as pd
import datetime
from pytz import timezone

def loadDataFromInfluxdb(dtLimit, direction, client, noCandles):
    """Actual implementation of data loading from Influxdb"""
    
    if direction == 'left':
        query = 'SELECT "time", "open", "high", "low", "close" FROM "rates" WHERE time < \'%s\' ORDER BY DESC LIMIT %i' % (dtLimit, noCandles)
    elif direction == 'right':
        query = 'SELECT "time", "open", "high", "low", "close" FROM "rates" WHERE time > \'%s\' ORDER BY ASC LIMIT %i' % (dtLimit, noCandles)
    
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
    # Replace null values for np.nan
    rates.replace(0.0, np.nan, inplace=True)
    
    return rates

def loadDataFromFile(dtLimit, direction, filePath, noCandles):
    """Actual implementation of data loading from file"""
    
    # Adjust dtLimit string to match file format
    dtLimit = datetime.datetime.strptime(dtLimit, '%Y-%m-%dT%H:%M:%S.000Z')
    dtLimit = timezone('UTC').localize(dtLimit)
    dtLimit = dtLimit.strftime('%Y-%m-%d-%H:%M:%S%z')

    # Find line number containing dtLimit
    dtLimitFound = False
    with open(filePath, 'r') as file:
        line = file.readline() 
        startLine = 0
        while line:
            if line.startswith(dtLimit):
                dtLimitFound = True
                break
            line = file.readline()
            startLine += 1
    if not dtLimitFound:
        raise Exception('No such data exist in given file!')

    # Load up data to pandas array
    if direction == 'left':
        rates = pd.read_csv(filePath, index_col=False, names=['Date', 'Open', 'High', 'Low', 'Close', 'Spread'], delimiter=' ', skiprows=startLine-noCandles, nrows=noCandles)
    if direction == 'right':
        rates = pd.read_csv(filePath, index_col=False, names=['Date', 'Open', 'High', 'Low', 'Close', 'Spread'], delimiter=' ', skiprows=startLine, nrows=noCandles)

    if rates.empty:
        raise Exception('No such data exist in given file!')

    # Delete last column
    del rates['Spread']
    # Parse datetimes in array
    rates['Date'] = rates['Date'].apply(lambda x: datetime.datetime.strptime(x, '%Y-%m-%d-%H:%M:%S%z'))

    return rates

class data():
    """Class that creates universal data loading method used in requests"""

    loadMethod = None
    loadDataArgs = dict()
    patternFile = None

    @classmethod
    def init(cls, pars):
        """Create arguments necessary to load new data"""
        
        # Reset arguments
        cls.loadMethod = None
        cls.loadDataArgs = dict()
        cls.patternFile = None

        # specify path for pattern file 
        cls.patternFile = './static/data/'+pars['patternFile']
        
        if pars['loadMethod'] == 'influxdb':
            # Specify method for actual data loading
            cls.loadMethod = loadDataFromInfluxdb
            # Specify necessary arguments for loadMethod
            cls.loadDataArgs['client'] = DataFrameClient(host='127.0.0.1', port=8086, database=pars['dbName'])
            # specify number of preloaded candles
            cls.loadDataArgs['noCandles'] = 1000
            
        elif pars['loadMethod'] == 'file':
            # Specify method for actual data loading
            cls.loadMethod = loadDataFromFile
            # Specify necessary arguments for loadMethod
            cls.loadDataArgs['filePath'] = './static/data/'+pars['fileUploadVisible']
            # specify number of preloaded candles
            cls.loadDataArgs['noCandles'] = 1000

        else:
            raise Exception('Data loading method unknown during initialization!')

    @classmethod
    def load(cls, dtLimit, direction):
        """Call loadMethod
           Returns loaded data"""

        if direction not in ('left', 'right'):
            raise Exception('Direction unknown during loading new data!')

        return cls.loadMethod(dtLimit, direction, **cls.loadDataArgs)

    @classmethod
    def savePattern(cls, startDt, stopDt, direction):
        """Save new pattern to json file of sorted patterns"""

        if os.path.isfile(cls.patternFile):
            
            # load pattern file
            try:
                with open(cls.patternFile, 'r') as patternFile:
                    patterns = json.load(patternFile)
            except Exception as e:
                raise Exception('Error during loading pattern file: %s' % e)
                
            # append new pattern
            try:
                patterns.append({'startDt': startDt, 'stopDt': stopDt, 'dir': direction})
                # sort updated list by startDt
                patterns = sorted(patterns, key=lambda p: datetime.datetime.strptime(p['startDt'],'%Y-%m-%dT%H:%M:%S.000Z'))
            except Exception as e:
                raise Exception('Error during updating patterns: %s' % e)
                
            # dumps updated patterns into file
            try:
                with open(cls.patternFile, 'w') as patternFile:
                    patternFile.write(json.dumps(patterns, indent=4))
            except Exception as e:
                raise Exception('Error during saving pattern file: %e' % e)
        
        else:
            raise Exception('Pattern file does not exist!')

    @classmethod
    def loadPatterns(cls):
        """Load and return patterns"""

        try:
            with open(cls.patternFile, 'r') as patternFile:
                patterns = json.load(patternFile)
        except:
            patterns = []
        
        return patterns

def createResponse(status, message):
    """returns flask Response object"""
    
    if type(message) in (str, list):
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

@app.route("/loadNewData", methods=['GET'])
def loadNewData():
    
    try:
        return createResponse(200, data.load(request.args.get('dtLimit'), request.args.get('dir')))
    except Exception as error:
        print(error)
        return createResponse(400, "Error during loading new data!")

@app.route("/savePattern", methods=['POST'])
def savePattern():
    
    try:
        data.savePattern(request.json['startDt'], request.json['stopDt'], request.json['dir'])
        return createResponse(200, "New pattern was successfully saved!")
    except Exception as error:
        print(error)
        return createResponse(400, "Error during saving new pattern!")

@app.route("/loadPatterns", methods=['GET'])
def loadPatterns():

    return createResponse(200, data.loadPatterns())

if __name__ == "__main__":
    app.run(debug=True)
