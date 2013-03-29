'use strict';

var lr  = require('../lineReader')
var log = require('../log');

module.exports=function(file, rules, Anno){
    log('parse rule begin...');
	var reader=lr(file);
	var isAnno=false,arr;
	var regExp=/(id|word|line|block)-([a-zA-Z_][a-zA-Z0-9_]*)/g;
	var curRule=null,lineNumber=0,string='var string="";',
    strRegExp=/(^\!\!|(?!\\)@([0-9a-zA-Z_\.]+)|(?!\\)\[list\]|(?!\\)\[list_([a-zA-Z0-9_][a-zA-Z0-9_]*)\]|(?!\\)\[#\])/g,
    strRegExp2=/((?!\\)\[\/list\]|(?!\\)@([a-zA-Z0-9_][0-9a-zA-Z_\.]*)|(?!\\)\[#\])/g,
    strRegExp3=/((?!\\)\[\/#\]|(?!\\)@([a-zA-Z0-9_][0-9a-zA-Z_\.]+))/g,
    strMarkRegExp,
    isList=false,strArr=null,isNecessary=false,curString='',listString='',argArr=null,listArgArr=null,listArg='',
    isChooseArg=false,chooseString='',chooseArgArr=null;
	var unique={};
	while(reader.hasNextLine()){
        var line=reader.nextLine();
        line=line.replace(/(\r|\n|\r\n)$/g,'');
        lineNumber++;
        if(isAnno){
            if(line.match(/^\s*\*+\//)){
                if(curRule)createRule(curRule, rules.annoRules);
                curRule=null;
                isAnno=false;
                continue;
            }
            line=line.replace(/^\s*\*+/, '').replace(/\s+/g,' ').trim();
            // 空行处理
            if(line.match(/^\s*$/)){
                if(curRule && curRule['$matchSign'] !== undefined && !curRule['$matchSign']){
                    line='EOF';
                }
            }
            // 解析注释
            var markIndex=0,markExp=markExp?markExp:regExp;
            while(arr=markExp.exec(line)){
            	markIndex=arr.index;
            	switch(arr[1]){
            		case 'id':{
            			if(curRule)createRule(curRule, rules.annoRules);
            			var index=arr.index;
            			var preSign=line.substring(0, index);
            			var isArr=!!unique[arr[2]];
            			unique[arr[2]]=true;
            			curRule={
            				'$preSign':preSign,
            				'$line':'',
            				'$id':arr[2],
                            '$isArr':isArr
            			}
            			break;
            		}
            		case 'word':
            		case 'line':{
            			break;
            		}
            		case 'block':{
            			if(curRule['$preSign']){
            				var sign=curRule['$preSign'].charAt(0);
            				if(sign.match(/[<\(\[\{]/)){
            					curRule['$postSign']=escape(curRule['$preSign'])+'\/'+curRule['$id']+escape(averse(curRule['$preSign']));
            				}else{
            					curRule['$postSign']='\/'+escape(curRule['$preSign']);
            				}
            			}else{
            				curRule['$postSign']='\/'+arr[2];
            			}
                        curRule['$postSign']+='|EOF';
            			curRule['$matchSign']=false;
        				markExp=new RegExp(curRule['$postSign'],'i');
            			break;
            		}
            		default:{
            			if(arr[0].match(new RegExp(curRule['$postSign'],'i'))){
            				markExp=regExp;
            				curRule['$matchSign']=true;
            			}else{
            				log.err('注释模版有错误！\n行号：'+lineNumber+'\n具体原因：遇到不匹配的符号。');
            			}
            		}
            	}
            	markExp.lastIndex=markIndex+arr[0].length;
            }
            curRule['$line']+=line+' ';
        }else{
            if(line.match(/^\s*\/\*+/)){
                isAnno=true;
                continue;
            }
            // 代码
            // 去除单行注释
            line=line.replace(/((?!\\)\/{2,}.*)/, '');
            // 去除空行
            if(line.match(/^\s*$/)) continue;
            // 解释title
            if(line.match(/\[title\](.*?)\[\/title\]/)) {createTitle(RegExp.$1, Anno); continue;}
            // 解释show
            if(line.match(/\[show\](.*?)\[\/show\]/)) {createShow(RegExp.$1, Anno); continue;}
            // 解释toString
            // 转义'"
            line=line.replace(/\\/g,'\\\\').replace(/('|")/g,'\\$1')
            if(!isList){
                isNecessary=false;
                argArr=[];
                curString='';
            }
            strMarkRegExp=isList?strRegExp2:isChooseArg?strRegExp3:strRegExp;
            var markIndex2=0;
            strMarkRegExp.lastIndex=0;
            while(strArr=strMarkRegExp.exec(line)){
                switch(strArr[0]){
                    case '!!':{
                        isNecessary=true;
                        line=line.substr(2);
                        strMarkRegExp.lastIndex=0;
                        break;
                    }
                    case '[/list]':{
                        isList=false;
                        strMarkRegExp=strRegExp;
                        strMarkRegExp.lastIndex=strArr.index+strArr[0].length;
                        listString+='string+="'+line.substring(markIndex2, strArr.index)+'";';
                        curString+='for(var i=0,ii=this.'+listArg+'.length;i<ii;i++){'+listString+'}';
                        //curString+='this.'+listArg+'.forEach(function(itm){'+listString+'});';
                        break;
                    }
                    case '[#]':{
                        if(isList)listString+='string+="'+line.substring(markIndex2, strArr.index)+'";';
                        else curString+='string+="'+line.substring(markIndex2, strArr.index)+'";';
                        if(!isChooseArg){
                            isChooseArg=true;
                            chooseArgArr=[];
                            chooseString='';
                            strMarkRegExp=strRegExp3;
                            strMarkRegExp.lastIndex=strArr.index+strArr[0].length;
                        }else{
                            log.err("语法错误：[#]不匹配，存在连续的[#]。");
                        }
                        break;
                    }
                    case '[/#]':{
                        if(isChooseArg){
                            isChooseArg=false;
                            chooseString+='string+="'+line.substring(markIndex2, strArr.index)+'";';
                            chooseString=createChooseCondition(chooseArgArr)+'{'+chooseString+'}';
                            if(isList){
                                listString+=chooseString;
                                strMarkRegExp=strRegExp2;
                            }else{
                                curString+=chooseString;
                                strMarkRegExp=strRegExp;
                            }
                            chooseString='';
                            strMarkRegExp.lastIndex=strArr.index+strArr[0].length;
                        }else{
                            log.err("语法错误：[/#]不匹配，[/#]不能匹配到[#]。");
                        }
                        break;
                    }
                    default:{
                        if(strArr[0].indexOf('[list')==0){
                            isList=true;
                            listString='';
                            listArgArr=[];
                            listArg=strArr[3];
                            strMarkRegExp=strRegExp2;
                            strMarkRegExp.lastIndex=strArr.index+strArr[0].length;
                            curString+='string+="'+line.substring(markIndex2, strArr.index)+'";';
                            break;
                        }
                        var id=getId(strArr[2]);
                        if(isChooseArg){
                            chooseString+='string+="'+line.substring(markIndex2, strArr.index)+'";';
                            if(isList)addArray(id, listArgArr);
                            else addArray(id, argArr);
                            if(isList && id==listArg){
                                chooseString+='string+='+strArr[2].replace(id,'this.'+id+'[i]')+';';
                                addArray('this.'+id+'[i]', chooseArgArr);
                                if(id!=strArr[2]){
                                    addArray(strArr[2].replace(id, 'this.'+id+'[i]'), chooseArgArr);
                                }
                            }else{
                                chooseString+='string+='+strArr[2].replace(id,'this.'+id)+';';
                                addArray('this.'+id, chooseArgArr);
                                if(id!=strArr[2]){
                                    addArray(strArr[2].replace(id,'this.'+id), chooseArgArr);
                                }
                            }
                        }else if(isList){
                            addArray(id,listArgArr);
                            listString+='string+="'+line.substring(markIndex2, strArr.index)+'";';
                            if(id==listArg){
                                listString+='string+='+strArr[2].replace(id,'this.'+id+'[i]')+';';
                                //listString+='string+='+strArr[2].replace(id,'itm')+';';
                            }else{
                                listString+='string+='+strArr[2].replace(id,'this.'+id)+';';
                            }
                        }else{
                            addArray(id,argArr);
                            curString+='string+="'+line.substring(markIndex2, strArr.index)+'";';
                            curString+='string+='+strArr[2].replace(id,'this.'+id)+';';
                        }
                    }
                }
                if(strMarkRegExp.lastIndex>0)markIndex2=strArr.index+strArr[0].length;
                else markIndex2=0;
            }
            if(isChooseArg){
                chooseString+='string+="'+line.substring(markIndex2)+'";';
            }else if(!isList){
                curString+='string+="'+line.substring(markIndex2)+'";';
                if(isNecessary){
                    string+=createNecessaryCondition(argArr, listArgArr)+curString;
                }else{
                    string+=createCondition(argArr, listArgArr)+'{'+curString+'}';
                }
                listArgArr=[];argArr=[];chooseArgArr=[];
                log.info(curString);
            }else{
                listString+='string+="'+line.substring(markIndex2)+'";';
            }
        }
	}
    string+='return string;';
    log.info(string);
    Anno.prototype.__toString=new Function(string);
    log('parse rule end!!!\n');
}
/*
 * 为可选属性创造条件
 */
function createChooseCondition(arr){
    var ret='if(';
    if(arr.length==0)ret+='true';
    else ret+=arr.join(' && ');
    ret+=')';
    return ret;
}
/*
 * 为necessary创造条件
 */
function createNecessaryCondition(arr1, arr2){
    var ret='';
    var arr=(arr1 && arr2)? arr1.concat(arr2) : (!arr1 && !arr2)? []: arr1 || arr2;
    arr.forEach(function(itm){
        ret+='if(!this.'+itm+')this.'+itm+'={};';
    });
    return ret;
}
/*
 * 创造条件
 */
function createCondition(arr1, arr2){
    var ret='if(';
    var arr=(arr1 && arr2)? arr1.concat(arr2) : (!arr1 && !arr2)? []: arr1 || arr2;
    var tmp=[];
    arr.forEach(function(itm){
        tmp.push('this.'+itm);
    });
    if(tmp.length>0)ret+=tmp.join(' && ');
    else ret+='true';
    ret+=')';
    return ret;
}
/*
 * 去重array
 */
function addArray(itm, arr){
    for(var i=0,ii=arr.length;i<ii;i++){
        if(arr[i]==itm)return;
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
                    tmp.push('!this["'+a2+'"]');
                }else{
                    tmp.push('this["'+a2+'"]');
                }
            }else{
                tmp.push('this["'+itm+'"]');
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
 * 创建一条规则 并添加到rules中去
 */
function createRule(curRule, annoRules){
	var line=escape(curRule['$line'])
	var arr=null,index=0;
	var regExp=/((id|word|line|block)-([a-zA-Z_][a-zA-Z0-9_]*))|((?!\\)#)|((^|\s+)(EOF\b))/g;
	var markIndex=0;
	var multiRule=false;
    var id=curRule['$id'];
	var isArr=curRule['$isArr'];
    var isChooseArg=false,chooseArgLine='',chooseMarkIndex=0,chooseArg='';
    var keepBottomNullString=false;
	regExp.lastIndex=0;
	var CONST_STR={
		'word':'(\\S+)',
		'line':'(.*)',
		'block':'([\u0000-\uffff]*?)',
        'whitespace':'\\s*',
        'eof':'(\\n[ \\t]*){2,}'
	}
	var queue=[];
	while(arr=regExp.exec(line)){
		markIndex=arr.index;
		switch(arr[2]){
			case 'id':
			case 'word':
			case 'line':
			case 'block':{
				if(arr[2]!='id'){
                    if(isChooseArg)queue.push(arr[3]+'Exist');
                    queue.push(arr[3]);
                }
                if(arr[2]=='id'){
                    line=line.replace(arr[0],arr[3]);
                    regExp.lastIndex=markIndex+arr[3].length;
                }else{
                    if(isChooseArg){
                        chooseArg=arr[3];
                        chooseArgLine+=line.substring(chooseMarkIndex, markIndex)+CONST_STR[arr[2]];
                        line=line.substring(0, chooseMarkIndex)+line.substring(markIndex+arr[0].length);
                        regExp.lastIndex=chooseMarkIndex;
                    }else{
                        line=line.replace(arr[0],CONST_STR[arr[2]]);
        				regExp.lastIndex=markIndex+CONST_STR[arr[2]].length;
                    }
                }
				if(arr[2]=='block')multiRule=true;
				break;
			}
			default:{
                if(arr[4]=='#'){
                    if(!isChooseArg){
                        isChooseArg=true;
                        chooseArgLine='';
                        chooseArg='';
                        chooseMarkIndex=markIndex;
                        line=line.substring(0, markIndex)+line.substring(markIndex+1);
                        regExp.lastIndex=markIndex;
                    }else{
                        chooseArgLine+=line.substring(chooseMarkIndex, markIndex);
                        chooseArgLine='('+chooseArgLine+')?';
                        if(!chooseArg){
                            chooseArg='';
                            log.err('注释中的##中没有可选属性！');
                        }
                        chooseArg='';
                        line=line.substring(0, chooseMarkIndex)+chooseArgLine+line.substring(markIndex+1);
                        regExp.lastIndex=chooseMarkIndex+chooseArgLine.length;
                        isChooseArg=false;
                    }
                }else if(arr[7]=='EOF'){
                    line=line.replace(arr[0],CONST_STR['eof']);
                    regExp.lastIndex=markIndex+CONST_STR['eof'].length;
                    keepBottomNullString=true;
                }else{
                    log.err("createRule err!");
                }
			}
		}
	}
    // 填上前空白
    if(line.charAt(0)!==' ')line=' '+line;
    line=line.replace(/[ ]+/g,CONST_STR['whitespace']);
    if(multiRule){
        var indexOfId=line.indexOf(id)+id.length;
        var line2='(.*)'+line.substring(0,indexOfId)+'\\+'+line.substring(indexOfId);
        line2=new RegExp(line2,'im');
    }
    line=new RegExp(line,'i'+(multiRule?'m':''));
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
    var fun='';
	if(isArr)fun+='if(!anno["'+id+'"])anno["'+id+'"]=[];var tmp={};anno["'+id+'"].push(tmp);';
    else fun+='var tmp={};anno["'+id+'"]=tmp;';
	for(var i=0,ii=queue.length;i<ii;i++){
		fun+='if('+queue[i]+')tmp["'+queue[i]+'"]='+queue[i]+';';
	}
    if(multiRule){
        var fun2=fun+'if(title)tmp["title"]=title;';
    }
    var args='anno'+(queue.length==0 ?'':', '+queue.join(', '));
    if(multiRule){
        var args2='anno, title'+(queue.length==0 ?'':', '+queue.join(', '));
    }
	var handler = new Function(args, fun);
    if(multiRule){
        var handler2=new Function(args2, fun2);
    }
    log.info('rule:'+line);
    log.info('handler:'+handler);
	if(!isArr){
        annoRules.push({'rule':line,'handler':handler,'multiline':line.multiline,'keepBottomNullString':keepBottomNullString});
        if(multiRule)annoRules.push({'rule':line2,'handler':handler2,'multiline':line2.multiline,'keepBottomNullString':keepBottomNullString});
    }else{
        for(var i=annoRules.length-1;i>-1;i--){
            var itm=annoRules[i];
            if(itm.rule.toString()==line.toString()){
                itm.handler=handler;
                break;
            }
        }
        if(multiRule){
            for(i=annoRules.length-1;i>-1;i--){
                var itm=annoRules[i];
                if(itm.rule.toString()==line2.toString()){
                    itm.handler=handler2;
                    break;
                }
            }
        }
    }
}

// 反转符号 <({[#@ => @#]})>
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

// 给正则式中有特殊含义的字符进行转义^$.*+?=!:|\/()[]{}
function escape(str){
    return str.replace(/\\/g, '\\\\').replace(/([\^\$\.\*\+\?\=\!\:\|\/\(\)\[\]\{\}])/g, '\\$1');
}