/*
 * @id-api word-api
 * @id-author line-name #(line-mail)#
 * @id-author line-name #(line-mail)#
 * @id-version word-ver
 * @id-since word-ver #line-date#
 * @id-deprecated word-ver #line-date#
 * @id-see line-api
 * @id-see line-api
 * @id-param word-type word-name line-desc
 * @id-param word-type word-name line-desc
 * @id-return line-desc
 * @id-exception word-name line-desc
 * @id-exception word-name line-desc
 * @id-code #line-title# block-cnt EOF
 * @id-code #line-title# block-cnt EOF
 * @id-hidden
 */

//title规则 输出先存在的属性 都不存在 输出smartTitle
[title]api.api|desc[/title]

//show规则 只要该属性存在就show 加感叹号的 只要存在该属性就不输出
[show]!hidden[/show]

//toString 规则 双感叹号 一定会输出 否则只有对应属性存在才输出
//对于可重复属性用[list-property]来标示开始 以[/list]来标示结束
//对于属性的可能的特性用[#]来标示开始 以[/#]来标示结束
<p class='desc'>@desc</p>
<ul class='authors'>
	[list-author]<li class='author'>@author.name</li>[/list]
</ul>
<p class='version'>@version.ver</p>
<p class='since'>@since.ver[#] @since.date[/#]</p>
<p class='deprecated'>@deprecated.ver[#] @deprecated.date[/#]</p>
<ul class='sees'>
	[list-see]<li class='see'>@see.api</li>[/list]
</ul>
<ul class='codes'>
	[list-code]
		[#]<p class='codeTitle'>@code.title</p>[/#]
		<pre class='codeCnt'>@code.cnt</pre>
	[/list]
</ul>
<ul class='params'>
	[list-param]<li class='param'>@param.name<br>@param.desc</li>[/list]
</ul>
<p class='return'>@return.desc</p>
<ul class='exceptions'>
	[list-exception]<li class='exception'>@exception.name<br>@exception.desc</li>[/list]
</ul>
<pre class='source'>@__code</pre>