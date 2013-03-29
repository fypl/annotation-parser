'use strict';

function warn(warninfo){
	console.warn('warn::'+warninfo);
}
function log(loginfo){
	console.log('log::'+loginfo);
}
function info(info){
	console.info('info::'+info);
}
function err(errinfo){
	console.error('err::'+errinfo);
}
function X(type, msg){
	if(arguments.length==1){
		msg=type;
		type='log';
	}
	switch(type.toLowerCase()){
		case 'err':err(msg);break;
		case 'warn':warn(msg);break;
		case 'info':info(msg);break;
		case 'log':log(msg);break;
		default: console.log(type+'::'+msg);
	}
}
X.err=err;
X.warn=warn;
X.info=info;
X.log=log;
module.exports=X;