"use strict";


// Requires

var dom = require('../dom.js');
var throttle = require('jmas/throttle');
var parallel = require('jmas/parallel');
var request = require('visionmedia/superagent');


// Local vars

var partEl = document.createElement('DIV');
var product = {};


// Functions

function render() {
  
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

          
      });
    },
    function(next) { // load recomends by view

    },
    function(next) { // load recomends by cart

    },
    function(next) { // load recomends by buy

    }
  ], function() {

  });
}


// Exports

module.exports = function(rootEl, emitter) {
  console.log('product bootstrap.');

  emitter.on('page.activated.product', function(id) {
    // console.log('activated product page with id #' + id);
  });

  return partEl;
};