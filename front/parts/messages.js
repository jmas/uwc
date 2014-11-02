"use strict";


// Requires

var dom = require('../dom.js');
var throttle = require('jmas/throttle');
var parallel = require('jmas/parallel');
var storeService = require('../store-service.js');


// Local vars

var partEl = document.createElement('DIV');


// Exports

module.exports = function(rootEl, emitter) {
	console.log('checkout bootstrap.');

	return partEl;
};