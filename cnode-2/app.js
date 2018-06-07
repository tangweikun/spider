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

    topicUrls.forEach(function(topicUrl) {
      superagent.get(topicUrl).end(function(err, res) {
        ep.emit('got_topic_html', [topicUrl, res.text])
      })
    })

    ep.after('got_topic_html', topicUrls.length, function(topics) {
      topics.forEach(function([topicUrl, topicHtml]) {
        var $ = cheerio.load(topicHtml)
        list.push({
          href: topicUrl,
          title: $('.topic_full_title')
            .text()
            .trim(),
          comment1: $('.reply_content')
            .eq(0)
            .text()
            .trim(),
        })
      })

      response.send(list)
    })
  })
})
