"use strict";


// Requires

var request = require('visionmedia/superagent');
var Arr = require('jmas/arr');
var Emitter = require('component/emitter');

// Exports

module.exports = new Emitter({
  products: new Arr,
  cartProducts: new Arr,
  
  addProductToCart: function(productId, amount) {
    var _this = this;
    amount = amount || 1;

    request.post('/api/order/products/' + productId).query({amount: amount}).end(function(response) {
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

  removeProductFromCart: function(productId) {
    var _this = this;

    request.del('/api/order/products/' + productId).end(function(response) {
      if (! response.ok) {
        _this.emit('error', 'Не удалось получить данные с сервера.');
        return;
      }

      if (typeof response.body.result === 'undefined') {
        _this.emit('error', 'Результат неизвестен.');
        return;
      }

      _this.cartProducts.remove(function(item) {
        return item.id == productId;
      });

      _this.products.update(function(item) {
        if (item.id == productId) {
          item._inCart = false;
          return item;
        }
      });

      try {
        _this.updateProductsInCart();
      } catch(e) {
        console.error(e);
      }
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
        var products = response.body.result;

        for (var i=0,len=products.length; i<len; i++) {
          products[i]._inCart = true;
        }

        _this.cartProducts.length = 0;
        _this.cartProducts.insert(products);
      } catch (e) {
        console.error(e);
      }

      _this.updateProductsInCart();

      console.log('loaded cart products');
    });
  },

  updateProductsInCart: function() {
    var products = this.products.slice(0);
    var cartProducts = this.cartProducts.slice(0);

    for (var i=0,leni=products.length; i<leni; i++) {
      for (var j=0,lenj=cartProducts.length; j<lenj; j++) {
        if (products[i].id === cartProducts[j].id) {
          products[i]._inCart = true;
          break;
        }
      }

      if (typeof products[i]._inCart === 'undefined') {
        products[i]._inCart = false;
      }
    }

    this.products.length = 0;
    this.products.insert(products);
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
        var products = response.body.result;

        _this.products.length = 0;
        _this.products.insert(products);

        _this.updateProductsInCart();
      } catch (e) {
        console.error(e);
      }
    });
  },

  checkout: function() {
    var _this = this;

    request.post('/api/order').send({ purchased: '1' }).end(function(response) {
      if (! response.ok) {
        _this.emit('error', 'Не удалось получить данные с сервера.');
        return;
      }

      if (typeof response.body.result === 'undefined') {
        _this.emit('error', 'Результат неизвестен.');
        return;
      }

      _this.emit('checkout.finished');

      try {
        _this.cartProducts.remove();
      } catch (e) {
        console.error(e);
      }
    });
  }
});