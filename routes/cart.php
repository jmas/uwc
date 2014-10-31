<?php

// Add one or more products

$app->post('/:id', function() use ($app) {
  $amount = $app->request->params('amount');

});


// List of products

$app->get('/', function() use ($app) {

});

// Delete one or more products

$app->delete('/:id', function() use ($app) {
  $amount = $app->request->params('amount');

});

