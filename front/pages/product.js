"use strict";

module.exports = function(rootEl, emitter) {
	console.log('product bootstrap.');
	
	emitter.on('page.activated.product', function(id) {
		console.log('activated product page with id #' + id);
	});
};