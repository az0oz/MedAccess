const crypto = require('crypto');
const fs = require('fs')
const aesWrapper = {};

// get list of supportable encryption algorithms
aesWrapper.getAlgorithmList = () => {
    console.log(crypto.getCiphers());
};

aesWrapper.generateKey = () => {
    return crypto.randomBytes(32);
};

//encryption
aesWrapper.encrypt = (pdfBlob,password) => {
    
    const encrypt = crypto.createCipher('aes-256-ctr', password)
    const encBlob = pdfBlob.pipe(encrypt)
    return encBlob;
};
//decryption
aesWrapper.decrypt = (encBlob,password) => {
    const encrypt = crypto.createDecipher('aes-256-ctr', password)
    
     encBlob.pipe(encrypt)
    return pdfBlob;
}
aesWrapper.encryptInformation= function(KEY,pdfBlob){
    const encrypt = crypto.createCipher('aes-256-ctr', KEY);
    fs.writeFileSync('test.pdf',pdfBlob)
    const write =fs.writeFileSync("enc.pdf")
     pdfBlob.pipe(encrypt).pipe(write)
     const encBlob = fs.readFileSync('enc.pdf')
    return encBlob;
    }
aesWrapper.decryptInformation = function(KEY,encryptedText){ 
    const decipher = crypto.createDecipher('aes-256-ctr', KEY) 
    var decrypted = decipher.update(text,'hex','utf8') 
    decrypted += decipher.final('utf8'); 
    return decrypted; 
 }


module.exports = aesWrapper;