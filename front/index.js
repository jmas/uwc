"use strict";


// Shim

if (typeof console === 'undefined') {
  window.console = console = {
    log: function() {},
    error: function() {},
    warning: function() {}
  };
}


// Requires

var Router = require('component/router');
var Emitter = require('component/emitter');

var storeService = require('./store-service.js');

var dom = require('./dom.js');

var productsPartFn = require('./parts/products.js');
var productPartFn = require('./parts/product.js');
var cartPartFn = require('./parts/cart.js');
var checkoutPartFn = require('./parts/checkout.js');


// Local vars

var pageListEl = document.getElementById('page-list');
var cartContentEl = document.getElementById('cart-content');
var pagesEls = [];
var emitter = new Emitter;
var router = new Router;


// Functions

function addPage(name, bootstrapFn) {
  if (typeof name !== 'string') {
    console.warn('name should be a string.');
    return;
  }

  var el = document.createElement('DIV');
  el.setAttribute('class', 'page-item');
  el.setAttribute('data-page', name);
  
  if (typeof bootstrapFn === 'function') {
    var partEl = bootstrapFn(el, emitter);
    
    if (typeof partEl !== 'undefined' && partEl !== null && dom.isNode(partEl)) {
      el.appendChild(partEl);
    }
  }

  pageListEl.appendChild(el);
  pagesEls.push({
    name: name,
    el: el
  });
}

function activatePage(name) {
  if (typeof name !== 'string') {
    console.warn('name should be a string.');
    return;
  }

  for (var item,i=0,len=pagesEls.length; i<len; i++) {
    item = pagesEls[i];

    if (item.name === name) {
      item.el.classList.add('active');
    } else {
      item.el.classList.remove('active');
    }
  }

  emitter.emit('page.activated', name);
}

function registerRouting() {
  document.getElementsByTagName('BODY')[0].addEventListener('click', function(event) {
    var route = typeof event.target.getAttribute !== 'undefined' ? event.target.getAttribute('data-route'): null;
    var alternateRoute = typeof event.target.getAttribute !== 'undefined' ? event.target.getAttribute('href'): null;

    if (alternateRoute === null) {
      var node = event.target.parentNode;
      var len = 0;

      while (node) {
        if (typeof node.getAttribute !== 'undefined' && node.getAttribute('href') !== null) {
          alternateRoute = node.getAttribute('href');
          break;
        }

        if (len > 10) {
          break;
        }

        node = node.parentNode;
        len++;
      }
    }

    if (route === null && alternateRoute !== null && alternateRoute.indexOf('#') === 0) {
      route = alternateRoute.substring(1);
    }

    if (route !== null) {
      console.log('dispatch location: ', route);
      router.dispatch(route);
    }
  }, false);
}

function dispatchRouting() {
  var loc = location.hash.substring(1);

  if (! loc) {
    loc = '/';
  }

  console.log('dispatch start location: ', loc);
  
  router.dispatch(loc);
}

function registerCart() {
  var el = document.createElement('DIV');
  
  if (typeof cartPartFn === 'function') {
    var partEl = cartPartFn(el, emitter);

    if (typeof partEl !== 'undefined' && partEl !== null && dom.isNode(partEl)) {
      el.appendChild(partEl);
    }
  }

  cartContentEl.appendChild(el);
}


// Bootstrap

storeService.on('error', function(msg) {
  emitter.emit('error', msg);
});

storeService.on('checkout', function() {
  router.dispatch('/checkout');
});

addPage('products', productsPartFn);
addPage('product', productPartFn);
addPage('checkout', checkoutPartFn);

registerCart();

router.get('/', function() {
  activatePage('products');
  emitter.emit('page.activated.products');
});

router.get('/product/:id', function(id) {
  activatePage('product');
  emitter.emit('page.activated.product', id);
});

router.get('/checkout', function() {
  alert('Ваш заказ принят и обрабатывается!');
});

registerRouting();
dispatchRouting();