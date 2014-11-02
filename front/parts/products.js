"use strict";


// Requires

var dom = require('../dom.js');
var storeService = require('../store-service.js');
var throttle = require('jmas/throttle');
var fmt = require('../format.js');

var productsTemplate = require('../templates/products.hg');
var productItemTemplate = require('../templates/product-item.hg');


// Local vars

var partEl = document.createElement('DIV');
var products = storeService.products;


// Functions

function render() {
	var items = [];

	for (var item,i=0,len=products.length; i<len; i++) {
		item = products.get(i);
		
		item._priceFormatted = fmt.formatCur(parseFloat(item.price), 2, 3, ' ', ',');

		items.push(productItemTemplate.render(item));
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