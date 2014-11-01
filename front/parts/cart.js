"use strict";


// Requires

var dom = require('../dom.js');
var storeService = require('../store-service.js');

var cartTemplate = require('../templates/cart.hg');
var cartEmptyTemplate = require('../templates/cart-empty.hg');
var productItemTemplate = require('../templates/product-item.hg');


// Local vars

var partEl = document.createElement('DIV');
var cartCheckoutPriceEl = document.getElementById('cart-checkout-price');
var products = storeService.cartProducts;


// Functions

function render() {
  var items = [];

  for (var i=0,len=products.length; i<len; i++) {
    items.push(productItemTemplate.render(products.get(i)));
  }

  var html = cartTemplate.render({
    products: items.join('')
  });

  dom.replaceHtml(pageEl, html);
}

function registerCartEventHandler() {
  document.getElementsByTagName('BODY')[0].addEventListener('click', function(event) {
    var productId = typeof event.target.getAttribute !== 'undefined' ? event.target.getAttribute('data-cart'): null;

    if (productId !== null) {
      storeService.addProductToCart(productId);
    }
  }, false);
}


// Bootstrap

storeService.cartProducts.on('change', render);

registerCartEventHandler();


// Exports

module.exports = function(rootEl, emitter) {
  console.log('cart bootstrap.');

  rootEl.appendChild(partEl);

  storeService.loadCartProducts();

  emitter.on('cart.add', function(productId) {
    storeService.addProductToCart(productId);
  });
};