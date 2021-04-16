import { expect } from "chai"
import {investingCurrencyParse} from "../web-scraper.js"

describe('Get usd-uah ticker', () => {
    it('should return float', async () => {
        const rate = await investingCurrencyParse('usd-uah')
        expect(rate).to.be.a('number')
    })
})
