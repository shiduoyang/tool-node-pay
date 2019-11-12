import moment = require('moment');
import Fetch = require('node-fetch');
import signUtil = require('./sign');
import redis = require('redis');
import Cache = require('./cache');
import { readXml, buildXMLData } from './xml';
const fetch = Fetch.default;

interface WxOptions {
    appId: string;
    appSecret: string;
    spbillCreateIp: string;
    mchId: string;    
    payNotifyUrl: string;
    key: string;
    redisClient: redis.RedisClient;
    cache: Cache;
    wxH5TokenKey: string;
    wxH5TicketKey: string;
}

class Wx {
    private appId: string;
    private appSecret: string;
    private spbillCreateIp: string;
    private mchId: string;
    private payNotifyUrl: string;
    private key: string;
    private redisClient: redis.RedisClient;
    private cache: Cache;
    private wxH5TokenKey: string;
    private wxH5TicketKey: string;

    constructor(options: WxOptions) {
        this.appId = options.appId;
        this.appSecret = options.appSecret;
        this.spbillCreateIp = options.spbillCreateIp;
        this.mchId = options.mchId;
        this.payNotifyUrl = options.payNotifyUrl;
        this.key = options.key;
        this.redisClient = options.redisClient;
        this.cache = new Cache(this.redisClient);
        this.wxH5TokenKey = options.wxH5TokenKey;
        this.wxH5TicketKey = options.wxH5TicketKey;
    }

    async getNewToken(): Promise<string> {
        const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`;
        let resp = await fetch(url, { method: 'GET'});
        let info = await resp.json();
        await this.cache.setCache(this.wxH5TokenKey, info.access_token, parseInt(info.expires_in) * 1000);
        return info.access_token;
    }

    async getNewTicket(token: string): Promise<string> {
        const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`;
        let resp = await fetch(url, {method: 'GET'});
        let info = await resp.json();
        await this.cache.setCache(this.wxH5TicketKey, info.ticket, parseInt(info.expires_in) * 1000);
        return info.ticket;
    }

    async getUserOpenId(code: string, userUniqueKey: string): Promise<string | null> {
        let cachedKey = `cachedOpenid-${userUniqueKey}`,
            cachedOpenid = await this.cache.getCache(cachedKey);
        if (cachedOpenid) {
            return cachedOpenid;
        }
        let url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${this.appId}&secret=${this.appSecret}&code=${code}&grant_type=authorization_code`,
            res = await fetch(url, { method: 'GET' }),
            json = await res.json(),
            errcode = json.errcode;
        if (errcode) {
            console.log(`errcode:${errcode} , errorMsg:${json.errmsg}`);
            return null
        }
        let access_token = json.access_token,
            expires_in = json.expires_in,
            refresh_token = json.refresh_token,
            openid = json.openid;
        await this.cache.setCache(cachedKey, openid, parseInt(expires_in) * 1000);
        return openid;
    }

    generateNonce(): string  {
        return ((('' + Math.random()).match(/[^0.]\d{7}/)) || [])[0]
            + ((('' + Math.random()).match(/[^0.]\d{7}/)) || [])[0]
            + ((('' + Math.random()).match(/[^0.]\d{7}/)) || [])[0]
            + ((('' + Math.random()).match(/[^0.]\d{7}/)) || [])[0];
    }

    async getShareConfig(url: string): Promise<{ [key: string]: any }> {
        let cachedToken = await this.cache.getCache(this.wxH5TokenKey);
        if (!cachedToken) {
            cachedToken = await this.getNewToken();
        }
        let ticket = await this.cache.getCache(this.wxH5TicketKey);
        if (!ticket) {
            ticket = await this.getNewTicket(cachedToken);
        }
        
        let appId = this.appId;
        let timestamp = '' + Math.floor(Date.now() / 1000);
        let nonceStr = this.generateNonce();
        let signature = signUtil.sha1.sign({
            params: {
                jsapi_ticket: ticket,
                noncestr: nonceStr,
                timestamp: timestamp,
                url: url
            },
        });
    
        let result = { appId, nonceStr, timestamp, signature };
        return result;
    }

    async h5Pay(goodsDescription: string, goodsPrice: number, outTradeNo: string): Promise<{ [key: string]: any }> {
        let params = {
            appid: this.appId,
            body: goodsDescription,
            mch_id: this.mchId,
            nonce_str: this.generateNonce(),
            notify_url: this.payNotifyUrl,
            out_trade_no: outTradeNo,
            spbill_create_ip: this.spbillCreateIp,
            total_fee: goodsPrice,
            trade_type: 'MWEB',
        },
            sign = signUtil.md5.sign({ params: params, handleStrFunc: str => str + `&key=${this.key}` }),
            formData = buildXMLData(params, sign),
            regUrl = "https://api.mch.weixin.qq.com/pay/unifiedorder",
            res = await fetch(regUrl, { method: 'POST', body: formData, headers: { 'Content-Type': 'text/xml' } }),
            json = await res.text(),
            unifyResult = await readXml(json),
            prepay_id = unifyResult.prepay_id,
            mweb_url = unifyResult.mweb_url,
            nonce = this.generateNonce(),
            ret = {
                timestamp: '' + Math.floor(new Date().getTime() / 1000),
                nonceStr: nonce,
                package: prepay_id,
                signType: 'MD5',
                appid: this.appId,
                mweb_url: mweb_url,
            };
        return ret;
    }


    async jsApiPay(code: string, userUniqueKey: string, goodsDescription: string, goodsPrice: number, outTradeNo: string): Promise<{ [key: string]: any }> {
        let params = {
            appid: this.appId,
            body: goodsDescription,
            mch_id: this.mchId,
            nonce_str: this.generateNonce(),
            notify_url: this.payNotifyUrl,
            out_trade_no: outTradeNo,
            spbill_create_ip: this.spbillCreateIp,
            total_fee: goodsPrice,
            trade_type: 'JSAPI',
            openid: await this.getUserOpenId(code, userUniqueKey),
            sign_type: 'MD5',
        },
            sign = signUtil.md5.sign({ params: params, handleStrFunc: str => str + `&key=${this.key}` }),
            formData = buildXMLData(params, sign),
            regUrl = "https://api.mch.weixin.qq.com/pay/unifiedorder",
            res = await fetch(regUrl, { method: 'POST', body: formData, headers: { 'Content-Type': 'text/xml' } }),
            json = await res.text(),
            unifyResult = await readXml(json);

        let return_code = unifyResult.return_code;
        if (return_code != 'SUCCESS') {
            throw new Error(unifyResult.return_msg);
        }
        let result_code = unifyResult.result_code;
        if (result_code != 'SUCCESS') {
            throw new Error(unifyResult.err_code_des);
        }
        let prepay_id = unifyResult.prepay_id,
            nonce = this.generateNonce(),
            ret: { [key: string]: any } = {
                timeStamp: '' + Math.floor(new Date().getTime() / 1000),
                nonceStr: nonce,
                package: `prepay_id=${prepay_id}`,
                signType: 'MD5',
                appId: this.appId,
            },
            paySign = signUtil.md5.sign({ params: ret, handleStrFunc: str => str + `&key=${this.key}` });
        ret.paySign = paySign;
        return ret;
    }

    async queryOrder(outTradeNo: string): Promise<{ [key: string]: any }> {
        let params = {
            appid: this.appId,
            mch_id: this.mchId,
            out_trade_no: outTradeNo,
            nonce_str: this.generateNonce(),
            sign_type: 'MD5',
        },
            sign = signUtil.md5.sign({
                params: params,
                handleStrFunc: str => str + `&key=${this.key}`,
            }),
            xmlData = buildXMLData(params, sign),
            regUrl = 'https://api.mch.weixin.qq.com/pay/orderquery',
            res = await fetch(regUrl, { method: 'POST', body: xmlData, headers: { 'Content-Type': 'text/xml' } }),
            json = await res.text(),
            queryResult = await readXml(json);
    
        let return_code = queryResult.return_code,
        return_msg =queryResult.return_msg,
            resultDefault: { [key: string]: any } = {
                trade_state: 'NOTPAY',
            };
        if (return_code != 'SUCCESS') {
            console.log(`queryOrder return_code fail , out_trade_no:${outTradeNo},return_code:${return_code},return_msg:${return_msg}`);
            return resultDefault
        }
        let result_code = queryResult.result_code,
            trade_state = queryResult.trade_state;
        if (result_code != 'SUCCESS') {
            console.log(`queryOrder result_code fail , result_code:${result_code},trade_state:${trade_state}`);
            return resultDefault
        }
        resultDefault.trade_state = trade_state; 
        return resultDefault;
    }

    verifySign(paramsWithoutSign: { [key: string]: any }, sign: string) {
        return signUtil.md5.checkSign({
            paramsWithoutSign: paramsWithoutSign,
            handleStrFunc: (str) => {
                return str + `&key=${this.key}`;
            },
            sign: sign,
        });
    }
}

export = Wx;