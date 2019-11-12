"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var Fetch = require("node-fetch");
var signUtil = require("./sign");
var Cache = require("./cache");
var xml_1 = require("./xml");
var fetch = Fetch.default;
var Wx = /** @class */ (function () {
    function Wx(appId, appSecret, spbillCreateIp, mchId, payNotifyUrl, key, redisClient) {
        this.wxH5TokenKey = '';
        this.wxH5TicketKey = '';
        this.appId = appId;
        this.appSecret = appSecret;
        this.spbillCreateIp = spbillCreateIp;
        this.mchId = mchId;
        this.payNotifyUrl = payNotifyUrl;
        this.key = key;
        this.redisClient = redisClient;
        this.cache = new Cache(this.redisClient);
    }
    Wx.prototype.getNewToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, resp, info;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=" + this.appId + "&secret=" + this.appSecret;
                        return [4 /*yield*/, fetch(url, { method: 'GET' })];
                    case 1:
                        resp = _a.sent();
                        return [4 /*yield*/, resp.json()];
                    case 2:
                        info = _a.sent();
                        return [4 /*yield*/, this.cache.setCache(this.wxH5TokenKey, info.access_token, parseInt(info.expires_in) * 1000)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, info.access_token];
                }
            });
        });
    };
    Wx.prototype.getNewTicket = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var url, resp, info;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=" + token + "&type=jsapi";
                        return [4 /*yield*/, fetch(url, { method: 'GET' })];
                    case 1:
                        resp = _a.sent();
                        return [4 /*yield*/, resp.json()];
                    case 2:
                        info = _a.sent();
                        return [4 /*yield*/, this.cache.setCache(this.wxH5TicketKey, info.ticket, parseInt(info.expires_in) * 1000)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, info.ticket];
                }
            });
        });
    };
    Wx.prototype.getUserOpenId = function (code, userUniqueKey) {
        return __awaiter(this, void 0, void 0, function () {
            var cachedKey, cachedOpenid, url, res, json, errcode, access_token, expires_in, refresh_token, openid;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cachedKey = "cachedOpenid-" + userUniqueKey;
                        return [4 /*yield*/, this.cache.getCache(cachedKey)];
                    case 1:
                        cachedOpenid = _a.sent();
                        if (cachedOpenid) {
                            return [2 /*return*/, cachedOpenid];
                        }
                        url = "https://api.weixin.qq.com/sns/oauth2/access_token?appid=" + this.appId + "&secret=" + this.appSecret + "&code=" + code + "&grant_type=authorization_code";
                        return [4 /*yield*/, fetch(url, { method: 'GET' })];
                    case 2:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 3:
                        json = _a.sent(), errcode = json.errcode;
                        if (errcode) {
                            console.log("errcode:" + errcode + " , errorMsg:" + json.errmsg);
                            return [2 /*return*/, null];
                        }
                        access_token = json.access_token, expires_in = json.expires_in, refresh_token = json.refresh_token, openid = json.openid;
                        return [4 /*yield*/, this.cache.setCache(cachedKey, openid, parseInt(expires_in) * 1000)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, openid];
                }
            });
        });
    };
    Wx.prototype.generateNonce = function () {
        return ((('' + Math.random()).match(/[^0.]\d{7}/)) || [])[0]
            + ((('' + Math.random()).match(/[^0.]\d{7}/)) || [])[0]
            + ((('' + Math.random()).match(/[^0.]\d{7}/)) || [])[0]
            + ((('' + Math.random()).match(/[^0.]\d{7}/)) || [])[0];
    };
    Wx.prototype.getShareConfig = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var cachedToken, ticket, appId, timestamp, nonceStr, signature, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.cache.getCache(this.wxH5TokenKey)];
                    case 1:
                        cachedToken = _a.sent();
                        if (!!cachedToken) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.getNewToken()];
                    case 2:
                        cachedToken = _a.sent();
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.cache.getCache(this.wxH5TicketKey)];
                    case 4:
                        ticket = _a.sent();
                        if (!!ticket) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.getNewTicket(cachedToken)];
                    case 5:
                        ticket = _a.sent();
                        _a.label = 6;
                    case 6:
                        appId = this.appId;
                        timestamp = '' + Math.floor(Date.now() / 1000);
                        nonceStr = this.generateNonce();
                        signature = signUtil.sha1.sign({
                            params: {
                                jsapi_ticket: ticket,
                                noncestr: nonceStr,
                                timestamp: timestamp,
                                url: url
                            },
                        });
                        result = { appId: appId, nonceStr: nonceStr, timestamp: timestamp, signature: signature };
                        return [2 /*return*/, result];
                }
            });
        });
    };
    Wx.prototype.h5Pay = function (goodsDescription, goodsPrice, outTradeNo) {
        return __awaiter(this, void 0, void 0, function () {
            var params, sign, formData, regUrl, res, json, unifyResult, prepay_id, mweb_url, nonce, ret;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = {
                            appid: this.appId,
                            body: goodsDescription,
                            mch_id: this.mchId,
                            nonce_str: this.generateNonce(),
                            notify_url: this.payNotifyUrl,
                            out_trade_no: outTradeNo,
                            spbill_create_ip: this.spbillCreateIp,
                            total_fee: goodsPrice,
                            trade_type: 'MWEB',
                        }, sign = signUtil.md5.sign({ params: params, handleStrFunc: function (str) { return str + ("&key=" + _this.key); } }), formData = xml_1.buildXMLData(params, sign), regUrl = "https://api.mch.weixin.qq.com/pay/unifiedorder";
                        return [4 /*yield*/, fetch(regUrl, { method: 'POST', body: formData, headers: { 'Content-Type': 'text/xml' } })];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.text()];
                    case 2:
                        json = _a.sent();
                        return [4 /*yield*/, xml_1.readXml(json)];
                    case 3:
                        unifyResult = _a.sent(), prepay_id = unifyResult.prepay_id, mweb_url = unifyResult.mweb_url, nonce = this.generateNonce(), ret = {
                            timestamp: '' + Math.floor(new Date().getTime() / 1000),
                            nonceStr: nonce,
                            package: prepay_id,
                            signType: 'MD5',
                            appid: this.appId,
                            mweb_url: mweb_url,
                        };
                        return [2 /*return*/, ret];
                }
            });
        });
    };
    Wx.prototype.jsApiPay = function (code, userUniqueKey, goodsDescription, goodsPrice, outTradeNo) {
        return __awaiter(this, void 0, void 0, function () {
            var params, sign, formData, regUrl, res, json, unifyResult, _a, return_code, result_code, prepay_id, nonce, ret, paySign;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = {
                            appid: this.appId,
                            body: goodsDescription,
                            mch_id: this.mchId,
                            nonce_str: this.generateNonce(),
                            notify_url: this.payNotifyUrl,
                            out_trade_no: outTradeNo,
                            spbill_create_ip: this.spbillCreateIp,
                            total_fee: goodsPrice,
                            trade_type: 'JSAPI'
                        };
                        return [4 /*yield*/, this.getUserOpenId(code, userUniqueKey)];
                    case 1:
                        params = (_a.openid = _b.sent(),
                            _a.sign_type = 'MD5',
                            _a), sign = signUtil.md5.sign({ params: params, handleStrFunc: function (str) { return str + ("&key=" + _this.key); } }), formData = xml_1.buildXMLData(params, sign), regUrl = "https://api.mch.weixin.qq.com/pay/unifiedorder";
                        return [4 /*yield*/, fetch(regUrl, { method: 'POST', body: formData, headers: { 'Content-Type': 'text/xml' } })];
                    case 2:
                        res = _b.sent();
                        return [4 /*yield*/, res.text()];
                    case 3:
                        json = _b.sent();
                        return [4 /*yield*/, xml_1.readXml(json)];
                    case 4:
                        unifyResult = _b.sent();
                        return_code = unifyResult.return_code;
                        if (return_code != 'SUCCESS') {
                            throw new Error(unifyResult.return_msg);
                        }
                        result_code = unifyResult.result_code;
                        if (result_code != 'SUCCESS') {
                            throw new Error(unifyResult.err_code_des);
                        }
                        prepay_id = unifyResult.prepay_id, nonce = this.generateNonce(), ret = {
                            timeStamp: '' + Math.floor(new Date().getTime() / 1000),
                            nonceStr: nonce,
                            package: "prepay_id=" + prepay_id,
                            signType: 'MD5',
                            appId: this.appId,
                        }, paySign = signUtil.md5.sign({ params: ret, handleStrFunc: function (str) { return str + ("&key=" + _this.key); } });
                        ret.paySign = paySign;
                        return [2 /*return*/, ret];
                }
            });
        });
    };
    Wx.prototype.queryOrder = function (outTradeNo) {
        return __awaiter(this, void 0, void 0, function () {
            var params, sign, xmlData, regUrl, res, json, queryResult, return_code, return_msg, resultDefault, result_code, trade_state;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = {
                            appid: this.appId,
                            mch_id: this.mchId,
                            out_trade_no: outTradeNo,
                            nonce_str: this.generateNonce(),
                            sign_type: 'MD5',
                        }, sign = signUtil.md5.sign({
                            params: params,
                            handleStrFunc: function (str) { return str + ("&key=" + _this.key); },
                        }), xmlData = xml_1.buildXMLData(params, sign), regUrl = 'https://api.mch.weixin.qq.com/pay/orderquery';
                        return [4 /*yield*/, fetch(regUrl, { method: 'POST', body: xmlData, headers: { 'Content-Type': 'text/xml' } })];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.text()];
                    case 2:
                        json = _a.sent();
                        return [4 /*yield*/, xml_1.readXml(json)];
                    case 3:
                        queryResult = _a.sent();
                        return_code = queryResult.return_code, return_msg = queryResult.return_msg, resultDefault = {
                            trade_state: 'NOTPAY',
                        };
                        if (return_code != 'SUCCESS') {
                            console.log("queryOrder return_code fail , out_trade_no:" + outTradeNo + ",return_code:" + return_code + ",return_msg:" + return_msg);
                            return [2 /*return*/, resultDefault];
                        }
                        result_code = queryResult.result_code, trade_state = queryResult.trade_state;
                        if (result_code != 'SUCCESS') {
                            console.log("queryOrder result_code fail , result_code:" + result_code + ",trade_state:" + trade_state);
                            return [2 /*return*/, resultDefault];
                        }
                        resultDefault.trade_state = trade_state;
                        return [2 /*return*/, resultDefault];
                }
            });
        });
    };
    Wx.prototype.verifySign = function (paramsWithoutSign, sign) {
        var _this = this;
        return signUtil.md5.checkSign({
            paramsWithoutSign: paramsWithoutSign,
            handleStrFunc: function (str) {
                return str + ("&key=" + _this.key);
            },
            sign: sign,
        });
    };
    return Wx;
}());
