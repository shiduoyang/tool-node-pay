"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var crypto = require("crypto");
function getSortedStr(body) {
    var string = '';
    var keyList = Object.keys(body).sort();
    for (var _i = 0, keyList_1 = keyList; _i < keyList_1.length; _i++) {
        var key = keyList_1[_i];
        var value = body[key];
        string = string + key + '=' + value + '&';
    }
    if (string[string.length - 1] == '&') {
        string = string.slice(0, string.length - 1);
    }
    return string;
}
var SignUtil = /** @class */ (function () {
    function SignUtil() {
    }
    SignUtil.prototype.sign = function (options) {
        var string = getSortedStr(options.params);
        options.handleStrFunc && (string = options.handleStrFunc(string));
        return this.signFunc(string, options);
    };
    return SignUtil;
}());
var Sha1 = /** @class */ (function (_super) {
    __extends(Sha1, _super);
    function Sha1() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Sha1.prototype.signFunc = function (sortedStr, options) {
        return crypto.createHash('sha1').update(sortedStr, 'utf8').digest('hex');
    };
    Sha1.prototype.checkSign = function (options) {
        return this.sign({
            params: options.paramsWithoutSign,
            handleStrFunc: options.handleStrFunc,
        }) == options.sign;
    };
    return Sha1;
}(SignUtil));
var Md5 = /** @class */ (function (_super) {
    __extends(Md5, _super);
    function Md5() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Md5.prototype.signFunc = function (sortedStr, options) {
        return crypto.createHash('md5').update(sortedStr, 'utf8').digest('hex').toUpperCase();
    };
    Md5.prototype.checkSign = function (options) {
        return this.sign({
            params: options.paramsWithoutSign,
            handleStrFunc: options.handleStrFunc,
        }) == options.sign;
    };
    return Md5;
}(SignUtil));
var RsaSha256 = /** @class */ (function (_super) {
    __extends(RsaSha256, _super);
    function RsaSha256() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RsaSha256.prototype.signFunc = function (sortedStr, options) {
        if (!options.privateKey) {
            throw new Error('private key cannot null');
        }
        return crypto.createSign('RSA-SHA256').update(sortedStr).sign(options.privateKey, 'base64');
    };
    RsaSha256.prototype.checkSign = function (options) {
        var string = getSortedStr(options.paramsWithoutSign);
        if (options.handleStrFunc) {
            string = options.handleStrFunc(string);
        }
        if (!options.publicKey) {
            throw new Error('publicKey cannot null');
        }
        return crypto.createVerify('RSA-SHA256').update(string).verify(options.publicKey, options.sign, 'base64');
    };
    return RsaSha256;
}(SignUtil));
var RsaSha1 = /** @class */ (function (_super) {
    __extends(RsaSha1, _super);
    function RsaSha1() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RsaSha1.prototype.signFunc = function (sortedStr, options) {
        if (!options.privateKey) {
            throw new Error('private key cannot null');
        }
        return crypto.createSign('RSA-SHA1').update(sortedStr).sign(options.privateKey, 'base64');
    };
    RsaSha1.prototype.checkSign = function (options) {
        var string = getSortedStr(options.paramsWithoutSign);
        if (options.handleStrFunc) {
            string = options.handleStrFunc(string);
        }
        if (!options.publicKey) {
            throw new Error('publicKey cannot null');
        }
        return crypto.createVerify('RSA-SHA1').update(string).verify(options.publicKey, options.sign, 'base64');
    };
    return RsaSha1;
}(SignUtil));
exports.sha1 = new Sha1();
exports.md5 = new Md5();
exports.rsaSha256 = new RsaSha256();
exports.rsaSha1 = new RsaSha1();
