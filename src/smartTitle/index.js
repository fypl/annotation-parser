var avoidExp='java|x';
module.exports=function(ext){
	if(ext.match(new RegExp(avoidExp, 'i'))) return require('./'+ext.replace(/^\.+/,'').toLowerCase()+'SmartTitle');
	else return require('./defaultSmartTitle');
}