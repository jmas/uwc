"use strict";


// Requires

var dom = require('../dom.js');
var storeService = require('../store-service.js');
var throttle = require('jmas/throttle');

var cartTemplate = require('../templates/cart.hg');
var cartEmptyTemplate = require('../templates/cart-empty.hg');
var productItemTemplate = require('../templates/product-item.hg');


// Local vars

var partEl = document.createElement('DIV');
var cartCheckoutEl = document.getElementById('cart-checkout');
var cartCheckoutPriceEl = document.getElementById('cart-checkout-price');
var products = storeService.cartProducts;


// Functions

function render() {
  var items = [];

  if (products.length > 0) {
    var price = 0;

    for (var item,i=0,len=products.length; i<len; i++) {
      item = products.get(i);

      items.push(productItemTemplate.render(item));

      price += item.price * item.amount;
    }

    var html = cartTemplate.render({
      products: items.join('')
    });

    cartCheckoutEl.classList.add('active');

    cartCheckoutPriceEl.innerHTML = Math.ceil(price * 100) / 100;
  } else {
    cartCheckoutEl.classList.remove('active');
    html = cartEmptyTemplate.render();
  }

  dom.replaceHtml(partEl, html);

  console.log('render cart');
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

storeService.cartProducts.on('change', throttle(render));

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