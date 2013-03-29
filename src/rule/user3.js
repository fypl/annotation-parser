/**
 * id-Purpose: block-purpose
 *
 * id-Entry: block-entry
 *
 * id-Exceptions: block-exc
 *
 * id-Note: block-note
 *
 * id-Uses: block-uses
 *
 * id-Exit: block-exi
 *
 */

//title规则 输出先存在的属性 都不存在 输出smartTitle
[title][/title]
//show规则 只要该属性存在就show 加感叹号的 只要存在该属性就不输出
[show][/show]

//toString 规则 双感叹号 一定会输出 否则只有对应属性存在才输出

<p><span>desc:</span>@desc</p>
<p><span>Purpose:</span>@Purpose.purpose</p>
<p><span>Entry:</span>@Entry.entry</p>
<p><span>Exceptions:</span>@Exceptions.exc</p>
<p><span>Note:</span>@Note.note</p>
<p><span>Uses:</span>@Uses.uses</p>
<p><span>Exit:</span>@Exit.exi</p>
<p>=============================================</p>
<pre>@__code</pre>