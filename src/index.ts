import {
    CipherGCM,
    constants,
    createCipheriv,
    createDecipheriv,
    createSign,
    createVerify,
    DecipherGCM,
    KeyLike,
    privateDecrypt,
    PrivateKeyInput,
    publicEncrypt,
    randomBytes,
    RsaPrivateKey,
    RsaPublicKey
} from 'crypto';
import {constants as zConstants, gunzipSync, gzipSync} from 'zlib';

export enum ZIP {
    GZIP = "GZIP"
}

export interface JOSE {
    alg: string;
    /**
     * The content of the message
     */
    cty?: MEDIA_TYPES;
    /**
     * The public key to which the JWE was encrypted; this can be used to determine the private key needed to decrypt the JWE.
     * @see https://tools.ietf.org/html/rfc7515#section-4.1.4
     */
    kid?: string;
}

export interface JWE_JOSE extends JOSE {
    enc: string;
    zip?: ZIP;
}

export interface JWS_JOSE extends JOSE {
}

export enum MEDIA_TYPES {
    JSON = 'json', // at this time it only makes sense to support application/json.
}

export interface JWE_OPTIONS {
    zip?: ZIP,
    cty: MEDIA_TYPES
}

/**
 * a safer way to do toString on an object
 * @param obj
 */
const toSafeString = function toSafeString(obj: any): string {
    if (typeof obj === 'string')
        return obj;
    if (typeof obj === 'number' || Buffer.isBuffer(obj))
        return obj.toString();
    return JSON.stringify(obj);
};

/**
 * Base 64 URL encode
 * @param value
 */
const base64url = function base64url( value: Buffer ): string {
    return value.toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
};

/**
 * Base 64 URL decode
 * @param value
 */
const lru46esab = function lru46esab ( value: string ): Buffer {
    return Buffer.from (
        value.replace('-', '+').replace('_', '/'),
        'base64'
    );
};

/**
 * Is the thing an object? might be better ways of doing this with ES6... just needed to get it done.
 * @param thing
 */
const isObject = function isObject(thing: any) {
    return Object.prototype.toString.call(thing) === '[object Object]';
};

/**
 * Safe JSON parse...
 * @param thing
 */
const safeJsonParse = function safeJsonParse(thing: any) {
    if ( isObject(thing) )
        return thing;
    try { return JSON.parse(thing); }
    catch (e) { return undefined; }
};

/**
 * Asymmetric Encrypt With Public Key
 * @param value
 * @param publicKey
 */
const AsymmetricEncryptWithPublicKey = function AsymmetricEncryptWithPublicKey ( value: Buffer, publicKey: KeyLike ): Buffer {
    // If key ( A PEM encoded public key ) is a string, it is treated as the
    // key with no passphrase and will use RSA_PKCS1_OAEP_PADDING.
    // We are passing as KeyLike Typescript object, which means
    // we need to declare the padding.
    const public_key: RsaPublicKey = {
        key: publicKey,
        padding: constants.RSA_PKCS1_OAEP_PADDING
    };
    return publicEncrypt( public_key, value );
};

/**
 * Asymmetric Decrypt With Private Key
 * @param value
 * @param privateKey
 * @param passphrase
 */
const AsymmetricDecryptWithPrivateKey = function AsymmetricDecryptWithPrivateKey ( value: Buffer, privateKey: KeyLike, passphrase: string ): Buffer {
    const private_key: RsaPrivateKey = {
        key: privateKey,
        passphrase,
        // @todo: Still trying to establish why this is not working.
        // oaepLabel:  https://github.com/nodejs/help/issues/1726
        // oaepHash: 'sha256', // this does not appear to work on Mac OSX with OpenSSL 1.0.1g 7 Apr 2014 or OpenSSL 1.1.1d  10 Sep 2019 ( via Brew )
        padding: constants.RSA_PKCS1_OAEP_PADDING
    };
    return privateDecrypt(private_key, value);
};

/**
 * JWE Decrypt
 *
 * When decrypting, particular care must be taken not to allow the JWE recipient to be used as an oracle for
 * decrypting messages.  RFC 3218 should be consulted for specific countermeasures to attacks on RSAES-PKCS1-v1_5.
 *
 * An attacker might modify the contents of the "alg" Header Parameter from "RSA-OAEP" to "RSA1_5" in order to
 * generate a formatting error that can be detected and used to recover the CEK even if RSAES-OAEP was used to
 * encrypt the CEK.  It is therefore particularly important to report all formatting errors to the CEK, Additional
 * Authenticated Data, or ciphertext as a single error when the encrypted content is rejected.
 *
 * Additionally, this type of attack can be prevented by restricting the use of a key to a limited set of
 * algorithms -- usually one.  This means, for instance, that if the key is marked as being for "RSA-OAEP" only,
 * any attempt to decrypt a message using the "RSA1_5" algorithm with that key should fail immediately due to
 * invalid use of the key.
 *
 * @param payload
 * @param privateKey
 * @param passphrase
 */
const decrypt = function decrypt ( payload: string, privateKey: KeyLike, passphrase: string ): string {
    try {
        let joseStr: string;
        let cekStr: string;
        let ivStr: string;
        let cipherTextStr: string;
        let tagStr: string;
        /**
         * JOSE - Javascript Object Signing and Encryption Header
         * CEK - Content Encryption Key ( Asymmetrically encrypted with the )
         * IV - Initialization Vector
         * cipherText - The Symmetrically encrypted payload of a UTF-8 String, with the mime type identified as `cty` in the JOSE
         * tag - Auth tag is the message authentication code (MAC) calculated during the encryption
         */
        [joseStr, cekStr, ivStr, cipherTextStr, tagStr] = payload.split('.');
        // @TODO: need to exit here, if there are any values equal to null
        let jose: JWE_JOSE = safeJsonParse(Buffer.from(joseStr, 'base64').toString('utf8'));
        if (jose.alg !== 'RSA-OAEP-256') {
            throw new Error('Unsupported "alg" detected in JOSE. currently only "RSA-OAEP-256" supported');
        }
        if (jose.enc !== 'A256GCM') {
            throw new Error('Unsupported "enc" detected in JOSE. currently only "A256GCM" supported');
        }
        if (jose.zip && jose.zip !== ZIP.GZIP) {
            throw new Error(`Unsupported "zip" detected in JOSE. currently only "${ZIP.GZIP}" supported`);
        }
        const cek: Buffer = AsymmetricDecryptWithPrivateKey( lru46esab( cekStr ), privateKey, passphrase );
        const decipher: DecipherGCM = createDecipheriv('aes-256-gcm', cek, lru46esab( ivStr ) );
        /**
         * When using an authenticated encryption mode ( like GCM ),
         * the decipher.setAuthTag() method is used to pass in the received authentication tag. If no tag is
         * provided, or if the cipher text has been tampered with, decipher.final() will throw, indicating
         * that the cipher text should be discarded due to failed authentication. If the tag length is
         * invalid according to NIST SP 800-38D or does not match the value of the authTagLength option,
         * decipher.setAuthTag() will throw an error.
         *
         * The decipher.setAuthTag() method must be called before decipher.final() and can only be called once.
         */
        decipher.setAuthTag( lru46esab(tagStr) );
        decipher.setAAD(Buffer.from( toSafeString(jose), 'utf8'));
        let text: Buffer = Buffer.concat([decipher.update( lru46esab(cipherTextStr) ), decipher.final()]);
        if (jose.zip && jose.zip === ZIP.GZIP) {
            return gunzipSync(text, {level: zConstants.Z_BEST_COMPRESSION}).toString('utf8');
        }
        return text.toString('utf8');
    } catch (e) {
        console.error(e);
        throw new Error('A decryption error has occurred. refer to the logs for more details.')
    }
};

const encrypt = function encrypt( value: string, publicKey: KeyLike, options: JWE_OPTIONS ): string {

    // RSA-OAEP-256 - RSAES OAEP using SHA-256 and MGF1 with SHA-256
    //  @see https://www.rfc-editor.org/rfc/rfc7518#section-4.3
    const alg: string = 'RSA-OAEP-256';
    // AES 256 GCM - encryption of the content.
    const enc: string = 'A256GCM';

    /**
     * Javascript Object Signing and Encryption (JOSE ) - describe the encryption
     * applied to the plaintext and optionally additional properties of the JWE.
     */
    const jose: JWE_JOSE = { alg, enc };
    /**
     * Optional the body zip type, should be omitted from the JOSE to indicate no compression
     */
    if ( options && options.zip ) {
        if ( options.zip !== ZIP.GZIP ) {
            throw new Error(`Unsupported "zip" detected in JOSE. currently only "${ZIP.GZIP}" supported`);
        }
        jose.zip = ZIP.GZIP;
    }
    if ( options && options.cty !== MEDIA_TYPES.JSON ) {
        throw new Error(`Unsupported "cty" detected in JOSE. currently only "${MEDIA_TYPES.JSON}" supported`);
    }
    jose.cty = MEDIA_TYPES.JSON;
    /**
     * Content Encryption Key (CEK) - ( this is the symmetrical key, which will later be
     * encrypted asymmetrically ) A new symmetric key generated to encrypt the Plaintext
     * for the recipient to produce the Ciphertext, which is encrypted to the recipient as
     * the JWE Encrypted Key. 32 Bytes = 256 bits
     */
    const cek: Buffer = randomBytes(32);
    if ( cek.length !== 32 ) throw new Error('AES Key Must be 256 bytes (32 characters)');
    /**
     * JWE Initialization Vector
     * The bit block size of the encryption algorithm dictates the
     * Byte size of the IV. eg: A128GCM is 128 Bits = 16 Bytes and 256 Bits would be 32
     */
    const iv: Buffer = randomBytes(32 );
    /**
     * aes-256-cgm - Advanced Encryption Standard (AES) in Galois/Counter Mode (GCM)
     * AES-GCM is a more secure cipher than AES-CBC, because AES-CBC, operates by XOR'ing
     * each block with the previous block and cannot be written in parallel and
     * Initialization Vector is required because AES is a Block Encryption method.
     * AES is a block cipher mode type of encryption
     */
    const cipher: CipherGCM = createCipheriv(  'aes-256-gcm', cek, iv );
    /**
     * When using an authenticated encryption mode (GCM, CCM and OCB are currently supported), the cipher.setAAD()
     * method sets the value used for the additional authenticated data (AAD) input parameter.
     *
     * The options argument is optional for GCM and OCB. When using CCM, the plaintextLength option must be
     * specified and its value must match the length of the plaintext in bytes. See CCM mode.
     *
     * The cipher.setAAD() method must be called before cipher.update().
     */
    cipher.setAAD( Buffer.from( toSafeString( jose ),'utf8' ) );
    let content: Buffer;
    if ( options && options.zip && options.zip === ZIP.GZIP ) {
        content = cipher.update(
            gzipSync( value, {
                level: zConstants.Z_BEST_COMPRESSION
            } )
        );
    } else {
        content = cipher.update( value );
    }
    const cipherText = Buffer.concat([ content, cipher.final() ] );
    /**
     * When using an authenticated encryption mode ( like GCM ), cipher.getAuthTag() method
     * returns a Buffer containing the authentication tag that has been computed from the given data.
     *
     * Message Authentication Code (MAC)
     *
     * The cipher.getAuthTag() method should only be called after encryption has been completed using the
     * cipher.final() method.
     */
    const tag: Buffer = cipher.getAuthTag();
    const ecek : Buffer = AsymmetricEncryptWithPublicKey( cek, publicKey ); // we asymmetrically encrypt the key with the users Public Key.

    // @todo: I think it would be best, if we make sure the output is ASCII
    // Buffer.from( '').toString('ascii')
    return `${ base64url( Buffer.from( toSafeString( jose ),'utf8' ) ) }.${ base64url( ecek ) }.${ base64url( iv ) }.${ base64url( cipherText ) }.${ base64url( tag ) }`
};

/**
 * Generate a JWS Token
 * @param value
 * @param privateKey
 */
const encode = function encode( value: string, privateKey: PrivateKeyInput ): string {
    // while HMAC-SHA256 is by far better than RSA-SHA256. It would require a private key by both parties. Therefore,
    // we will use RSA and exchange Public Keys.
    const signature = createSign( 'RSA-SHA256' );
    /**
     * Javascript Object Signing and Encryption (JOSE ) - describe the encryption
     * applied to the plaintext and optionally additional properties of the JWE.
     */
    const jose: JWS_JOSE = { alg: 'RSA-SHA256' };
    const joseAndValue = `${ base64url( Buffer.from( toSafeString( jose ),'utf8' ) ) }.${ base64url( Buffer.from( value, 'utf8') ) }`;
    /**
     * Compute the JWS Signature with RSA-SHA256
     *
     * ASCII(   BASE64URL(UTF8(JWS Protected Header)) || '.' || BASE64URL(JWS Payload)   )
     *
     * The "alg" (algorithm) Header Parameter
     * MUST be present in the JOSE Header, with the algorithm value
     * accurately representing the algorithm used to construct the JWS
     * Signature.
     */
    signature.write( joseAndValue );
    signature.end();
    const base64Signature: string = signature.sign(privateKey, 'base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    return `${ joseAndValue }.${ base64Signature }`;
};

/**
 * Verify the Payload is signed correctly.
 * @param jwsPayload
 * @param publicKey
 */
const verify = function verify( jwsPayload: string, publicKey: string ): boolean {
    const [joseStr, message, sig] = jwsPayload.split('.');
    const jose = JSON.parse(lru46esab(joseStr).toString('utf8'));
    if (jose && jose.alg && jose.alg !== 'RSA-SHA256') {
        throw new Error(`Unsupported "alg" detected in JOSE. currently only "RSA-SHA256" supported`);
    }
    const verify = createVerify(jose.alg);
    verify.write(`${joseStr}.${message}`);
    verify.end();
    return verify.verify(publicKey, sig, 'base64');
};

/**
 * Extract the message from the JwsPayload.
 * @param jwsPayload
 */
const decode = function decode(jwsPayload: string): string {
    const [, message,] = jwsPayload.split('.');
    return lru46esab(message).toString('utf8')
};

export const JWE = {
    encrypt,
    decrypt
};
export const JWS = {
    decode,
    encode,
    verify
};
