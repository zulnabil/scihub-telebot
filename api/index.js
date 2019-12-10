const Telegraf = require('telegraf')
const axios = require('axios')
const qs = require('querystring')

const token = '1055599150:AAE6WR-IKacoI_MOO5p0lBsb_SUfUN-KEVI'

const bot = new Telegraf(token)

bot.start((ctx) => ctx.reply(`Selamat datang di aplikasi pembuka Paper yang terkunci.\nKamu bisa langsung mengunduh file pdf paper yang diinginkan dari sini.\n\nKetik perintah berikut: \nbukakunci \"URL DOI atau kode PMID\"\n\nContoh dengan URL DOI: \nbukakunci https://doi.org/10.1016/j.apnu.2015.05.006\n\nContoh dengan PMID: \nbukakunci 3945130\n\nTerimakasih, bijak dalam menggunakan ya.
`))

bot.help((ctx) => ctx.reply(`Selamat datang di aplikasi pembuka Paper yang terkunci.\nKamu bisa langsung mengunduh file pdf paper yang diinginkan dari sini.\n\nKetik perintah berikut: \nbukakunci \"URL DOI atau kode PMID\"\n\nContoh dengan URL DOI: \nbukakunci https://doi.org/10.1016/j.apnu.2015.05.006\n\nContoh dengan PMID: \nbukakunci 3945130\n\nTerimakasih, bijak dalam menggunakan ya.
`))


bot.hears(/domain (.+)/, (ctx) => {
  const req = ctx.match[1]
  axios.get('https://api.indoxploit.or.id/domain/'+req)
    .then(res => {
      const info = res.data.data.whois
      console.log(res.data.data.geolocation)
      info ? ctx.reply(info) : ctx.reply('Data tidak ditemukan.')
    })
})

// core
bot.hears(/bukakunci (.+)/, (ctx) => {
  const req = ctx.match[1]
  const isDOI = req.match('http')
  isDOI ? ctx.reply('Memproses paper dengan URL DOI...') : ctx.reply('Memproses paper dengan PMID...')
  const requestBody = {
    request: req
  }
  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }
  const regex = /<iframe src = \"(.*?)\" id = \"pdf\"><\/iframe>/
  axios.post('https://sci-hub.tw/', qs.stringify(requestBody), config)
    .then(res => {
      const found = res.data.match(regex)
      // console.log(found[1])
      found ? ctx.replyWithDocument(found[1]) : ctx.reply('Data tidak ditemukan.')
    })
    .catch((err) => {
      ctx.reply('Data tidak ditemukan. err: '+err)
    })
})


bot.launch()
// module.exports = (req, res) => {
//   bot.launch(req.body, res)
// }