"use strict";


// Requires

var dom = require('../dom.js');
var throttle = require('jmas/throttle');
var parallel = require('jmas/parallel');
var request = require('visionmedia/superagent');
var productTemplate = require('../templates/product.hg');
var productViewTemplate = require('../templates/product-view.hg');
var productItemTemplate = require('../templates/product-item.hg');


// Local vars

var partEl = document.createElement('DIV');
var product = {};
var buyWithProducts = [];
var viewWithProducts = [];
var cartWithProducts = [];


// Functions

function render() {
  var productViewHtml = productViewTemplate.render(product);

  var html = productTemplate.render({
    product_view: productViewHtml
  });

  dom.replaceHtml(partEl, html);

  // Render recomends

  var buyWithListEl = document.getElementById('product-view-buy-with-list');
  var viewWithListEl = document.getElementById('product-view-view-with-list');
  var cartWithListEl = document.getElementById('product-view-cart-with-list');

  var buyWithHtml = renderList(buyWithProducts, productItemTemplate);
  var viewWithHtml = renderList(viewWithProducts, productItemTemplate);
  var cartWithHtml = renderList(cartWithProducts, productItemTemplate);

  dom.replaceHtml(buyWithListEl, buyWithHtml);
  dom.replaceHtml(viewWithListEl, viewWithHtml);
  dom.replaceHtml(cartWithListEl, cartWithHtml);



  console.log('render product.');
}

function renderList(items, itemTemplate) {
  var html = [];

  for (var i=0,len=items.length; i<len; i++) {
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
          return;
        }

        if (typeof response.body.result === 'undefined') {
          emitter.emit('error', 'Результат неизвестен.');
          return;
        }

        product = response.body.result;

        next();
      });
    },
    function(next) { // load recomends by view
      request.get('/api/product/view-with/' + id).end(function(response) {
        next();
        return;

        if (! response.ok) {
          emitter.emit('error', 'Не удалось получить данные с сервера.');
          return;
        }

        if (typeof response.body.result === 'undefined') {
          emitter.emit('error', 'Результат неизвестен.');
          return;
        }

        viewWithProducts = response.body.result;

        next();
      });
    },
    function(next) { // load recomends by cart
      request.get('/api/product/cart-with/' + id).end(function(response) {
        next();
        return;

        if (! response.ok) {
          emitter.emit('error', 'Не удалось получить данные с сервера.');
          return;
        }

        if (typeof response.body.result === 'undefined') {
          emitter.emit('error', 'Результат неизвестен.');
          return;
        }

        cartWithProducts = response.body.result;

        next();
      });
    },
    function(next) { // load recomends by buy
      request.get('/api/product/buy-with/' + id).end(function(response) {
        if (! response.ok) {
          emitter.emit('error', 'Не удалось получить данные с сервера.');
          return;
        }

        if (typeof response.body.result === 'undefined') {
          emitter.emit('error', 'Результат неизвестен.');
          return;
        }

        buyWithProducts = response.body.result;

        next();
      });
    }
  ], function() {
    render();
  });
}


// Exports

module.exports = function(rootEl, emitter) {
  console.log('product bootstrap.');

  emitter.on('page.activated.product', function(id) {
    loadProductAndRecomends(id);
    
    console.log('activated product page with id #' + id);
  });

  return partEl;
};