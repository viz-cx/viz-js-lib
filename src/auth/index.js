import bigi from 'bigi';
import bs58 from 'bs58';
import ecurve from 'ecurve';
import config from '../config.js';
import operation  from './serializer/src/operations.js';
import Signature from './ecc/src/signature.js';
import KeyPrivate from './ecc/src/key_private.js';
import PublicKey from './ecc/src/key_public.js';
import * as hash from './ecc/src/hash.js';

const {Point} = ecurve;
const secp256k1 = ecurve.getCurveByName('secp256k1');

const Auth = {};
const {transaction} = operation;
const {signed_transaction} = operation;

Auth.signature=Signature;

Auth.verify = function (name, password, auths) {
	let hasKey = false;
	const roles = [];
	for (const role in auths) {
		roles.push(role);
	}
	const pubKeys = this.generateKeys(name, password, roles);
	roles.forEach((role) => {
		if (auths[role][0][0] === pubKeys[role]) {
			hasKey = true;
		}
	});
	return hasKey;
};

Auth.generateKeys = function (name, password, roles) {
	const pubKeys = {};
	roles.forEach((role) => {
		const seed = name + role + password;
		const brainKey = seed.trim().split(/[\t\n\v\f\r ]+/).join(' ');
		const hashSha256 = hash.sha256(brainKey);
		const bigInt = bigi.fromBuffer(hashSha256);
		const toPubKey = secp256k1.G.multiply(bigInt);
		const point = new Point(toPubKey.curve, toPubKey.x, toPubKey.y, toPubKey.z);
		const pubBuf = point.getEncoded(toPubKey.compressed);
		const checksum = hash.ripemd160(pubBuf);
		const addy = Buffer.concat([pubBuf, checksum.slice(0, 4)]);
		pubKeys[role] = config.get('address_prefix') + bs58.encode(addy);
	});
	return pubKeys;
};

/**
	@arg {string} name - blockchain account name
	@arg {string} password - very strong password typically no shorter than a private key
	@arg {array} roles - defaults to standard Golos blockchain-level roles
*/
Auth.getPrivateKeys = function (name, password, roles = ['master', 'active', 'regular', 'memo']) {
	const privKeys = {};
	roles.forEach((role) => {
		privKeys[role] = this.toWif(name, password, role);
		privKeys[`${role  }Pubkey`] = this.wifToPublic(privKeys[role]);
	});
	return privKeys;
};

Auth.isWif = function (privWif) {
	let isWif = false;
	try {
		const bufWif = new Buffer(bs58.decode(privWif));
		const privKey = bufWif.slice(0, -4);
		const checksum = bufWif.slice(-4);
		let newChecksum = hash.sha256(privKey);
		newChecksum = hash.sha256(newChecksum);
		newChecksum = newChecksum.slice(0, 4);
		if (checksum.toString() == newChecksum.toString()) {
			isWif = true;
		}
	} catch { /* empty */ }
	return isWif;
};

Auth.toWif = function (name, password, role) {
	const seed = name + role + password;
	const brainKey = seed.trim().split(/[\t\n\v\f\r ]+/).join(' ');
	const hashSha256 = hash.sha256(brainKey);
	const privKey = Buffer.concat([new Buffer([0x80]), hashSha256]);
	let checksum = hash.sha256(privKey);
	checksum = hash.sha256(checksum);
	checksum = checksum.slice(0, 4);
	const privWif = Buffer.concat([privKey, checksum]);
	return bs58.encode(privWif);
};

Auth.wifIsValid = function (privWif, pubWif) {
	return (this.wifToPublic(privWif) == pubWif);
};

Auth.wifToPublic = function (privWif) {
	let pubWif = KeyPrivate.fromWif(privWif);
	pubWif = pubWif.toPublic().toString();
	return pubWif;
};

Auth.isPubkey = function(pubkey, address_prefix) {
	return PublicKey.fromString(pubkey, address_prefix) != null
}

Auth.signTransaction = function (trx, keys, debug = false) {
	let signatures = [];
	if (trx.signatures) {
		signatures = [].concat(trx.signatures);
	}

	const cid = new Buffer(config.get('chain_id'), 'hex');
	const buf = transaction.toBuffer(trx);

	if(debug){
		console.log('transaction',transaction.fromBuffer(buf));
		console.log('raw transaction',buf.toString('hex'));
	}

	for (const key in keys) {
		const sig = Signature.signBuffer(Buffer.concat([cid, buf]), keys[key]);
		signatures.push(sig.toBuffer())
		if(debug){
			console.log('signature',sig.toBuffer().toString('hex'));
		}
	}

	return signed_transaction.toObject(Object.assign(trx, { signatures }))
};

export default Auth;
