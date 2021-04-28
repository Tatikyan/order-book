import React, {Component} from 'react';
import './style.scss'

class OrderBookData extends Component {
  state = {
    data: [],
    newData: [],
    titles: [],
    isAllData: false,
    filterData: {
      bid: false,
      ask: false,
      high: false,
      low: false,
      last: true,
      symbol: false,
    },
    filterType: ''
  };

  componentDidMount() {
    this.webSocket()
  }

  webSocket = () => {
    const getSymbols = {
      "method": "getSymbols",
      "params": {},
      "id": 123
    };

    const ws = new WebSocket('wss://api.exchange.bitcoin.com/api/2/ws');
    ws.onopen = () => {
      ws.send(JSON.stringify(getSymbols));
    };
    ws.onmessage = (event) => {
      const response = JSON.parse(event.data);

      const symbols = response.result;
      symbols.forEach(obj => {
        this.createList(obj, true);
        const getRates = {
          "method": "subscribeTicker",
          "params": {
            "symbol": obj.id,
          },
          "id": 123
        };
        let responseRates;
        ws.send(JSON.stringify(getRates));
        ws.onmessage = (event) => {
          responseRates = JSON.parse(event.data);
          this.createList(responseRates.params, false);
        };
      })
    };

    ws.onclose = () => {
      ws.close();
    };
  };


  // create list and titles
  createList = (item, isTitle) => { // (1)
    const {data, titles} = this.state;
    if (item) {
      this.updateRowColor(item);

      if (isTitle) {
        const i = titles.findIndex(_item => _item.id === item.id);
        if (i > -1) titles[i] = item; // (2)
        else titles.push(item);
      } else {
        const i = data.findIndex(_item => _item.symbol === item.symbol);
        if (i > -1) data[i] = item; // (2)
        else data.push(item);
      }
    }
    this.setState({data, titles})

  };

  // for left titles
  writeTitle = (titles, item) => {
    let text = '';
    if (titles && item) {
      text = titles.find(x => item.symbol === x.id);
      text = text.baseCurrency + ' / ' + text.feeCurrency
    }
    return text
  };

  // click on header tags  to sort
  toggleSort = (key) => {
    const {filterData} = this.state;
    filterData[key] = !filterData[key];
    this.setState({filterData, filterType: key}, () => {
    })
  };

  // button  click for show all  list or 50 items
  showAllList = () => {
    this.setState({isAllData: !this.state.isAllData})
  };

  // return  new data array
  getData = () => {
    const {data, isAllData, filterData, filterType} = this.state;
    let newData;
    if (data) {
      if (isAllData) {
        newData = this.bubbleSortDown(data, 'last')
      } else {
        newData = this.bubbleSortDown(data, filterType).slice(0, 50);
        newData = this.bubbleSortDown(newData, 'last')
      }

      if (filterData[filterType]) {
        newData = this.bubbleSortDown(newData, filterType)

      } else {
        newData = this.bubbleSortUp(newData, filterType)
      }
    }
    return newData
  };

  updateRowColor = (item) => {
    const {data} = this.state;
    data.forEach((element, index, array) => {
      if (item.last && element.last && item.symbol === element.symbol) {
        if (item.last > element.last) {
          item.lastChange = 'up';
        } else if (item.last < element.last) {
          item.lastChange = 'down';
        } else {
          item.lastChange = '';
        }
        setTimeout(() => {
          item.lastChange = '';

        }, 0)
      }
    });
  };

  bubbleSortUp = (array, type) => {
    let swapp;
    let n = array.length - 1;
    let x = array;
    do {
      swapp = false;
      for (let i = 0; i < n; i++) {
        if (type === 'symbol') {
          if (x[i][type] > x[i + 1][type]) {
            let temp = x[i];
            x[i] = x[i + 1];
            x[i + 1] = temp;
            swapp = true;
          }
        } else {
          if (+x[i][type] > +x[i + 1][type]) {
            let temp = x[i];
            x[i] = x[i + 1];
            x[i + 1] = temp;
            swapp = true;
          }
        }
      }
      n--;
    } while (swapp);
    return x;
  };
  bubbleSortDown = (array, type) => {
    let swapp;
    let n = array.length - 1;
    let x = array;
    do {
      swapp = false;
      for (let i = 0; i < n; i++) {

        if (type === 'symbol') {
          if (x[i][type] < x[i + 1][type]) {
            let temp = x[i];
            x[i] = x[i + 1];
            x[i + 1] = temp;
            swapp = true;
          }
        } else {
          if (+x[i][type] < +x[i + 1][type]) {
            let temp = x[i];
            x[i] = x[i + 1];
            x[i + 1] = temp;
            swapp = true;
          }
        }
      }
      n--;
    } while (swapp);
    return x;
  };

  render() {
    const {data, titles, isAllData} = this.state;
    return (
        <div className="G-container">
            <h1>Exchange Quotes</h1>
          <button className='P-show-all-brn'
                  onClick={this.showAllList}>{!isAllData ? 'Show all' : 'Show top 50'}</button>
          {data ? <div className='P-table-block'>
            <div className='P-table-header'>
              <ul className='G-flex'>
                <li onClick={() => this.toggleSort('symbol')}
                    className={`${this.state.filterData.symbol ? 'P-up' : ''}`}>Ticker
                </li>
                <li onClick={() => this.toggleSort('bid')}
                    className={`${this.state.filterData.bid ? 'P-up' : ''}`}>Bid
                </li>
                <li onClick={() => this.toggleSort('ask')}
                    className={`${this.state.filterData.ask ? 'P-up' : ''}`}>Ask
                </li>
                <li onClick={() => this.toggleSort('high')}
                    className={`${this.state.filterData.high ? 'P-up' : ''}`}>High
                </li>
                <li onClick={() => this.toggleSort('low')}
                    className={`${this.state.filterData.low ? 'P-up' : ''}`}>Low
                </li>
                <li onClick={() => this.toggleSort('last')}
                    className={`${this.state.filterData.last ? 'P-up' : ''}`}>Last
                </li>
              </ul>
            </div>
            <div className='P-table-body'>
              {this.getData().map((item, index) => {
                return <ul key={index} className={`G-flex ${item.lastChange}`}>
                  <li>{this.writeTitle(titles, item)}</li>
                  <li>{item.bid  || '—'}</li>
                  <li>{item.ask  || '—'}</li>
                  <li>{item.high || '—'}</li>
                  <li>{item.low  || '—'}</li>
                  <li>{item.last || '—'}</li>
                </ul>
              })}
            </div>
          </div> : null}
        </div>
    );
  }
}

export default OrderBookData;
