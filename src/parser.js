'use strict';

var fs   = require('fs');
var lr   = require('./lineReader');
var log  = require('./log');
var path = require('path');
var util = require('./util');

module.exports = function(settings, rules, Anno){
    log('parse annotation begin...');
    var filepath = path.resolve(__dirname, path.normalize(settings.path));
    var root = getRootDir(filepath);
    var files = getAllFiles(filepath);
    files = util.filterFile(files, settings.parse_file_type, settings.ignore_file_type);
    var lineRules=[],multilineRules=[],annoRules=rules.annoRules,codeRules=rules.codeRules,unmarkHandler=rules.unmarkHandler;
    for(var i=0, ii=annoRules.length; i<ii; i++){
        var rule=annoRules[i];
        if(rule.rule.multiline)multilineRules.push(rule);
        else lineRules.push(rule);
    }
    var res = [];
    for(i=0, ii=files.length; i<ii; i++){
        var annos = parseAnnos(files[i], settings, lineRules, multilineRules, codeRules, unmarkHandler, Anno);
        res.push({'file':getFileName(files[i], root), 'annos':annos});
    }
    log('parse annotation end!!!\n');
    return res;
}
function parseAnnos(file, settings, lineRules, multilineRules, codeRules, unmarkHandler, Anno){
    var reader=lr(file, 'utf8', '\n');
    // codeBeforeAnno 特别指第一有意义注释前的代码 例如Java的import，js的require，c++的include 它们通常在第一个有意义的注释前
    // tmpAnno={};存储codeBeforeAnno
    // stack 注释堆栈 引入新的目录算法 解决跳层报错的提示
    var strictMode=settings.strict_mode, keepCode=settings.keep_code, keepNullString=settings.keep_null_string, keepAnnoStar=settings.keep_anno_star,
        annos=[], curAnno=null, curLev=-1, ignoreLev=settings.ignore_hierarchy, maxLev=settings.parse_hierarchy, isIgnoreAnno=false,
        isAnno=false, anno='', brace=0, isCodeString=false, stringQuotes='', arr, markIndex=-1, isRegExp=false, keepCodeAnno=settings.keep_code_anno, codeAnno='',
        ignoreFileLine=settings.ignore_file_line,lineNumber=0,ignoreFirstBoringAnno=settings.ignore_first_boring_anno,codeBeforeAnno='',notBeforeAnnoCodeLine=false,
        smartTitle=settings.smart_title, parseCode=settings.parse_code,tmpAnno={},smartTitleHandler=null,codeLev=0,
        smartHierarchy=settings.smart_hierarchy,extname=path.extname(file).replace(/^\.+/,'').toLowerCase(),stack=[],resetHierarchyLev=settings.reset_hierarchy_lev;
    if(!smartHierarchy){
        ignoreLev=0;keepCode=false;keepCodeAnno=false;maxLev=Number.MAX_VALUE;
    }
    if(smartTitle)smartTitleHandler=require('./smartTitle')(extname);
    var regExp={
        'ANNO_START':/^\s*\/\*+/,                // 注释开始 匹配/*，/**
        'ANNO_STAR':/^\s*\*+/,                   // 注释行中的前端*, **
        'NULL_STRING':/^\s*$/,                   // 注释中的空行
        'ANNO_END':/^\s*\*+\//,                  // 注释结束 匹配*/，**/
        'LINE_ANNO':/\/\*+(.*)\*+\//,            // 单行注释 匹配/****[anno]****/
        'LINE_ANNO2':/((?!\\)\/{2,}.*)/,         // 单行注释 匹配//[anno]
        'MARK':/(?!\\)(\'|\"|\{|\}|\/\/|\/)/g,   // 获取层次需要的符号 匹配{,},',",/ 不匹配\{,\},\',\",\/ 补充将去除单行注释移到这里处理匹配 //
        'MARK2':/([\'\"])/g,                     // 获取字符串需要的符号 辅助进行层次判断
        'MARK3':/(\/)/g                          // 匹配正则式直接量
    };
    while(reader.hasNextLine()){
        if(++lineNumber <= ignoreFileLine) continue;
        //log.info(lineNumber+'::'+curLev);
        var sLine=reader.nextLine();
        var line=sLine;
        //严格模式
        if(isIgnoreAnno){
            if(line.match(regExp.ANNO_END))isIgnoreAnno=false;
        }
        else if(isAnno){
            if(keepCode)addCode(stack, sLine);
            if(keepCode && keepCodeAnno) codeAnno+=sLine+'\n';
            if(line.match(regExp.ANNO_END)){
                anno=matchMultilineRule(anno, multilineRules, curAnno);
                completeAnno();
                continue;
            }
            if(!keepAnnoStar)line=line.replace(regExp.ANNO_STAR, '');
            if(!matchLineRule(line, lineRules, curAnno) && (keepNullString || !line.match(regExp.NULL_STRING))) anno+=line+'\n';
        }else{
            if(line.match(regExp.ANNO_START)){
                if(curLev==brace){
                    //log.info('file:'+file+'\nlineNumber:'+lineNumber+'\nline:'+sLine+'\nlev:'+brace);
                    if(keepCode) checkCode(true);
                    stack.pop();
                    setCurAnno();
                }
                if(brace<maxLev){
                    if(keepCode) addCode(stack, sLine);
                    if(brace < ignoreLev || ignoreFirstBoringAnno){
                        if(!line.match(regExp.LINE_ANNO)) isIgnoreAnno=true;
                        ignoreFirstBoringAnno=false;
                        continue;
                    }
                    curLev=brace;
                    curAnno=new Anno();
                    curAnno.extend(tmpAnno);
                    tmpAnno={};
                    isAnno=true;
                    if(keepCode && keepCodeAnno)codeAnno+=sLine+'\n';
                    if(line.match(regExp.LINE_ANNO)){
                        anno=RegExp.$1;
                        anno=matchLineRule(anno, lineRules, curAnno)?'':matchMultilineRule(anno, multilineRules, curAnno);
                        completeAnno();
                    }
                    continue;
                }
            }
            if(!smartHierarchy) continue;
            //代码
            //代码解释
            if(parseCode) matchLineRule(line, codeRules, curAnno || tmpAnno);
            //层次判断 主要通过匹配{}来判断
            //去掉代码中的单行注释// anno
            //不严谨的 会误判正则式中和字符串中的//
            //line=line.replace(regExp.LINE_ANNO2, '');
            //smartTitle
            if(smartTitle && curLev===brace && curAnno && !curAnno.__title){
                curAnno.__title=smartTitleHandler(line);
            }
            markIndex=-1;
            var markExp= isCodeString ? regExp.MARK2 : isRegExp ? regExp.MARK3 : regExp.MARK;
            markExp.lastIndex=0;
            while(arr=markExp.exec(line)){
                if(arr.index>markIndex) markIndex=arr.index; else continue;
                switch(arr[1]){
                    case '{':{
                        // /* xx */
                        // methodA(
                        // ){
                        //
                        // }
                        // /* xx */
                        // int a;
                        // methodA()
                        // {
                        //  /* xx */
                        //  xxx
                        // }
                        // 第二种情况要求默认开启保留代码 优先级高 影响层次判断
                        if(curLev===brace){
                            if(keepCode) checkCode(false);
                            if(curAnno.__codeCompleted){
                                stack.pop();
                                setCurAnno();
                            }
                        }
                        brace++;break;
                    }
                    case '}':{
                        // /* xx */
                        // methodA(){
                        // /* xxx */
                        // var x=xx;
                        // }
                        if(curLev===brace){
                            if(keepCode) checkCode(true);
                            stack.pop();
                            setCurAnno();
                        }
                        brace--;
                        if(curLev===brace){
                            if(brace<0) log.err('file:'+file+'\nlineNumber:'+lineNumber+'\nline:'+sLine+'\nlev:'+brace);
                            if(keepCode && curAnno){
                                curAnno.__code+=sLine+'\n';
                                curAnno.__pureCode+=line+'\n';
                                checkCode(false);
                                if(!curAnno.__codeCompleted){
                                    curAnno.__code=curAnno.__code.slice(0,-(sLine.length+1));
                                    curAnno.__pureCode=curAnno.__pureCode.slice(0,-(line.length+1));
                                }else{
                                    stack.pop();
                                    setCurAnno();
                                }
                            }
                        }
                        if(keepCode && brace===0 && stack.length===0)notBeforeAnnoCodeLine=true;
                        break;
                    }
                    case '//':{
                        if(notEscape(line, arr.index-1)){
                            line=line.substring(0, arr.index);
                            markExp.lastIndex=arr.index;
                        }
                        break;
                    }
                    case '/':{
                        if(isRegExp){
                            if(notEscape(line, arr.index-1)){
                                markExp=regExp.MARK;
                                markExp.lastIndex=markIndex+1;
                                isRegExp=false;
                            }
                        }else{
                            // 正则式直接量开始符和除法都是/ 需要做判断
                            if(regExpSign(line.substring(0, arr.index), extname)){
                                markExp=regExp.MARK3;
                                markExp.lastIndex=markIndex+1;
                                isRegExp=true;
                            }
                        }
                        break;
                    }
                    default:{
                        if(isCodeString){
                            if(stringQuotes==line.charAt(arr.index) && notEscape(line, arr.index-1)){
                                stringQuotes='';
                                markExp=regExp.MARK;
                                markExp.lastIndex=markIndex+1;
                                isCodeString=false;
                            }
                        }else{
                            stringQuotes=line.charAt(arr.index);
                            markExp=regExp.MARK2;
                            markExp.lastIndex=markIndex+1;
                            isCodeString=true;
                        }
                    }
                }
            }
            if(keepCode){
                addCode(stack, sLine);
                addPureCode(stack, line);
                if(brace===0 && stack.length===0){
                    if(notBeforeAnnoCodeLine) notBeforeAnnoCodeLine=false;
                    else codeBeforeAnno+=sLine+'\n';
                }
            }
        }
    }
    // 注释结束时 需要采取的步骤
    // 参数清除工作在注释结束时进行
    function completeAnno(){
        unmarkHandler(curAnno, anno);
        curAnno.__title='';
        curAnno.__lev=curLev;
        curAnno.__pureCode=''; //注释以下的 不包含//注释的代码
        curAnno.__code=(curLev===0?codeBeforeAnno:'')+codeAnno;
        curAnno.__annoNum=getLineCount(curAnno.__code);
        curAnno.__codeCompleted=false;
        curAnno.__subAnnos=[];
        addAnno(annos, stack, curAnno);
        codeBeforeAnno='';
        codeAnno='';
        anno='';
        isAnno=false;
        setCurAnno();
    }
    function setCurAnno(){
        curAnno=stack[stack.length-1];
        if(curAnno)curLev=curAnno.__lev;
        else curLev=-1;
    }
    // 赋值代码判断
    function checkCode(forceEnd){
        // 当前注释代码未结束，并且已添加代码不为空
        if(!curAnno.__codeCompleted && !curAnno.__pureCode.match(/^\s*$/)){
            // 在java和C++中 申明变量必然以;结尾 所以可以通过判断;来判断注释是否属于申明注释
            // 对于js则采用语法分析的手段
            // 如果第一个有意义字符为; 去掉 因为可能只是单纯分割符号
            // 如果;和{在同一行里面 直接跳出 不处理
            var firstVisibleCharArr=curAnno.__pureCode.match(/\S/);
            var firstVisibleCharIndex=(firstVisibleCharArr[0]===';'?1:0)+firstVisibleCharArr.index;
            var validLine=0;
            if(extname.match(/js/i)){
                validLine=getValidCode2(curAnno.__pureCode, firstVisibleCharIndex, extname);
            }else{
                // java C++ 或者类似java C++的语言
                // 取得有效的;
                var firstSemicolonIndex=getFirstSemicolonIndex(curAnno.__pureCode, firstVisibleCharIndex, extname);
                if(firstSemicolonIndex>-1){
                    // 因为源码含有注释 所以改为获取第几个\n 即行号
                    validLine=getValidCode(curAnno.__pureCode,firstVisibleCharIndex, extname);
                    forceEnd=true;
                }
            }
            if(validLine){
                var lastEOLIndex=0;
                validLine+=curAnno.__annoNum+getSubAnnosAnnoNumCount(curAnno);
                while(validLine){
                    lastEOLIndex=curAnno.__code.indexOf('\n', lastEOLIndex)+1;
                    validLine--;
                }
                curAnno.__code=curAnno.__code.substring(0, lastEOLIndex);
                curAnno.__codeCompleted=true;
            }
        }
        if(forceEnd)curAnno.__codeCompleted=true;
    }
    if(resetHierarchyLev) resetLev(annos);
    return annos;
}
/*
 * 对层次进行调整
 */
function resetLev(annos, lev){
    if(annos.length===0) return;
    if(lev===undefined){
        lev=Number.MAX_VALUE;
        annos.forEach(function(anno){
            if(anno.__lev<lev)lev=anno.__lev;
        });
    }
    annos.forEach(function(anno){
        anno.__lev=lev;
        resetLev(anno.__subAnnos, lev+1);
    });
}
/*
 * 获取所有后代的注释行数
 */
function getSubAnnosAnnoNumCount(curAnno){
    var count=0;
    curAnno.__subAnnos.forEach(function(anno){
        count+=anno.__annoNum+getSubAnnosAnnoNumCount(anno);
    });
    return count;
}
/*
 * 取得代码行数
 */
function getLineCount(code){
    var num=0,index=0;
    while((index = code.indexOf('\n', index))!==-1){
        index++;
        num++;
    } 
    return num;
};
/*
 * 取得有效的;（非字符串和正则式中）
 */
function getFirstSemicolonIndex(code, begin, extname){
    var REGEXP={
        MARK0:/(\;|\(|\)|\[|\]|\'|\"|\/)/g,
        MARK1:/(\'|\")/g,
        MARK2:/(\/)/g
    }
    var isStr=false, strChar='', isRegExp=false, left=0, arr=null, index=begin, reg=null, matchIndex=-1;
    reg=REGEXP.MARK0;
    reg.lastIndex=index;
    while(arr=reg.exec(code)){
        switch(arr[1]){
            case ';':{
                if(left===0) matchIndex=arr.index;
                break;
            }
            case '(':
            case '[':{
                left++;break;
            }
            case ')':
            case ']':{
                left--;break;
            }
            case '\'':
            case '"':{
                if(isStr){
                    if(arr[1]===strChar && notEscape(code, arr.index-1)){
                        reg=REGEXP.MARK0;
                        reg.lastIndex=arr.index+1;
                        strChar='';
                        isStr=false;
                    }
                }else{
                    strChar=arr[1];
                    reg=REGEXP.MARK1;
                    reg.lastIndex=arr.index+1;
                    isStr=true;
                }
                break;
            }
            case '\/':{
                if(isRegExp){
                    if(notEscape(code, arr.index-1)){
                        reg=REGEXP.MARK0;
                        reg.lastIndex=arr.index+1;
                        isRegExp=false;
                    }
                }else{
                    // 正则式直接量开始符和除法都是/ 需要做判断
                    if(regExpSign(code.substring(0, arr.index), extname)){
                        reg=REGEXP.MARK2;
                        reg.lastIndex=arr.index+1;
                        isRegExp=true;
                    }
                }
                break;
            }
        }
        if(matchIndex>-1)break;
    }
    return matchIndex;
}
/*
 * 取得有效的代码2
 * 按行解析
 */
function getValidCode2(code, begin, extname){
    var REGEXP={
        MARK0:/(\=|\,|\;|\(|\)|\[|\]|\'|\"|\/|\{|\})/g,
        MARK1:/(\'|\")/g,
        MARK2:/(\/)/g,
        MARK3:/(\S)/g
    }
    var isStr=false, strChar='', isRegExp=false, left=0, arr=null, index=0, reg=null, matched=false, matchIndex=-1, strCount=0, hasEqualSign=false;
    // ,b=3 去除前面的,
    reg=REGEXP.MARK3;
    reg.lastIndex=begin;
    if(arr=reg.exec(code)) if(arr[1]==',') begin++;
    reg=null;
    code.split('\n').forEach(function(line){
        if(matched) return;
        if(strCount+line.length>begin){
            if(strCount>begin)index=0;
            else index=begin-strCount;
            if(!reg)reg=REGEXP.MARK0;
            reg.lastIndex=index;
            while(arr=reg.exec(line)){
                switch(arr[1]){
                    case '=':{
                        hasEqualSign=true;
                        break;
                    }
                    case ',':
                    case ';':{
                        if(left===0){
                            matched=true;
                            matchIndex=arr.index+strCount;
                        }
                        break;
                    }
                    case '(':
                    case '[':
                    case '{':{
                        if(!hasEqualSign) matched=true;
                        left++;break;
                    }
                    case ')':
                    case ']':
                    case '}':{
                        left--;break;
                    }
                    case '\'':
                    case '"':{
                        if(isStr){
                            if(arr[1]===strChar && notEscape(code, arr.index-1)){
                                reg=REGEXP.MARK0;
                                reg.lastIndex=arr.index+1;
                                strChar='';
                                isStr=false;
                            }
                        }else{
                            strChar=arr[1];
                            reg=REGEXP.MARK1;
                            reg.lastIndex=arr.index+1;
                            isStr=true;
                        }
                        break;
                    }
                    case '\/':{
                        if(isRegExp){
                            if(notEscape(code, arr.index-1)){
                                reg=REGEXP.MARK0;
                                reg.lastIndex=arr.index+1;
                                isRegExp=false;
                            }
                        }else{
                            // 正则式直接量开始符和除法都是/ 需要做判断
                            if(regExpSign(code.substring(0, arr.index), extname)){
                                reg=REGEXP.MARK2;
                                reg.lastIndex=arr.index+1;
                                isRegExp=true;
                            }
                        }
                        break;
                    }
                }
                if(matched) break;
            }
            // 此处没有考虑到如下的情况
            // var x = 1 + 
            // 2;
            // 推荐如下写法
            // var x = (1 +
            // 2);
            if(left===0){
                matched=true;
                matchIndex=strCount+line.length;
            }
        }
        strCount+=line.length+1;
    });
    var ret=0;
    if(matched && matchIndex>-1){
        var lastEOL=code.indexOf('\n', matchIndex);
        arr=-1;
        do{
            arr++;
            arr=code.indexOf('\n',arr)
            ret++;
        }while(arr>-1 && arr<lastEOL);
    }
    return ret;
}
/*
 * 取得有效的代码
 */
function getValidCode(code, begin, extname){
    var REGEXP={
        MARK0:/(\=|\,|\;|\(|\)|\[|\]|\'|\"|\{|\})/g,
        MARK1:/(\'\")/g,
        MARK2:/(\S)/g
    };
    var isStr=false, strChar='', left=0, arr=null, hasEqualSign=false, index=begin, reg=null, matched=false, matchIndex=-1;
    // ,b=3 去除前面的,
    reg=REGEXP.MARK2;
    reg.lastIndex=index;
    if(arr=reg.exec(code)) if(arr[1]==',') index=arr.index+1;
    // 取得有效的,||;
    reg=REGEXP.MARK0;
    reg.lastIndex=index;
    while(arr=reg.exec(code)){
        switch(arr[1]){
            case '=':{
                hasEqualSign=true;break;
            }
            case ',':
            case ';':{
                if(left===0){
                    matchIndex=arr.index;
                    matched=true;
                }
                break;
            }
            case '(':
            case '[':
            case '{':{
                // 没有= 不可能有([
                if(!hasEqualSign) matched=true;
                left++;break;
            }
            case ')':
            case ']':
            case '}':{
                left--;break;
            }
            case '\'':
            case '"':{
                if(isStr){
                    if(arr[1]===strChar && notEscape(code, arr.index-1)){
                        reg=REGEXP.MARK0;
                        reg.lastIndex=arr.index+1;
                        strChar='';
                        isStr=false;
                    }
                }else{
                    strChar=arr[1];
                    reg=REGEXP.MARK1;
                    reg.lastIndex=arr.index+1;
                    isStr=true;
                }
                break;
            }
        }
        if(matched) break;
    }
    var ret=0;
    if(matched && matchIndex>-1){
        var lastEOL=code.indexOf('\n', matchIndex);
        arr=-1;
        do{
            arr++;
            arr=code.indexOf('\n',arr)
            ret++;
        }while(arr>-1 && arr<lastEOL);
    }
    return ret;
}
/*
 * 判断是否是正则式开始符号
 */
function regExpSign(line, extname){
    // java和c不支持正则式直接量
    if(extname.match(/java|c|cpp/i)) return false;
    // 如果是正则式开始符号 则符号前面可能为
    // 关键字为js的
    // =，,，(，[，，typeof，instanceof，in，delete，return，空
    // 如果是除法符号 除法为双元操作符 则符号前可能为
    // 变量名，数字直接量，数组[.*]，方法(.*)
    // 重正反两面来判断 提高准确度
    // js关键字
    var keyword=['break','delete','function','return','typeof','case','do','if','switch','var','catch','else','in','this',
                'void','continue','false','instanceof','throw','while','debugger','finally','new','true','with','default',
                'for','null','try','abstract','double','goto','native','static','boolean','enum','implements','package','super',
                'byte','export','import','private','synchronized','char','extends','int','protected','throws','class','final',
                'interface','public','transient','const','float','long','short','volatile'];
    line=line.trim();
    if(line){
        var lastChar=line.charAt(line.length-1);
        if(lastChar.match(/\=|\,|\(|\[/)) return true;
        if(lastChar.match(/\]|\)/)) return false;
        if(!lastChar.match(/[a-zA-Z0-9_\.\$]/)) return true;
        var lastWord=line.match(/\S+$/)[0];
        if(lastWord.match(/typeof|instanceof|in|delete|return|case|void/i)) return true;
        // 关键字过滤 暂时过滤js的 
        if(lastWord.match(/[a-z]/i)){
            for(var i=0,ii=keyword.length;i<ii;i++){
                if(lastWord.toLowerCase()==keyword[i]) return true;
            }
        }
        if(lastWord.match(/((\.)?[a-zA-Z_\$][a-zA-Z0-9_\$]*$|^(\d)*(\.\d*)?((E|e)(\+|\-)\d+)?$|^0(x|X)[0-9a-fA-F]+$)/)) return false;
        if(lastChar=='.') return true;
        return true;
    }else{
        return true;
    }
}
function addPureCode(stack, line){
    stack.forEach(function(anno){
        anno.__pureCode+=line+'\n';
    });
}
function addCode(stack, line){
    stack.forEach(function(anno){
        anno.__code+=line+'\n';
    });
}
function addAnno(annos, stack, anno){
    if(!anno.show()) return;
    if(stack.length>0){
        if(stack[stack.length-1].__lev==anno.__lev)stack.pop();
    }
    if(stack.length>0){
        stack[stack.length-1].__subAnnos.push(anno);
    }else annos.push(anno);
    stack.push(anno);
}
function matchLineRule(line, rules, curAnno){
    var matched=false;
    for(var i=0, ii=rules.length; i<ii; i++){
        var rule=rules[i];
        if(line.match(rule.rule)){
            rule.handler(curAnno, RegExp.$1, RegExp.$2, RegExp.$3, RegExp.$4, RegExp.$5, RegExp.$6, RegExp.$7, RegExp.$8, RegExp.$9, RegExp);
            matched=true;
            break;
        }
    }
    return matched;
}
function matchMultilineRule(anno, rules, curAnno){
    for(var i=0, ii=rules.length; i<ii; i++){
        var mrule=rules[i], arr, firstS, lastS;
        if(arr=anno.match(mrule.rule)){
            mrule.handler(curAnno, RegExp.$1, RegExp.$2, RegExp.$3, RegExp.$4, RegExp.$5, RegExp.$6, RegExp.$7, RegExp.$8, RegExp.$9, RegExp);
            // 保留上面的空白 汲取下面的空白
            firstS=arr[0].match(/\S/).index;
            firstS=arr[0].lastIndexOf('\n', firstS);
            firstS+=1;
            if(mrule.keepBottomNullString){
                lastS=arr[0].lastIndexOf('\n');
                lastS+=1;
            }else{
                lastS=arr[0].match(/\S\s*$/).index;
                lastS=arr[0].indexOf('\n',lastS);
                lastS+=1;
            }
            anno=anno.replace(arr[0].substring(firstS, lastS), '');
            if(mrule.rule.multiline) i= i-2>-1? i-2:-1;
            else i--;
        }
    }
    return anno;
}
function notEscape(str, index){
    if(index < 0 || str.charAt(index) !== '\\') return true;
    else return needEscape(str, index-1);
}
function needEscape(str, index){
    if(index < 0 || str.charAt(index) !== '\\') return false;
    else return notEscape(str, index-1);
}
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
function getRootDir(filepath){
    if(fs.lstatSync(filepath).isDirectory()) return filepath;
    return path.resolve(filepath, '..');
}
function getFileName(filename, root){
    var index=filename.indexOf(root);
    var name= index==0 ? filename.substr(root.length) : filename;
    name=name.replace(/(\\|\/)+/g,'.').replace(/^\.+/,'');
    return name;
}