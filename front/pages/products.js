"use strict";

module.exports = function(rootEl, emitter) {
	console.log('products bootstrap.');

	emitter.on('page.activated.products', function(name) {
		console.log('activated products page');
	});
};