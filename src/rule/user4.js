//module.exports=null;
module.exports=function(rules, Anno){
    function define(annoRule, handler, keepBottomNullString){
        rules.annoRules.push({'rule':annoRule,'handler':handler,'multiline':annoRule.multiline,'keepBottomNullString':keepBottomNullString});
    }
    function defineCode(codeRule, handler){
        rules.codeRules.push({'rule':codeRule,'handler':handler});
    }
    define(/\+\s*(\S*)\s*(.*)/,function(anno,a1,a2){
        if(!anno.arg)anno.arg=[];
        anno.arg.push({'id':a1,'desc':a2});
    });
    define(/\^\s*(\S*)\s*(.*)/,function(anno,a1,a2){
        anno.ret={'id':a1,'desc':a2};
    });
    define(/\s*#\s*(-\s*(\S*)\s*(\r\n|\n)[\b ]*(\r\n|\n))?([\u0000-\uffff]*?)(\r\n|\n)[ \b]*(\r\n|\n)/m,function(anno,a1,a2,a3,a4,a5,a6,a7){
        if(!anno.code)anno.code=[];
        anno.code.push({'type':a2,'code':a5});
    });
    rules.unmarkHandler=function(anno, desc){
        if(!anno['desc'])anno['desc']=desc;
        else anno['desc']+=desc;
    }
    Anno.prototype.toString=function(){
    	var str='';
        str+='<pre>'+this.__code+'</pre>';
        str+='<p>'+this.__title+'</p>'
        str+='<p><span>'+this.desc+'</span></p>';
        this.arg.forEach(function(itm){
            str+='<p><span>'+itm.id+' </span>'+itm.desc+'</p>';
        });
        str+='<p><span>'+this.ret.id+' </span>'+this.ret.desc+'</p>';
        this.code.forEach(function(itm){
            str+='<h3>'+itm.type+'</h3><pre>'+itm.code+'</pre>';
        });
     	return str;
    };
    Anno.prototype.__getTitle=function(){
        return '';
    }
    Anno.prototype.show=function(){
    	return true;
    }
};