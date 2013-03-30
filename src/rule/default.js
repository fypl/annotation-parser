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
