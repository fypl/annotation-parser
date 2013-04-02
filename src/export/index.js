'use strict';

/*
 * 按配置输出文件
 */
module.exports=function(data, settings){
	// 输出文件类型
	var type=new RegExp(settings.export_file_type, 'i');
	// 输出API的文件目录
	var targetApiPath=settings.target_api_path;
	// 输出API目录的文件目录
	var targetApiNavPath=settings.target_api_nav_path;
	// 输出Class的文件目录
	var targetClsPath=settings.target_cls_path;
	// 输出Class目录的文件目录
	var targetClsNavPath=settings.target_cls_nav_path;
	// HTML友好
	var htmlFriendly=settings.html_friendly;
	// api生成工具
	var api=require('./api');
	// class生成工具
	var cls=require('./cls');
	// 按输出类型输出文件
	if('html'.match(type)){
		api.html(data, targetApiNavPath, targetApiPath, htmlFriendly);
		cls.html(data, targetClsNavPath, targetClsPath, htmlFriendly);
	}
	if('json'.match(type)){
		api.json(data, targetApiNavPath, targetApiPath);
		cls.json(data, targetClsNavPath, targetClsPath);
	}
}