'use strict';

var fs=require('fs');
var path=require('path');
var log=require('./log');
var base='';
var dir='';
var dirpath='';
var uniqueTitle={};

//生成Html导航
module.exports.htmlNav=function(files, targetApiPath){
	log('create html nav begin...');
	base=targetApiPath;
	var html='<ul>';
	files.forEach(function(file){
		dir=file.file;
		dirpath=dir.replace(path.extname(dir),'');
		uniqueTitle={};
		html+='<li class="LTop caption"><a class="LTop" href="#'+dir+'" title="'+dir+'">'+dir+'</a>'+createUl(HTMLFriendly(file.annos))+'</li>';
	});
	html+='</ul>';
	fs.writeFileSync(path.join(base,'nav.html'),html);
	log('create html nav end!!!\n');
}

function createUl(annos){
	var html='';
	if(annos && annos.length>0){
		html='<ul>'
		annos.forEach(function(anno){ html+=createLi(anno); });
		html+='</ul>';
	}
	return html;
}

function createLi(anno){
	var title=anno.getTitle(), lev=anno.__lev, hasChildren=anno.__subAnnos && anno.__subAnnos.length>0;
	if(!hasChildren){
		title=unique(title);
		saveAnno(anno, 'html')
	}
	var filedir=path.join(dirpath+'.'+toDirStr(title)+'.html');
	return '<li class="L'+lev+(hasChildren?' caption':'')+'"><a class="L'+lev+'" href="#'+encodeURIComponent(filedir)+'" title="'+title+'">'+title+'</a>'+(hasChildren?createUl(anno.__subAnnos):'')+'</li>';
}
//生成json导航
module.exports.jsonNav=function(files, targetApiPath){
	log('create json nav begin...');
	base=targetApiPath;
	var nav=[];
	files.forEach(function(file){
		dir=file.file;
		dirpath=dir.replace(path.extname(dir),'');
		uniqueTitle={};
		nav.push({'file':dir,'subtitles':getSubtitles(file.annos)});
	});
	nav=JSON.stringify(nav);
	fs.writeFileSync(path.join(base, 'nav.json'), nav);
	log('create json nav end!!!\n');
}
function getSubtitles(annos){
	var nav=null;
	if(annos && annos.length>0){
		nav=[];
		annos.forEach(function(anno){
			var title=anno.getTitle();
			if(anno.__subAnnos.length==0){
				title=unique(title);
				saveAnno(anno, 'json');
			}
			nav.push({'title':title,'subtitles':getSubtitles(anno.__subAnnos)});
		});
	}
	return nav;
}
function saveAnno(anno, ext){
	var filedir=path.join(base,dirpath+'.'+toDirStr(getUnique(anno.getTitle()))+'.'+ext);
	var data= ext=='json'? JSON.stringify(anno) : anno.toString();
	var buffer=new Buffer(data);
	if(fs.existsSync(filedir)) log.warn('文件冲突，'+filedir+"会被覆盖！");
	var fd=fs.openSync(filedir, 'w');
	fs.writeSync(fd, buffer, 0, buffer.length, 0);
	fs.close(fd,function(err){ if(err) log.warn('somethine happened when close file '+filedir+'\n'+err); });
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
function unique(title){
	if(!uniqueTitle[title])uniqueTitle[title]=1;
	else uniqueTitle[title]++;
	return title+(uniqueTitle[title]>1?uniqueTitle[title]:'');
}
function getUnique(title){
	return title+(uniqueTitle[title]>1?uniqueTitle[title]:'');
}
function toDirStr(str){
	return str.replace(/\s/g,'').replace(/[\\\/\:\*\?\"\<\>\|]/g,'').substr(0,50).replace(/^\.+/,'').replace(/\.+$/,'');
}