(function outer(modules, cache, entries){

  /**
   * Global
   */

  var global = (function(){ return this; })();

  /**
   * Require `name`.
   *
   * @param {String} name
   * @param {Boolean} jumped
   * @api public
   */

  function require(name, jumped){
    if (cache[name]) return cache[name].exports;
    if (modules[name]) return call(name, require);
    throw new Error('cannot find module "' + name + '"');
  }

  /**
   * Call module `id` and cache it.
   *
   * @param {Number} id
   * @param {Function} require
   * @return {Function}
   * @api private
   */

  function call(id, require){
    var m = cache[id] = { exports: {} };
    var mod = modules[id];
    var name = mod[2];
    var fn = mod[0];

    fn.call(m.exports, function(req){
      var dep = modules[id][1][req];
      return require(dep ? dep : req);
    }, m, m.exports, outer, modules, cache, entries);

    // expose as `name`.
    if (name) cache[name] = cache[id];

    return cache[id].exports;
  }

  /**
   * Require all entries exposing them on global if needed.
   */

  for (var id in entries) {
    if (entries[id]) {
      global[entries[id]] = require(id);
    } else {
      require(id);
    }
  }

  /**
   * Duo flag.
   */

  require.duo = true;

  /**
   * Expose cache.
   */

  require.cache = cache;

  /**
   * Expose modules
   */

  require.modules = modules;

  /**
   * Return newest require.
   */

   return require;
})({
1: [function(require, module, exports) {
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

router.get('/checkout-prompt', function() {
  activatePage('checkout');
});

registerRouting();
}, {"component/router":2,"component/emitter":3,"./store-service.js":4,"./dom.js":5,"./parts/products.js":6,"./parts/product.js":7,"./parts/cart.js":8,"./parts/checkout.js":9}],
2: [function(require, module, exports) {

/**
 * Module dependencies.
 */

try {
  var Route = require('route-component');
} catch (err) {
  var Route = require('route');
}

/**
 * Expose `Router`.
 */

module.exports = Router;

/**
 * Initialize a new Router.
 *
 * @api public
 */

function Router() {
  this.routes = [];
}

/**
 * Create route `path` with optional `before`
 * and `after` callbacks. If you omit these
 * they may be added later with the `Route` returned.
 *
 *   router.get('/user/:id', showUser, hideUser);
 *
 *   router.get('/user/:id')
 *     .before(showUser)
 *     .after(hideUser)
 *
 * @param {String} path
 * @param {Function} before
 * @param {Function} after
 * @return {Route}
 * @api public
 */

Router.prototype.get = function(path, before, after){
  var route = new Route(path);
  this.routes.push(route);
  if (before) route.before(before);
  if (after) route.after(after);
  return route;
};

/**
 * Dispatch the given `path`, matching routes
 * sequentially.
 *
 * @param {String} path
 * @api public
 */

Router.prototype.dispatch = function(path){
  var ret;
  this.teardown();
  for (var i = 0; i < this.routes.length; i++) {
    var route = this.routes[i];
    if (ret = route.match(path)) {
      this.route = route;
      this.args = ret.args;
      route.call('before', ret.args);
      break;
    }
  }
};

/**
 * Invoke teardown callbacks of previous route.
 *
 * @api private
 */

Router.prototype.teardown = function(){
  var route = this.route;
  if (!route) return;
  route.call('after', this.args);
};

}, {"route":10}],
10: [function(require, module, exports) {

/**
 * Module dependencies.
 */

var toRegexp = require('path-to-regexp');

/**
 * Expose `Route`.
 */

module.exports = Route;

/**
 * Initialize a route with the given `path`.
 *
 * @param {String|Regexp} path
 * @return {Type}
 * @api public
 */

function Route(path) {
  this.path = path;
  this.keys = [];
  this.regexp = toRegexp(path, this.keys);
  this._before = [];
  this._after = [];
}

/**
 * Add before `fn`.
 *
 * @param {Function} fn
 * @return {Route} self
 * @api public
 */

Route.prototype.before = function(fn){
  this._before.push(fn);
  return this;
};

/**
 * Add after `fn`.
 *
 * @param {Function} fn
 * @return {Route} self
 * @api public
 */

Route.prototype.after = function(fn){
  this._after.push(fn);
  return this;
};

/**
 * Invoke callbacks for `type` with `args`.
 *
 * @param {String} type
 * @param {Array} args
 * @api public
 */

Route.prototype.call = function(type, args){
  args = args || [];
  var fns = this['_' + type];
  if (!fns) throw new Error('invalid type');
  for (var i = 0; i < fns.length; i++) {
    fns[i].apply(null, args);
  }
};

/**
 * Check if `path` matches this route,
 * returning `false` or an object.
 *
 * @param {String} path
 * @return {Object}
 * @api public
 */

Route.prototype.match = function(path){
  var keys = this.keys;
  var qsIndex = path.indexOf('?');
  var pathname = ~qsIndex ? path.slice(0, qsIndex) : path;
  var m = this.regexp.exec(pathname);
  var params = [];
  var args = [];

  if (!m) return false;

  for (var i = 1, len = m.length; i < len; ++i) {
    var key = keys[i - 1];

    var val = 'string' == typeof m[i]
      ? decodeURIComponent(m[i])
      : m[i];

    if (key) {
      params[key.name] = undefined !== params[key.name]
        ? params[key.name]
        : val;
    } else {
      params.push(val);
    }

    args.push(val);
  }

  params.args = args;
  return params;
};

}, {"path-to-regexp":11}],
11: [function(require, module, exports) {
/**
 * Expose `pathtoRegexp`.
 */
module.exports = pathtoRegexp;
console.log("DEPRECATED use https://github.com/pillarjs/path-to-regexp");

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
  // Match already escaped characters that would otherwise incorrectly appear
  // in future matches. This allows the user to escape special characters that
  // shouldn't be transformed.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?"]
  // "/route(\\d+)" => [undefined, undefined, undefined, "\d+", undefined]
  '([\\/.])?(?:\\:(\\w+)(?:\\(((?:\\\\.|[^)])*)\\))?|\\(((?:\\\\.|[^)])*)\\))([+*?])?',
  // Match regexp special characters that should always be escaped.
  '([.+*?=^!:${}()[\\]|\\/])'
].join('|'), 'g');

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {String} group
 * @return {String}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$\/()])/g, '\\$1');
}

/**
 * Attach the keys as a property of the regexp.
 *
 * @param  {RegExp} re
 * @param  {Array}  keys
 * @return {RegExp}
 */
var attachKeys = function (re, keys) {
  re.keys = keys;

  return re;
};

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array should be passed in, which will contain the placeholder key
 * names. For example `/user/:id` will then contain `["id"]`.
 *
 * @param  {(String|RegExp|Array)} path
 * @param  {Array}                 keys
 * @param  {Object}                options
 * @return {RegExp}
 */
function pathtoRegexp (path, keys, options) {
  if (keys && !Array.isArray(keys)) {
    options = keys;
    keys = null;
  }

  keys = keys || [];
  options = options || {};

  var strict = options.strict;
  var end = options.end !== false;
  var flags = options.sensitive ? '' : 'i';
  var index = 0;

  if (path instanceof RegExp) {
    // Match all capturing groups of a regexp.
    var groups = path.source.match(/\((?!\?)/g) || [];

    // Map all the matches to their numeric keys and push into the keys.
    keys.push.apply(keys, groups.map(function (match, index) {
      return {
        name:      index,
        delimiter: null,
        optional:  false,
        repeat:    false
      };
    }));

    // Return the source back to the user.
    return attachKeys(path, keys);
  }

  if (Array.isArray(path)) {
    // Map array parts into regexps and return their source. We also pass
    // the same keys and options instance into every generation to get
    // consistent matching groups before we join the sources together.
    path = path.map(function (value) {
      return pathtoRegexp(value, keys, options).source;
    });

    // Generate a new regexp instance by joining all the parts together.
    return attachKeys(new RegExp('(?:' + path.join('|') + ')', flags), keys);
  }

  // Alter the path string into a usable regexp.
  path = path.replace(PATH_REGEXP, function (match, escaped, prefix, key, capture, group, suffix, escape) {
    // Avoiding re-escaping escaped characters.
    if (escaped) {
      return escaped;
    }

    // Escape regexp special characters.
    if (escape) {
      return '\\' + escape;
    }

    var repeat   = suffix === '+' || suffix === '*';
    var optional = suffix === '?' || suffix === '*';

    keys.push({
      name:      key || index++,
      delimiter: prefix || '/',
      optional:  optional,
      repeat:    repeat
    });

    // Escape the prefix character.
    prefix = prefix ? '\\' + prefix : '';

    // Match using the custom capturing group, or fallback to capturing
    // everything up to the next slash (or next period if the param was
    // prefixed with a period).
    capture = escapeGroup(capture || group || '[^' + (prefix || '\\/') + ']+?');

    // Allow parameters to be repeated more than once.
    if (repeat) {
      capture = capture + '(?:' + prefix + capture + ')*';
    }

    // Allow a parameter to be optional.
    if (optional) {
      return '(?:' + prefix + '(' + capture + '))?';
    }

    // Basic parameter support.
    return prefix + '(' + capture + ')';
  });

  // Check whether the path ends in a slash as it alters some match behaviour.
  var endsWithSlash = path[path.length - 1] === '/';

  // In non-strict mode we allow an optional trailing slash in the match. If
  // the path to match already ended with a slash, we need to remove it for
  // consistency. The slash is only valid at the very end of a path match, not
  // anywhere in the middle. This is important for non-ending mode, otherwise
  // "/test/" will match "/test//route".
  if (!strict) {
    path = (endsWithSlash ? path.slice(0, -2) : path) + '(?:\\/(?=$))?';
  }

  // In non-ending mode, we need prompt the capturing groups to match as much
  // as possible by using a positive lookahead for the end or next path segment.
  if (!end) {
    path += strict && endsWithSlash ? '' : '(?=\\/|$)';
  }

  return attachKeys(new RegExp('^' + path + (end ? '$' : ''), flags), keys);
};

}, {}],
3: [function(require, module, exports) {

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

}, {}],
4: [function(require, module, exports) {
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
        _this.cartProducts.length = 0;
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
        _this.products.length = 0;
        _this.products.insert(response.body.result);
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
}, {"visionmedia/superagent":12,"jmas/arr":13,"component/emitter":3}],
12: [function(require, module, exports) {
/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var reduce = require('reduce');

/**
 * Root reference for iframes.
 */

var root = 'undefined' == typeof window
  ? this
  : window;

/**
 * Noop.
 */

function noop(){};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * TODO: future proof, move to compoent land
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isHost(obj) {
  var str = {}.toString.call(obj);

  switch (str) {
    case '[object File]':
    case '[object Blob]':
    case '[object FormData]':
      return true;
    default:
      return false;
  }
}

/**
 * Determine XHR.
 */

function getXHR() {
  if (root.XMLHttpRequest
    && ('file:' != root.location.protocol || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
}

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return obj === Object(obj);
}

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    if (null != obj[key]) {
      pairs.push(encodeURIComponent(key)
        + '=' + encodeURIComponent(obj[key]));
    }
  }
  return pairs.join('&');
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var parts;
  var pair;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    parts = pair.split('=');
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  this.text = this.xhr.responseText;
  this.setStatusProperties(this.xhr.status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this.setHeaderProperties(this.header);
  this.body = this.req.method != 'HEAD'
    ? this.parseBody(this.text)
    : null;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

Response.prototype.setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype.parseBody = function(str){
  var parse = request.parse[this.type];
  return parse && str && str.length
    ? parse(str)
    : null;
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

Response.prototype.setStatusProperties = function(status){
  var type = status / 100 | 0;

  // status / class
  this.status = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status || 1223 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  Emitter.call(this);
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {};
  this._header = {};
  this.on('end', function(){
    try {
      var res = new Response(self);
      if ('HEAD' == method) res.text = null;
      self.callback(null, res);
    } catch(e) {
      var err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
      self.callback(err);
    }
  });
}

/**
 * Mixin `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Allow for extension
 */

Request.prototype.use = function(fn) {
  fn(this);
  return this;
}

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.timeout = function(ms){
  this._timeout = ms;
  return this;
};

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.clearTimeout = function(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */

Request.prototype.abort = function(){
  if (this.aborted) return;
  this.aborted = true;
  this.xhr.abort();
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Set header `field` to `val`, or multiple fields with one object.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Remove header `field`.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Get case-insensitive header `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api private
 */

Request.prototype.getHeader = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass){
  var str = btoa(user + ':' + pass);
  this.set('Authorization', 'Basic ' + str);
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Write the field `name` and `val` for "multipart/form-data"
 * request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 * ```
 *
 * @param {String} name
 * @param {String|Blob|File} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.field = function(name, val){
  if (!this._formData) this._formData = new FormData();
  this._formData.append(name, val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `filename`.
 *
 * ``` js
 * request.post('/upload')
 *   .attach(new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String} filename
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, filename){
  if (!this._formData) this._formData = new FormData();
  this._formData.append(field, file, filename);
  return this;
};

/**
 * Send `data`, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // querystring
 *       request.get('/search')
 *         .end(callback)
 *
 *       // multiple data "writes"
 *       request.get('/search')
 *         .send({ search: 'query' })
 *         .send({ range: '1..5' })
 *         .send({ order: 'desc' })
 *         .end(callback)
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"})
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
  *      request.post('/user')
  *        .send('name=tobi')
  *        .send('species=ferret')
  *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.send = function(data){
  var obj = isObject(data);
  var type = this.getHeader('Content-Type');

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    if (!type) this.type('form');
    type = this.getHeader('Content-Type');
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj) return this;
  if (!type) this.type('json');
  return this;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  if (2 == fn.length) return fn(err, res);
  if (err) return this.emit('error', err);
  fn(res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');
  err.crossDomain = true;
  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype.timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

Request.prototype.withCredentials = function(){
  this._withCredentials = true;
  return this;
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = getXHR();
  var query = this._query.join('&');
  var timeout = this._timeout;
  var data = this._formData || this._data;

  // store callback
  this._callback = fn || noop;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;
    if (0 == xhr.status) {
      if (self.aborted) return self.timeoutError();
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  if (xhr.upload) {
    xhr.upload.onprogress = function(e){
      e.percent = e.loaded / e.total * 100;
      self.emit('progress', e);
    };
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.abort();
    }, timeout);
  }

  // querystring
  if (query) {
    query = request.serializeObject(query);
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }

  // initiate request
  xhr.open(this.method, this.url, true);

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
    // serialize stuff
    var serialize = request.serialize[this.getHeader('Content-Type')];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  // send stuff
  this.emit('request', this);
  xhr.send(data);
  return this;
};

/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(method, url) {
  // callback
  if ('function' == typeof url) {
    return new Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new Request('GET', method);
  }

  return new Request(method, url);
}

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.del = function(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * Expose `request`.
 */

module.exports = request;

}, {"emitter":3,"reduce":14}],
14: [function(require, module, exports) {

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  
  return curr;
};
}, {}],
13: [function(require, module, exports) {
(function(rootScope) {
  
  // original Array methods
  var
    arrayPop = Array.prototype.pop,
    arrayPush = Array.prototype.push,
    arrayReverse = Array.prototype.reverse,
    arrayShift = Array.prototype.shift,
    arraySort = Array.prototype.sort,
    arraySplice = Array.prototype.splice,
    arrayUnshift = Array.prototype.unshift;
  
  /**
   * Constructor.
   */
  function Arr() {
    var instance = this;
    
    if (! instance instanceof Arr) {
      instance = new Arr();
    }
        
    if (arguments.length === 1 && typeof arguments[0] === 'number' && arguments[0] % 1 === 0) {
      arrayPush.apply(instance, new Array(arguments[0]));
    } else {
      arrayPush.apply(instance, arguments);
    }
    
    instance.events = {};
    
    return instance;
  };
  
  // Attach prototype
  Arr.prototype = [];
  
  /**
   * Attached events.
   */
  Arr.prototype.events = {};
   
  /**
   * Get value by index.
   */
  Arr.prototype.get = function(index, defaultValue) {
    return typeof this[index] === 'undefined' ? defaultValue: this[index];
  };
   
  /**
   * Attach event handler.
   */
  Arr.prototype.on = function(eventName, handler) {
    if (typeof this.events[eventName] === 'undefined') {
      this.events[eventName] = [];
    }

    this.events[eventName].push(handler);

    return this;
  };
   
  /**
   * Trigger event.
   */
  Arr.prototype.trigger = function(eventName, args) {
    args = args || [];

    if (eventName instanceof Array) {
      for (var k=0, klen=eventName.length; k<klen; k++) {
        if (typeof this.events[eventName[k]] === 'undefined') {
          continue;
        }
       
        for (var i=0,len=this.events[eventName[k]].length; i<len; i++) {
          this.events[eventName[k]][i].apply(this, [args]);
        }
      }
    } else {
      for (var i=0,len=this.events[eventName].length; i<len; i++) {
        this.events[eventName][i].apply(this, [args]);
      }
    }

    return this;
  };
   
  /**
   * Update items by handler.
   */
  Arr.prototype.update = function(handler) {
    if (! handler instanceof Function) {
      throw new Error('handler should be an Function');
    }
    
    var oldValue, newValue, i, result = [];
   
    for (i=0,len=this.length; i<len; i++) {
      oldValue = this[i];
      newValue = handler.apply(this, [oldValue, i]);
      
      if (typeof newValue !== 'undefined') {
        this[i] = newValue;
        result.push(newValue);
      }
    }
   
    if (result.length > 0) {
      if (typeof this.events.change !== 'undefined' || typeof this.events.update !== 'undefined') {
        this.trigger(['change', 'update'], {
          type: 'update',
          items: result
        });
      }
    }
   
    return this;
  };
  
  /**
   * Insert array of items.
   */
  Arr.prototype.insert = function(items) {
    if (! items instanceof Array) {
      throw new Error('items should be an Array');
    }
    
    arrayPush.apply(this, items);

    if (typeof this.events.change !== 'undefined' || typeof this.events.insert !== 'undefined') {
      this.trigger(['change', 'insert'], {
        type: 'insert',
        items: items
      });
    }

    return this;
  };
  
  /**
   * Remove items by handler.
   */
  Arr.prototype.remove = function(handler) {
    if (typeof handler === 'undefined') { // drop all items
      if (this.length > 0) {
        this.splice(0, this.length);
      }
      
      return this;
    }
    
    if (! handler instanceof Function) {
      throw new Error('handler should be an Function');
    }
    
    var result = [], stay = [], i;

    for (i=0, len=this.length; i<len; i++) {
      isRemove = handler.apply(this, [this[i], i]);
      
      if (isRemove === true) {
        result.push(this[i]);
      } else {
        stay.push(this[i]);
      }
    }

    arraySplice.apply(this, [0, this.length]);
    arrayPush.apply(this, stay);

    if (result.length > 0) {
      if (typeof this.events.change !== 'undefined' || typeof this.events.remove !== 'undefined') {
        this.trigger(['change', 'remove'], {
          type: 'remove',
          items: result
        });
      }
    }
   
    return this;
  };
  
  /**
   * Set value by index.
   */
  Arr.prototype.set = function(index, value) {
    if (! index instanceof Number) {
      throw new Error('index should be an Number');
    }
    
    this[index] = value;

    if (typeof this.events.change !== 'undefined' || typeof this.events.update !== 'undefined') {
      this.trigger(['change', 'update'], {
        type: 'update',
        items: [this[index]]
      });
    }

    return this;
  };
   
  /**
   * Removes the last element from an array and returns that element.
   */
  Arr.prototype.pop = function() {
    var result = arrayPop.apply(this, arguments);

    if (typeof this.events.change !== 'undefined' || typeof this.events.remove !== 'undefined' ) {
      this.trigger(['change', 'remove'], {
        type: 'remove',
        items: [result]
      });
    }

    return result;
  };
   
  /**
   * Adds one or more elements to the end of an array and returns the new length of the array.
   */
  Arr.prototype.push = function() {
    var result = arrayPush.apply(this, arguments);

    if (typeof this.events.change !== 'undefined' || typeof this.events.insert !== 'undefined' ) {
      this.trigger(['change', 'insert'], {
        type: 'insert',
        items: Array.prototype.slice.call(arguments, 0)
      });
    }

    return result;
  };
   
  /**
   * Reverses the order of the elements of an array — the first becomes the last, and the last becomes the first.
   */
  Arr.prototype.reverse = function() {
    var result = arrayReverse.apply(this, arguments);

    if (typeof this.events.change !== 'undefined' || typeof this.events.update !== 'undefined' ) {
      this.trigger(['change', 'update'], {
        type: 'update',
        items: Array.prototype.slice.call(result, 0)
      });
    }

    return result;
  };
   
  /**
   * Removes the first element from an array and returns that element.
   */
  Arr.prototype.shift = function() {
    var result = arrayShift.apply(this, arguments);

    if (typeof this.events.change !== 'undefined' || typeof this.events.remove !== 'undefined' ) {
      this.trigger(['change', 'remove'], {
        type: 'remove',
        items: [result]
      });
    }

    return result;
  };
   
  /**
   * Sorts the elements of an array in place and returns the array.
   */
  Arr.prototype.sort = function() {
    var result = arraySort.apply(this, arguments);

    if (typeof this.events.change !== 'undefined' || typeof this.events.update !== 'undefined' ) {
      this.trigger(['change', 'update'], {
        type: 'update',
        items: Array.prototype.slice.call(result, 0)
      });
    }

    return result;
  };
   
  /**
   * Adds and/or removes elements from an array.
   */
  Arr.prototype.splice = function() {
    var result = arraySplice.apply(this, arguments);

    if (result.length > 0) {
      if (typeof this.events.change !== 'undefined' || typeof this.events.remove !== 'undefined' ) {
        this.trigger(['change', 'remove'], {
          type: 'remove',
          items: Array.prototype.slice.call(result, 0)
        });
      }
    }

    if (arguments.length > 2) {
      if (typeof this.events.change !== 'undefined' || typeof this.events.insert !== 'undefined' ) {
        this.trigger(['change', 'insert'], {
          type: 'insert',
          items: Array.prototype.slice.call(arguments, 2)
        });
      }
    }

    return result;
  };
   
  /**
   * Adds one or more elements to the front of an array and returns the new length of the array.
   */
  Arr.prototype.unshift = function() {
    var result = arrayUnshift.apply(this, arguments);

    if (typeof this.events.change !== 'undefined' || typeof this.events.insert !== 'undefined' ) {
      this.trigger(['change', 'insert'], {
        type: 'insert',
        items: [result]
      });
    }

    return result;
  };
  
  // exports

  if (typeof module !== 'undefined') {
    module.exports = Arr;
  } else {
    rootScope.Arr = Arr;
  }
})(this);

}, {}],
5: [function(require, module, exports) {
"use strict";


module.exports = {
  removeChildNodes: function(node) {
    if (! this.isNode(node)) {
      console.warn('node is wrong.');
      return;
    }

    while (node.firstChild) {
      node.removeChild(node.firstChild);  
    }
  },
  replaceHtml: function(node, html) {
    this.removeChildNodes(node);
    this.html(node, html);
  },
  appendHtml: function(node, html) {
    this.html(node, html, 'beforeend');
  },
  html: function(node, html, pos) {
    pos = pos || 'beforeend';

    if (! html instanceof String) {
      console.warn('html is not string.');
      return;
    }

    if (! node) {
      console.warn('node is wrong.');
      return;
    }

    node.insertAdjacentHTML(pos, html);
  },
  isNode: function(obj) {
    return (
      typeof Node === "object" ? obj instanceof Node : 
      obj && typeof obj === "object" && typeof obj.nodeType === "number" && typeof obj.nodeName==="string"
    );
  },
  scrollTo: function(el, to, duration) {
    // duration = duration || 100;

    // var difference = to - el.scrollTop;
    // var perTick = difference / duration * 10;

    // setTimeout(function() {
      el.scrollTop = to;
    //   if (el.scrollTop <= to) return;
    //   scrollTo(el, to, duration - 10);
    // }, 10);
  }
};
}, {}],
6: [function(require, module, exports) {
"use strict";


// Requires

var dom = require('../dom.js');
var storeService = require('../store-service.js');
var throttle = require('jmas/throttle');
var fmt = require('../format.js');

var productsTemplate = require('../templates/products.hg');
var productItemTemplate = require('../templates/product-item.hg');


// Local vars

var partEl = document.createElement('DIV');
var products = storeService.products;


// Functions

function render() {
	var items = [];

	for (var item,i=0,len=products.length; i<len; i++) {
		item = products.get(i);
		
		item._priceFormatted = fmt.formatCur(parseFloat(item.price), 2, 3, ' ', ',');

		items.push(productItemTemplate.render(item));
	}

	var html = productsTemplate.render({
		products: items.join('')
	});

	dom.replaceHtml(partEl, html);

	console.log('render products');
}


// Bootstrap

products.on('change', throttle(render));


// Exports

module.exports = function(rootEl, emitter) {
	console.log('products bootstrap.');

	emitter.on('page.activated.products', function(name) {
		storeService.loadProducts();

		console.log('activated products page');
	});

	return partEl;
};
}, {"../dom.js":5,"../store-service.js":4,"jmas/throttle":15,"../format.js":16,"../templates/products.hg":17,"../templates/product-item.hg":18}],
15: [function(require, module, exports) {
(function(rootScope) {
  
  var throttle = function(fn, timeout, ctx) {
    var timer, args, needInvoke;

    return function() {
      args = arguments;
      needInvoke = true;
      ctx = ctx || this;

      timer || (function() {
        if(needInvoke) {
          fn.apply(ctx, args);
          needInvoke = false;
          timer = setTimeout(arguments.callee, timeout);
        }
        else {
          timer = null;
        }
      })();
    };
  };

  if (typeof module !== 'undefined') {
    module.exports = throttle;
  } else {
    rootScope.throttle = throttle;
  }

})(this);
}, {}],
16: [function(require, module, exports) {
module.exports = {
  formatCur: function(num, n, x, s, c) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\D' : '$') + ')',
      num = num.toFixed(Math.max(0, ~~n));

    return (c ? num.replace('.', c) : num).replace(new RegExp(re, 'g'), '$&' + (s || ','));
  }
};
}, {}],
17: [function(require, module, exports) {
var Template = require('hogan-runtime').Template;module.exports = new Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div id=\"main-product-list\" class=\"product-list hor-list\">");t.b("\n" + i);t.b("	");t.b(t.t(t.f("products",c,p,0)));t.b("\n" + i);t.b("</div>");return t.fl(); },partials: {}, subs: {  }});
}, {"hogan-runtime":19}],
19: [function(require, module, exports) {
/*
 *  Copyright 2011 Twitter, Inc.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

var Hogan = {};

(function (Hogan) {
  Hogan.Template = function (codeObj, text, compiler, options) {
    codeObj = codeObj || {};
    this.r = codeObj.code || this.r;
    this.c = compiler;
    this.options = options || {};
    this.text = text || '';
    this.partials = codeObj.partials || {};
    this.subs = codeObj.subs || {};
    this.buf = '';
  }

  Hogan.Template.prototype = {
    // render: replaced by generated code.
    r: function (context, partials, indent) { return ''; },

    // variable escaping
    v: hoganEscape,

    // triple stache
    t: coerceToString,

    render: function render(context, partials, indent) {
      return this.ri([context], partials || {}, indent);
    },

    // render internal -- a hook for overrides that catches partials too
    ri: function (context, partials, indent) {
      return this.r(context, partials, indent);
    },

    // ensurePartial
    ep: function(symbol, partials) {
      var partial = this.partials[symbol];

      // check to see that if we've instantiated this partial before
      var template = partials[partial.name];
      if (partial.instance && partial.base == template) {
        return partial.instance;
      }

      if (typeof template == 'string') {
        if (!this.c) {
          throw new Error("No compiler available.");
        }
        template = this.c.compile(template, this.options);
      }

      if (!template) {
        return null;
      }

      // We use this to check whether the partials dictionary has changed
      this.partials[symbol].base = template;

      if (partial.subs) {
        // Make sure we consider parent template now
        if (!partials.stackText) partials.stackText = {};
        for (key in partial.subs) {
          if (!partials.stackText[key]) {
            partials.stackText[key] = (this.activeSub !== undefined && partials.stackText[this.activeSub]) ? partials.stackText[this.activeSub] : this.text;
          }
        }
        template = createSpecializedPartial(template, partial.subs, partial.partials,
          this.stackSubs, this.stackPartials, partials.stackText);
      }
      this.partials[symbol].instance = template;

      return template;
    },

    // tries to find a partial in the current scope and render it
    rp: function(symbol, context, partials, indent) {
      var partial = this.ep(symbol, partials);
      if (!partial) {
        return '';
      }

      return partial.ri(context, partials, indent);
    },

    // render a section
    rs: function(context, partials, section) {
      var tail = context[context.length - 1];

      if (!isArray(tail)) {
        section(context, partials, this);
        return;
      }

      for (var i = 0; i < tail.length; i++) {
        context.push(tail[i]);
        section(context, partials, this);
        context.pop();
      }
    },

    // maybe start a section
    s: function(val, ctx, partials, inverted, start, end, tags) {
      var pass;

      if (isArray(val) && val.length === 0) {
        return false;
      }

      if (typeof val == 'function') {
        val = this.ms(val, ctx, partials, inverted, start, end, tags);
      }

      pass = !!val;

      if (!inverted && pass && ctx) {
        ctx.push((typeof val == 'object') ? val : ctx[ctx.length - 1]);
      }

      return pass;
    },

    // find values with dotted names
    d: function(key, ctx, partials, returnFound) {
      var found,
          names = key.split('.'),
          val = this.f(names[0], ctx, partials, returnFound),
          doModelGet = this.options.modelGet,
          cx = null;

      if (key === '.' && isArray(ctx[ctx.length - 2])) {
        val = ctx[ctx.length - 1];
      } else {
        for (var i = 1; i < names.length; i++) {
          found = findInScope(names[i], val, doModelGet);
          if (found !== undefined) {
            cx = val;
            val = found;
          } else {
            val = '';
          }
        }
      }

      if (returnFound && !val) {
        return false;
      }

      if (!returnFound && typeof val == 'function') {
        ctx.push(cx);
        val = this.mv(val, ctx, partials);
        ctx.pop();
      }

      return val;
    },

    // find values with normal names
    f: function(key, ctx, partials, returnFound) {
      var val = false,
          v = null,
          found = false,
          doModelGet = this.options.modelGet;

      for (var i = ctx.length - 1; i >= 0; i--) {
        v = ctx[i];
        val = findInScope(key, v, doModelGet);
        if (val !== undefined) {
          found = true;
          break;
        }
      }

      if (!found) {
        return (returnFound) ? false : "";
      }

      if (!returnFound && typeof val == 'function') {
        val = this.mv(val, ctx, partials);
      }

      return val;
    },

    // higher order templates
    ls: function(func, cx, partials, text, tags) {
      var oldTags = this.options.delimiters;

      this.options.delimiters = tags;
      this.b(this.ct(coerceToString(func.call(cx, text)), cx, partials));
      this.options.delimiters = oldTags;

      return false;
    },

    // compile text
    ct: function(text, cx, partials) {
      if (this.options.disableLambda) {
        throw new Error('Lambda features disabled.');
      }
      return this.c.compile(text, this.options).render(cx, partials);
    },

    // template result buffering
    b: function(s) { this.buf += s; },

    fl: function() { var r = this.buf; this.buf = ''; return r; },

    // method replace section
    ms: function(func, ctx, partials, inverted, start, end, tags) {
      var textSource,
          cx = ctx[ctx.length - 1],
          result = func.call(cx);

      if (typeof result == 'function') {
        if (inverted) {
          return true;
        } else {
          textSource = (this.activeSub && this.subsText && this.subsText[this.activeSub]) ? this.subsText[this.activeSub] : this.text;
          return this.ls(result, cx, partials, textSource.substring(start, end), tags);
        }
      }

      return result;
    },

    // method replace variable
    mv: function(func, ctx, partials) {
      var cx = ctx[ctx.length - 1];
      var result = func.call(cx);

      if (typeof result == 'function') {
        return this.ct(coerceToString(result.call(cx)), cx, partials);
      }

      return result;
    },

    sub: function(name, context, partials, indent) {
      var f = this.subs[name];
      if (f) {
        this.activeSub = name;
        f(context, partials, this, indent);
        this.activeSub = false;
      }
    }

  };

  //Find a key in an object
  function findInScope(key, scope, doModelGet) {
    var val;

    if (scope && typeof scope == 'object') {

      if (scope[key] !== undefined) {
        val = scope[key];

      // try lookup with get for backbone or similar model data
      } else if (doModelGet && scope.get && typeof scope.get == 'function') {
        val = scope.get(key);
      }
    }

    return val;
  }

  function createSpecializedPartial(instance, subs, partials, stackSubs, stackPartials, stackText) {
    function PartialTemplate() {};
    PartialTemplate.prototype = instance;
    function Substitutions() {};
    Substitutions.prototype = instance.subs;
    var key;
    var partial = new PartialTemplate();
    partial.subs = new Substitutions();
    partial.subsText = {};  //hehe. substext.
    partial.buf = '';

    stackSubs = stackSubs || {};
    partial.stackSubs = stackSubs;
    partial.subsText = stackText;
    for (key in subs) {
      if (!stackSubs[key]) stackSubs[key] = subs[key];
    }
    for (key in stackSubs) {
      partial.subs[key] = stackSubs[key];
    }

    stackPartials = stackPartials || {};
    partial.stackPartials = stackPartials;
    for (key in partials) {
      if (!stackPartials[key]) stackPartials[key] = partials[key];
    }
    for (key in stackPartials) {
      partial.partials[key] = stackPartials[key];
    }

    return partial;
  }

  var rAmp = /&/g,
      rLt = /</g,
      rGt = />/g,
      rApos = /\'/g,
      rQuot = /\"/g,
      hChars = /[&<>\"\']/;

  function coerceToString(val) {
    return String((val === null || val === undefined) ? '' : val);
  }

  function hoganEscape(str) {
    str = coerceToString(str);
    return hChars.test(str) ?
      str
        .replace(rAmp, '&amp;')
        .replace(rLt, '&lt;')
        .replace(rGt, '&gt;')
        .replace(rApos, '&#39;')
        .replace(rQuot, '&quot;') :
      str;
  }

  var isArray = Array.isArray || function(a) {
    return Object.prototype.toString.call(a) === '[object Array]';
  };

})(typeof exports !== 'undefined' ? exports : Hogan);

}, {}],
18: [function(require, module, exports) {
var Template = require('hogan-runtime').Template;module.exports = new Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"product-item\">");t.b("\n" + i);t.b("  <a class=\"product-image\" href=\"#/product/");t.b(t.v(t.f("id",c,p,0)));t.b("\">");t.b("\n" + i);t.b("    <img src=\"");t.b(t.v(t.f("image",c,p,0)));t.b("\" alt=\"");t.b(t.v(t.f("name",c,p,0)));t.b("\" />");t.b("\n" + i);if(t.s(t.f("amount",c,p,1),c,p,0,137,183,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("    <div class=\"amount\">");t.b(t.v(t.f("amount",c,p,0)));t.b("</div>");t.b("\n" + i);});c.pop();}t.b("  </a>");t.b("\n" + i);t.b("  <div class=\"product-summary\">");t.b("\n" + i);t.b("    <a class=\"name\" href=\"#/product/");t.b(t.v(t.f("id",c,p,0)));t.b("\">");t.b(t.v(t.f("name",c,p,0)));t.b("</a>");t.b("\n" + i);t.b("    <div class=\"price\">");t.b(t.v(t.f("_priceFormatted",c,p,0)));t.b(" грн.</div>");t.b("\n" + i);t.b("    <span class=\"action-btn accept\" data-cart=\"");t.b(t.v(t.f("id",c,p,0)));t.b("\">В корзину</span>");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("</div>");return t.fl(); },partials: {}, subs: {  }});
}, {"hogan-runtime":19}],
7: [function(require, module, exports) {
"use strict";


// Requires

var dom = require('../dom.js');
var throttle = require('jmas/throttle');
var parallel = require('jmas/parallel');
var waterfall = require('jmas/waterfall');
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
  data._priceFormatted = fmt.formatCur(parseFloat(data.price), 2, 3, ' ', ',');

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

  function loadProduct(next) { // load product
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
  }

  loadProduct(function() {
    parallel([
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
  });
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
}, {"../dom.js":5,"jmas/throttle":15,"jmas/parallel":20,"jmas/waterfall":21,"visionmedia/superagent":12,"../format.js":16,"../templates/product.hg":22,"../templates/product-view.hg":23,"../templates/product-item.hg":18,"../templates/recomends-empty.hg":24}],
20: [function(require, module, exports) {
(function() {
  'use strict';
  
  var root = this || window;

  var nextTick = function (fn) {
    if (typeof setImmediate === 'function') {
      setImmediate(fn);
    } else if (typeof process !== 'undefined' && process.nextTick) {
      process.nextTick(fn);
    } else {
      setTimeout(fn, 0);
    }
  };
  
  var parallel = function(tasks, result) {
    var finished = 0;

    var next = function() {
      finished++;

      if (finished === tasks.length) {
        typeof result === 'function' && result.apply(null, []);
      }
    };

    for (var i=0,len=tasks.length; i<len; i++) {
      (function(fn) {
        nextTick(function () {
          typeof fn === 'function' && fn.apply(null, [next]);
        });
      })(tasks[i]);
    }
  };
  
  if (typeof define !== 'undefined' && define.amd) {
    define([], function () {
      return parallel;
    }); // RequireJS
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = parallel; // CommonJS
  } else {
    root.parallel = parallel; // <script>
  }
  
})();

}, {}],
21: [function(require, module, exports) {
(function() {
  'use strict';
  
  var root = this;
  
  var nextTick = function (fn) {
    if (typeof setImmediate === 'function') {
      setImmediate(fn);
    } else if (typeof process !== 'undefined' && process.nextTick) {
      process.nextTick(fn);
    } else {
      setTimeout(fn, 0);
    }
  };
  
  var waterfall = function(tasks, result) {
    var next = function() {
      var fn = tasks.shift();
      var args = Array.prototype.slice.call(arguments, 0);
      var error = args.shift();
  
      if (typeof fn === 'undefined' || error === true) {
        args.unshift(error);
        typeof result === 'function' && result.apply(null, args);
        return;
      }
      
      args.unshift(next);
      nextTick(function () {
        typeof fn === 'function' && fn.apply(null, args);
      });
    };
    
    next(false);
  };
  
  if (typeof define !== 'undefined' && define.amd) {
    define([], function () {
      return waterfall;
    }); // RequireJS
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = waterfall; // CommonJS
  } else {
    root.waterfall = waterfall; // <script>
  }
  
})();

}, {}],
22: [function(require, module, exports) {
var Template = require('hogan-runtime').Template;module.exports = new Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b(t.t(t.f("product_view",c,p,0)));t.b("\n");t.b("\n" + i);t.b("<div id=\"product-view-back\">");t.b("\n" + i);t.b("  <a class=\"action-btn\" href=\"#/\">Вернуться к списку товаров</a>");t.b("\n" + i);t.b("</div>");t.b("\n");t.b("\n" + i);t.b("<h3>Товары, которые покупают с этим товаром</h3>");t.b("\n");t.b("\n" + i);t.b("<div id=\"product-view-buy-with-list\" class=\"product-list hor-list\"></div>");t.b("\n");t.b("\n" + i);t.b("<h3>Товары, которые просматриваются с этим товаром</h3>");t.b("\n");t.b("\n" + i);t.b("<div id=\"product-view-view-with-list\" class=\"product-list hor-list\"></div>");t.b("\n");t.b("\n" + i);t.b("<h3>Товары, которые добавляются в корзину с этим товаром</h3>");t.b("\n");t.b("\n" + i);t.b("<div id=\"product-view-cart-with-list\" class=\"product-list hor-list\"></div>");return t.fl(); },partials: {}, subs: {  }});
}, {"hogan-runtime":19}],
23: [function(require, module, exports) {
var Template = require('hogan-runtime').Template;module.exports = new Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div id=\"product-view\">");t.b("\n" + i);t.b("  <div class=\"product-image\">");t.b("\n" + i);t.b("    <img src=\"");t.b(t.v(t.f("image",c,p,0)));t.b("\" alt=\"");t.b(t.v(t.f("name",c,p,0)));t.b("\" />");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("  <div class=\"product-summary\">");t.b("\n" + i);t.b("    <span class=\"name\">");t.b(t.v(t.f("name",c,p,0)));t.b("</span>");t.b("\n" + i);t.b("    <div class=\"price\">");t.b(t.v(t.f("_priceFormatted",c,p,0)));t.b(" грн.</div>");t.b("\n" + i);t.b("    <div class=\"amount\">");t.b("\n" + i);t.b("      <input id=\"product-view-amount\" type=\"text\" value=\"1\" />");t.b("\n" + i);t.b("    </div>");t.b("\n" + i);t.b("    <span id=\"product-view-cart-btn\" class=\"action-btn accept\" data-cart=\"");t.b(t.v(t.f("id",c,p,0)));t.b("\" data-cart-amount=\"");t.b(t.v(t.f("amount",c,p,0)));t.b("\">В корзину</span>");t.b("\n" + i);t.b("  </div>");t.b("\n" + i);t.b("</div>");return t.fl(); },partials: {}, subs: {  }});
}, {"hogan-runtime":19}],
24: [function(require, module, exports) {
var Template = require('hogan-runtime').Template;module.exports = new Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"empty recomends-empty\">Эта рекомендация недоступна, но скоро здесь появятся товары.</div>");return t.fl(); },partials: {}, subs: {  }});
}, {"hogan-runtime":19}],
8: [function(require, module, exports) {
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
      storeService.addProductToCart(productId, amount);
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

module.exports = function(rootEl, emitter) {
  console.log('cart bootstrap.');

  storeService.loadCartProducts();

  emitter.on('cart.add', function(productId) {
    storeService.addProductToCart(productId);
  });

  return partEl;
};
}, {"../dom.js":5,"../store-service.js":4,"jmas/throttle":15,"../format.js":16,"../templates/cart.hg":25,"../templates/cart-empty.hg":26,"../templates/product-item.hg":18}],
25: [function(require, module, exports) {
var Template = require('hogan-runtime').Template;module.exports = new Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div id=\"cart-product-list\" class=\"product-list\">");t.b("\n" + i);t.b("  ");t.b(t.t(t.f("products",c,p,0)));t.b("\n" + i);t.b("</div>");return t.fl(); },partials: {}, subs: {  }});
}, {"hogan-runtime":19}],
26: [function(require, module, exports) {
var Template = require('hogan-runtime').Template;module.exports = new Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"empty\">В корзине нет продуктов.<br />Нажмите «В корзину» чтобы товар очутился здесь.</div>");return t.fl(); },partials: {}, subs: {  }});
}, {"hogan-runtime":19}],
9: [function(require, module, exports) {
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

  emitter.on('checkout.finished', function() {
    alert('Checkouted!');
    location.href = '#/checkout-prompt';
  });

  return partEl;
};
}, {"../dom.js":5,"../templates/checkout.hg":27}],
27: [function(require, module, exports) {
var Template = require('hogan-runtime').Template;module.exports = new Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div id=\"checkout-prompt\">");t.b("\n" + i);t.b("	<p><img src=\"images/accept.png\" /></p>");t.b("\n" + i);t.b("	<p><b>Ваш заказ принят!</b></p>");t.b("\n" + i);t.b("	<p>Скоро мы вам позвоним и уточним куда и как доставить заказ.</p>");t.b("\n" + i);t.b("</div>");return t.fl(); },partials: {}, subs: {  }});
}, {"hogan-runtime":19}]}, {}, {"1":""})
