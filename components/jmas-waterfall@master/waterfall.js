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
