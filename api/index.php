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


// Functions

function createSessionUser($sessionKey) use ($app) {
  $sql = 'INSERT INTO user(session_key) VALUES(:session_key)';

  $stmt = $app->db->prepare($sql);
  
  if ($stmt->execute([ ':session_key'=> $sessionKey ]) === false) {
    $app->halt(503, 'Query id not executable!');
  }

  $userId = $app->db->lastInsertId();

  return $userId;
}


// Get and set user.

$app->hook('slim.before.router', function () use ($app) {
  // If user is not defined - create new user
  if (empty($_SESSION['user_id'])) {
    $userId = createSessionUser(session_id());

    $_SESSION['user_id'] = $userId;
  }

  $userId = $_SESSION['user_id'];

  $sql = 'SELECT id FROM user WHERE id=:userId)';
    
  $stmt = $app->db->prepare($sql);

  if ($stmt->execute([ ':userId'=>$userId ]) === false) {
    $app->halt(503, 'Query id not executable!');
  }

  if ($stmt->fetch() === false) {
    $userId = createSessionUser(session_id());
  }

  // If order is not difined at session - create new order
  if (empty($_SESSION['order_id'])) {
    
    $sql = 'INSERT INTO user_order(user_id) VALUES(:userId)';
    
    $stmt = $app->db->prepare($sql);
    
    if ($stmt->execute([ ':userId'=>$userId ]) === false) {
      $app->halt(503, 'Query id not executable!');
    }

    $orderId = $app->db->lastInsertId();
    
    $_SESSION['order_id'] = $orderId;
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
