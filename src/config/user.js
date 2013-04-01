/*
 * 用户自定义配置文件
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
	'smart_user_rule':'./rule/template.js',
	// 智能模式下 默认规则的文件
	'smart_default_rule':'./rule/default.js',
	// 默认模式下 自定义规则的文件
	'default_user_rule':'./user4.js',
	// 默认模式下 默认规则的文件
	'default_default_rule':'./default2.js',
	// 忽略第一个无意义的注释 (java中可能是版权注释)
	'ignore_first_boring_anno':false,
	// 解析后API文件输出目录
	'target_api_path':'../../lemon/public/res/api/',
	// 解析后class文件输出目录
	'target_class_path':'../../lemon/public/res/cls/',
	// 是否保留注释对应的代码
	'keep_code':true,
	// 是否在保留代码时保留已解析的注释
	'keep_code_anno':true,
	// 智能断层
	// 如果设为false 所有跟层,代码相关的设置将不再生效 parse_hierarchy ignore_hierarchy keep_code keep_code_anno smart_title
	'smart_hierarchy':true,
	// 是否保留注释中的空行
	'keep_null_string':true
};