var eventproxy = require('eventproxy')
var superagent = require('superagent')
var cheerio = require('cheerio')
var url = require('url')

var cnodeUrl = 'https://cnodejs.org/'
var list = []

superagent.get(cnodeUrl).end(function(err, res) {
  if (err) return console.log(err)

  var topicUrls = []
  var $ = cheerio.load(res.text)
  $('#topic_list .topic_title').each(function(_, element) {
    const href = url.resolve(cnodeUrl, $(element).attr('href'))
    topicUrls.push(href)
  })

  var ep = new eventproxy()

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

    console.log('final:')
    console.log(list)
  })

  topicUrls.forEach(function(topicUrl) {
    superagent.get(topicUrl).end(function(err, res) {
      ep.emit('got_topic_html', [topicUrl, res.text])
    })
  })
})
