'use strict';

var fs = require('fs');
var path = require('path');

/*
 * 公共方法
 */
module.exports={

	// 在默认配置的基础上合并自定义配置文件
	config:function(defaultConfig, userConfig){
		var conf={};
	    if(typeof defaultConfig === 'object'){
	        conf=defaultConfig;
	        if(typeof userConfig === 'object')
	            for(var x in userConfig)
	                if(x in conf) conf[x]=userConfig[x];
	    }
	    // 进一步处理
	    if(conf['parse_hierarchy']==-1)conf['parse_hierarchy']=Number.MAX_VALUE;
	    return conf;
	},
	
	// 筛选文件
	filterFile:function(files, avoidType, ignoreType){
		var res = [], type, avoid=true;
		if(!!avoidType){
			type = new RegExp(avoidType, 'i');
		}else{
			type = new RegExp(ignoreType, 'i');
			avoid=false;
		}
		for(var i=0, ii=files.length; i<ii; i++){
			var ext=path.extname(files[i]);
			if(ext.charAt(0)==='.') ext = ext.substr(1);
			if(ext && ((avoid && ext.match(type)) || (!avoid && !ext.match(type)))) res.push(files[i]);  
		}
		return res;
	}
};