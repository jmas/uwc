"use strict";


// Shim

if (typeof console === 'undefined') {
  window.console = console = {
    log: function() {},
    error: function() {}
  };
}


// Requires

var Router = require('component/router');
var Emitter = require('component/emitter');

var productsPageFn = require('./pages/products.js');
var productPageFn = require('./pages/product.js');


// Local varibles

var pagesEl = document.getElementById('page-list');
var pagesEls = [];
var emitter = new Emitter;
var router = new Router;


// Functions

function addPage(name, bootstrapFn) {
  var el = document.createElement('DIV');
  el.setAttribute('class', 'page-item');
  if (typeof bootstrapFn === 'function') {
    bootstrapFn(el, emitter);
  }
  pagesEl.appendChild(el);
  pagesEls.push({
    name: name,
    el: el
  });
}

function activatePage(name) {
  if (typeof pagesEls[name] === 'undefined') {
    return;
  }

  for (var item,i=0,len=pagesEls.length; i<len; i++) {
    item = pagesEls[i];

    if (item.name === name) {
      pagesEls[i].el.classList.add('active');
    } else {
      pagesEls[i].el.classList.remove('active');
    }
  }

  emitter.emit('page.activated', name);
}

function registerRouting() {
  router.get('/', function() {
      activatePage('products');
      emitter.emit('page.activated.products');
    });

  router.get('/product/:id', function(id) {
      activatePage('product');
      emitter.emit('page.activated.product', id);
    });

  document.getElementsByTagName('BODY')[0].addEventListener('click', function(event) {
    var route = event.target.getAttribute('data-route');

    if (route !== null) {
      event.preventDefault();
      event.stopPropagation();

      router.dispatch(route);
    }
  }, false);
}

function dispatchRouting() {
  var loc = location.hash.substring(1);

  if (! loc) {
    loc = '/';
  }
  
  console.log('dispatch location: ' + loc);
  
  router.dispatch(loc);
}


// Bootstrap

addPage('products', productsPageFn);
addPage('product', productPageFn);

registerRouting();
dispatchRouting();