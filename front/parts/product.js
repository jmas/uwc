"use strict";


// Requires

var dom = require('../dom.js');
var throttle = require('jmas/throttle');
var parallel = require('jmas/parallel');
var request = require('visionmedia/superagent');
var fmt = require('../format.js');

var productTemplate = require('../templates/product.hg');
var productViewTemplate = require('../templates/product-view.hg');
var productItemTemplate = require('../templates/product-item.hg');
var recomendsEmptyTemplate = require('../templates/recomends-empty.hg');


// Local vars

var partEl = document.createElement('DIV');
var product = {};
var buyWithProducts = [];
var viewWithProducts = [];
var cartWithProducts = [];
var emitter = null;


// Functions

function render() {
  var data = product;
  data.amount = 1;

  var productViewHtml = productViewTemplate.render(data);

  var html = productTemplate.render({
    product_view: productViewHtml
  });

  dom.replaceHtml(partEl, html);

  // Render recomends

  var buyWithListEl = document.getElementById('product-view-buy-with-list');
  var viewWithListEl = document.getElementById('product-view-view-with-list');
  var cartWithListEl = document.getElementById('product-view-cart-with-list');

  if (buyWithProducts.length > 0) {
    var buyWithHtml = renderList(buyWithProducts, productItemTemplate);
  } else {
    var buyWithHtml = recomendsEmptyTemplate.render();
  }

  if (viewWithProducts.length > 0) {
    var viewWithHtml = renderList(viewWithProducts, productItemTemplate);
  } else {
    var viewWithHtml = recomendsEmptyTemplate.render();
  }

  if (cartWithProducts.length > 0) {
    var cartWithHtml = renderList(cartWithProducts, productItemTemplate);
  } else {
    var cartWithHtml = recomendsEmptyTemplate.render();
  }

  dom.replaceHtml(buyWithListEl, buyWithHtml);
  dom.replaceHtml(viewWithListEl, viewWithHtml);
  dom.replaceHtml(cartWithListEl, cartWithHtml);

  // Register amount handler

  var amountEl = document.getElementById('product-view-amount');
  var cartBtn = document.getElementById('product-view-cart-btn');

  amountEl.addEventListener('change', function() {
    cartBtn.setAttribute('data-amount', this.value);
  }, false);

  console.log('render product.');
}

function renderList(items, itemTemplate) {
  var html = [];

  for (var item,i=0,len=items.length; i<len; i++) {
    item = items[i];
    
    item._priceFormatted = fmt.formatCur(parseFloat(item.price), 2, 3, ' ', ',');

    html.push(itemTemplate.render(items[i]));
  }

  return html.join('');
}

function loadProductAndRecomends(id) {
  parallel([
    function(next) { // load product
      request.get('/api/product/' + id).end(function(response) {
        if (! response.ok) {
          emitter.emit('error', 'Не удалось получить данные с сервера.');
          next();
          return;
        }

        if (typeof response.body.result !== 'undefined') {
          product = response.body.result;
        } else {
          product = {};
        }

        next();

        console.log('loadProducts - product.');
      });
    },
    function(next) { // load recomends by view
      request.get('/api/product/view-with/' + id).end(function(response) {
        if (! response.ok) {
          emitter.emit('error', 'Не удалось получить данные с сервера.');
          next();
          return;
        }

        if (typeof response.body.result !== 'undefined') {
          viewWithProducts = response.body.result;
        } else {
          viewWithProducts = [];
        }

        next();

        console.log('loadProducts - view-with.');
      });
    },
    function(next) { // load recomends by cart
      request.get('/api/product/cart-with/' + id).end(function(response) {
        if (! response.ok) {
          emitter.emit('error', 'Не удалось получить данные с сервера.');
          next();
          return;
        }

        if (typeof response.body.result !== 'undefined') {
          cartWithProducts = response.body.result;
        } else {
          cartWithProducts = [];
        }

        next();

        console.log('loadProducts - cart-with.');
      });
    },
    function(next) { // load recomends by buy
      request.get('/api/product/buy-with/' + id).end(function(response) {
        if (! response.ok) {
          emitter.emit('error', 'Не удалось получить данные с сервера.');
          next();
          return;
        }

        if (typeof response.body.result !== 'undefined') {
          buyWithProducts = response.body.result;
        } else {
          buyWithProducts = [];
        }

        next();
        console.log('loadProducts - buy-with.');
      });
    }
  ], throttle(render));
}


// Exports

module.exports = function(rootEl, _emitter) {
  console.log('product bootstrap.');

  emitter = _emitter;

  emitter.on('page.activated.product', function(id) {
    loadProductAndRecomends(id);
    
    console.log('activated product page with id #' + id);
  });

  return partEl;
};