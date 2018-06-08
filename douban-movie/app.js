// 使用 `eventproxy` 来控制并发

var eventproxy = require('eventproxy')
var superagent = require('superagent')
var cheerio = require('cheerio')
var url = require('url')
var express = require('express')
var ep = new eventproxy()

var app = express()
app.listen(4000, function() {
  console.log('app is listening at port 4000')
})

app.get('/', function(request, response) {
  const baseUrl = 'https://movie.douban.com/chart'
  const detailUrls = []
  const list = []

  superagent.get(baseUrl).end(function(err, res) {
    if (err) return console.log(err)

    const $ = cheerio.load(res.text)
    $('#content .types span a').each(function(_, element) {
      const bar = $(element)
        .attr('href')
        .split('?')[1]

      const href =
        'https://movie.douban.com/j/chart/top_list?' + bar + '&limit=10'
      detailUrls.push(href)
    })

    detailUrls.forEach(function(x) {
      superagent.get(x).end(function(err, res) {
        if (err) {
          ep.emit('got_detail_html', [])
        } else {
          ep.emit('got_detail_html', JSON.parse(res.text))
        }
      })
    })

    ep.after('got_detail_html', detailUrls.length, function(bar) {
      bar.forEach(function(text) {
        list.push(text)
      })

      response.send(list)
    })
  })
})
