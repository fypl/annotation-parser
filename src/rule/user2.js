//module.exports=null;
module.exports=function(rules, Anno){
    function define(annoRule, handler){
        rules.annoRules.push({'rule':annoRule,'handler':handler,'multiline':annoRule.multiline});
    }
    function defineCode(codeRule, handler){
        rules.codeRules.push({'rule':codeRule,'handler':handler});
    }
    define(/@since\s+(.*)\s*/i,function(anno, a1){
    	anno.since=a1;
    });
    define(/@author\s+(.*)\s*/i,function(anno, a1){
    	anno.author=a1;
    });
    define(/@param\s+(\w+)?\s+(.*)\s*/i,function(anno, a1, a2){
    	if(!anno.param)anno.param=[];
    	anno.param.push({'var':a1,'desc':a2});
    });
    define(/@return\s+(.*)\s*/i,function(anno, a1){
    	anno.return=a1;
    });
    define(/@throws\s+(.*)\s*/i,function(anno, a1){
    	if(!anno.throws)anno.throws=[];
    	anno.throws.push(a1);
    });
    rules.unmarkHandler=function(anno, desc){
        if(!anno['desc'])anno['desc']=desc;
        else anno['desc']+=desc;
    }
    Anno.prototype.toString=function(){
    	var str='';
    	if(!!this.desc)str+='<p>'+this.desc+'</p>';
     	if(!!this.since)str+='<p>since: '+this.since+'</p>';
     	if(!!this.author)str+='<p>author: '+this.author+'</p>';
     	if(!!this.param){
     		str+='<ul>';
     		this.param.forEach(function(itm){
     			str+='<li>'+itm.var+': '+itm.desc+'</li>';
     		});
     		str+='</ul>';
     	}
     	if(!!this.return)str+='<p>return: '+this.return+'</p>';
     	if(!!this.throws){
     		str+='<ul>';
     		this.throws.forEach(function(itm){
     			str+='<li>'+itm+'</li>';
     		});
     		str+='</ul>';
     	}
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
    	if(!this.__title)this.__title=this.autoTitle(); 	
    	else if(!!this.param){
    		var str='(';
    		for(var i=0,ii=this.param.length;i<ii;i++){
    			str+=this.param[i]['var'];
    			if(i!=ii-1)str+=', ';
    		}
    		str+=')';
			this.__title+=str;
			this.__getTitle=function(){
				return this.__title;
			}
    	}	
        return this.__title;
    }
    Anno.prototype.show=function(){
    	return true;
    }
};