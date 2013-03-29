module.exports=function(rules, Anno){
    function define(annoRule, handler){
        rules.annoRules.push({'rule':annoRule,'handler':handler,'multiline':annoRule.multiline});
    }
    function defineCode(codeRule, handler){
        rules.codeRules.push({'rule':codeRule,'handler':handler});
    }
    define(/@version\s*(.*)\s*/i,function(anno, a1){
        anno['version']=a1;
    });
    define(/@author\s*(.*)\s*/i,function(anno, a1){
        anno['author']=a1;
    });
    define(/\s*(页面)?结构举例\s*\[code\s*.*\](\s*(\r\n|.)*?)\s*\[\/code\]\s*/im,function(anno, a1, a2){
        anno['html']=a2;
    });
    define(/\s*脚本举例\s*\[code\s*.*\](\s*(\r\n|.)*?)\s*\[\/code\]\s*/im,function(anno, a1){
        anno['js']=a1;
    });
    define(/@see\s*\{(.*)\}\s*/i,function(anno, a1){
        anno['see']=a1;
    });
    define(/@api\s*\{(.*)\}\s*/i,function(anno, a1){
        anno['api']=a1;
    });
    define(/@type\s*\{(.*)\}\s*/i,function(anno, a1){
        anno['type']=a1;
    });
    define(/@const\s*\{(.*)\}\s*/i,function(anno, a1){
        anno['const']=a1;
    });
    define(/@return\s*\{(.*)\}\s*(.*)/i,function(anno, a1, a2){
        anno['return']={'type':a1,'desc':a2};
    });
    define(/@param\s*\{(.*)\}\s*(.*)/i,function(anno, a1, a2){
        if(!anno['param'])anno['param']=[];
        anno['param'].push({'type':a1,'desc':a2});
    });
    rules.unmarkHandler=function(anno, desc){
        if(!anno['desc'])anno['desc']=desc;
        else anno['desc']+=desc;
    }
    Anno.prototype.toString=function(){
        var str="";
        if(!!this['desc'])str+='<p>desc: '+this['desc']+'</p>';
        if(!!this['version'])str+='<p>version: '+this['version']+'</p>';
        if(!!this['author'])str+='<p>author: '+this['author']+'</p>';
        if(!!this['html'])str+='<pre>'+this['html'].replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</pre>';
        if(!!this['js'])str+='<pre>'+this['js'].replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</pre>';
        if(!!this['see'])str+='<p>see: '+this['see']+'</p>';
        if(!!this['api'])str+='<p>api: '+this['api']+'</p>';
        if(!!this['type'])str+='<p>type: '+this['type']+'</p>';
        if(!!this['const'])str+='<p>const: '+this['const']+'</p>';
        if(!!this['param']){
            str+='<ul>';
            for(var i=0,ii=this['param'].length;i<ii;i++)str+='<li>param: '+this['param'][i]['type']+" "+this['param'][i]['desc']+'</li>';
            str+='</ul>';
        } 
        if(!!this['return'])str+='<p>return: '+this['return']['type']+" "+this['return']['desc']+"</p>";
        if(!!this.__lev)str+='<p>lev: '+this.__lev+'</p>';
        if(!!this.__title)str+='<p>author: '+this.__title+'</p>';
        if(!!this.__code)str+='<pre>'+this.__code+'</pre>';
        if(!!this.__subAnnos && this.__subAnnos.length>0){
            str+='<ul>';
            this.__subAnnos.forEach(function(anno){
                str+='<li class="subAnno">'+anno.toString()+'</li>';
            });
            str+='</ul>';
        }
        return str;
    };
    Anno.prototype.__getTitle=function(){
        return this['api'];
    }
    Anno.prototype.show=function(){
        return (this['api'] || this['author']);
    }
};