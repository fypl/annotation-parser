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
<pre>@__code</pre>
<p>=============================================</p>
<p><span>desc:</span>@desc</p>
<p><span>author:</span>@author.name</p>
<p><span>since:</span>@since.ver</p>
<ul>[list_param]<li><span>@param.id</span> @param.desc</li>[/list]</ul>
<p><span>return:</span>@return.desc</p>
[list_throws]
<p><span>throws </span>@throws.desc</p>
[/list]
<p>=============================================</p>
!!<p><span>desc:</span>@desc</p>
!!<p><span>author:</span>@author.name</p>
!!<p><span>since:</span>@since.ver</p>
!!<ul>[list-param]<li><span>@param.id</span> @param.desc</li>[/list]</ul>
!!<p><span>return:</span>@return.desc</p>
!![list-throws]
<p><span>throws </span>@throws.desc</p>
[/list]