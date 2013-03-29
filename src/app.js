'use strict';

// 配置
var config = require('./config');
var settings = config.define();

// 规则
var rules = {
	annoRules: [],
	codeRules: [],
	unmarkHandler: null
};
function Anno() {}
var rule = require('./rule');
rule.define(settings, rules, Anno);

// 解析
var parser = require('./parser');
var res = parser(settings, rules, Anno);

// 生成API目录
var api = require('./api');
api.jsonNav(res, settings.target_api_path);
api.htmlNav(res, settings.target_api_path);

// 生成类目录
var cls = require('./cls');
cls.jsonClass(res, settings.target_class_path);
cls.htmlClass(res, settings.target_class_path);