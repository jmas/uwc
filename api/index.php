<?php

session_cache_limiter(false);
session_start();

require '../vendor/autoload.php';

define('PROJECT_ROOT', dirname(__FILE__) . DIRECTORY_SEPARATOR . '..');

$app = new \Slim\Slim(require_once('../config.php'));

$app->response->headers->set('Content-Type', 'application/json');

$dbPath =  PROJECT_ROOT . DIRECTORY_SEPARATOR . $app->config('db.path');

try {
  $app->db = new PDO('sqlite:' . $dbPath);
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
