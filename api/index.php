<?php

require '../vendor/autoload.php';

$app = new \Slim\Slim([
  'debug'=>true,
  'db.path'=>'../db/database.sqlite3',
]);

$app->response->headers->set('Content-Type', 'application/json');

try {
  $app->db = new PDO('sqlite:' . $app->config('db.path'));
} catch(Exception $e) {
  throw new Exception("Error connection to DB.");
}

$app->group('/product', function($route) use ($app) {
  require_once('../routes/product.php');
});

$app->group('/cart', function($route) use ($app) {
  require_once('../routes/cart.php');
});

$app->run();
