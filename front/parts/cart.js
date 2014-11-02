"use strict";


// Requires

var dom = require('../dom.js');
var storeService = require('../store-service.js');
var throttle = require('jmas/throttle');
var fmt = require('../format.js');

var cartTemplate = require('../templates/cart.hg');
var cartEmptyTemplate = require('../templates/cart-empty.hg');
var productItemTemplate = require('../templates/product-item.hg');


// Local vars

var emitter;
var partEl = document.createElement('DIV');
var cartCheckoutEl = document.getElementById('cart-checkout');
var cartCheckoutPriceEl = document.getElementById('cart-checkout-price');
var cartCheckoutBtn = document.getElementById('cart-checkout-btn');
var products = storeService.cartProducts;


// Functions

function render() {
  var items = [];

  if (products.length > 0) {
    var price = 0;

    for (var item,i=0,len=products.length; i<len; i++) {
      item = products.get(i);
      item._priceFormatted = fmt.formatCur(parseFloat(item.price), 2, 3, ' ', ',');

      items.push(productItemTemplate.render(item));

      price += item.price * item.amount;
    }

    var html = cartTemplate.render({
      products: items.join('')
    });

    cartCheckoutEl.classList.add('active');

    cartCheckoutPriceEl.innerHTML = fmt.formatCur(parseFloat(Math.ceil(price * 100) / 100), 2, 3, ' ', ',');
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
    var amount = typeof event.target.getAttribute !== 'undefined' ? event.target.getAttribute('data-amount'): null;

    if (productId !== null) {
      if (typeof event.target.hasAttribute !== 'undefined' && event.target.hasAttribute('data-cart-remove')) {
        storeService.removeProductFromCart(productId);
        emitter.emit('success', 'Товар убран из корзины');
      } else {
        storeService.addProductToCart(productId, amount);
        emitter.emit('success', 'Товар добавлен в корзину');
      }
    }
  }, false);
}

function registerCheckoutEventHandler() {
  cartCheckoutBtn.addEventListener('click', function(event) {
    storeService.checkout();

  }, false);
}


// Bootstrap

storeService.cartProducts.on('change', throttle(render));

registerCartEventHandler();

registerCheckoutEventHandler();


// Exports

module.exports = function(rootEl, _emitter) {
  console.log('cart bootstrap.');

  emitter = _emitter;

  storeService.loadCartProducts();

  emitter.on('cart.add', function(productId) {
    storeService.addProductToCart(productId);
  });

  return partEl;
};