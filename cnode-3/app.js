// 使用 `async` 来控制并发

var async = require('async')
var superagent = require('superagent')
var cheerio = require('cheerio')
var url = require('url')
var express = require('express')
var concurrencyCount = 0
var app = express()
app.listen(4000, function() {
  console.log('app is listening at port 4000')
})

app.get('/', function(request, response) {
  const cnodeUrl = 'https://cnodejs.org/'
  const list = []
  const topicUrls = []

  superagent.get(cnodeUrl).end(function(err, res) {
    if (err) return console.log(err)

    const $ = cheerio.load(res.text)
    $('#topic_list .topic_title').each(function(_, element) {
      const href = url.resolve(cnodeUrl, $(element).attr('href'))
      topicUrls.push(href)
    })

    async.mapLimit(
      topicUrls,
      5,
      function(url, callback) {
        fetchUrl(url, callback)
      },
      function(err, result) {
        response.send(result)
      },
    )
  })
})

function fetchUrl(url, callback) {
  var delay = parseInt(Math.random() * 2000, 10)
  concurrencyCount++
  console.log(`当前并发数：${concurrencyCount}`)
  setTimeout(function() {
    concurrencyCount--
    superagent.get(url).end(function(err, res) {
      const $ = cheerio.load(res.text)
      callback(null, {
        href: url,
        title: $('.topic_full_title')
          .text()
          .trim(),
        comment1: $('.reply_content')
          .eq(0)
          .text()
          .trim(),
      })
    })
  }, delay)
}
