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
