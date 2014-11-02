"use strict";


// Requires

var dom = require('../dom.js');

var checkoutTemplate = require('../templates/checkout.hg');


// Local vars

var partEl = document.createElement('DIV');


// Bootstrap
var checkoutHtml = checkoutTemplate.render();
dom.replaceHtml(partEl, checkoutHtml);


// Exports

module.exports = function(rootEl, emitter) {
  console.log('checkout bootstrap.');

  return partEl;
};