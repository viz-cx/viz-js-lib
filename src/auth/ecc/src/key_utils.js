import PrivateKey from './key_private.js';
import { sha256 } from './hash.js';
import randomBuffer from 'secure-random';

// hash for .25 second
const HASH_POWER_MILLS = 250;

let entropyPos = 0, entropyCount = 0
const entropyArray = randomBuffer(101)

export function addEntropy(...ints) {
  entropyCount++;
  for (const i of ints) {
    const pos = entropyPos++ % 101;
    const i2 = entropyArray[pos] += i;
    if (i2 > 9007199254740991)
      entropyArray[pos] = 0;
  }
}
export function random32ByteBuffer(entropy = this.browserEntropy()) {

  if (!(typeof entropy === 'string')) {
    throw new Error('string required for entropy');
  }

  if (entropy.length < 32) {
    throw new Error('expecting at least 32 bytes of entropy');
  }

  const start_t = Date.now();

  while (Date.now() - start_t < HASH_POWER_MILLS)
    entropy = sha256(entropy);

  const hash_array = [];
  hash_array.push(entropy);

  // Hashing for 1 second may helps the computer is not low on entropy (this method may be called back-to-back).
  hash_array.push(randomBuffer(32));

  return sha256(Buffer.concat(hash_array));
}
export function get_random_key(entropy) {
  return PrivateKey.fromBuffer(this.random32ByteBuffer(entropy));
}
export function browserEntropy() {
  let entropyStr = Array(entropyArray).join();
  try {
    entropyStr += `${(new Date()).toString()  } ${  window.screen.height  } ${  window.screen.width  } ${
      window.screen.colorDepth  } ` + ` ${  window.screen.availHeight  } ${  window.screen.availWidth  } ${
      window.screen.pixelDepth  }${navigator.language  } ${  window.location  } ${  window.history.length}`;

    for (let i = 0, mimeType; i < navigator.mimeTypes.length; i++) {
      mimeType = navigator.mimeTypes[i];
      entropyStr += `${mimeType.description  } ${  mimeType.type  } ${  mimeType.suffixes  } `;
    }
    console.log('INFO\tbrowserEntropy gathered', entropyCount, 'events');
  } catch {
    //nodejs:ReferenceError: window is not defined
    entropyStr += sha256((new Date()).toString());
  }

  const b = new Buffer(entropyStr);
  entropyStr += `${b.toString('binary')  } ${  (new Date()).toString()}`;
  return entropyStr;
}
