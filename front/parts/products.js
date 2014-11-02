"use strict";


// Requires

var dom = require('../dom.js');
var storeService = require('../store-service.js');
var throttle = require('jmas/throttle');

var productsTemplate = require('../templates/products.hg');
var productItemTemplate = require('../templates/product-item.hg');


// Local vars

var partEl = document.createElement('DIV');
var products = storeService.products;


// Functions

function render() {
	var items = [];

	for (var i=0,len=products.length; i<len; i++) {
		items.push(productItemTemplate.render(products.get(i)));
	}

	var html = productsTemplate.render({
		products: items.join('')
	});

	dom.replaceHtml(partEl, html);

	console.log('render products');
}


// Bootstrap

products.on('change', throttle(render));


// Exports

module.exports = function(rootEl, emitter) {
	console.log('products bootstrap.');

	emitter.on('page.activated.products', function(name) {
		storeService.loadProducts();

		console.log('activated products page');
	});

	return partEl;
};