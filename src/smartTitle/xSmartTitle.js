var rules=[];
function define(rule, handler){
	rules.push({'rule':rule,'handler':handler});
}
define(/function\s+(\w+)\(/,function(a1){
	return a1;
});

module.exports=function(codeline){
	var title='',rule;
	for(var i=0,ii=rules.length;i<ii;i++){
		rule=rules[i];
		if(codeline.match(rule.rule)){
			title=rule.handler(RegExp.$1, RegExp.$2, RegExp.$3, RegExp.$4, RegExp.$5, RegExp.$6, RegExp.$7, RegExp.$8, RegExp.$9, RegExp);
			break;
		}
	}
	return title;
}