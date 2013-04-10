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