<?php

// Base requirements and definitions.

session_start();

require '../vendor/autoload.php';

define('PROJECT_ROOT', dirname(__FILE__) . DIRECTORY_SEPARATOR . '..');


// Create app instance

$app = new \Slim\Slim(require_once('../config.php'));

$app->response->headers->set('Content-Type', 'application/json');


// Connect to DB.

$dbPath = PROJECT_ROOT . DIRECTORY_SEPARATOR . $app->config('db.path');

try {
  $app->db = new PDO('sqlite:' . $dbPath);
  $app->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(Exception $e) {
  throw new Exception('Error connection to DB.');
}


// Get and set user.

$app->hook('slim.before.router', function () use ($app) {
  if (! isset($_SESSION['user_id'])) {
    $sql = 'INSERT INTO user(session_key) VALUES(:session_key)';

    $stmt = $app->db->prepare($sql);
    $stmt->bindParam(':session_key', session_id());
    $stmt->execute();

    $userId = $app->db->lastInsertId();

    $_SESSION['user_id'] = $userId;
  }
});


// Setup routes

$app->group('/product', function() use ($app) {
  require_once('../routes/product.php');
});

$app->group('/order', function() use ($app) {
  require_once('../routes/order.php');
});


// Run

$app->run();
