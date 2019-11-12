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
var moment = require("moment");
var Fetch = require("node-fetch");
var signUtil = require("./sign");
var fetch = Fetch.default;
var Ali = /** @class */ (function () {
    function Ali(options) {
        this.appId = options.appId;
        this.appPrivateKey = options.appPrivateKey;
        this.aliPublicKey = options.aliPublicKey;
        this.gateway = options.gateway;
        this.notifyUrl = options.notifyUrl;
    }
    Ali.prototype.h5Pay = function (goodsDescription, goodsPrice, outTradeNo, returnUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, params, sign, paramsStr, url;
            return __generator(this, function (_a) {
                timestamp = moment().format("YYYY-MM-DD HH:mm:ss"), params = {
                    app_id: this.appId,
                    method: 'alipay.trade.wap.pay',
                    charset: 'utf-8',
                    sign_type: 'RSA2',
                    timestamp: timestamp,
                    version: '1.0',
                    return_url: returnUrl,
                    notify_url: this.notifyUrl,
                    biz_content: JSON.stringify({
                        subject: goodsDescription,
                        out_trade_no: outTradeNo,
                        total_amount: goodsPrice / 100,
                        // quit_url: settings.quitUrl,
                        product_code: 'QUICK_WAP_WAY',
                    }),
                }, sign = signUtil.rsaSha256.sign({ params: params, privateKey: this.appPrivateKey });
                params.sign = sign;
                paramsStr = Object.keys(params).map(function (k) { return k + "=" + encodeURIComponent(params[k]); }).join('&'), url = this.gateway + "?" + paramsStr;
                return [2 /*return*/, { url: url }];
            });
        });
    };
    Ali.prototype.queryOrder = function (outTradeNo) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, params, sign, paramsStr, result, resultBody, alipay_trade_query_response, trade_status;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        timestamp = moment().format("YYYY-MM-DD HH:mm:ss"), params = {
                            app_id: this.appId,
                            method: 'alipay.trade.query',
                            charset: 'utf-8',
                            sign_type: 'RSA2',
                            timestamp: timestamp,
                            version: '1.0',
                            biz_content: JSON.stringify({
                                out_trade_no: outTradeNo,
                            })
                        }, sign = signUtil.rsaSha256.sign({ params: params, privateKey: this.appPrivateKey });
                        params.sign = sign;
                        paramsStr = Object.keys(params).map(function (k) { return k + "=" + encodeURIComponent(params[k]); }).join('&');
                        return [4 /*yield*/, fetch(this.gateway + "?" + paramsStr, { method: 'GET' })];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, result.json()];
                    case 2:
                        resultBody = _a.sent(), alipay_trade_query_response = resultBody.alipay_trade_query_response, trade_status = alipay_trade_query_response ? alipay_trade_query_response.trade_status : 'NOT_PAY';
                        return [2 /*return*/, trade_status == 'TRADE_SUCCESS'];
                }
            });
        });
    };
    Ali.prototype.verifySign = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var sign, paramsCp;
            return __generator(this, function (_a) {
                sign = params.sign, paramsCp = JSON.parse(JSON.stringify(params));
                delete paramsCp.sign;
                return [2 /*return*/, signUtil.rsaSha256.checkSign({ paramsWithoutSign: paramsCp, publicKey: this.aliPublicKey, sign: sign })];
            });
        });
    };
    return Ali;
}());
module.exports = Ali;
