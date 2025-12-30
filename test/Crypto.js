import { PrivateKey, PublicKey, Signature }  from "../src/auth/ecc/index.js"
import assert from "assert"
import {sha256 } from '../src/auth/ecc/src/hash.js';

describe("viz.auth: Crypto", function() {

    /*it "Computes public key", ->
        private_key = PrivateKey.fromHex decrypted_key.substring 0, 64
        public_key = private_key.toPublicKey()
        console.log public_key.toHex());*/

    it("sign", function() {
        this.timeout(10000);
        var private_key = PrivateKey.fromSeed("1");
        return (() => {
            var result = [];
            for (var i = 0; i < 10; i++) {
                result.push(Signature.signBuffer((new Buffer(i)), private_key));
            }
            return result;
        })();
    });

})

describe("viz.auth: derives", ()=> {

    let one_time_private = PrivateKey.fromHex("8fdfdde486f696fd7c6313325e14d3ff0c34b6e2c390d1944cbfe150f4457168")
    let to_public = PublicKey.fromStringOrThrow("VIZ7vbxtK1WaZqXsiCHPcjVFBewVj8HFRd5Z5XZDpN6Pvb2dZcMqK")
    let secret = one_time_private.get_shared_secret( to_public )
    let child = sha256( secret )

    // Check everything above with `wdump((child));` from the witness_node:
    assert.equal(child.toString('hex'), "1f296fa48172d9af63ef3fb6da8e369e6cc33c1fb7c164207a3549b39e8ef698")

    let nonce = sha256( one_time_private.toBuffer() )
    assert.equal(nonce.toString('hex'), "462f6c19ece033b5a3dba09f1e1d7935a5302e4d1eac0a84489cdc8339233fbf")

    it("child from public", ()=> assert.equal(
        to_public.child(child).toString(),
        "VIZ6XA72XARQCain961PCJnXiKYdEMrndNGago2PV5bcUiVyzJ6iL",
        "derive child public key"
    ))

    // child = sha256( one_time_private.get_secret( to_public ))
    it("child from private", ()=> assert.equal(
        PrivateKey.fromSeed("alice-brain-key").child(child).toPublicKey().toString(),
        "VIZ6XA72XARQCain961PCJnXiKYdEMrndNGago2PV5bcUiVyzJ6iL",
        "derive child from private key"
    ))

    // "many keys" works, not really needed
    // it("many keys", function() {
    //
    //     this.timeout(10 * 1000)
    //
    //     for (var i = 0; i < 10; i++) {
    //         let privkey1 = key.get_random_key()
    //         let privkey2 = key.get_random_key()
    //
    //         let secret1 = one_time_private.get_shared_secret( privkey1.toPublicKey() )
    //         let child1 = sha256( secret1 )
    //
    //         let secret2 = privkey2.get_shared_secret( privkey2.toPublicKey() )
    //         let child2 = sha256( secret2 )
    //
    //         it("child from public", ()=> assert.equal(
    //             privkey1.toPublicKey().child(child1).toString(),
    //             privkey2.toPublicKey().child(child2).toString(),
    //             "derive child public key"
    //         ))
    //
    //         it("child from private", ()=> assert.equal(
    //             privkey1.child(child1).toString(),
    //             privkey2.child(child2).toString(),
    //             "derive child private key"
    //         ))
    //     }
    //
    // })

})
