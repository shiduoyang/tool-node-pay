import xml2js = require('xml2js');

export async function readXml(xmlJsonStr: string) {
    let parsedObj = await xml2js.parseStringPromise(xmlJsonStr);
    if (!parsedObj.xml) {
        throw new Error('xml error');
    }
    let ret: { [key: string]: any } = {};
    for (let key in parsedObj.xml) {
        let vArr = parsedObj.xml[key];
        if (!vArr || !vArr.length) {
            continue;
        }
        ret[key] = vArr[0];
    }
    return ret;
}

export function buildXMLData(paramsObj: { [key: string]: any }, sign: string): string {
    let formData = "<xml>";
    let sortedParamsKeys = Object.keys(paramsObj).sort();
    for (let k of sortedParamsKeys) {
        let v = paramsObj[k];
        if (v == null) {
            throw new Error(`k:${k},v:${v} value is null`);
        }
        formData += `<${k}>${v}</${k}>`;
    }
    formData += `</sign>${sign}</sign>`;
    formData += "</xml>";
    return formData;
}