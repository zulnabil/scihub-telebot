const Telegraf = require('telegraf')
const axios = require('axios')
const qs = require('querystring')

const token = '943004924:AAHH0umsj_c4ktwI1ouckK6kASTUxV-YRdQ'

const bot = new Telegraf(token)

bot.start((ctx) => {
  console.log(ctx.from.first_name, 'mendaftar.')
  ctx.reply(`Halo ${ctx.from.first_name} ${ctx.from.last_name || ''}\nSelamat datang di aplikasi pembuka Paper yang terkunci.\nKamu bisa langsung mengunduh file pdf paper yang diinginkan dari sini.\n\nKetik perintah berikut: \nbuka \"Link paper atau DOI atau PMID\"\n\nContoh dengan Link paper: \nbuka https://www.sciencedirect.com/science/article/abs/pii/S0191886914003560\n\nContoh dengan DOI: \nbuka https://doi.org/10.1016/j.apnu.2015.05.006\n\nContoh dengan PMID: \nbuka 3945130\n\nTerimakasih, bijak dalam menggunakan ya.`)
})

bot.help((ctx) => ctx.reply(`Halo ${ctx.from.first_name} ${ctx.from.last_name || ''}\nSelamat datang di aplikasi pembuka Paper yang terkunci.\nKamu bisa langsung mengunduh file pdf paper yang diinginkan dari sini.\n\nKetik perintah berikut: \nbuka \"Link paper atau DOI atau PMID\"\n\nContoh dengan Link paper: \nbuka https://www.sciencedirect.com/science/article/abs/pii/S0191886914003560\n\nContoh dengan DOI: \nbuka https://doi.org/10.1016/j.apnu.2015.05.006\n\nContoh dengan PMID: \nbuka 3945130\n\nTerimakasih, bijak dalam menggunakan ya.`))


bot.hears(/domain (.+)/, (ctx) => {
  const req = ctx.match[1]
  axios.get('https://api.indoxploit.or.id/domain/'+req)
    .then(res => {
      const info = res.data.data.whois
      console.log(res.data.data.geolocation)
      info ? ctx.reply(info) : ctx.reply('Data tidak ditemukan.')
    })
})

// dev
bot.hears(/dev (.+)/, ctx => {
  const regex = /https?:\/\/doi\.org(\/[A-Za-z0-9\-\._~:\/\?#\[\]@!$&\(\)\*\+,;\=]*)?/
  const req = ctx.match[1]
  const PMID = req.match(/\/([^\/]+)\/?$/)[1]
  console.log('wew')
  axios.get(req)
    .then(res => {
      const find = res.data.match(regex)
      find ? console.log(find[0]) : console.log(PMID)
    })
})

// mencari doi di link, gunakan pmid jika tidak ditemukan
const findDOIorPMID = (req, reqhtml) => {
  const isDOI = req.match('doi.org')
  const regex = /https?:\/\/doi\.org(\/[A-Za-z0-9\-\._~:\/\?#\[\]@!$&\(\)\*\+,;\=]*)?/
  const PMID = req.match(/\/([^\/]+)\/?$/)[1]
  const find = reqhtml.match(regex)
  return (
    isDOI ? req :
    find ? find[0] : PMID
  )
}

// mencari title di res html
const findTitle = (reqhtml) => {
  const regex = /<title>((.|\n)*?)<\/title>/
  const find = reqhtml.match(regex)
  return find ? find[1] : null
}

// core
bot.hears(/buka (.+)/, async (ctx) => {
  // inisialisasi
  const user = ctx.from.first_name
  const req = ctx.match[1]
  let attempt = 0
  // const requestBody = {
  //   request: detected
  // }
  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }

  // identifikasi input
  const isDOI = req.match('doi.org')
  const isLink = req.match('http')

  isDOI ? ctx.reply('Kamu mengirim URL DOI') :
  isLink ? (ctx.reply('Kamu mengirim link Paper\nMenganalisa link...')) :
  ctx.reply('Kamu mengirim PMID')
  

  // mengirim ke user
  // ctx.reply('Menganalisa link...')

  console.log(user, 'membuat permintaan.')
  // mengirim ke admin
  ctx.reply(`${user} membuat permintaan.`, { chat_id: 546426425 })

  const sendDocument = (doc, requestBody) => {
    ctx.replyWithDocument(doc, { caption: '*Berhasil membuka!* silahkan unduh file papermu. Terimakasih sudah menggunakan *PembukaPaper*.', parse_mode: 'Markdown' })
      .then(() => console.log(`Percobaan ke ${attempt+1} ${user} berhasil\nPermintaan ${user} selesai. File pdf telah dikirim.`))
      .catch(() => {
        console.log(`Percobaan ke ${attempt+1} ${user} gagal`)
        attempt++
        if (attempt == 5) {
          ctx.reply('Tolong menunggu, server masih memproses.')
          fetchData(requestBody)
        }
        else if (attempt == 10) {
          console.log(`Permintaan ${user} selesai. Data tidak dapat diproses.`)
          return ctx.reply('Maaf data tidak ditemukan, kamu boleh coba paper lain.')
        } else {
          fetchData(requestBody)
        }
      }) 
  }
  
  const fetchData = (requestBody) => {
    const regex = /<iframe src = \"(.*?)\" id = \"pdf\"><\/iframe>/
    axios.post('https://sci-hub.tw/', qs.stringify(requestBody), config)
      .then(res => {
        const found = res.data.match(regex)
        console.log(`Mencoba membuka paper ${user} [${attempt+1}] ...`)
        sendDocument(found[1], requestBody)
      })
      .catch(() => {
        console.log(`Permintaan ${user} selesai. Data tidak ditemukan.`)
        ctx.reply('Maaf data tidak ditemukan, kamu boleh coba paper lain.')
      })
  }

  if (!req.match('http')) {
    console.log(`Memproses paper ${user} dengan PMID: ${req}`)
    fetchData({ request: req })
  } else {
    // get res html
    axios.get(req)
    .then(res => {
      let resHTML = res.data
      const detected = findDOIorPMID(req, resHTML)
      const title = findTitle(resHTML)

      if (!detected) {
        ctx.reply(`Maaf paper tidak dapat diproses, kamu boleh coba yang lain.`)
      } else {
        const isDOIpriv = detected.match('http')
        isDOIpriv ? console.log(`Memproses paper ${user} dengan URL DOI: ${detected}`) : console.log(`Memproses paper ${user} dengan PMID: ${detected}`)
        isLink && !isDOI ? ctx.reply(`Memproses paper dengan judul: \n_${title}_`, { parse_mode: 'Markdown' }) : null
        fetchData({ request: detected })
      }
    })
  }

  

  // link yg te bisa : 
  // https://dacemirror.sci-hub.tw/journal-article/f13751a25ec6729b175f067caed24bb3/10.1016@j.apnu.2015.05.006.pdf#view=FitH
  // https://zero.sci-hub.tw/4498/f13751a25ec6729b175f067caed24bb3/10.1016@j.apnu.2015.05.006.pdf#view=FitH
  // new https://zero.sci-hub.tw/4498/f13751a25ec6729b175f067caed24bb3/10.1016@j.apnu.2015.05.006.pdf?download=true

  // link yg bsa : 
  // https://moscow.sci-hub.tw/4498/f13751a25ec6729b175f067caed24bb3/10.1016@j.apnu.2015.05.006.pdf#view=FitH
})


bot.launch()
  .then(() => console.log('Server dev berjalan'))