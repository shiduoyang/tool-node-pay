const fs = require('fs');
const Ali = require('../lib/ali');

/**
 * appPrivateKey 和aliPublicKey需要用户自行存储
 */
(async () => {
    const appId = '2019010020000001';
    const appPrivateKey = fs.readFileSync(__dirname + '/alipem/app-private.pem');
    const aliPublicKey = fs.readFileSync(__dirname+'/alipem/ali-public.pem');
    const gateway = 'https://openapi.alipay.com/gateway.do';
    const notifyUrl = 'www.baidu.com';
    
    const ali = new Ali(appId, appPrivateKey, aliPublicKey, gateway, notifyUrl);
    let result = await ali.h5Pay('商品一号', 100, 'outTradeNo11111', 'www.baidu.com');
    console.log(result);
})();