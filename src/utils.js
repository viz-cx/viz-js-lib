import {Aes} from './auth/ecc';

const snakeCaseRe = /_([a-z])/g;
export function camelCase(str) {
  return str.replace(snakeCaseRe, function(_m, l) {
    return l.toUpperCase();
  });
}

export function validateAccountName(value) {
  let i, label, len, suffix;

  suffix = "Account name should ";
  if (!value) {
    return suffix + "not be empty.";
  }
  const length = value.length;
  if (length < 2) {
    return suffix + "be longer.";
  }
  if (length > 25) {
    return suffix + "be shorter.";
  }
  if (/\./.test(value)) {
    suffix = "Each account segment should ";
  }
  const ref = value.split(".");
  for (i = 0, len = ref.length; i < len; i++) {
    label = ref[i];
    if (!/^[a-z]/.test(label)) {
      return suffix + "start with a letter.";
    }
    if (!/^[a-z0-9-]*$/.test(label)) {
      return suffix + "have only letters, digits, or dashes.";
    }
    if (/--/.test(label)) {
      return suffix + "have only one dash in a row.";
    }
    if (!/[a-z0-9]$/.test(label)) {
      return suffix + "end with a letter or digit.";
    }
    if (!(label.length >= 2)) {
      return suffix + "be longer";
    }
  }
  return null;
}

export function voiceEvent(wif,account,event_type,target_account,target_block,data,loop,callback){
  loop=typeof loop === 'undefined'?false:loop;
  callback=typeof callback === 'undefined'?function(){}:callback;

  let use_previous=function(wif,account,event_type,target_account,target_block,data,previous,callback){
    let object={
      'p':previous,
      'e':event_type,//h - hide, e - edit, a - append
      'b':target_block,//block to hide, edit or append
    };
    if(target_account!==account){
      object['a']=target_account;
    }
    if(typeof data !== 'undefined'){
      object['d']=data;//optional
    }
    viz.broadcast.custom(wif,[],[account],'VE',JSON.stringify(object),function(err,result){
      callback(!err);
    });
  }
  if(false!==loop){
    use_previous(wif,account,event_type,target_account,target_block,data,loop,callback);
  }
  else{
    viz.api.getAccount(account,'VE',function(err,result){
      if(!err){
        use_previous(wif,account,event_type,target_account,target_block,data,result.custom_sequence_block_num,callback);
      }
      else{
        callback(false);
      }
    });
  }
}

export function voiceText(wif,account,text,reply,share,beneficiaries,loop,callback){
  reply=typeof reply === 'undefined'?false:reply;
  share=typeof share === 'undefined'?false:share;
  beneficiaries=typeof beneficiaries === 'undefined'?false:beneficiaries;
  loop=typeof loop === 'undefined'?false:loop;
  callback=typeof callback === 'undefined'?function(){}:callback;

  let use_previous=function(wif,account,text,reply,share,beneficiaries,previous,callback){
    let object={
      'p':previous,
      //'t':'t',//text as default type
      'd':{
        't':text,
      }
    };
    if(reply){
      object['d']['r']=reply;
    }
    else{//share conflict with reply
      if(share){
        object['d']['s']=share;
      }
    }
    if(beneficiaries){//json example: [{"account":"committee","weight":1000}]
      object['d']['b']=beneficiaries;
    }
    viz.broadcast.custom(wif,[],[account],'V',JSON.stringify(object),function(err,result){
      callback(!err);
    });
  }
  if(false!==loop){
    use_previous(wif,account,text,reply,share,beneficiaries,loop,callback);
  }
  else{
    viz.api.getAccount(account,'V',function(err,result){
      if(!err){
        use_previous(wif,account,text,reply,share,beneficiaries,result.custom_sequence_block_num,callback);
      }
      else{
        callback(false);
      }
    });
  }
}

export function voiceEncodedText(wif,account,passphrase,comment,text,reply,share,beneficiaries,loop,callback){
  reply=typeof reply === 'undefined'?false:reply;
  share=typeof share === 'undefined'?false:share;
  beneficiaries=typeof beneficiaries === 'undefined'?false:beneficiaries;
  loop=typeof loop === 'undefined'?false:loop;
  callback=typeof callback === 'undefined'?function(){}:callback;

  let use_previous=function(wif,account,passphrase,comment,text,reply,share,beneficiaries,previous,callback){
    let object={
      'd':{
        't':text,
      }
    };
    if(reply){
      object['d']['r']=reply;
    }
    else{//share conflict with reply
      if(share){
        object['d']['s']=share;
      }
    }
    if(beneficiaries){//json example: [{"account":"committee","weight":1000}]
      object['d']['b']=beneficiaries;
    }
    if(typeof passphrase === 'object'){
      //reverse array (first item encode last for human readable envelope)
      passphrase=passphrase.reverse();
      if(typeof comment === 'object'){
        comment=comment.reverse();
      }
      for(let i in passphrase){
        let number=i;
        if(0==number){
          object['nt']='t';//text
        }
        else{
          object['nt']='e';//encoded
        }
        console.log('encode object',object,'with passphrase',passphrase[number],'and comment',comment[number]);
        object['d']=JSON.stringify(object);
        object['d']=Aes.simpleEncoder(object['d'],passphrase[number]);
        if(typeof comment === 'object'){
          if(typeof comment[number] === 'string'){
            object['c']=comment[number];
          }
        }
      }
      delete object['nt'];//remove new type because it already stringified and encoded
    }
    else{
      //nt - new type (not needed for default t/text)
      //object['d']['nt']=object['t'];//new type is text
      object['d']=JSON.stringify(object);
      object['d']=Aes.simpleEncoder(object['d'],passphrase);
      if(typeof comment !== 'undefined'){
        object['c']=comment;
      }
    }
    object['t']='e';//encoded
    object['p']=previous;
    viz.broadcast.custom(wif,[],[account],'V',JSON.stringify(object),function(err,result){
      callback(!err);
    });
  }
  if(false!==loop){
    use_previous(wif,account,passphrase,comment,text,reply,share,beneficiaries,loop,callback);
  }
  else{
    viz.api.getAccount(account,'V',function(err,result){
      if(!err){
        use_previous(wif,account,passphrase,comment,text,reply,share,beneficiaries,result.custom_sequence_block_num,callback);
      }
      else{
        callback(false);
      }
    });
  }
}

export function voicePublication(wif,account,title,markdown,description,image,reply,share,beneficiaries,loop,callback){
  description=typeof description === 'undefined'?false:description;
  image=typeof image === 'undefined'?false:image;
  reply=typeof reply === 'undefined'?false:reply;
  share=typeof share === 'undefined'?false:share;
  beneficiaries=typeof beneficiaries === 'undefined'?false:beneficiaries;
  loop=typeof loop === 'undefined'?false:loop;
  callback=typeof callback === 'undefined'?function(){}:callback;

  let use_previous=function(wif,account,title,markdown,description,image,reply,share,beneficiaries,previous,callback){
    let object={
      'p':previous,
      't':'p',//publication
      'd':{
        't':title,
        'm':markdown,
      }
    };
		if(description){
			object['d']['d']=description;
		}
		if(image){
			object['d']['i']=image;
		}
    if(reply){
      object['d']['r']=reply;
    }
    else{//share conflict with reply
      if(share){
        object['d']['s']=share;
      }
    }
    if(beneficiaries){//json example: [{"account":"committee","weight":1000}]
      object['d']['b']=beneficiaries;
    }
    viz.broadcast.custom(wif,[],[account],'V',JSON.stringify(object),function(err,result){
      callback(!err);
    });
  }
  if(false!==loop){
    use_previous(wif,account,title,markdown,description,image,reply,share,beneficiaries,loop,callback);
  }
  else{
    viz.api.getAccount(account,'V',function(err,result){
      if(!err){
        use_previous(wif,account,title,markdown,description,image,reply,share,beneficiaries,result.custom_sequence_block_num,callback);
      }
      else{
        callback(false);
      }
    });
  }
}

export function voiceEncodedPublication(wif,account,passphrase,comment,title,markdown,description,image,reply,share,beneficiaries,loop,callback){
  description=typeof description === 'undefined'?false:description;
  image=typeof image === 'undefined'?false:image;
  reply=typeof reply === 'undefined'?false:reply;
  share=typeof share === 'undefined'?false:share;
  beneficiaries=typeof beneficiaries === 'undefined'?false:beneficiaries;
  loop=typeof loop === 'undefined'?false:loop;
  callback=typeof callback === 'undefined'?function(){}:callback;

  let use_previous=function(wif,account,passphrase,comment,title,markdown,description,image,reply,share,beneficiaries,previous,callback){
    let object={
      't':'p',//publication
      'd':{
        't':title,
        'm':markdown,
      }
    };
		if(description){
			object['d']['d']=description;
		}
		if(image){
			object['d']['i']=image;
		}
    if(reply){
      object['d']['r']=reply;
    }
    else{//share conflict with reply
      if(share){
        object['d']['s']=share;
      }
    }
    if(beneficiaries){//json example: [{"account":"committee","weight":1000}]
      object['d']['b']=beneficiaries;
    }
    if(typeof passphrase === 'object'){
      //reverse array (first item encode last for human readable envelope)
      passphrase=passphrase.reverse();
      if(typeof comment === 'object'){
        comment=comment.reverse();
      }
      for(let i in passphrase){
        let number=i;
        if(0==number){
          object['nt']='t';//text
        }
        else{
          object['nt']='e';//encoded
        }
        console.log('encode object',object,'with passphrase',passphrase[number],'and comment',comment[number]);
        object['d']=JSON.stringify(object);
        object['d']=Aes.simpleEncoder(object['d'],passphrase[number]);
        if(typeof comment === 'object'){
          if(typeof comment[number] === 'string'){
            object['c']=comment[number];
          }
        }
      }
      delete object['nt'];//remove new type because it already stringified and encoded
    }
    else{
      object['d']['nt']=object['t'];//new type
      object['d']=JSON.stringify(object);
      object['d']=Aes.simpleEncoder(object['d'],passphrase);
      if(typeof comment !== 'undefined'){
        object['c']=comment;
      }
    }
    object['t']='e';//encoded
    object['p']=previous;
    viz.broadcast.custom(wif,[],[account],'V',JSON.stringify(object),function(err,result){
      callback(!err);
    });
  }
  if(false!==loop){
    use_previous(wif,account,passphrase,comment,title,markdown,description,image,reply,share,beneficiaries,loop,callback);
  }
  else{
    viz.api.getAccount(account,'V',function(err,result){
      if(!err){
        use_previous(wif,account,passphrase,comment,title,markdown,description,image,reply,share,beneficiaries,result.custom_sequence_block_num,callback);
      }
      else{
        callback(false);
      }
    });
  }
}