"use strict";


// Requires

var request = require('visionmedia/superagent');
var Arr = require('jmas/arr');
var Emitter = require('component/emitter');

// Exports

module.exports = new Emitter({
  products: new Arr,
  cartProducts: new Arr,
  
  addProductToCart: function(productId) {
    var _this = this;

    request.post('/api/order/products/' + productId).end(function(response) {
      if (! response.ok) {
        _this.emit('error', 'Не удалось получить данные с сервера.');
        return;
      }

      if (typeof response.body.result === 'undefined') {
        _this.emit('error', 'Результат неизвестен.');
        return;
      }

      _this.loadCartProducts();
    });
  },

  loadCartProducts: function() {
    var _this = this;

    request.get('/api/order/products').end(function(response) {
      if (! response.ok) {
        _this.emit('error', 'Не удалось получить данные с сервера.');
        return;
      }

      if (typeof response.body.result === 'undefined') {
        _this.emit('error', 'Результат неизвестен.');
        return;
      }

      try {
        _this.cartProducts.remove();
        _this.cartProducts.insert(response.body.result);
      } catch (e) {
        console.error(e);
      }

      console.log('loaded cart products');
    });
  },
  
  loadProducts: function() {
    var _this = this;

    request.get('/api/product').end(function(response) {
      if (! response.ok) {
        _this.emit('error', 'Не удалось получить данные с сервера.');
        return;
      }

      if (typeof response.body.result === 'undefined') {
        _this.emit('error', 'Результат неизвестен.');
        return;
      }

      try {
        _this.products.remove();
        _this.products.insert(response.body.result);
      } catch (e) {
        console.error(e);
      }
    });
  }
});