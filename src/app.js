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

// 输出
var output = require('./export');
output(res, settings);