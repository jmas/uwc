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