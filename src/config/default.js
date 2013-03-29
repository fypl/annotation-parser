/*
 * 默认配置文件
 */
module.exports={
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
	'path':'../material/',
	// 解析后API文件输出目录
	'target_api_path':'./api/',
	// 解析后class文件输出目录
	'target_class_path':'./cls/',
	// 严格模式(注释严格模式) 暂时未实现非严格模式
	// 严格实例
	// /*
	//  * annotation
	//  */
	// 非严格实例
	// [code] /* [annotation]
	// [annotation]
	// [annotation] */ [code]
	'strict_mode':true,
	// 智能断层
	// 如果设为false 所有跟层,代码相关的设置将不再生效 parse_hierarchy ignore_hierarchy keep_code keep_code_anno smart_title
	'smart_hierarchy':true,
	// 解析注释深度 代码有层级结构（例如类函数，有两层结构）其深度可以设为2
	// 默认为-1 解析所有注释
	'parse_hierarchy':-1,
	// 不解析的层次 (因为js存在闭包 第一层无意义)
	'ignore_hierarchy':0,
	// 如果要解析的文件类型不为空 则忽略不解析文件类型
	// 要解析的文件类型
	'parse_file_type':'js|c|java|x',
	// 如果要解析的文件类型为空 则不解析文件类型生效
	// 不解析的文件类型
	'ignore_file_type':'txt|html|css|class',
	// 忽略第一个无意义的注释 (java中可能是版权注释)
	'ignore_first_boring_anno':false,
	// 忽略文件的开始的行数[1，N] (忽略文件前面的无意义文字，例如版权注释等)
	'ignore_file_line':0,
	// 智能提取标题 例如类名，函数名
	'smart_title':true,
	// 代码解析 代码包含注释
	// 只处理行代码
	'parse_code':false,
	// 是否保留注释对应的代码
	'keep_code':false,
	// 是否在保留代码时保留已解析的注释
	'keep_code_anno':false,
	// 是否保留注释内容中的星号(不包括首尾的)
	// /*    不包括
	//  *    包括
	//  **   包括
	// *     包括
	//  */   不包括
	'keep_anno_star':false,
	// 是否保留注释中的空行
	'keep_null_string':true,
	// 是否对层级的lev进行统一整理
	// 因为新算法解决了跳lev的问题 导致同层次会出现不同的lev 这样生成的目录中同层次的class却不一样 这样导致显示效果不一样
	// 已顶层中最小的lev为起点进行调整
	'reset_hierarchy_lev':true,

	///////////////////// 导出的文件相关 /////////////////////////
	//导出的文件类型
	'export_file_type':'html|json'
};