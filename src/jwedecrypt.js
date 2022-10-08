"use strict";


const fs = require("fs");
var crypto = require("crypto");
const privatePEM = Buffer.from(fs.readFileSync("private.pem", { encoding: "utf-8" }));

const re = {
  signed : {
    jwt : new RegExp('^([^\\.]+)\\.([^\\.]+)\\.([^\\.]+)$'),
    cm : new RegExp('^([^\\.]+)(\\.)([^\\.]+)(\\.)([^\\.]+)$')
  },
  encrypted: {
    jwt : new RegExp('^([^\\.]+)\\.([^\\.]*)\\.([^\\.]+)\\.([^\\.]+)\\.([^\\.]+)$'),
    cm :  new RegExp('^([^\\.]+)(\\.)([^\\.]*)(\\.)([^\\.]+)(\\.)([^\\.]+)(\\.)([^\\.]+)$')
  }
};

console.log("loaded private key");

// another sample from mark, use the right key and jwe payload is unencrypted jwt
var encrypted = "eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiUlNBLU9BRVAtMjU2In0.h7A01b1U3xwZrSuSEeY18MEgMRKa8W0eW7ghNVYkn3ih8jhi-w-N1DHIyJ_BvaDfESokjqA12n2nhCvGp2EE3DookcXxW_rF5PsxHndjJeDy0s_jELVV_iela-ObvFFW2rIkKm3YNMsQpTkhui9CjUWTbSM-ZeCnZilGP3Z5YnRGFOX1OlHmAlPNwUgUn7jn3BP0pPaybwG4uYumEGATsCDDbE-fQ-M8f3WYDLOxlefvJZTZuv67piDozOlC86CoggyuI1gR3L1YopBQNys9LWY6OWO1O5J7PXK33WJTwmeNXZvV-pceouTn24_xY3rKb8RmW2ECJMRfHCK37eeHrg.BGg2Kn_9fmGcGRLhcqM2Jg.WVGY9k0XjbNysZSkZlNome7NAQmO-uZg3N3p8lD_mQYIY80r1eFOwJ24r52E2YLk8BiyoXuKB1ditAyJP8iBu-Mdk99h_vAzq4-0jXeuHUO7Bb3Tq3lkzGBwkxhFF-aVUdgk7rSUlx2CDCOKQmGl5UQSbai57Z80aecW-sDunS5OO37Xb-r9k2BhCnwSbwCpXq8gnOnlbQLEM6IU6R2E_uh6s4_lv8eT_hGQbQjL_bquz3Qr4OTUOPILmB-XRPr1aLrH_X2mriNG2OjN3bPyv8Ce19m1WUYedHVk6Z242RMDkZRw_lA7NQ_CMkoWxyoiRA8vx902WftWJLjrq9Jqya8GddAr7lX99Cqd5dyovlmXnWvFQEHt3A-bYh7-Vpnu_1D7yAD0Pl6NcTdrWeMrgRoFIUOVuF3EUPOTTZ-ja-1zP4S936hm82r7AKY1zFSc_c-OOHXqEJ1FdcdTtNxrhjS96k5tLgyZ50xSY_7EFnfJ5E__SuWhTsMqwtYtN6bqdVX5u58zQpyredfNNd_ppW7xbInAM0dQHXluvnAq9EqjWuy6j3E_h33R_MJYxpd791r3kSEGx0QEEnUKHo530MkljJ6_eixf4p6UruV09LCQ-69r5W9zo82kymhoN6fzzop-R2aFvrfBf0olaR5L3dJRPLN9Rro0i1DP-N8ql3y0yi8Rl7NcxXhQwUWwOmTFT56sa3GFyD-ItiUo48M46wj1SonewHkt0DHf5JgR1r0KoP0ligameGsYmrY6NQRWrkJHOfPRhld0EBz-MJufDLc3tkH6M5G12lnGBGSPiextnyndVCnZTjO1lHNsAYW-X2WaAxBwJZU7PIQT2M5_v0tky6n5zGpm2aiVFPqIL1CQHOntJ6NUwoJFrXFTXGZPBPuALANFpZ-8lI66VnTbAnuO9vScCjdDCFw4535fISEj1twBHM4lMmUBU3KdCMnOhFYGcqgR1IYkiRmHnjR-GitInzmbqSAgbsNlCtaJl-1AzSS2xS_d2YYaDkNK8o5hwzgg4WPAg1YQW3u8JJCAM1iV-hu_bU92Bk1JVRRjIbgHfObtEz0OXtEL64gHm1vr6-Jt3soazotnQbTdWfKCtZzpWR_Gpf9ZCOS4TlAghnPpJRcaOuTAeOI98sA5VXfuE87tZBrioybXyBF4NSsU57dpUfSzAdSWegbwI5oog8LA9cPoJcmZthK_mBQ7iEw5CjXwJRswd59CSZQXTUlq2rmUkk7Bzf3Nylo7lzzffz6P2zWNzcmdAXzHWGIqTnN5MXvF2SG4WMAFSfY3OewSMbczowoxn15d7wmPRWr6bt5Eq8P4trXzxsTZOyZEstzbPxSDXSWoVPEKbZ70WGpJglECFYh6mzVB8dlHWxT1UHW-BL9Y7qmavh8VsAgicWDUvTbkGT6moqGSS7XYE8KXQNT9TrhN7M22hjk8ksxNCz3mODTsKC9JgYoY-fWsA2j0nfngVmmj7P8SLB6w0QhLzE8mQoH7hCXhJ07hAoO7MvXdZTJihE9X1YJ7ZsEJ-pgxNN4OA_KOzvilIWZLUhSkrExbc7ZAQt6fm8155uE6GfP8bGKEWco3_jsp7SQwXvRMfrzrs4RV1x-q336Un8XB-b0lMbOQWMhxy00PbdDsFnfNHSFWZKuVmN2Znqqi1BOmj0ruPpBXDXWW_VmvxDblpgJzNs5mc8VSipvbRgTtU9HSx3EpIxocG2WnT4MAgQAjOdH9ve_gT8kFTGOWJVa0sKPUkd_wRyDe263P1e8isdHupx4-dBqtUSnxlVbNQ6zuZ3BvwcpxWh5Uskbl0dw7KEIz0_kM47OpyIHyJd7IaFNF82foBbpSuzws7N4ya9aW.yZZCy4HcC_rzpnh7JDQOrA";
let matches = re.encrypted.jwt.exec(encrypted);
let header = JSON.parse(Buffer.from(matches[1], 'base64').toString('utf8'));
console.log("algo is " + header.alg);
console.log("enc is " + header.enc);

// i think this might be url64encoded
let encryptedKeyHex = matches[2];
let iv = matches[3];

var privateKey = Buffer.from(
  fs.readFileSync("private.pem", { encoding: "utf-8" })
);

const decryptedData = crypto.privateDecrypt(
  {
    key: privateKey,
    // In order to decrypt the data, we need to specify the
    // same hashing function and padding scheme that we used to
    // encrypt the data in the previous step
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256',
  },
  Buffer.from(encryptedKeyHex, 'base64'),
)
console.log("decrypted key = " + decryptedData);
// decrypted the key



var dcipher = crypto.createDecipheriv(header.alg, encrytedKey, iv);

let decryptedKey = dcipher.update(encryptedData, "hex", "utf-8");

matches.forEach( token => {
  console.log(token);
  var json = Buffer.from(token, 'base64').toString('utf8');
  console.log(json + "\n-------------------");
})


//var decrypted = JWE.decrypt(encrypted, privatePEM);
console.log("\ndecrypted JWE and payload = \n");

