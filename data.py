import os
import json
import datetime
from dataLoad import loadDataFromInfluxdb, loadDataFromFile, DataFrameClient

class dataHandler():
    """Class that is a universal handler for data processing"""

    loadMethod = None
    loadDataOthersArgs = dict()
    patternFile = None
    noCandles = None

    @classmethod
    def init(cls, pars):
        """Initiate arguments necessary to perform data operations"""
        
        # Reset arguments
        cls.loadMethod = None
        cls.loadDataOthersArgs = dict()
        cls.patternFile = None
        cls.noCandles = None

        # specify path for pattern file 
        cls.patternFile = './static/data/'+pars['patternFile']
        
        # specify number of preloaded candles
        cls.noCandles = 1000
       
        # specify arguments for data loading
        if pars['loadMethod'] == 'influxdb':
            # Specify method for actual data loading
            cls.loadMethod = loadDataFromInfluxdb
            # influxdb client
            cls.loadDataOthersArgs['client'] = DataFrameClient(host='127.0.0.1',
                                                               port=8086,
                                                               database=pars['dbName'])

        elif pars['loadMethod'] == 'file':
            # Specify method for actual data loading
            cls.loadMethod = loadDataFromFile
            # filename
            cls.loadDataOthersArgs['filePath'] = './static/data/'+pars['fileUploadVisible']

        else:
            raise Exception('Data loading method %s unknown during initialization!' %
                            pars['loadMethod'])
        

    @classmethod
    def load(cls, dtLimit, direction):
        """Call method for actual data loading
           Returns loaded data"""

        if direction not in ('left', 'right'):
            raise Exception('Direction unknown during loading new data!')

        return cls.loadMethod(dtLimit,
                              direction,
                              cls.noCandles,
                              **cls.loadDataOthersArgs)

    @classmethod
    def savePattern(cls, startDt, stopDt, direction):
        """Save new pattern to json file of sorted patterns"""

        if os.path.isfile(cls.patternFile):
            
            # load pattern file
            if os.stat(cls.patternFile).st_size == 0:
                patterns = list()
            else:
                try:
                    with open(cls.patternFile, 'r') as patternFile:
                        patterns = json.load(patternFile)
                except Exception as e:
                    raise Exception('Error during loading pattern file: %s' % e)
                
            # append new pattern
            try:
                patterns.append({'startDt': startDt,
                                 'stopDt': stopDt,
                                 'dir': direction})
                # sort updated list by startDt
                patterns = sorted(patterns,
                                  key=lambda p: datetime.datetime.strptime(p['startDt'],'%Y-%m-%dT%H:%M:%S.000Z'))
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
        """Load and return patterns from json file"""

        try:
            with open(cls.patternFile, 'r') as patternFile:
                patterns = json.load(patternFile)
        except:
            patterns = []
        
        return patterns
