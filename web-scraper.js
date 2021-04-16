import request from 'request'
import cheerio from 'cheerio'


const investingCurrencyParse = async ticker => {
    /* Example:
    investingCurrencyParse('usd-uah')
     */
    const args = {
        uri: `https://ru.investing.com/currencies/${ticker}`,
        headers: {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.75 Safari/537.36",
            "X-Requested-With": "XMLHttpRequest"
        }
    }
    return new Promise((resolve, reject) => {
        request(args, (err, resp, body) => {
            if (!err && resp.statusCode === 200) {
                let $ = cheerio.load(body)
                const rate = parseFloat($('#last_last')
                    .text()
                    .replace(/,/, '.')
                )
                resolve(rate) // ticker rate
            } else {
                reject(err)
            }
        })
    })
}


export {
    investingCurrencyParse
}

