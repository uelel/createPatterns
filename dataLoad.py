import pandas as pd
import numpy as np
from influxdb import DataFrameClient
import datetime
from pytz import timezone

def loadDataFromInfluxdb(dtLimit, direction, noCandles, client):
    """Actual implementation of data loading from Influxdb"""
    
    if direction == 'left':
        query = 'SELECT "time", "open", "high", "low", "close" ' \
                'FROM "rates" WHERE time < \'%s\' ' \
                'ORDER BY DESC LIMIT %i' % (dtLimit, noCandles)
    elif direction == 'right':
        query = 'SELECT "time", "open", "high", "low", "close" ' \
                'FROM "rates" WHERE time > \'%s\' ' \
                'ORDER BY ASC LIMIT %i' % (dtLimit, noCandles)
    
    try:
        rates = client.query(query)['rates']
    except Exception as error:
        raise Exception('Error during loading data from influxdb '
                        '(dtLimit=%s, direction=%s, noCandles=%i): %s' %
                        (dtLimit,
                         direction,
                         noCandles,
                         error))
   
    try:
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
    except Exception as error:
        raise Exception('Error during modifying pandas array '
                        'of loaded data: %s' % error)
    
    return rates

def loadDataFromFile(dtLimit, direction, noCandles, filePath):
    """Actual implementation of data loading from file"""
    
    # Adjust dtLimit string to match file format
    dtLimit = datetime.datetime.strptime(dtLimit, '%Y-%m-%dT%H:%M:%S.000Z')
    dtLimit = timezone('UTC').localize(dtLimit)
    dtLimit = dtLimit.strftime('%Y-%m-%d-%H:%M:%S%z')
    
    # Check if data file exists
    if not os.path.isfile(filePath): raise Exception('Data file does not exist!')

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
    if not dtLimitFound: raise Exception('No such data exist in given file!')

    # Load up data to pandas array
    try:
        if direction == 'left':
            rates = pd.read_csv(filePath,
                                index_col=False,
                                names=['Date',
                                       'Open',
                                       'High',
                                       'Low',
                                       'Close',
                                       'Spread'],
                                delimiter=' ',
                                skiprows=startLine-noCandles,
                                nrows=noCandles)
        if direction == 'right':
            rates = pd.read_csv(filePath,
                                index_col=False,
                                names=['Date',
                                       'Open',
                                       'High',
                                       'Low',
                                       'Close',
                                       'Spread'],
                                delimiter=' ',
                                skiprows=startLine,
                                nrows=noCandles)
    except Exception as error:
        raise Exception('Error during loading data from data file %s: %s' % 
                        (filePath,
                         error))

    if rates.empty: raise Exception('No such data exist in given file!')

    # Delete last column
    try:
        del rates['Spread']
        # Parse datetimes in array
        rates['Date'] = rates['Date'].apply(lambda x: datetime.datetime.strptime(x, '%Y-%m-%d-%H:%M:%S%z'))
    except Exception as error:
        raise Exception('Error during modifying pandas array of '
                        'loaded data: %s' % error)

    return rates
