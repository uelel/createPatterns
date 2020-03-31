import json
import os
import datetime
from dataLoad import loadDataFromInfluxdb, loadDataFromFile, DataFrameClient

class dataHandler():
    """Class that handles any data loading"""

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
