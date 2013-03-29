// 严格模式
'use strict';

var fs  = require('fs');
var log = require('../log');

module.exports.define=function(settings, rules, Anno){
	defineRules(settings, rules, Anno);
}

function defineRules(settings, rules, Anno){
	log('define rule begin...');
	var ruleModule         = settings.rule_module,
		smartUserRule      = settings.smart_user_rule,
		smartDefaultRule   = settings.smart_default_rule,
		defaultUserRule    = settings.default_user_rule,
		defaultDefaultRule = settings.default_default_rule,
		parser 			   = require('./ruleParser');

	if(ruleModule == 'smart'){
		if(fileExists(smartUserRule)){
			parser(smartUserRule, rules, Anno);
		}else if(fileExists(smartDefaultRule)){
			parser(smartDefaultRule, rules, Anno);
		}else{
			log.err('smart rule modle:'+smartUserRule+', '+smartDefaultRule+' files not exists!');
		}
	}else if(ruleModule == 'default'){
		var user2    = require(defaultUserRule);
		var default2 = require(defaultDefaultRule);
		if(!user2 && !default2) log.err('default rule modle:'+defaultUserRule+', '+defaultDefaultRule+' files not exists!');
		else (user2 ? user2 : default2)(rules, Anno);
	}else{
		var user2 = require(defaultUserRule);
		if(fileExists(smartUserRule) && user2){
			parser(smartUserRule, rules, Anno);
			user2(rules, Anno);
		}else if(user2){
			user2(rules, Anno);
		}else{
			log.err('mix rule modle:'+smartUserRule+', '+defaultUserRule+' files not exists!');
		}
	}

	// 增强Anno
	Anno.prototype.extend = function(obj) {
		for (var x in obj) {
			if (obj.hasOwnProperty(x)) this[x] = obj[x];
		}
	};
	// 防出错
	Anno.prototype.__innerCounter = 0;
	Anno.prototype.autoTitle = function() {
		this.__title='autoTitle'+Anno.prototype.__innerCounter++;
		return this.__title;
	}
	if(!Anno.prototype.__getTitle) Anno.prototype.__getTitle=function(){return '';};
	if(!Anno.prototype.getTitle) Anno.prototype.getTitle = function(){
		return this.__getTitle() || this.__title || this.autoTitle();
	}
	if(!Anno.prototype.show) Anno.prototype.show=function(){return true;};
	if(!Anno.prototype.__toString) Anno.prototype.__toString=function(){return '';};
	if(Anno.prototype.toString.toString() == 'function toString() { [native code] }') Anno.prototype.toString=function(){
		var str='';
		if(!!this.__subAnnos && this.__subAnnos.length>0){
            str+='<ul>';
            this.__subAnnos.forEach(function(anno){
                str+='<li class="subAnno">'+anno.toString()+'</li>';
            });
            str+='</ul>';
        }
        return this.__toString()+str;
	};
	if(!rules.unmarkHandler){
		rules.unmarkHandler=function(anno, desc){
			if(anno.desc)anno.desc+=desc+'\n';
			else anno.desc=desc+'\n';
		}
	}
	log('define rule end!!!\n');
}

function fileExists(path){
	return fs.lstatSync(path).isFile();
}