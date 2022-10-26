import streamlit as st
import plotly.express as px
import numpy as np
import pandas as pd
from datetime import datetime

st.title("Nethermind : application to observe historical data from Uniswap liquidity pools")


df = pd.read_csv('blockchainData.csv')
keyData = df.keys()
finalData = dict()
# from string to number
for keysBlckData in df:
    longString = df[keysBlckData][0][1:-1]
    separateString = longString.split(',')
    dataBlck = np.empty(len(separateString))
    for iElement in range(len(separateString)):
        dataBlck[iElement] = (pd.to_numeric(separateString[iElement]))    
    finalData[keysBlckData] = dataBlck


# set date from unix timestamp to readable
i = 0
dateArray = []
for iDate in finalData['Date']:
    dateArray.append(datetime.utcfromtimestamp(int(iDate)).strftime('%Y-%m-%d %H:%M:%S'))
    i = i+1

finalData.pop('Date')
dateArray_Df = pd.DataFrame(data=dateArray)
unisLiPl_data = pd.DataFrame(data=finalData)
unisLiPl_data = dateArray_Df.join(unisLiPl_data)
unisLiPl_data.columns = ['Date', keyData[1], keyData[2]]

# plot on streamlit
fig = px.line(unisLiPl_data,x='Date', y=[keyData[1],keyData[2]])
fig.add_scatter(x=unisLiPl_data['Date'], y=unisLiPl_data[keyData[1]]+unisLiPl_data[keyData[2]], mode='lines',name = 'TVL')
fig.update_layout(title_text='Uniswap liquidity pool ' + keyData[1] +' - ' + keyData[2], xaxis_title = "date", yaxis_title = "value ($)",legend_title="token pair")

st.plotly_chart(fig, use_container_width=True)
