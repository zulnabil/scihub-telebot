const Telegraf = require('telegraf')
const axios = require('axios')
const qs = require('querystring')

const token = '943004924:AAHH0umsj_c4ktwI1ouckK6kASTUxV-YRdQ'

const bot = new Telegraf(token)

bot.start((ctx) => {
  console.log(ctx.from.first_name, 'mendaftar.')
  ctx.reply(`Halo ${ctx.from.first_name} ${ctx.from.last_name || ''}\nSelamat datang di aplikasi pembuka Paper yang terkunci.\nKamu bisa langsung mengunduh file pdf paper yang diinginkan dari sini.\n\nKetik perintah berikut: \nbukakunci \"URL DOI atau kode PMID\"\n\nContoh dengan URL DOI: \nbukakunci https://doi.org/10.1016/j.apnu.2015.05.006\n\nContoh dengan PMID: \nbukakunci 3945130\n\nTerimakasih, bijak dalam menggunakan ya.`)
})

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
bot.hears(/bukakunci (.+)/, async (ctx) => {
  console.log(ctx.from.first_name, 'membuat permintaan')
  let attempt = 0
  const req = ctx.match[1]
  const isDOI = req.match('http')
  isDOI ? ctx.reply('Memproses paper dengan URL DOI: '+req) : ctx.reply('Memproses paper dengan PMID: '+req)
  const requestBody = {
    request: req
  }
  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }
  const regex = /<iframe src = \"(.*?)\" id = \"pdf\"><\/iframe>/

  const sendDocument = (doc) => {
    ctx.replyWithDocument(doc, { caption: 'Berhasil membuka! silahkan unduh file papermu. Terimakasih sudah menggunakan PembukaPaper.' })
      .then(() => console.log(`Percobaan ke ${attempt+1} berhasil\nPermintaan ${ctx.from.first_name} selesai. File pdf telah dikirim.`))
      .catch(() => {
        console.log(`Percobaan ke ${attempt+1} gagal`)
        attempt++
        if (attempt == 5) {
          ctx.reply('Tolong menunggu, server masih memproses.')
          fetchData(requestBody)
        }
        else if (attempt == 10) {
          console.log(`Permintaan ${ctx.from.first_name} selesai. Data tidak ditemukan.`)
          return ctx.reply('Maaf data tidak ditemukan, kamu boleh coba paper lain.')
        } else {
          fetchData(requestBody)
        }
      }) 
  }
  
  const fetchData = (requestBody) => {
    axios.post('https://sci-hub.tw/', qs.stringify(requestBody), config)
      .then(res => {
        const found = res.data.match(regex)
        console.log(`Mencoba membuka paper ${ctx.from.first_name} [${attempt+1}] ...`)
        sendDocument(found[1])
      })
      .catch(() => {
        ctx.reply('Maaf data tidak ditemukan, kamu boleh coba paper lain.')
      })
  }

  fetchData(requestBody)

  // link yg te bisa : 
  // https://dacemirror.sci-hub.tw/journal-article/f13751a25ec6729b175f067caed24bb3/10.1016@j.apnu.2015.05.006.pdf#view=FitH
  // https://zero.sci-hub.tw/4498/f13751a25ec6729b175f067caed24bb3/10.1016@j.apnu.2015.05.006.pdf#view=FitH
  // new https://zero.sci-hub.tw/4498/f13751a25ec6729b175f067caed24bb3/10.1016@j.apnu.2015.05.006.pdf?download=true

  // link yg bsa : 
  // https://moscow.sci-hub.tw/4498/f13751a25ec6729b175f067caed24bb3/10.1016@j.apnu.2015.05.006.pdf#view=FitH
})


bot.launch()