process.env.NTBA_FIX_319 = 1 // telegram api bug fix

import { getClientInfo } from './utils.js'
import { investingCurrencyParse } from './web-scraper.js'
import express from 'express'
import bodyParser from 'body-parser'
import mongoose from "mongoose"
import schedule from 'node-schedule'
import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv'

dotenv.config()
let bot
let job

if (process.env.NODE_ENV === 'production') {
    // const token = process.env.TELEGRAM_TOKEN,
    //     host = '0.0.0.0',
    //     port = process.env.PORT || 3000,
    //     externalUrl = process.env.CUSTOM_ENV_VARIABLE || `https://${process.env.HEROKU_APP}.herokuapp.com`
    // bot = new TelegramBot(token, { webHook: { port : port, host : host } })
    // bot.setWebHook(externalUrl + ':443/bot' + token)
    bot = new TelegramBot(process.env.TELEGRAM_TOKEN)
    bot.setWebHook(`https://${process.env.HEROKU_URL}.herokuapp.com/` + bot.token)
} else {
    bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true })
}

const connection  = mongoose.createConnection(process.env.MONGODB_URI || 'mongodb://localhost/macpaw_exchange_bot',
    { useNewUrlParser: true, useUnifiedTopology: true })
const Schema = mongoose.Schema
const userTickersSchema = new Schema({
    chatId: String,
    ticker: String, // "usd-uah"
    value: Number, // 27.9925
    time: { type: Date, default: Date.now }
})
const userTickers = connection.model('userTickers', userTickersSchema)

// HANDLERS
const query = data => ({ 'ticker': data.ticker, 'chatId': data.chatId })

const getLastUpdate = async data => await userTickers.findOne(query(data))

const updateUserTickers = async data => {
    userTickers
        .findOneAndReplace(query(data), data, { "returnNewDocument": false })
        .then(replaceData => {
            if (replaceData) {
                // console.log('Replaced', replaceData)
            } else {
                // console.log('No matches')
            }
            return replaceData
        })
        .catch(err => console.error('Failed to find and replace', err))
}

const saveUserTickers = async data => await userTickers.create(data)


// Cron Setup
bot.on("callback_query", cbQ => {
    const info = getClientInfo(cbQ.message)
    const cbData = JSON.parse(cbQ.data)

    let cronArgs
    let text
    switch (cbData.when) {
        case 'day':
            text = 'Alert: Each Day at 13:00'
            cronArgs = { hour: 13 }
            break
        case 'hour':
            text = 'Alert: Each Hour at :00'
            cronArgs = { minute: 0 }
            break
        case 'minute':
            text = 'Alert: Each Minute at :00'
            cronArgs = { second: 0 }
            break
    }
    // console.log(text, cronArgs, data.ticker, typeof data.ticker)
    // console.log(info.telegramId)

    job = schedule.scheduleJob(cronArgs, async _ => {
        await investingCurrencyParse(cbData.ticker)
            .then(async value => {

                const data = {
                    chatId: info.telegramId,
                    ticker: cbData.ticker,
                    value
                }
                getLastUpdate(data)
                    .then(async prevData => {
                        // console.log(prevData)
                        // console.log(data)
                        if (prevData) {
                            if (prevData.value < data.value) {
                                await bot.sendMessage(info.telegramId, `${data.ticker} has grown from ${prevData.value} to ${data.value}`)
                            } else { }
                            await updateUserTickers(data)
                        } else {
                            await saveUserTickers(data)
                            await bot.sendMessage(info.telegramId, `${data.ticker} is ${data.value}`)
                        }
                    })
                // console.log(value)
            })
            .catch(console.log)
    })

})


// Start bot
bot.onText(/\/start/, async msg => {
    const info = getClientInfo(msg)

    // Get Currency
    await bot.sendMessage(info.telegramId, 'Type currency ticker (example: usd-uah)')
    await bot.onText(/\w+\-\w+/, async (msg, [match, _]) => {
        // Get Notification Date
        await bot.sendMessage(info.telegramId, 'When notify about currency growth?', {
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: 'Each Day at 13:00',
                        callback_data: JSON.stringify({ when: 'day', ticker: match })
                    },{
                        text: 'Each Hour',
                        callback_data: JSON.stringify({ when: 'hour', ticker: match })
                    },{
                        text: 'Each Minute',
                        callback_data: JSON.stringify({ when: 'minute', ticker: match })
                    }
                ]]
            }
        })
    })
})


// Stop bot
bot.onText(/\/stop/, msg => {
    const { chat: { id }} = msg
    if (job) {
        bot.sendMessage(id, 'MacPaw Bot Stopped')
        job.cancel()
    }
})

// Errors
bot.on("polling_error", console.log)

const app = express()
app.listen(process.env.PORT)
app.use(bodyParser.json())
app.post('/' + bot.token, (req, res) => {
    bot.processUpdate(req.body)
    res.sendStatus(200)
})
