import moment = require('moment');
import Fetch = require('node-fetch');
import signUtil = require('./sign');
const fetch = Fetch.default;

interface AliOptions {
    appId: string;
    appPrivateKey: string;
    aliPublicKey: string;
    gateway: string;
    notifyUrl: string;
}

class Ali {
    private appId: string;
    private appPrivateKey: string;
    private aliPublicKey: string;
    private gateway: string;
    private notifyUrl: string;

    constructor(options: AliOptions) {
        this.appId = options.appId;
        this.appPrivateKey = options.appPrivateKey;
        this.aliPublicKey = options.aliPublicKey;
        this.gateway = options.gateway;
        this.notifyUrl = options.notifyUrl;
    }

    async h5Pay(goodsDescription: string, goodsPrice: number, outTradeNo: string, returnUrl: string): Promise<{ [key: string]: any }> {
        let timestamp = moment().format(`YYYY-MM-DD HH:mm:ss`),
            params: { [key: string]: any } = {
                app_id: this.appId,
                method: 'alipay.trade.wap.pay',
                charset: 'utf-8',
                sign_type: 'RSA2',
                timestamp: timestamp,
                version: '1.0',
                return_url: returnUrl,
                notify_url: this.notifyUrl,
                biz_content: JSON.stringify({
                    subject: goodsDescription,//商品描述
                    out_trade_no: outTradeNo,
                    total_amount: goodsPrice / 100,
                    // quit_url: settings.quitUrl,
                    product_code: 'QUICK_WAP_WAY',
                }),
            },
            sign = signUtil.rsaSha256.sign({ params: params, privateKey: this.appPrivateKey });
        params.sign = sign;
        let paramsStr = Object.keys(params).map(k => `${k}=${encodeURIComponent(params[k])}`).join('&'),
            url = `${this.gateway}?${paramsStr}`;
        return { url };
    }

    async queryOrder(outTradeNo: string): Promise<boolean> {
        let timestamp = moment().format(`YYYY-MM-DD HH:mm:ss`),
            params: { [key: string]: any } = {
                app_id: this.appId,
                method: 'alipay.trade.query',
                charset: 'utf-8',
                sign_type: 'RSA2',
                timestamp: timestamp,
                version: '1.0',
                biz_content: JSON.stringify({
                    out_trade_no: outTradeNo,
                })
            },
            sign = signUtil.rsaSha256.sign({ params: params, privateKey: this.appPrivateKey });
        params.sign = sign;
        let paramsStr = Object.keys(params).map(k => `${k}=${encodeURIComponent(params[k])}`).join('&'),
            result = await fetch( `${this.gateway}?${paramsStr}`, { method: 'GET' }),
            resultBody = await result.json(),
            alipay_trade_query_response = resultBody.alipay_trade_query_response,
            trade_status = alipay_trade_query_response ? alipay_trade_query_response.trade_status : 'NOT_PAY';
        return trade_status == 'TRADE_SUCCESS';
    }

    async verifySign(params: { [key: string]: any }): Promise<boolean> {
        let sign = params.sign,
            paramsCp: { [key: string]: any } = JSON.parse(JSON.stringify(params));
        delete paramsCp.sign;
        return signUtil.rsaSha256.checkSign({ paramsWithoutSign: paramsCp, publicKey: this.aliPublicKey, sign: sign });
    }
}

export = Ali;