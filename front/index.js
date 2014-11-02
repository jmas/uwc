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
var Arr = require('jmas/arr');

var storeService = require('./store-service.js');

var dom = require('./dom.js');
var notifyTemplate = require('./templates/notify.hg');

var productsPartFn = require('./parts/products.js');
var productPartFn = require('./parts/product.js');
var cartPartFn = require('./parts/cart.js');
var checkoutPartFn = require('./parts/checkout.js');
var messagesPartFn = require('./parts/messages.js');


// Local vars

var pageListEl = document.getElementById('page-list');
var cartContentEl = document.getElementById('cart-content');
var notifyEl = document.getElementById('notify');
var pagesEls = [];
var emitter = new Emitter;
var router = new Router;
var notifies = new Arr;


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
  var prevLoc = null;
  var loc;

  function pingLocation() {
    loc = location.hash.substring(1);

    if (loc !== prevLoc) {
      router.dispatch(loc);
      prevLoc = loc;
      dom.scrollTo(document.body, 0, 5000);
    }

    setTimeout(pingLocation, 10);
  }

  pingLocation();
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

function registerMessages() {
  var el = document.createElement('DIV');
  
  if (typeof cartPartFn === 'function') {
    var partEl = messagesPartFn(el, emitter);

    if (typeof partEl !== 'undefined' && partEl !== null && dom.isNode(partEl)) {
      el.appendChild(partEl);
    }
  }

  cartContentEl.appendChild(el);
}

function showNotify(type, message) {
  type = type || '';

  notifies.push({
    type: type,
    message: message
  });

  setTimeout(function() {
    notifies.splice(0, 1);
  }, 5000);
}

function renderNotify() {
  var html = notifyTemplate.render({
    notifies: notifies.slice(0)
  });

  dom.replaceHtml(notifyEl, html);
}


// Bootstrap

notifies.on('change', renderNotify);

emitter.on('error', function(msg) {
  showNotify('error', msg);
});

emitter.on('info', function(msg) {
  showNotify('info', msg);
});

emitter.on('success', function(msg) {
  showNotify('success', msg);
});

storeService.on('error', function(msg) {
  emitter.emit('error', msg);
});

storeService.on('checkout.finished', function() {
  location.href = '#/checkout-prompt';
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

router.get('/checkout-prompt', function() {
  activatePage('checkout');
});

registerRouting();