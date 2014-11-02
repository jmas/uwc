waterfall
=========

Waterfall run options.

```javascript
waterfall([task1, task2, ... taskN], result)
```

Next function params.

```javascript
next(error, arg1, ... argN)
```

Example without errors.

```javascript
waterfall([
  function(next) {
    next(false, 'arg 1');
  },
  function(next, arg1) {
    next(false, arg1 + ', arg 2', 'arg 3');
  },
  function(next, arg2, arg3) {
    next(false, arg2 + ', ' + arg3);
  }
], function(error, result) {
  console.log(arguments);
});
```

Example with produced error.

```javascript
waterfall([
  function(next) {
    next(false, 'arg 1');
  },
  function(next, arg1) {
    next(false, arg1 + ', arg 2', 'arg 3');
  },
  function(next, arg1) {
    // here we generate error by passing true as first argument
    next(true, 'Here is a big error.');
  },
  function(next, arg2, arg3) {
    next(false, arg2 + ', ' + arg3);
  }
], function(error, result) {
  console.log(arguments);
});
```
