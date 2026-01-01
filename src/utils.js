import { simpleEncoder } from './auth/ecc/src/aes.js';
import viz from './api/index.js';

const snakeCaseRe = /_([a-z])/g;
export function camelCase(str) {
  return str.replace(snakeCaseRe, (_m, l) => {
    return l.toUpperCase();
  });
}

export function validateAccountName(value) {
  let i, label, len, suffix;

  suffix = 'Account name should ';
  if (!value) {
    return `${suffix}not be empty.`;
  }
  const { length } = value;
  if (length < 2) {
    return `${suffix}be longer.`;
  }
  if (length > 25) {
    return `${suffix}be shorter.`;
  }
  if (/\./.test(value)) {
    suffix = 'Each account segment should ';
  }
  const ref = value.split('.');
  for (i = 0, len = ref.length; i < len; i++) {
    label = ref[i];
    if (!/^[a-z]/.test(label)) {
      return `${suffix}start with a letter.`;
    }
    if (!/^[a-z0-9-]*$/.test(label)) {
      return `${suffix}have only letters, digits, or dashes.`;
    }
    if (/--/.test(label)) {
      return `${suffix}have only one dash in a row.`;
    }
    if (!/[a-z0-9]$/.test(label)) {
      return `${suffix}end with a letter or digit.`;
    }
    if (!(label.length >= 2)) {
      return `${suffix}be longer`;
    }
  }
  return null;
}

export function voiceEvent(
  wif,
  account,
  event_type,
  target_account,
  target_block,
  data,
  loop,
  callback
) {
  const loopValue = typeof loop === 'undefined' ? false : loop;
  const callbackFn = typeof callback === 'undefined' ? function () {} : callback;

  const executeBroadcast = function (
    wifKey,
    accountName,
    eventType,
    targetAccount,
    targetBlock,
    dataValue,
    previous,
    cb
  ) {
    const object = {
      p: previous,
      e: eventType, //h - hide, e - edit, a - append
      b: targetBlock, //block to hide, edit or append
    };
    if (targetAccount !== accountName) {
      object['a'] = targetAccount;
    }
    if (typeof dataValue !== 'undefined') {
      object['d'] = dataValue; //optional
    }
    viz.broadcast.custom(
      wifKey,
      [],
      [accountName],
      'VE',
      JSON.stringify(object),
      (err) => {
        cb(!err);
      }
    );
  };

  if (false !== loopValue) {
    executeBroadcast(
      wif,
      account,
      event_type,
      target_account,
      target_block,
      data,
      loopValue,
      callbackFn
    );
  } else {
    viz.api.getAccount(account, 'VE', (err, result) => {
      if (!err) {
        executeBroadcast(
          wif,
          account,
          event_type,
          target_account,
          target_block,
          data,
          result.custom_sequence_block_num,
          callbackFn
        );
      } else {
        callbackFn(false);
      }
    });
  }
}

export function voiceText(
  wif,
  account,
  text,
  reply,
  share,
  beneficiaries,
  loop,
  callback
) {
  const replyValue = typeof reply === 'undefined' ? false : reply;
  const shareValue = typeof share === 'undefined' ? false : share;
  const beneficiariesValue = typeof beneficiaries === 'undefined' ? false : beneficiaries;
  const loopValue = typeof loop === 'undefined' ? false : loop;
  const callbackFn = typeof callback === 'undefined' ? function () {} : callback;

  const executeBroadcast = function (
    wifKey,
    accountName,
    textContent,
    replyTo,
    shareRef,
    beneficiariesList,
    previous,
    cb
  ) {
    const object = {
      p: previous,
      //'t':'t',//text as default type
      d: {
        t: textContent,
      },
    };
    if (replyTo) {
      object['d']['r'] = replyTo;
    } else {
      //share conflict with reply
      if (shareRef) {
        object['d']['s'] = shareRef;
      }
    }
    if (beneficiariesList) {
      //json example: [{"account":"committee","weight":1000}]
      object['d']['b'] = beneficiariesList;
    }
    viz.broadcast.custom(
      wifKey,
      [],
      [accountName],
      'V',
      JSON.stringify(object),
      (err) => {
        cb(!err);
      }
    );
  };

  if (false !== loopValue) {
    executeBroadcast(
      wif,
      account,
      text,
      replyValue,
      shareValue,
      beneficiariesValue,
      loopValue,
      callbackFn
    );
  } else {
    viz.api.getAccount(account, 'V', (err, result) => {
      if (!err) {
        executeBroadcast(
          wif,
          account,
          text,
          replyValue,
          shareValue,
          beneficiariesValue,
          result.custom_sequence_block_num,
          callbackFn
        );
      } else {
        callbackFn(false);
      }
    });
  }
}

export function voiceEncodedText(
  wif,
  account,
  passphrase,
  comment,
  text,
  reply,
  share,
  beneficiaries,
  loop,
  callback
) {
  const replyValue = typeof reply === 'undefined' ? false : reply;
  const shareValue = typeof share === 'undefined' ? false : share;
  const beneficiariesValue = typeof beneficiaries === 'undefined' ? false : beneficiaries;
  const loopValue = typeof loop === 'undefined' ? false : loop;
  const callbackFn = typeof callback === 'undefined' ? function () {} : callback;

  const executeBroadcast = function (
    wifKey,
    accountName,
    passphraseValue,
    commentValue,
    textContent,
    replyTo,
    shareRef,
    beneficiariesList,
    previous,
    cb
  ) {
    const object = {
      d: {
        t: textContent,
      },
    };
    if (replyTo) {
      object['d']['r'] = replyTo;
    } else {
      //share conflict with reply
      if (shareRef) {
        object['d']['s'] = shareRef;
      }
    }
    if (beneficiariesList) {
      //json example: [{"account":"committee","weight":1000}]
      object['d']['b'] = beneficiariesList;
    }
    if (typeof passphraseValue === 'object') {
      //reverse array (first item encode last for human readable envelope)
      const passphraseArray = passphraseValue.reverse();
      const commentArray = typeof commentValue === 'object' ? commentValue.reverse() : commentValue;

      for (const i in passphraseArray) {
        const number = i;
        if (0 == number) {
          object['nt'] = 't'; //text
        } else {
          object['nt'] = 'e'; //encoded
        }
        console.log(
          'encode object',
          object,
          'with passphrase',
          passphraseArray[number],
          'and comment',
          commentArray[number]
        );
        object['d'] = JSON.stringify(object);
        object['d'] = simpleEncoder(object['d'], passphraseArray[number]);
        if (typeof commentArray === 'object') {
          if (typeof commentArray[number] === 'string') {
            object['c'] = commentArray[number];
          }
        }
      }
      delete object['nt']; //remove new type because it already stringified and encoded
    } else {
      //nt - new type (not needed for default t/text)
      //object['d']['nt']=object['t'];//new type is text
      object['d'] = JSON.stringify(object);
      object['d'] = simpleEncoder(object['d'], passphraseValue);
      if (typeof commentValue !== 'undefined') {
        object['c'] = commentValue;
      }
    }
    object['t'] = 'e'; //encoded
    object['p'] = previous;
    viz.broadcast.custom(
      wifKey,
      [],
      [accountName],
      'V',
      JSON.stringify(object),
      (err) => {
        cb(!err);
      }
    );
  };

  if (false !== loopValue) {
    executeBroadcast(
      wif,
      account,
      passphrase,
      comment,
      text,
      replyValue,
      shareValue,
      beneficiariesValue,
      loopValue,
      callbackFn
    );
  } else {
    viz.api.getAccount(account, 'V', (err, result) => {
      if (!err) {
        executeBroadcast(
          wif,
          account,
          passphrase,
          comment,
          text,
          replyValue,
          shareValue,
          beneficiariesValue,
          result.custom_sequence_block_num,
          callbackFn
        );
      } else {
        callbackFn(false);
      }
    });
  }
}

export function voicePublication(
  wif,
  account,
  title,
  markdown,
  description,
  image,
  reply,
  share,
  beneficiaries,
  loop,
  callback
) {
  const descriptionValue = typeof description === 'undefined' ? false : description;
  const imageValue = typeof image === 'undefined' ? false : image;
  const replyValue = typeof reply === 'undefined' ? false : reply;
  const shareValue = typeof share === 'undefined' ? false : share;
  const beneficiariesValue = typeof beneficiaries === 'undefined' ? false : beneficiaries;
  const loopValue = typeof loop === 'undefined' ? false : loop;
  const callbackFn = typeof callback === 'undefined' ? function () {} : callback;

  const executeBroadcast = function (
    wifKey,
    accountName,
    titleText,
    markdownContent,
    descriptionText,
    imageUrl,
    replyTo,
    shareRef,
    beneficiariesList,
    previous,
    cb
  ) {
    const object = {
      p: previous,
      t: 'p', //publication
      d: {
        t: titleText,
        m: markdownContent,
      },
    };
    if (descriptionText) {
      object['d']['d'] = descriptionText;
    }
    if (imageUrl) {
      object['d']['i'] = imageUrl;
    }
    if (replyTo) {
      object['d']['r'] = replyTo;
    } else {
      //share conflict with reply
      if (shareRef) {
        object['d']['s'] = shareRef;
      }
    }
    if (beneficiariesList) {
      //json example: [{"account":"committee","weight":1000}]
      object['d']['b'] = beneficiariesList;
    }
    viz.broadcast.custom(
      wifKey,
      [],
      [accountName],
      'V',
      JSON.stringify(object),
      (err) => {
        cb(!err);
      }
    );
  };

  if (false !== loopValue) {
    executeBroadcast(
      wif,
      account,
      title,
      markdown,
      descriptionValue,
      imageValue,
      replyValue,
      shareValue,
      beneficiariesValue,
      loopValue,
      callbackFn
    );
  } else {
    viz.api.getAccount(account, 'V', (err, result) => {
      if (!err) {
        executeBroadcast(
          wif,
          account,
          title,
          markdown,
          descriptionValue,
          imageValue,
          replyValue,
          shareValue,
          beneficiariesValue,
          result.custom_sequence_block_num,
          callbackFn
        );
      } else {
        callbackFn(false);
      }
    });
  }
}

export function voiceEncodedPublication(
  wif,
  account,
  passphrase,
  comment,
  title,
  markdown,
  description,
  image,
  reply,
  share,
  beneficiaries,
  loop,
  callback
) {
  const descriptionValue = typeof description === 'undefined' ? false : description;
  const imageValue = typeof image === 'undefined' ? false : image;
  const replyValue = typeof reply === 'undefined' ? false : reply;
  const shareValue = typeof share === 'undefined' ? false : share;
  const beneficiariesValue = typeof beneficiaries === 'undefined' ? false : beneficiaries;
  const loopValue = typeof loop === 'undefined' ? false : loop;
  const callbackFn = typeof callback === 'undefined' ? function () {} : callback;

  const executeBroadcast = function (
    wifKey,
    accountName,
    passphraseValue,
    commentValue,
    titleText,
    markdownContent,
    descriptionText,
    imageUrl,
    replyTo,
    shareRef,
    beneficiariesList,
    previous,
    cb
  ) {
    const object = {
      t: 'p', //publication
      d: {
        t: titleText,
        m: markdownContent,
      },
    };
    if (descriptionText) {
      object['d']['d'] = descriptionText;
    }
    if (imageUrl) {
      object['d']['i'] = imageUrl;
    }
    if (replyTo) {
      object['d']['r'] = replyTo;
    } else {
      //share conflict with reply
      if (shareRef) {
        object['d']['s'] = shareRef;
      }
    }
    if (beneficiariesList) {
      //json example: [{"account":"committee","weight":1000}]
      object['d']['b'] = beneficiariesList;
    }
    if (typeof passphraseValue === 'object') {
      //reverse array (first item encode last for human readable envelope)
      const passphraseArray = passphraseValue.reverse();
      const commentArray = typeof commentValue === 'object' ? commentValue.reverse() : commentValue;

      for (const i in passphraseArray) {
        const number = i;
        if (0 == number) {
          object['nt'] = 'p'; //publication
        } else {
          object['nt'] = 'e'; //encoded
        }
        console.log(
          'encode object',
          object,
          'with passphrase',
          passphraseArray[number],
          'and comment',
          commentArray[number]
        );
        object['d'] = JSON.stringify(object);
        object['d'] = simpleEncoder(object['d'], passphraseArray[number]);
        if (typeof commentArray === 'object') {
          if (typeof commentArray[number] === 'string') {
            object['c'] = commentArray[number];
          }
        }
      }
      delete object['nt']; //remove new type because it already stringified and encoded
    } else {
      object['d']['nt'] = object['t']; //new type
      object['d'] = JSON.stringify(object);
      object['d'] = simpleEncoder(object['d'], passphraseValue);
      if (typeof commentValue !== 'undefined') {
        object['c'] = commentValue;
      }
    }
    object['t'] = 'e'; //encoded
    object['p'] = previous;
    viz.broadcast.custom(
      wifKey,
      [],
      [accountName],
      'V',
      JSON.stringify(object),
      (err) => {
        cb(!err);
      }
    );
  };

  if (false !== loopValue) {
    executeBroadcast(
      wif,
      account,
      passphrase,
      comment,
      title,
      markdown,
      descriptionValue,
      imageValue,
      replyValue,
      shareValue,
      beneficiariesValue,
      loopValue,
      callbackFn
    );
  } else {
    viz.api.getAccount(account, 'V', (err, result) => {
      if (!err) {
        executeBroadcast(
          wif,
          account,
          passphrase,
          comment,
          title,
          markdown,
          descriptionValue,
          imageValue,
          replyValue,
          shareValue,
          beneficiariesValue,
          result.custom_sequence_block_num,
          callbackFn
        );
      } else {
        callbackFn(false);
      }
    });
  }
}

export default {
  camelCase,
  validateAccountName,
  voiceEvent,
  voiceText,
  voiceEncodedText,
  voicePublication,
  voiceEncodedPublication
}
