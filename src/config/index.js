'use strict';

module.exports.define=function(){
	var log           = require('../log');
	var util          = require('../util');
	var defaultConfig = require('./default');
	var userConfig    = require('./user');

	log('config begin...');
	var settings = util.config(defaultConfig, userConfig);
	log('config end!!!\n');

	return settings;
}