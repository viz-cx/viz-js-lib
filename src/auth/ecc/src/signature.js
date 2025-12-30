import { recoverPubKey, sign as _sign, calcPubKeyRecoveryParam, verify } from './ecdsa.js';
import { sha256 } from './hash.js';
import ecurve from 'ecurve';
const curve = ecurve.getCurveByName('secp256k1');
import assert, { equal } from 'assert';
import bigi from 'bigi';
import PublicKey from './key_public.js';
import PrivateKey from './key_private.js';

class Signature {

    constructor(r1, s1, i1) {
        this.r = r1;
        this.s = s1;
        this.i = i1;
        equal(this.r != null, true, 'Missing parameter');
        equal(this.s != null, true, 'Missing parameter');
        equal(this.i != null, true, 'Missing parameter');
    }

    static fromBuffer(buf) {
        equal(buf.length, 65, 'Invalid signature length');
        const i = buf.readUInt8(0);
        equal(i - 27, i - 27 & 7, 'Invalid signature parameter');
        const r = bigi.fromBuffer(buf.slice(1, 33));
        const s = bigi.fromBuffer(buf.slice(33));
        return new Signature(r, s, i);
    };

    toBuffer() {
        const buf = Buffer.alloc(65);
        buf.writeUInt8(this.i, 0);
        this.r.toBuffer(32).copy(buf, 1);
        this.s.toBuffer(32).copy(buf, 33);
        return buf;
    };

    recoverPublicKeyFromBuffer(buffer) {
        return this.recoverPublicKey(sha256(buffer));
    };

    /**
        @return {PublicKey}
    */
    recoverPublicKey(sha256_buffer) {
        const e = bigi.fromBuffer(sha256_buffer);
        let {i} = this;
        i -= 27;
        i = i & 3;
        const Q = recoverPubKey(curve, e, this, i);
        return PublicKey.fromPoint(Q);
    };


    /**
        @param {Buffer} buf
        @param {PrivateKey} private_key
        @return {Signature}
    */
    static signBuffer(buf, private_key) {
        const _hash = sha256(buf);
        return Signature.signBufferSha256(_hash, private_key)
    }

    /** Sign a buffer of exactally 32 bytes in size (sha256(text))
        @param {Buffer} buf - 32 bytes binary
        @param {PrivateKey} private_key
        @return {Signature}
    */
    static signBufferSha256(buf_sha256, private_key) {
        if( buf_sha256.length !== 32 || ! Buffer.isBuffer(buf_sha256) )
            throw new Error('buf_sha256: 32 byte buffer requred')
        private_key = toPrivateObj(private_key)
        assert(private_key, 'private_key required')

        let der, ecsignature, i, lenR, lenS, nonce;
        i = null;
        nonce = 0;
        const e = bigi.fromBuffer(buf_sha256);
        while (true) {
          ecsignature = _sign(curve, buf_sha256, private_key.d, nonce++);
          der = ecsignature.toDER();
          lenR = der[3];
          lenS = der[5 + lenR];
          if (lenR === 32 && lenS === 32) {
            i = calcPubKeyRecoveryParam(curve, e, ecsignature, private_key.toPublicKey().Q);
            i += 4;  // compressed
            i += 27; // compact  //  24 or 27 :( forcing odd-y 2nd key candidate)
            break;
          }
          if (nonce % 10 === 0) {
            console.log(`WARN: ${  nonce  } attempts to find canonical signature`);
          }
        }
        return new Signature(ecsignature.r, ecsignature.s, i);
    };

    static sign(string, private_key) {
        return Signature.signBuffer(Buffer.from(string), private_key);
    };


    /**
        @param {Buffer} un-hashed
        @param {./PublicKey}
        @return {boolean}
    */
    verifyBuffer(buf, public_key) {
        const _hash = sha256(buf);
        return this.verifyHash(_hash, public_key);
    };

    verifyHash(hash, public_key) {
        equal(hash.length, 32, `A SHA 256 should be 32 bytes long, instead got ${  hash.length}`);
        return verify(curve, hash, {
          r: this.r,
          s: this.s
        }, public_key.Q);
    };


    // toByteBuffer() {
    //     var b;
    //     b = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
    //     this.appendByteBuffer(b);
    //     return b.copy(0, b.offset);
    // };

    static fromHex(hex) {
        return Signature.fromBuffer(Buffer.from(hex, 'hex'));
    };

    toHex() {
        return this.toBuffer().toString('hex');
    };

    static signHex(hex, private_key) {
        const buf = Buffer.from(hex, 'hex');
        return Signature.signBuffer(buf, private_key);
    };

    verifyHex(hex, public_key) {
        const buf = Buffer.from(hex, 'hex');
        return this.verifyBuffer(buf, public_key);
    };

    static verifyData(data, signature, public_key_str) {
    	const data_buf = Buffer.from(data);
        const data_buf_hex = Buffer.from(data_buf, 'hex');
        const data_buf_hash = sha256(data_buf_hex);
        equal(data_buf_hash.length, 32, `A SHA 256 should be 32 bytes long, instead got ${  data_buf_hash.length}`);
        const public_key=PublicKey.fromString(public_key_str);
        return verify(curve, data_buf_hash, signature, public_key.Q);
    };

}
const toPrivateObj = o => (o ? o.d ? o : PrivateKey.fromWif(o) : o/*null or undefined*/)
export default Signature;
