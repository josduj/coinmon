#!/usr/bin/env node
const program = require('commander');
const axios = require('axios');
const ora = require('ora');
const Table = require('tty-table')('automattic-cli-table');
const colors = require('colors');

program
  .version('0.0.6')
  .option('-c, --convert [currency]', 'Convert to your fiat currency', 'usd')
  .option('-f, --find [keyword]', 'Find specific coin data with coin symbol or name', null)
  .option('-t, --top [index]', 'Show the top coins ranked from 1 - [index] according to the market cap', null)
  .parse(process.argv);

const find = program.find
const top = !isNaN(program.top) && +program.top > 0 ? +program.top : (find ? 1500 : 10)
const convert = program.convert.toUpperCase()
const availableCurrencies = ['USD', 'AUD', 'BRL', 'CAD', 'CHF', 'CLP', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PKR', 'PLN', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'TWD', 'ZAR']
if (availableCurrencies.indexOf(convert) === -1) {
  return console.log('We cannot convert to your fiat currency.'.red)
}
const table = new Table({
  chars: {
    'top': '-',
    'top-mid': '-',
    'top-left': '-',
    'top-right': '-',
    'bottom': '-',
    'bottom-mid': '-',
    'bottom-left': '-',
    'bottom-right': '-',
    'left': '║',
    'left-mid': '-' ,
    'mid': '-' ,
    'mid-mid': '-',
    'right': '║',
    'right-mid': '-',
    'middle': '│'
  },
  head: ['Rank', 'Coin', `Price (${convert})`, 'Change (24H)', 'Change (1H)', `Market Cap (${convert})`].map(title => title.yellow),
  colWidths: [6, 14, 15, 15, 15, 20]
});

const spinner = ora('Loading data').start();
const sourceUrl = `https://api.coinmarketcap.com/v1/ticker/?limit=${top}&convert=${convert}`
axios.get(sourceUrl)
.then(function (response) {
  spinner.stop();
  console.log(`Data sourced from coinmarketcap.com at ${new Date().toLocaleTimeString()}`)
  response.data
    .filter(record => {
      if (find) {
        const keyword = `${find}`
        return record.symbol.toLowerCase().indexOf(keyword) !== -1 || record.name.toLowerCase().indexOf(keyword) !== -1
      }
      return true
    })
    .map(record => {
      const percentChange24h = record.percent_change_24h
      const textChange24h = `${percentChange24h}%`
      const change24h = percentChange24h? (percentChange24h > 0 ? textChange24h.green : textChange24h.red) : 'NA'
      const percentChange1h = record.percent_change_1h
      const textChange1h = `${percentChange1h}%`
      const change1h = percentChange1h ? (percentChange1h > 0 ? textChange1h.green : textChange1h.red) : 'NA'
      return [
        record.rank,
        record.symbol.bold,
        record[`price_${convert}`.toLowerCase()], 
        change24h,
        change1h,
        record[`market_cap_${convert}`.toLowerCase()]
      ]
    })
    .forEach(record => table.push(record))
  console.log(table.toString());
})
.catch(function (error) {
  spinner.stop();
  console.error('Coinmon is not working now. Please try again later.'.red);
});