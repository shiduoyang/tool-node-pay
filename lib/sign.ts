import crypto = require('crypto');

function getSortedStr(body: any): string {
    let string: string = '';
    let keyList = Object.keys(body).sort();
    for (let key of keyList) {
        let value = body[key];
        string = string + key + '=' + value + '&';
    }
    if (string[string.length - 1] == '&') {
        string = string.slice(0, string.length - 1);
    }
    return string
}

export interface SignOptions{
    params: { [k: string]: any },
    privateKey?: string;
    handleStrFunc?: (s: string) => string;
}

export interface CheckSignOptions{
    paramsWithoutSign: { [k: string]: any },
    sign: string;
    publicKey?: string;
    handleStrFunc?: (s: string) => string;    
}

abstract class SignUtil{
    abstract signFunc(sortedStr: string, options: SignOptions): string;
    sign(options: SignOptions): string {
        let string = getSortedStr(options.params);
        options.handleStrFunc && (string = options.handleStrFunc(string));
        return this.signFunc(string, options);
    }

    abstract checkSign(options: CheckSignOptions): boolean;
}

class Sha1 extends SignUtil{
    signFunc(sortedStr: string, options: SignOptions): string {
        return crypto.createHash('sha1').update(sortedStr, 'utf8').digest('hex');
    }
    checkSign(options: CheckSignOptions): boolean {
        return this.sign({
            params: options.paramsWithoutSign,
            handleStrFunc: options.handleStrFunc,
        }) == options.sign;
    }
}

class Md5 extends SignUtil{
    signFunc(sortedStr: string, options: SignOptions): string {
        return crypto.createHash('md5').update(sortedStr, 'utf8').digest('hex').toUpperCase(); 
    }
    checkSign(options : CheckSignOptions ): boolean {
        return this.sign({
            params: options.paramsWithoutSign,
            handleStrFunc: options.handleStrFunc,
        }) == options.sign;
    }
}

class RsaSha256 extends SignUtil{
    signFunc(sortedStr: string, options: SignOptions): string {
        if (!options.privateKey) {
            throw new Error('private key cannot null');
        }
        return crypto.createSign('RSA-SHA256').update(sortedStr).sign(options.privateKey, 'base64');
    }
    checkSign(options: CheckSignOptions): boolean {
        let string = getSortedStr(options.paramsWithoutSign);
        if (options.handleStrFunc) {
            string = options.handleStrFunc(string);
        }
        if (!options.publicKey) {
            throw new Error('publicKey cannot null');
        }
        return crypto.createVerify('RSA-SHA256').update(string).verify(options.publicKey, options.sign, 'base64');
    }
}

class RsaSha1 extends SignUtil{
    signFunc(sortedStr: string, options: SignOptions): string {
        if (!options.privateKey) {
            throw new Error('private key cannot null');
        }
        return crypto.createSign('RSA-SHA1').update(sortedStr).sign(options.privateKey, 'base64');
    }
    checkSign(options: CheckSignOptions): boolean {
        let string = getSortedStr(options.paramsWithoutSign);
        if (options.handleStrFunc) {
            string = options.handleStrFunc(string);
        }
        if (!options.publicKey) {
            throw new Error('publicKey cannot null');
        }
        return crypto.createVerify('RSA-SHA1').update(string).verify(options.publicKey, options.sign, 'base64');
    }
}

export const sha1 = new Sha1();
export const md5 = new Md5();
export const rsaSha256 = new RsaSha256();
export const rsaSha1 = new RsaSha1();