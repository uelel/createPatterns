import os
import json
import datetime
from dataLoad import loadDataFromInfluxdb, loadDataFromFile, DataFrameClient

class dataHandler():
    """Class that is a universal handler for data processing"""

    loadMethod = None
    loadDataArgs = dict()
    patternFile = None

    @classmethod
    def init(cls, pars):
        """Initiate arguments necessary to perform data operations"""
        
        # Reset arguments
        cls.loadMethod = None
        cls.loadDataArgs = dict()
        cls.patternFile = None

        # specify path for pattern file 
        cls.patternFile = './static/data/'+pars['patternFile']
       
        # specify arguments for data loading
        if pars['loadMethod'] == 'influxdb':
            # Specify method for actual data loading
            cls.loadMethod = loadDataFromInfluxdb
            # influxdb client
            cls.loadDataArgs['client'] = DataFrameClient(host='127.0.0.1', port=8086, database=pars['dbName'])

        elif pars['loadMethod'] == 'file':
            # Specify method for actual data loading
            cls.loadMethod = loadDataFromFile
            # filename
            cls.loadDataArgs['filePath'] = './static/data/'+pars['fileUploadVisible']

        else:
            raise Exception('Data loading method %s unknown during initialization!' % pars['loadMethod'])
        
        # specify number of preloaded candles
        if pars['t'] == 'create': cls.loadDataArgs['noCandles'] = 1000
        elif pars['t'] == 'inspect': cls.loadDataArgs['noCandles'] = int(pars['noCandles'])
        else: raise Exception('Template %s unknown during initialization!' % pars['t'])

    @classmethod
    def load(cls, dtLimit, direction):
        """Call method for actual data loading
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
    def loadPatterns(cls, t):
        """Load and return patterns from json file"""

        if t == 'create':
            
            try:
                with open(cls.patternFile, 'r') as patternFile:
                    patterns = json.load(patternFile)
            except:
                patterns = []
            
            return patterns

        elif t == 'inspect':

            if os.path.isfile(cls.patternFile):
                
                try:
                    with open(cls.patternFile, 'r') as patternFile:
                        patterns = json.load(patternFile)
                    return patterns
                
                except Exception as e:
                    raise Exception('Error during loading pattern file: %s' % e)
            
            else:
                raise Exception('Pattern file %s does not exist!' % (cls.patternFile))

        else:
            raise Exception('Unknown template!')

    @classmethod
    def deletePattern(cls, pointer):
        """Deletes pattern with given pointer from json file"""

        if os.path.isfile(cls.patternFile):
            # load pattern file
            try:
                with open(cls.patternFile, 'r') as patternFile:
                    patterns = json.load(patternFile)
            except Exception as e:
                raise Exception('Error during loading pattern file: %s' % e)

            # delete pattern
            try:
                del patterns[pointer]
            except Exception as e:
                raise Exception('Error during deleting pattern: %s' % e)

            # dumps updated patterns into file
            try:
                with open(cls.patternFile, 'w') as patternFile:
                    patternFile.write(json.dumps(patterns, indent=4))
            except Exception as e:
                raise Exception('Error during saving pattern file: %e' % e)
            
        else:
            raise Exception('Pattern file does not exist!')
    
    @classmethod
    def editPattern(cls, pointer, startDt, stopDt):
        """Edit datetimes of pattern with given pointer"""

        if os.path.isfile(cls.patternFile):
            # load pattern file
            try:
                with open(cls.patternFile, 'r') as patternFile:
                    patterns = json.load(patternFile)
            except Exception as e:
                raise Exception('Error during loading pattern file: %s' % e)

            # edit pattern
            try:
                patterns[pointer]['startDt'] = startDt
                patterns[pointer]['stopDt'] = stopDt
            except Exception as e:
                raise Exception('Error during editing pattern: %s' % e)

            # dumps updated patterns into file
            try:
                with open(cls.patternFile, 'w') as patternFile:
                    patternFile.write(json.dumps(patterns, indent=4))
            except Exception as e:
                raise Exception('Error during saving pattern file: %e' % e)
            
        else:
            raise Exception('Pattern file does not exist!')
