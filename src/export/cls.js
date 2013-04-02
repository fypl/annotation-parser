'use strict';

var fs=require('fs');
var path=require('path');
var log=require('../log');
var base='';
var dir='';
var dirpath='';

//生成html类图
module.exports.html=function(files, targetClsNavPath, targetClsPath, htmlFriendly){
	log('create html class begin...');
	base=targetClsPath;
	var html='<ul>';
	files.forEach(function(file){
		dir=file.file;
		dirpath=dir.replace(path.extname(dir),'');
		var filedir=path.join(dirpath+'.'+toDirStr(file.annos[0].getTitle())+'.html');
		html+='<li><a href="#'+encodeURIComponent(filedir)+'" title="'+dir+'">'+dir+'</a></li>';
		saveAnnos(htmlFriendly?HTMLFriendly(file.annos):file.annos, 'html');
	});
	html+='</ul>';
	fs.writeFileSync(path.join(targetClsNavPath, 'cls.html'), html);
	log('create html class end!!!\n');
}
module.exports.json=function(files, targetClsNavPath, targetClsPath){
	log('create json class begin...');
	base=targetClsPath;
	var json=[];
	files.forEach(function(file){
		dir=file.file;
		dirpath=dir.replace(path.extname(dir),'');
		json.push(dir);
		saveAnnos(file.annos, 'json');
	});
	fs.writeFileSync(path.join(targetClsNavPath, 'cls.json'), JSON.stringify(json));
	log('create json class end!!!\n');
}

function saveAnnos(annos, ext){
	var filedir=path.join(base, dirpath+'.'+toDirStr(annos[0].getTitle())+'.'+ext);
	var data= ext == 'json' ? JSON.stringify(annos) : annosToString(annos);
	var buffer=new Buffer(data);
	if(fs.existsSync(filedir)) log.warn('warn: 文件冲突，'+filedir+"会被覆盖！");
	var fd=fs.openSync(filedir, 'w');
	fs.writeSync(fd, buffer, 0, buffer.length, 0);
	fs.close(fd,function(err){ if(err) log.warn('somethine happened when close file '+filedir+'\n'+err); });
}
function annosToString(annos){
	var str='';
	if(annos && annos.length>0){
		str+='<ul>';
		annos.forEach(function(anno){
			str+='<li class="topLev">'+anno.toString()+'</li>';
		});
		str+='</ul>';
	}
	return str;
}
function HTMLFriendly(obj){
	switch(obj.constructor){
		case Boolean:
		case Number:
		case Function:
		case Date:{
			return obj;
		}
		case String:
			return obj.replace(/\</g,'&lt;').replace(/\>/g,'&gt;');
		case Array:{
			for(var i=0,ii=obj.length;i<ii;i++)obj[i]=HTMLFriendly(obj[i]);
			return obj;
		}
		case Object:
		default:{
			for(var x in obj){
				if(obj.hasOwnProperty(x)){
					obj[x]=HTMLFriendly(obj[x]);
				}
			}
			return obj;
		}
	}
}
function toDirStr(str){
	return str.replace(/\s+/g,'').replace(/[\\\/\:\*\?\"\<\>\|]/g,'').substr(0,50).replace(/^\.+/,'').replace(/\.+$/,'');
}