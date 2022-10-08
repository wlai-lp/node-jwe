// crypto module
const crypto = require("crypto");

const algorithm = "aes-256-cbc"; 

// generate 16 bytes of random data
// const initVector = crypto.randomBytes(16);
const initVector = Buffer.from(crypto.randomBytes(16), 'utf8');
console.log("init vector " + initVector);

// protected data
const message = "This is a secret message";

// secret key generate 32 bytes of random data
// const Securitykey = crypto.randomBytes(32);
const Securitykey = Buffer.from(crypto.randomBytes(32), 'utf8');
console.log("security key " + Securitykey);
// const keyString = Securitykey.;

// console.log(`initial vector is ${initVector} and securitykey is ${keyString}`);

// the cipher function
const cipher = crypto.createCipheriv(algorithm, Securitykey, initVector);

// encrypt the message
// input encoding
// output encoding
let encryptedData = cipher.update(message, "utf-8", "hex");

encryptedData += cipher.final("hex");

console.log("Encrypted message: " + encryptedData);

// the decipher function
const decipher = crypto.createDecipheriv(algorithm, Securitykey, initVector);

let decryptedData = decipher.update(encryptedData, "hex", "utf-8");

decryptedData += decipher.final("utf8");

console.log("Decrypted message: " + decryptedData);