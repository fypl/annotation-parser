'use strict';

var lr  = require('../lineReader')
var log = require('../log');

module.exports=function(file, rules, Anno){
	log('parse rule begin...');
	var REGEXP={
		'TOKEN':/(id|word|line|block)-([a-zA-Z_][a-zA-Z0-9_]*)/g,
		'EOL':/(\r|\n|\r\n)$/,
		'ANNO_START':/^\s*\/\*+/,
		'ANNO_END':/^\s*\*+\//,
		'ANNO_STAR':/^\s*\*+/,
		'EMPTY':/\s+/g,
		'NULL_STRING':/^\s*$/,
		'LEFT':/[\<\(\[\{]/,
		'SINGLE_LINE_ANNO':/((?!\\)\/{2,}.*)/,
		'TITLE_RULE':/\[title\](.*?)\[\/title\]/,
		'SHOW_RULE':/\[show\](.*?)\[\/show\]/,
		'STRING_RULE':/(^\!\!|@([a-zA-Z_][0-9a-zA-Z_\.]*)|\[list-([a-zA-Z_][a-zA-Z0-9_]*)\]|\[#\])/g,
		'LIST_RULE':/(\[\/list\]|@([a-zA-Z_][0-9a-zA-Z_\.]*)|\[#\])/g,
		'CHOOSE_RULE':/(\[\/#\]|@([a-zA-Z_][0-9a-zA-Z_\.]*))/g
	};
	var anno={}, lineNumber=0, isAnno=false, curRule=null, arr=null, reg=null;
	var index=0, str='var ret="";', isNecessary=false, argArr=null, curStr='', escapeCharCount=0,
		offset=0, valid=true, id='',
		isList=false, listArg=null, listStr='', listArgArr=null,
		isChoose=false, chooseArgArr=null, chooseStr='';
	var reader=lr(file);
	while(reader.hasNextLine()){
		// 去掉尾巴上可能的回车换行符
		var line = reader.nextLine().replace(REGEXP.EOL,'');
		lineNumber++;
		if(isAnno){
			if(line.match(REGEXP.ANNO_END)){
				// 语法检测
				if(curRule.multiRule && !curRule.close){
					log.err('行号：'+lineNumber+'\n多行注释('+curRule.line+')定义未闭合，需要的结尾为'+curRule.suffix);
				}
				// 注释结束 生成所有规则
				createRules(anno, rules.annoRules);
				// 填充默认属性desc,__lev,__titile,__code,__subAnnos
				anno['desc']={'id':'desc','line':'','prefix':'','multi':false,'multiRule':false,'property':{}};
				anno['__lev']={'id':'__lev','line':'','prefix':'','multi':false,'multiRule':false,'property':{}};
				anno['__title']={'id':'__title','line':'','prefix':'','multi':false,'multiRule':false,'property':{}};
				anno['__code']={'id':'__code','line':'','prefix':'','multi':false,'multiRule':false,'property':{}};
				anno['__subAnnos']={'id':'__subAnnos','line':'','prefix':'','multi':true,'multiRule':false,'property':{}};
				curRule=null;
				isAnno=false;
			}else{
				// 去掉注释前的连续* 合并空格
				line=line.replace(REGEXP.ANNO_STAR,'').replace(REGEXP.EMPTY,' ').trim();
				// 支持空行断多行注释 所以需要在此进行空行处理
				if(line.match(REGEXP.NULL_STRING)){
					if(curRule && curRule.close === false) line='EOF';
				}
				// 解析注释 提取部分属性
				if(!reg) reg=REGEXP.TOKEN;
				reg.lastIndex=0;
				while(arr=reg.exec(line)){
					switch(arr[1]){
						case 'id':{
							curRule={
								'id':arr[2],
								'line':'',
								'prefix':line.substring(0, arr.index),
								'multi':!!anno[arr[2]],
								'multiRule':false,
								'property':{}
							}
							anno[arr[2]]=curRule;
							break;
						}
						case 'word':
						case 'line':{
							break;
						}
						case 'block':{
							curRule.multiRule=true;
							if(curRule.prefix){
								if(curRule.prefix.charAt(0).match(REGEXP.LEFT))
									curRule.suffix=escape(curRule.prefix)+'\/'+curRule.id+escape(averse(curRule.prefix));
								else
									curRule.suffix='\/'+escape(curRule.prefix);
							}else{
								curRule.suffix='\/'+arr[2];
							}
							curRule.suffix+='|EOF';
							curRule.close=false;
							reg=new RegExp(curRule.suffix,'i');
							break;
						}
						default:{
							reg=REGEXP.TOKEN;
							curRule.close=true;
						}
					}
					reg.lastIndex=arr.index+arr[0].length;
				}
				curRule.line+=line+' ';
			}
		}else{
			if(line.match(REGEXP.ANNO_START)) isAnno=true;
			else{
				// 代码
				// 去除单行注释
				line=line.replace(REGEXP.SINGLE_LINE_ANNO,'');
				// 非空判断
				if(!line.match(REGEXP.NULL_STRING)){
					// 解释title
					if(line.match(REGEXP.TITLE_RULE)) createTitle(RegExp.$1, Anno);
					// 解释show
					else if(line.match(REGEXP.SHOW_RULE)) createShow(RegExp.$1, Anno);
					// 解释toString
					else{
						// 转义'"
						line=line.replace(/\\/g,'\\\\').replace(/('|")/g,'\\$1')
						if(!isList){
							isNecessary=false;
							argArr=[];
							curStr='';
						}
						reg=isList?REGEXP.LIST_RULE:isChoose?REGEXP.CHOOSE_RULE:REGEXP.STRING_RULE;
						reg.lastIndex=index=0;
						while(arr=reg.exec(line)){
							escapeCharCount=line.substring(index, arr.index).match(/(\\*$)/)[1].length/2;
							offset=Math.ceil(escapeCharCount/2)*2;
							valid=escapeCharCount%2==0?true:false;
							if(valid){
								switch(arr[1]){
									case '!!':{
										isNecessary=true;
										break;
									}
									case '[/list]':{
										isList=false;
										listStr+=validStr(line.substring(index, arr.index-offset));
										curStr+=createCondition(listArgArr)+'{for(var __i=0,__ii=this.'+listArg+'.length;__i<__ii;__i++){'+listStr+'}}';
										reg=REGEXP.STRING_RULE;
										break;
									}
									case '[#]':{
										isChoose=true;
										(isList ? listStr+=validStr(line.substring(index, arr.index-offset)) : curStr+=validStr(line.substring(index, arr.index-offset)));
										chooseArgArr=[];
										chooseStr='';
										reg=REGEXP.CHOOSE_RULE;
										break;
									}
									case '[/#]':{
										isChoose=false;
										chooseStr+=validStr(line.substring(index, arr.index-offset));
										chooseStr=createCondition(chooseArgArr)+'{'+chooseStr+'}';
										if(isList){
											listStr+=chooseStr;
											reg=REGEXP.LIST_RULE;
										}else{
											curStr+=chooseStr;
											reg=REGEXP.STRING_RULE;
										}
										break;
									}
									default:{
										if(arr[0].indexOf('[list')==0){
											// 语法检测
											if(!anno[arr[3]] || !anno[arr[3]].multi) log.err('行号：'+lineNumber+'\n'+arr[3]+'不是可重复出现的属性');
											curStr+=validStr(line.substring(index, arr.index-offset));
											isList=true;
											listStr='';
											listArg=arr[3];
											listArgArr=[];
											addArray('this.'+listArg, listArgArr);
											reg=REGEXP.LIST_RULE;
											break;
										}
										id=getId(arr[2]);
										// 语法检测
										if(!anno[id]) log.err('行号：'+lineNumber+'\n未定义的属性'+id);
										(isChoose ? chooseStr+=validStr(line.substring(index, arr.index-offset)) : isList ? listStr+=validStr(line.substring(index, arr.index-offset)) : curStr+=validStr(line.substring(index, arr.index-offset)));
										if(isChoose){
											if(isList && id==listArg){
												chooseStr+=validStr(arr[2].replace(id, 'this.'+id+'[__i]'), true);
												addArray('this.'+id+'[__i]', chooseArgArr);
												if(id!==arr[2]) addArray(arr[2].replace(id, 'this.'+id+'[__i]'), chooseArgArr);
											}else{
												chooseStr+=validStr(arr[2].replace(id, 'this.'+id), true);
												addArray('this.'+id, chooseArgArr);
												if(id!==arr[2]) addArray(arr[2].replace(id, 'this.'+id), chooseArgArr);
											}
										}else if(isList){
											addArray('this.'+id, listArgArr);
											if(id===listArg) listStr+=validStr(arr[2].replace(id, 'this.'+id+'[__i]'), true);
											else listStr+=validStr(arr[2].replace(id, 'this.'+id), true);
										}else{
											addArray('this.'+id, argArr);
											curStr+=validStr(arr[2].replace(id, 'this.'+id), true);
										}
									}
								}
							}else{
								(isChoose ? chooseStr+=validStr(line.substring(index, arr.index-offset)+arr[0]) : isList ? listStr+=validStr(line.substring(index, arr.index-offset)+arr[0]) : curStr+=validStr(line.substring(index, arr.index-offset)+arr[0]));
							}
							reg.lastIndex=index=arr.index+arr[0].length;
						}
						(isChoose ? chooseStr+=validStr(line.substring(index)) : isList ? listStr+=validStr(line.substring(index)) : curStr+=validStr(line.substring(index)));
						if(!isList && !isChoose){
							if(isNecessary) str+=createNecessaryCondition(argArr)+curStr;
							else str+=createCondition(argArr)+'{'+curStr+'}';
							log.info(curStr+'\n');
						}
					}
				}
			}
		}
	} 
	// 语法检测
	if(isChoose) log.err('行号：'+lineNumber+'\nchoose未闭合。');
	if(isList) log.err('行号：'+lineNumber+'\nlist('+listArg+')未闭合');
	str+='return ret;';
	log.info(str);
	Anno.prototype.__toString=new Function(str);
	log('parse rule end!!!\n');
}
/*
 * 为necessary创造条件
 */
function createNecessaryCondition(arr){
    var ret='';
    arr.forEach(function(itm){
        ret+='if(!'+itm+')'+itm+'={};';
    });
    return ret;
}
/*
 * 创造条件
 */
function createCondition(arr){
    var ret='if(';
    if(arr.length>0)ret+=arr.join(' && ');
    else ret+='true';
    ret+=')';
    return ret;
}
/*
 * 去重array
 */
function addArray(itm, arr){
    for(var i=0,ii=arr.length;i<ii;i++){
        if(arr[i]===itm)return;
    }
    arr.push(itm);
}
/*
 * 获取id xx.bb.cc=>xx;xx=>xx
 */
function getId(str){
    var index = str.indexOf('.'), id;
    if(index>=0) id=str.substring(0, index);
    else id=str;
    return id;
}
/*
 * 获得有效的代码
 */
function validStr(line, isCode){
	var ret='';
	if(line)ret=isCode?'ret+='+line+';':'ret+="'+line+'";';
	return ret;
}
/*
 * 生成show函数
 */
function createShow(str, Anno){
    var itms= str?str.split('|'):[];
    var tmp=[];
    itms.forEach(function(itm){
        itm=itm.trim();
        if(itm){
            if(itm.match(/^(\!+)(.*)$/)){
                var a1=RegExp.$1,a2=RegExp.$2;
                if(a1.length%2==1){
                    tmp.push('!this.'+a2);
                }else{
                    tmp.push('this.'+a2);
                }
            }else{
                tmp.push('this.'+itm);
            }
        }
    });
    var fun='';
    if(tmp.length==0)fun='return true;';
    else fun='return '+tmp.join(' || ')+';';
    Anno.prototype.show=new Function(fun);
}
/*
 * 生成获取title的函数
 */
function createTitle(str, Anno){
    var itms=str?str.split('|'):[];
    var tmp=[];
    itms.forEach(function(itm){
        itm=itm.trim();
        if(itm){
            tmp.push('this.'+getId(itm)+' && this.'+itm);
        }
    });
    var fun='';
    if(tmp.length==0)fun='return "";';
    else fun='return '+tmp.join(' || ')+';'
    Anno.prototype.__getTitle=new Function(fun);
}
/*
 * 具体生成规则代码
 */
function createRule(rule, annoRules){
	var line=escape(rule.line);
	var CONST_STR={
		'word':'(\\S+)',
		'line':'(.*)',
		'block':'([\u0000-\uffff]*?)',
        'whitespace':'\\s*',
        'eof':'(\\n[ \\t]*){2,}'
	};
	var REGEXP=/((id|word|line|block)-([a-zA-Z_][a-zA-Z0-9_]*))|(#)|(\s+(EOF\b))/g;
	var arr=null, index=0, args=[], isChooseArg=false, chooseArg=[], chooseArgLine='', chooseIndex=0, escapeCharCount=0, offset=0,
		keepBottomNullString=false;
	while(arr=REGEXP.exec(line)){
		index=arr.index;
		switch(arr[2]){
			case 'id':
			case 'word':
			case 'line':
			case 'block':{
				if(arr[2]=='id'){
					line=line.replace(arr[0], arr[3]);
					REGEXP.lastIndex=index+arr[3].length;
				}else{
					rule.property[arr[3]]={'option':false};
					if(isChooseArg){
						rule.property[arr[3]].option=true;
						args.push(arr[3]+'Exist');
						args.push(arr[3]);
						chooseArg=arr[3];
						chooseArgLine+=line.substring(chooseIndex, index)+CONST_STR[arr[2]];
						line=line.substring(0, chooseIndex)+line.substring(index+arr[0].length);
						REGEXP.lastIndex=chooseIndex;
					}else{
						args.push(arr[3]);
						line=line.replace(arr[0], CONST_STR[arr[2]]);
						REGEXP.lastIndex=index+CONST_STR[arr[2]].length;
					}
				}
				break;
			}
			default:{
				if(arr[4]=='#' && line.substring(0, index).match(/(\\*$)/)){
					escapeCharCount=RegExp.$1.length/2;
					offset=Math.ceil(escapeCharCount/2)*2;
					if(escapeCharCount%2==0){
						if(isChooseArg){
							chooseArgLine+=line.substring(chooseIndex, index-offset);
							chooseArgLine='('+chooseArgLine+')?';
							if(!chooseArg){
								chooseArgLine='';
								log.warn('##中没有可选属性，##中的东西将被忽略');
							}
							line=line.substring(0, chooseIndex)+chooseArgLine+line.substring(index+1);
							REGEXP.lastIndex=chooseIndex+chooseArgLine.length;
							isChooseArg=false;
						}else{
							isChooseArg=true;
							chooseArg='';
							chooseArgLine='';
							chooseIndex=index-offset;
							line=line.substring(0, chooseIndex)+line.substring(index+1);
							REGEXP.lastIndex=chooseIndex;
						}
					}else{
						line=line.substring(0, index-offset)+line.substring(index);
						REGEXP.lastIndex=index-offset+1;
					}
				}else if(arr[6]=='EOF'){
					line=line.replace(arr[0], CONST_STR['eof']);
					REGEXP.lastIndex=index+CONST_STR['eof'].length;
					keepBottomNullString=true;
				}
			}
		}
	}
	// 统一在前面加上空白
	line=' '+line;
	line=line.replace(/[ ]+/g, CONST_STR['whitespace']);
	var reg=null, funArgs='', funHead='', funBody='', handler=null;
	/*
     * 可重复样本
     * function(anno, property1, property2...){
     *     if(!anno[id])anno[id]=[];
     *     var tmp={};
     *     anno[id].push(tmp);
     *     tmp["property1"]=property1;
     *     tmp["property2"]=property2;
     * }
     *
     * 不可重复属性
     * function(anno, property1, property2...){
     *     var tmp={};
     *     anno[id]=tmp;
     *     tmp["property1"]=property1;
     *     tmp["property2"]=property2;
     * }
     */
    reg=new RegExp(line, rule.multiRule?'im':'i');
    funArgs='anno'+(args.length===0?'':', '+args.join(', '));
    if(rule.multi) funHead='if(!anno["'+rule.id+'"])anno["'+rule.id+'"]=[];var __tmp={};anno["'+rule.id+'"].push(__tmp);';
    else if(args.length>0)funHead='var __tmp={};anno["'+rule.id+'"]=__tmp;';
    else funHead='anno["'+rule.id+'"]=true;';
    args.forEach(function(property){
    	funBody+='if(!!'+property+')__tmp["'+property+'"]='+property+';';
    });
    handler=new Function(funArgs, funHead+funBody);
    annoRules.push({'rule':reg,'handler':handler,'multiline':rule.multi,'keepBottomNullString':keepBottomNullString});
    log.info(line);
    log.info(handler.toString()+'\n');
    // 如果是多行规则 扩展+的支持
    if(rule.multiRule){
    	var indexOfId=-1, line2='', reg2=null, funArgs2='', funHead2='', funBody2='', handler2=null;
    	indexOfId=line.indexOf(rule.id)+rule.id.length;
    	line2='(.*)'+line.substring(0,indexOfId)+'\\+'+line.substring(indexOfId);
    	reg2=new RegExp(line2, 'im');
    	funArgs2='anno, title'+(args.length===0?'':', '+args.join(', '));
    	funHead2=funHead;
    	funBody2='if(title)__tmp["title"]=title;'+funBody;
    	handler2=new Function(funArgs2, funHead2+funBody2);
    	annoRules.push({'rule':reg2,'handler':handler2,'multiline':rule.multi,'keepBottomNullString':keepBottomNullString});
    }
}
/*
 * 统一生成所有的规则
 */
function createRules(anno, annoRules){
	for(var x in anno){
		createRule(anno[x], annoRules);
	}
}
/*
 * 反转符号 <({[#@ => @#]})>
 */
function averse(str){
	var ret='';
	for(var i=str.length-1;i>-1;i--){
		var ch=str.charAt(i);
		switch(ch){
			case '<':ret+='>';break;
			case '(':ret+=')';break;
			case '[':ret+=']';break;
			case '{':ret+='}';break;
			default :ret+=ch;
		}
	}
	return ret;
}
/*
 * 给正则式中有特殊含义的字符进行转义^$.*+?=!:|\/()[]{}
 */
function escape(str){
    return str.replace(/\\/g, '\\\\').replace(/([\^\$\.\*\+\?\=\!\:\|\/\(\)\[\]\{\}])/g, '\\$1');
}