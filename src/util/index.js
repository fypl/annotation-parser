'use strict';

var fs = require('fs');
var path = require('path');

/*
 * 公共方法
 */
module.exports={
	'config':config,
    'fileExists':fileExists,
    'getRootDir':getRootDir,
    'getAllFiles':getAllFiles,
    'filterFile':filterFile,
    'getFileName':getFileName
};
/*
 * 在默认配置的基础上合并自定义配置文件
 */
function config(defaultConfig, userConfig){
	var conf={};
    if(typeof defaultConfig === 'object'){
        conf=defaultConfig;
        if(typeof userConfig === 'object')
            for(var x in userConfig)
                if(x in conf) conf[x]=userConfig[x];
    }
    // 进一步处理
    if(conf['parse_hierarchy']==-1)conf['parse_hierarchy']=Number.MAX_VALUE;
    // 将配置的所有相对路径转换为绝对路径
    // 定义注释规则相关
    toAbsolutePath(conf, 'smart_user_rule');
    toAbsolutePath(conf, 'smart_default_rule');
    toAbsolutePath(conf, 'default_user_rule');
    toAbsolutePath(conf, 'default_user_rule');
    // 待解析的文件相关
    toAbsolutePath(conf, 'path');
    // 输出文件相关
    toAbsolutePath(conf, 'target_api_path');
    toAbsolutePath(conf, 'target_cls_path');
    if(!conf['target_api_nav_path']) conf['target_api_nav_path']=conf['target_api_path'];
    if(!conf['target_cls_nav_path']) conf['target_cls_nav_path']=conf['target_cls_path'];
    toAbsolutePath(conf, 'target_api_nav_path');
    toAbsolutePath(conf, 'target_cls_nav_path');
    return conf;
}
/*
 * 绝对路径化
 */
function toAbsolutePath(conf, filePath){
    if(conf[filePath]) conf[filePath]=path.normalize(path.resolve(__dirname, '../config/', conf[filePath]));
    console.log(conf[filePath]);
}
/*
 * 文件是否存在
 */
function fileExists(path){
    return fs.lstatSync(path).isFile();
}
/*
 * 获取根目录
 */
function getRootDir(filepath){
    if(fs.lstatSync(filepath).isDirectory()) return filepath;
    return path.resolve(filepath, '..');
}
/*
 * 获取根目录下所有文件名
 */
function getAllFiles(root){
    var res = [], stat = fs.lstatSync(root);
    if(stat.isDirectory()){
        var files = fs.readdirSync(root);
        files.forEach(function(file){
            var pathname=path.normalize(root+path.sep+file);
            res=res.concat(getAllFiles(pathname));
        });
    }else if(stat.isFile()){
        res.push(root);
    }
    return res;
}
/*
 * 筛选文件
 */
function filterFile(files, avoidType, ignoreType){
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
/*
 * 获取文件名
 */
function getFileName(fileName, root){
    var index=fileName.indexOf(root);
    var name= index===0 ? fileName.substr(root.length) : filename;
    name=name.replace(/(\\|\/)+/g,'.').replace(/^\.+/,'').replace(/\.+$/,'');
    return name;
}