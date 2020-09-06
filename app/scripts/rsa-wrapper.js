const path = require('path');
const rsaWrapper = {};
const fs = require('fs');
const NodeRSA = require('node-rsa');
const crypto = require('crypto');
let privateKeysDir = "../privateKeysDir";
let publicKeysDir = "../publicKeysDir";

rsaWrapper.generate = (direction) => {
    let key = new NodeRSA();
    key.generateKeyPair(2048, 65537);
    if (!fs.existsSync(path.resolve(__dirname, privateKeysDir))) {
        fs.mkdirSync(path.resolve(__dirname, privateKeysDir));
    }
    if (!fs.existsSync(path.resolve(__dirname, publicKeysDir))) {
        fs.mkdirSync(path.resolve(__dirname, publicKeysDir));
    }
    fs.writeFileSync(path.resolve(__dirname, privateKeysDir, 'private.pem'), key.exportKey('pkcs8-private-pem'));
    publicKey=key.exportKey('pkcs8-public-pem')
    fs.writeFileSync(path.resolve(__dirname, publicKeysDir, 'public.pem'), key.exportKey('pkcs8-public-pem'));

};

rsaWrapper.encrypt = (publicKey, message) => {
    let enc = crypto.publicEncrypt({
        key: publicKey,
        padding: crypto.RSA_PKCS1_OAEP_PADDING
    }, Buffer.from(message));

    return enc.toString('base64');
};

rsaWrapper.decrypt = (privateKey, message) => {
    let enc = crypto.privateDecrypt({
        key: privateKey,
        padding: crypto.RSA_PKCS1_OAEP_PADDING
    }, Buffer.from(message, 'base64'));

    return enc.toString();
};

module.exports = rsaWrapper;