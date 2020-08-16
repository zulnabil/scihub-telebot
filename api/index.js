// const Telegraf = require('telegraf')
const axios = require('axios')
const qs = require('querystring')
const { Composer } = require('micro-bot')

const token = process.env.TOKEN_PROD
const bot = new Composer(token)
// const bot = new Telegraf(token)

const admin_chat_id = 546426425

// welcome message
bot.start((ctx) => {
  const fullname = `${ctx.from.first_name}${ctx.from.last_name ? ' '+ctx.from.last_name : ''}`
  console.log(fullname, 'mendaftar.')
  ctx.reply(`Halo ${ctx.from.first_name} ${ctx.from.last_name || ''}\nSelamat datang di aplikasi pembuka Paper yang terkunci.\nKamu bisa langsung mengunduh file pdf paper yang diinginkan dari sini.\n\nKetik perintah berikut: \nbuka \"Link paper atau DOI atau PMID\"\n\nContoh dengan Link paper: \nbuka https://www.sciencedirect.com/science/article/abs/pii/S0191886914003560\n\nContoh dengan DOI: \nbuka https://doi.org/10.1016/j.apnu.2015.05.006\n\nContoh dengan PMID: \nbuka 3945130\n\nTerimakasih, bijak dalam menggunakan ya.`, { disable_web_page_preview: true })
})

bot.help((ctx) => ctx.reply(`Halo ${ctx.from.first_name} ${ctx.from.last_name || ''}\nSelamat datang di aplikasi pembuka Paper yang terkunci.\nKamu bisa langsung mengunduh file pdf paper yang diinginkan dari sini.\n\nKetik perintah berikut: \nbuka \"Link paper atau DOI atau PMID\"\n\nContoh dengan Link paper: \nbuka https://www.sciencedirect.com/science/article/abs/pii/S0191886914003560\n\nContoh dengan DOI: \nbuka https://doi.org/10.1016/j.apnu.2015.05.006\n\nContoh dengan PMID: \nbuka 3945130\n\nTerimakasih, bijak dalam menggunakan ya.`))


// find url DOI, use PMID if DOI not found
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

// find title of paper
const findTitle = (reqhtml) => {
  const regex = /<title>((.|\n)*?)<\/title>/
  const find = reqhtml.match(regex)
  return find ? find[1] : null
}

// core
bot.hears(/buka (.+)/, async (ctx) => {
  // initial
  const fullname = `${ctx.from.first_name}${ctx.from.last_name ? ' '+ctx.from.last_name : ''}`
  const user = ctx.from.first_name
  const req = ctx.match[1]
  let attempt = 0
  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }

  // identify input
  const isDOI = req.match('doi.org')
  const isLink = req.match('http')

  isDOI ? ctx.reply('Kamu mengirim URL DOI\nMemproses paper...') :
  isLink ? (ctx.reply('Kamu mengirim link Paper\nMenganalisa link...')) :
  ctx.reply('Kamu mengirim PMID\nMemproses paper...')
  
  // send report to admin
  ctx.reply(`${fullname} membuat permintaan.`, { chat_id: admin_chat_id })

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
})

// bot.launch()
//     .then(() => console.log('Server running'))

module.exports = bot