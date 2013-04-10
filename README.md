annotation-parser
=================

通用的注释解释器，强大便利的注释解决方案。

设计思想
--------

根据自己的了解，程序语言（重点是c++,java,javascript）的注释，一般分为两种。一种是由双斜杠（//）开头的单行注释，令外一种是由斜杠星号（/*）开始和对应星号斜杠（*/）结束的段落（多行）注释。在由注释生成文档（api,class）的操作中，因为单行注释的先天不足，承载的信息有限，所以通常会选用多行注释来承载我们所需要的信息。基于此，本注释解释器也专注于对多行注释的有效信息进行提取。

### 简单的实现思想 ###

作为一个通用的注释解释器，面对的注释风格也不统一，如何在众多的不同风格中寻找出一套统一的方法来适配所有的风格，这是一个难题。万幸，我找到了解决问题的利器——正则式。虽然每个人的风格都是不一样的，但是同一个人在同个项目中的注释风格应该是相同的，有规律的，而这规律可以通过正则式匹配出来，从而将有效的信息提取出来。由不同的正则式匹配不同的风格，从而实现了对不同注释风格的适配。

下面是个正则式匹配的简单的例子（源码来源于网易前端的<a target='_blank' href='https://github.com/genify/NEJ'>NEJ</a>框架）

    /**
     * 为节点设置一个唯一的ID<br/>
     * 
     * 页面结构举例
     * [code type="html"]
     *    <div id="abc">aaaaa</div>
     * [/code]
     * 脚本举例
     * [code]
     *   var _e = NEJ.P("nej.e");
     *   var _node = _e._$get("abc");
     *   // 如果有id，返回原来的id,否则返回auto-id-12345678(8位随机字符串)
     *   var _id = _e._$id(_node||"abc");
     * [/code]
     * 
     * @chainable
     * @api    {nej.e._$id}
     * @param  {String|Node}    节点ID或者对象
     * @return {String}         节点ID
     */
    _e._$id =  function(_element){
        _element = _e._$get(_element);
        if (!_element) return;
        var _id = !!_element.id ? _element.id
                : 'auto-id-'+_u._$randString(8);
        _element.id = _id;
        if (_e._$get(_id)!=_element)
            _empol[_id] = _element;
        return _id;
    };

通过分析，可以发现代码中主要有三种不同的注释（此处的注释跟上文提到的注释不一样，上文提到的注释是注释的形式，这里的注释可以理解为注释里的要注释的属性）。

第一种是单行注释（属性），一行内写完的注释。譬如如下：

    @chainable
    @api    {nej.e._$id}
    @param  {String|Node} 节点ID或者对象
    @return {String}      节点ID。
    
第二种是多行注释（属性），需要多行才能写完的注释。譬如如下：

    页面结构举例
    [code type="html"]
       <div id="abc">aaaaa</div>
    [/code]
    脚本举例
    [code]
       var _e = NEJ.P("nej.e");
       var _node = _e._$get("abc");
       // 如果有id，返回原来的id,否则返回auto-id-12345678(8位随机字符串)
       var _id = _e._$id(_node||"abc");
    [/code]
    
第三种是除了前两种外，剩下的注释（属性）。这种注释往往没有标识，只是一些说明性的文字而已。譬如如下：
    
    为节点设置一个唯一的ID<br/>

前两种注释可以通过如下的正则式匹配出来，并提取出有用的属性，剩下的注释就是第三种注释，设anno=new Anno()，第三种注释为anno.desc。

    @chainable
    /\s*@chainable\s*/ => anno.chainable=true
    @api    {nej.e._$id}
    /\s*@api\s*\{(\S*)\}\s*/ => anno.api=RegExp.$1
    @param  {String|Node} 节点ID或者对象
    /\s*@param\s*\{(\S*)\}\s*(.*)\s*/ => if(!anno.param)anno.param={}; anno.param.push({type:RegExp.$1, desc:RegExp.$2})
    @return {String}      节点ID。
    /\s*@return\s*\{(\S*)\}\s*/ => anno.return={type:RegExp.$1, desc:RegExp.$2}
    页面结构举例
    [code type="html"]
       <div id="abc">aaaaa</div>
    [/code]
    /\s*页面结构举例\s*\[code\s*type="html"\]([\u0000-\uffff]*?)\[\/code\]/ => anno.html=RegExp.$1
    脚本举例
    [code]
       var _e = NEJ.P("nej.e");
       var _node = _e._$get("abc");
       // 如果有id，返回原来的id,否则返回auto-id-12345678(8位随机字符串)
       var _id = _e._$id(_node||"abc");
    [/code]
    /\s*脚本举例\s*\[code\]([\u0000-\uffff]*?)\[\/code]/ => anno.js=RegExp.$1
    剩余未匹配的为anno.desc，此处为：为节点设置一个唯一的ID<br/>

### 简单的文本化思想 ###

上文中，已经实现了从注释中提取有用信息，并转换为anno的属性。下一步考虑，如果将提取出来的信息灵活地转换为各种文本，因为每个人期望转化的结果是不一样的。

最简单的方法是直接将anno对象序列化成json对象，并存成文本，这样每个人可以按自己的想法为所欲为。只是这样的话，输出的文本只是一个中间量，每个人还需要写自己的处理程序，需要进行二次转换。

另外一种方法是重写Anno.prototype.toString方法，这样所有的anno（注释对象）都会以一个统一的模板转换成个人需要的文本。譬如例子中注释可以通过如下的方法进行转换：

    Anno.prototype.toString=function(){
        var str='';
        if(this.desc)str+='<p>desc: '+this.desc+'</p>';
        if(this.api)str+='<p>api: '+this.api+'</p>';
        if(this.chainable)str+='<p>chainable: true</p>';
        else str+='<p>chainable: false</p>';
        if(this.param){
            str+='<ul>';
            this.param.forEach(function(itm){
                str+='<li>type: '+itm.type+'<br/>desc: '+itm.desc+'</li>';
            });
            str+='</ul>';
        }
        if(this.return)str+='<p>return {'+this.return.type+'} '+this.return.desc+'</p>';
        if(this.html)str+='<h3>结构举例</h3><pre>'+this.html+'</pre>';
        if(this.js)str+='<h3>脚本举例</h3><pre>'+this.js+'</pre>';
        return str;
    }

转换后的结果如下：

    <p>desc :为节点设置一个唯一的ID&lt;br/&gt;</p>
    <p>api :nej.e._$id</p>
    <p>chainable: true</p>
    <ul><li>type: String|Node<br/>desc: 节点ID或者对象</li></ul>
    <p>return {String} 节点ID
    <h3>结构举例</h3>
    <pre>
        <div id="abc">aaaaa</div>
    </pre>
    <h3>脚本举例</h3>
    <pre>
        var _e = NEJ.P("nej.e");
        var _node = _e._$get("abc");
        // 如果有id，返回原来的id,否则返回auto-id-12345678(8位随机字符串)
        var _id = _e._$id(_node||"abc");
    </pre>

转换的结果是可以自己控制的，html并不是唯一的形式，也可以是纯文本，json，markdown等。

### 增强功能 ###

前面已经完成了对注释中有用信息的提取，并进行文本化的功能，但是这样转化出来的注释，一个个只是孤立的个体，这跟现实是不相符的。现实中的代码是有层级关系（此处的层级关系侧重与代码结构的层次，譬如类之间的继承关系就力不从心了）的，例如类和类的成员这样的上下级关系，或者同一个类的成员之间的平级关系。注释作为代码的代表，自然也需要反映出这种关系。最典型直接的展示这种关系的方法，就是API目录。要生成API目录，必须需要两个条件。第一个需要确认注释（代码）之间的层级关系，第二个需要确定各个注释（代码）的目录标题。对于第一个条件可以转换为确定每个注释所在的层级来解决，对于第二个问题，可以通过个人配置生成标题的规则来完成。

#### 确定注释（代码）的层级关系 ####

任何一份书写规范的代码，层级关系都是清晰的，因为从某种程度上来说，层级关系就是语法的层级关系，而一份可以正常执行的代码，语法的层级上当然不会有问题，自然层级关系也足够清晰明了。如以下代码：

    /* 注释1 */
    class A{
        /* 注释2 */
        int property;
        /* 注释2-1 */
        void method(){
            /* 注释3 */
            void method(){}
        }
        void method(){
            /* 注释3-1 */
            void method(){} 
            /* 注释3-2 */
            void method(){}
        }
        void method(){
            method(){
                /* 注释4 */
                void method(){
                    /* 注释5 */
                    int property;
                }
                void method(){
                    /* 注释5-1 */
                    int property;
                    /* 注释5-2 */
                    int property;
                }
            }
        }
    }

可以非常清晰的看到注释（代码）之间的层级关系树和对应的语法的层级关系树。

    注释1                    注释1
        |- 注释2                 |- 注释2
        |- 注释2-1               |- 注释2-1
        |      |- 注释3          |      |-注释3
        |                        |
        |- 注释3-1               |- 匿名注释
        |- 注释3-2               |      |-注释3-1
        |- 注释4                 |      |-注释3-2
        |      |- 注释5          |
        |                        |- 匿名注释
        |- 注释5-1                      |- 匿名注释
        |- 注释5-2                             |- 注释4
                                               |      |- 注释5
                                               |
                                               |- 匿名注释
                                                      |- 注释5-1
                                                      |- 注释5-2

层级关系树就像是语法的层级关系树去除匿名注释后的简略版，但是依然大致保留了注释（代码）之间的关系。如果所有的匿名注释都存在，则层级关系树等于语法的层级关系树。本实现，只所以采用缩略版这种关系树，是因为具有更好通用适应性，例如在JavaScript中，有时候语法的层次的递增，其实是没有意义的。

因为层级关系树是语法的层级关系树的缩略版，可以通过语法的层级关系树生成，所以要确定层级关系树就要确定语法的层级关系树。而要确定语法的层级关系树，关键在于如何判断所有注释（包括匿名注释）的所在层次。要判断注释的层次，最好的办法是对不同的语言进行语法分析，这样可以准确无误的判断出注释所在的层次。但是这种实现需要对各种语言进行分析，代价太大，相当于要实现了各种语言的语法解析器，对于一个注释解释器来说不值得。所以我们需要寻找另外一种方法，一种能够在词法层面解决的通用的划分层次的方法。通过考察，我发现很多语言（起码javascript,java,c++）都是以‘{’和‘}’作为层次的开始和闭合的（当然他们也存在无‘{’，层次递增的情况，但是这种情况下注释的概率比较低，无注释也就不会有影响）。所以就采用了‘{’和‘}’匹配的方法来确定注释（代码）的层次的方法，这并不是一种完美的方法，抛弃了不能用‘{’和‘}’分层的语言，也没有办法保证百分百的正确率。但是通过优化，它已经有比较好的通用性和准确性，可以满足绝大部分的情况的使用。它的算法非常简单，首先需要进行词法分析，然后取得有效的‘{’和‘}’，遇到‘{’，层级就增加一，遇到‘}’，层级就减少一，最后验证层级是否等于初始量。

因为可以判断语法的层级结构，那么就可以进一步保留层级对应的源码，此处可以顺便实现保留注释对应的源码的功能，这是后面一些功能的基础。

#### 配置目录标题 ####

注释（代码）的标题是指有意义的对外接口，其来源不外乎两个地方，一个是注释中指出的有效信息，另一个是从源代码中提取出来的信息。

##### 从注释中获取有效标题 #####

从注释中获取有效标题，就是通过配置注释中明确指定的对外接口属性，例如api，class，method之类的，具体实现就是重写Anno.prototype.getTitle方法。代码如下所示（__title为从源码获取的标题，autoTitle()为获取自动分配的标题，防出错）：

    Anno.prototype.getTitle=function(){
        return this.api || this.class || this.method || this.__title || this.autoTitle();
    };

##### 从源码中获取有效标题 #####

从源码中获取有效标题，是在前面保留源码的前提下，可以通过对源码进行正则式匹配（单行匹配，不支持多行匹配），获取有用的类名，函数名，属性名等有意义的信息作为标题。因为各个语法差异性比较大，对应的获取标题的正则式（规则）差异也比较大，所以采用针对各个语言单独适配的原则，对各个语言各订制一套规则，属于一次性成本。以下是java的部分规则：

    // 返回类名 接口名
    define(/(^|\s+)(class|interface)\s+(\w+)?\s*/,function(a1,a2,a3){
        return a3;
    });
    // 返回方法名
    define(/(^|.*\s+)(\w+)\(/,function(a1, a2){
        return a2;
    });

当碰到源码时，流程如下：

    'public class AAA extend BBB {' => 匹配/(^|\s+)(class|interface)\s+(\w+)?\s*/ => 返回AAA => this.__title=AAA

同样的原理可以对源码进行一定的处理，可以定义相应的代码规则，补充注释。

#### 显示（导出）控制 ####

不是所有的注释都需要显示（导出）来的，譬如私有属性，私有方法，过程说明等等，为此提供了对各个注释进行显示（导出）控制的方法，具体就是现实Anno.prototype.show方法，通过条件判断（某属性存在否，属性是否符合某项条件...）来控制注释的显隐。可能代码如下：

    Anno.prototype.show=function(){
        return this.show || !this.hidden || this.api || this.export==true;
    };

综上所有的思路，已经完成了本注释解释器的所有核心思想，可以看到如下的结构：

                           待解析代码文件
                                 ↓                                        toString规则
                   ------------------------------       show规则               ↓
                   |           解释器           |          ↓          --------------
                   |----------------------------|    -------------    | 文 |  API  | => api目录以及各个文件
                   |          |     源码解析    | => | 筛选(show)| => | 本 |-------|
    定义注释规则-> | 注释解释 |-----------------|    -------------    | 化 | CLASS | => class目录以及各个文件
                   |          |解析标题|代码处理|                     --------------
                   ------------------------------                              ↑
                                  ↑        ↑                          按文件及顶级层次导出
                         定义标题规则    定义代码规则

注释器主要实现框中的功能和一些常用语言的标题规则，用户只需要定义注释规则，show规则，toString规则和可选的代码规则就可以获得一个高度自定义的个人注释解释器。完整的用户定义规则文件如下（java版本）：

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
            return str;
        };
        Anno.prototype.getTitle=function(){
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

### 便利的规则定义 ###

要使用本注释解释器，最重要的是要写定义规则文件，而通过分析可以发现，规则文件中有很多重复性的枯燥的代码，让人烦不胜烦。基于此，需要对规则定义文件简化，让用户更加方便自然地书写规则。通过努力，实现了对注释规则，title规则，show规则，toString规则的简化，上面定义文件简化后的代码如下：

    /**
     * @id-author line-name
     * @id-since word-ver
     * @id-param word-id line-desc
     * @id-param word-id line-desc
     * @id-return line-desc
     * @id-throws line-desc
     * @id-throws line-desc
     */

    //title规则 输出先存在的属性 都不存在 输出smartTitle
    [title][/title]

    //show规则 只要该属性存在就show 加感叹号的 只要存在该属性就不输出
    [show][/show]

    //toString 规则 双感叹号 一定会输出 否则只有对应属性存在才输出
    <p>@desc</p>
    <p>since: @since.ver</p>
    <p>author: @author.name</p>
    <ul>[list_param]<li><span>@param.id</span> @param.desc</li>[/list]</ul>
    <p>return: @return.desc</p>
    <ul>[list_throws]<li>@throws.desc</li>[/list]</ul>

通过对比可以发现，简化后的定义文件精简了许多，基本达到了去除冗余重复性代码的目标，但是也存在一些局限性，主要表现在功能上的削弱，没有那么灵活自由。这是因为在定义定义规则的语言时，增加了一些约束，弱化了定义规则的一部分能力。但是这是可以通过增强定义定义规则的语言的办法来增强定义规则的能力，本解释器也提供了混合模式，用最初那种定义规则的办法来增强定义规则的能力。下面分别从注释规则，title规则，show规则，toString规则来分开讲解如何定义它们。

#### 定义注释规则 ####

注释规则全部包含在一个标准的多行注释中。它通过id-xxx来定义一项注释，通过word-xxx，line-xxx，block-xxx三个来声明其属性。xxx代表以字母下划线开头，后面可接数字下划线字母的不少于一位的，非javascript关键字的标识符，word代表连续的非空的字符串，line代表连续的字符串，block代表跨行的字符串，其中block只运用在多行注释（参照前面的注释三分类）中。

要声明一项注释，必须以id-开头（开头的意思是，前面不能有属性声明，即必须是新的一行），id-前面的字符（注释*空格之后的）为其前缀。前缀和id-建议不要留空，否则空也是前缀。后面开始声明注释的属性，通过word-，line-，block-声明类型加上标识符来唯一标识一项属性。属性之间通过空格或者其它有效的标识（例如$*()+等不混淆词法分析的符号）来分隔开。如果出现了block类型的属性，则代表此项注释为多行注释，需要一个结尾的后缀。后缀是符合一定规则的前缀可以推测出来的。其规则如下xxx为注释的id：

+ 如果前缀为空，则后缀为"/xxx"
+ 如果前缀不以<([{开头，则后缀为"/前缀"
+ 否则后缀为"前缀/xxx逆反前缀"

换行和EOF可以结束任何多行注释，这种注释以换行作为注释的结尾。前后缀及换行示例如下

    // 前缀为空
    /*
     * id-code block-cnt /code
     * id-code
          block-cnt
     * /code
     */

    // 前缀不以<([{开头
    /*
     * @id-code block-cnt /@
     * @id-code
     *    block-cnt
     * /@
     */

    // 前缀以<([{开头，逆反类似回文，只是<([{分别由>)]}替换掉了
    /*
     * [@%<=id-code=>%@] block-cnt [@%<=/code=>%@]
     * [@%<=id-code=>%@]
     *    block-cnt
     * [@%<=/code=>%@]
     */

    // 换行和EOF结束多行注释
    /*
     * id-code block-cnt EOF
     * id-code block-cnt
     *
     * @id-code block-cnt EOF
     * @id-code block-cnt
     *
     * [@%<=id-code=>%@] block-cnt EOF
     * [@%<=id-code=>%@] block-cnt
     *
     */

有些某项注释可以出现多次，这时只要重复一次注释申明就代表注释可以了。示例如下：

    // 多作者，多代码注释申明
    /*
     * id-author line-name
     * id-author line-name
     * id-code block-cnt /code
     * id-code block-cnt /code
     */

有些注释的某项属性可能是可选出现的，这时需要用##包起来，如果要输出#，用反斜杠注释掉，如果##里面不包含属性申明，则##里面的所有字符串将被忽略掉，前缀中的#不会解析。示例如下：

    // 注释可选属性声明
    /*
     * @id-author line-name #(line-mail)#
     * @id-code #type=word-type#
     *    block-cnt
     * /@
     * @id-method\#line-name\#               //#无效
     * @id-since #1231# line-ver             //##里面的1231将被忽略
     * #id-api line-api                      //#不会解析
     */

#### 定义title规则 ####

titile规则定义包含在[titile][/title]中间，以分割符|分开，要作为title的注释的属性。如果所列的属性都不存在，则输出从源码解析的title，即smartTitle。示例如下：

    /**
     * @id-author line-name
     * @id-since word-ver
     * @id-api line-api
     * @id-param word-id line-desc
     * @id-param word-id line-desc
     * @id-return line-desc
     * @id-throws line-desc
     * @id-throws line-desc
     */
    // 存在api则输出api.api，存在author就输出author.name，否则就输出__title
    [title]api.api|author.name[/title]

#### 定义show规则 ####

show规则定义包含在[show][/show]中间，以分割符|分开，依次检查属性，直到为真则输出。如果不配置，则默认为真，输出所有注释。示例如下：

    /*
     * @id-show
     * @id-hidden
     * @id-api
     * @id-public
     */
    // 如果存在show，api，public或者不存在hidden属性，则输出
    [show]show|api|public|!hidden[/show]
    // 始终输出
    [show][/show]

#### 定义toString规则 ####

toString规则定义包含在规则定义文件的最下面。要输出一个非列表项注释的属性，只需要以"@+注释id+.+注释属性"声明就好。对于列表项注释，需要提前用"[list-列表项注释id]"开始，用"[/list]"结束列表项。定义toString规则实行按行定义的原则，一般一行就是一条规则，除了列表项和可选属性支持多行规则。以!!开始的规则（就是行开头是!!），属于必然输出规则，无论后面的注释项存在否，都会输出。否则，则要判断后面申明的注释项存在，才会输出。对于可选属性的输出，需要用[#][/#]包含起来，存在才输出，否则不输出。示例如下：

    /*
     * id-author line-name #(line-email)#
     * id-param word-type line-desc
     * id-param word-type line-desc
     * id-code #type="word-type"# block-cnt /code
     */

    <p>@author.name [#]@author.email[/#]</p>                                          //如果author存在才输出     如果author.email存在才输出可选部分
    !!<p>@suthor.name [#]@author.email[/#]</p>                                        //一定输出                 如果author.email存在才输出可选部分
    [#]<h3>@code.type</h3>[/#]                                                        //如果code.type存在才输出可选部分
    <pre>@code.cnt</pre>                                                              //如果code存在才输出
    <ul>[list-param]<li>[#]@param.type [/#]@param.desc</li>[/list]</ul>               //一定输出ul               如果param存在才输出列表项注释部分 如果param.type存在才输出可选部分
    !!<ul>[list-param]                                                                //一定输出ul               如果param存在才输出列表项注释部分 如果param.type存在才输出可选部分 如果去除!!则效果等同于前面的单行写法
        <li>
            [#]@param.type [/#]@param.desc
        </li>[/list]
    </ul>
    <ul>@author.name[list-param]<li>[#]@param.type [/#]@param.desc</li>[/list]</ul>   //如果author存在才输出ul   如果param存在才输出列表项注释部分 如果param.type存在才输出可选部分
    !!<ul>@author.name[list-param]                                                    //一定输出ul               如果param存在才输出列表项注释部分 如果param.type存在才输出可选部分 如果取出!!则效果等同于前面的单行写法
        <li>
            [#]@param.type [/#]@param.desc
        </li>[/list]
    </ul>

用[list-xxx][/list]以及[#][/#]标识的属性，都是可选的，都是存在才会输出的，并且都不支持各自的循环嵌套，即[#][/#]内部不能嵌套[#][/#]，[list-xxx][/list]内部不能嵌套[list-xxx][/list]。[#][/#]可以直接使用，或者嵌套在[list-xxx][/list]中，但是[#][/#]内部不能嵌套[list-xxx][/list]。

### 配置 ###

通用注释解释器的配置文件，非规则定义。

    /*
     * 默认配置文件
     */
    module.exports={

        // 路径名为相对本本配置文件的路径名或者绝对路径

        ///////////////////// 规则解释器相关 /////////////////////////
        // 配置规则的模式
        // 'smart':  智能模式 最方便的模式 通过rule定义语言定义rule
        // 'default':默认模式 功能最强大的模式 提供codeRule
        // 'mix':    混合模式 先智能模式后默认模式
        // 自定义规则和默认规则 只有一个能生效
        // 当自定义规则存在时 默认规则不生效
        'rule_module':'smart',
        // 智能模式下 自定义规则的文件
        'smart_user_rule':'./user.js',
        // 智能模式下 默认规则的文件
        'smart_default_rule':'./default.js',
        // 默认模式下 自定义规则的文件
        'default_user_rule':'./user2.js',
        // 默认模式下 默认规则的文件
        'default_default_rule':'./default2.js',

        ///////////////////// 注释解释器相关 /////////////////////////
        // 要解析文件路径
        'path':'../../material/',
        // 解析后API文件输出目录
        'target_api_path':'./api/',
        // 解析后API文件目录输出目录
        // 如果不填 则同target_api_path
        'target_api_nav_path':'',
        // 解析后class文件输出目录
        'target_cls_path':'./cls/',
        // 解析后class目录文件输出目录
        // 如果不填 则同target_cls_path
        'target_cls_nav_path':'',
        // 智能断层
        // 如果设为false 所有跟层,代码相关的设置将不再生效 parse_hierarchy ignore_hierarchy keep_code keep_anno smart_title
        'smart_hierarchy':true,
        // 解析注释深度 代码有层级结构（例如类函数，有两层结构）其深度可以设为2
        // 默认为-1 解析所有注释
        'parse_hierarchy':-1,
        // 不解析的层次 （因为js存在闭包 第一层无意义）
        'ignore_hierarchy':0,
        // 如果要解析的文件类型不为空 则忽略不解析文件类型
        // 要解析的文件类型
        'parse_file_type':'js|c|java|x',
        // 如果要解析的文件类型为空 则不解析文件类型生效
        // 不解析的文件类型
        'ignore_file_type':'txt|html|css|class',
        // 忽略第一个无意义的注释 （java中可能是版权注释）
        'ignore_first_boring_anno':false,
        // 忽略文件的开始的行数[1，N] （忽略文件前面的无意义文字，例如版权注释等）
        'ignore_file_line':0,
        // 智能提取标题 例如类名，函数名
        'smart_title':true,
        // 代码解析 代码包含注释
        // 只处理行代码
        'parse_code':false,
        // 是否保留注释对应的代码
        'keep_code':true,
        // 是否保留已解析的注释
        'keep_anno':true,
        // 是否在代码前添加注释 只有在keep_code和keep_anno设置为true的情况下才生效
        'keep_anno_before_code':true,
        // 是否保留注释内容中的星号（不包括首尾的）
        // /*    不包括
        //  *    包括
        //  **   包括
        // *     包括
        //  */   不包括
        'keep_anno_star':false,
        // 是否对层级的lev进行统一整理
        // 因为新算法解决了跳lev的问题 导致同层次会出现不同的lev 这样生成的目录中同层次的class却不一样 这样导致显示效果不一样
        // 以顶层中最小的lev为起点进行调整
        'reset_hierarchy_lev':true,

        ///////////////////// 导出的文件相关 /////////////////////////
        // 导出的文件类型
        'export_file_type':'html|json',
        // 是否对HTML友好的
        // 通过对<>进行转义来实现的 只在输出html文件时生效
        'html_friendly':true
    };

如何使用
--------

首先定义规则，其次配置文件，最后运行程序就可以了。

### 定义规则范例 ###

smart模式范例

    /**
     * @id-author line-name
     * @id-version word-ver
     * @id-since word-ver
     * @id-api {word-api}
     * @id-see {word-api}
     * @id-type {word-type}
     * @id-const {line-con}
     * @id-param {word-type} line-desc
     * @id-param {word-type} line-desc
     * @id-return {word-type} line-desc
     * @id-throw word-type line-desc
     * [id-code #type="word-type"#]
     * block-cnt
     * [/code]
     * [id-code #type="word-type"#]
     * block-cnt
     * [/code]
     */

    //title规则 输出先存在的属性 都不存在 输出smartTitle
    [title]api.api|const.con|desc[/title]
    //show规则 只要该属性存在就show 加感叹号的 只要存在该属性就不输出
    [show]api|author|const|desc[/show]

    //toString 规则 双感叹号 一定会输出 否则只有对应属性存在才输出
    <pre>@__code</pre>
    <p>=====================================================================================</p>
    <p>desc: @desc</p>
    <p>author: @author.name</p>
    <p>version: @version.ver</p>
    <p>since: @since.ver</p>
    <p>api: @api.api</p>
    <p>see: @see.api</p>
    <p>type: @type.type</p>
    <p>const: @const.con</p>
    <p>return: @return.type @return.desc</p>
    <ul>[list-param]<li>param-type: @param.type; param-desc:param.desc</li>[/list]</ul>
    [list-code]
        [#]<p>title:@code.title</p>[/#]
        [#]<p>type:@code.type</p>[/#]
        <pre>@code.cnt</pre>
    [/list]

default模式范例

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

### 配置文件范例 ###

只需要配置所需的属性就好，其它的可以采用默认配置。

    /*
     * 用户自定义配置文件
     */
    module.exports={

        // 路径名为相对本本配置文件的路径名或者绝对路径
        
        ///////////////////// 规则解释器相关 /////////////////////////
        // 配置规则的模式
        // 'smart':  智能模式 最方便的模式 通过rule定义语言定义rule
        // 'default':默认模式 功能最强大的模式 提供codeRule
        // 'mix':    混合模式 先智能模式后默认模式
        // 自定义规则和默认规则 只有一个能生效
        // 当自定义规则存在时 默认规则不生效
        'rule_module':'smart',
        // 智能模式下 自定义规则的文件
        'smart_user_rule':'../rule/default.js',
        // 智能模式下 默认规则的文件
        'smart_default_rule':'../rule/default.js',
        // 默认模式下 自定义规则的文件
        'default_user_rule':'../rule/user4.js',
        // 默认模式下 默认规则的文件
        'default_default_rule':'../rule/default2.js',
        // 忽略第一个无意义的注释 （可能是版权注释）
        'ignore_first_boring_anno':false,
        // 解析后API文件输出目录
        'target_api_path':'../../../lemon/public/res/api/',
        // 解析后class文件输出目录
        'target_cls_path':'../../../lemon/public/res/cls/',
        // 解析后API文件目录输出目录
        // 如果不填 则同target_api_path
        'target_api_nav_path':'../../../lemon/dev/',
        // 解析后class目录文件输出目录
        // 如果不填 则同target_cls_path
        'target_cls_nav_path':'../../../lemon/dev/',
        // 智能断层
        // 如果设为false 所有跟层,代码相关的设置将不再生效 parse_hierarchy ignore_hierarchy keep_code keep_anno smart_title
        'smart_hierarchy':true,
        // 是否保留注释对应的代码
        'keep_code':true,
        // 是否保留已解析的注释
        'keep_anno':true,
        // 是否在代码前添加注释 只有在keep_code和keep_anno设置为true的情况下才生效
        'keep_anno_before_code':true,
        // 智能提取标题 例如类名，函数名
        'smart_title':true,
        // 是否对HTML友好的
        // 通过对<>进行转义来实现的 只在输出html文件时生效
        'html_friendly':false
    };

### 运行程序 ###

以管理员权限运行node app就可以了