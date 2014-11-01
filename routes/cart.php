<?php

// Add one or more products

$app->post('/:id', function() use ($app) {
  $amount = $app->request->params('amount');

});


// List of products

$app->get('/', function() use ($app) {

  //print_r($_SESSION['user_id']);
  $_SESSION['user_id'] = NULL;

  if (! isset($_SESSION['user_id'])) {
    $sql = 'SELECT id FROM user WHERE session_key = :session_key LIMIT 1';

    $stmt = $app->db->prepare($sql);
    $stmt->bindParam(':session_key', session_id());
    $stmt->execute();
    $result = $stmt->fetchColumn();

    if (! $result) {
      $sql = 'INSERT INTO user (session_key) VALUES (:session_key)';
      $stmt = $app->db->prepare($sql);
      $stmt->bindParam(':session_key', session_id());
      $stmt->execute();

      $result = $app->db->lastInsertId();
    }

    $_SESSION['user_id'] = $result;

  }

  $sql = 'SELECT * FROM product WHERE id IN (
    SELECT product_id FROM order_product WHERE order_id IN (
      SELECT id FROM `order` WHERE user_id = :user_id))';

  $stmt = $app->db->prepare($sql);
  $stmt->bindParam(':user_id', $_SESSION['user_id']);
  
  if ($stmt->execute() === false) {
    $app->halt(503, 'Query not executable!');
  }

  $result = $stmt->fetch(PDO::FETCH_ASSOC);
  var_dump($result);

  $app->response->write(json_encode([
    'result'=>$result,
  ]));

});


// Delete one or more products

$app->delete('/:id', function() use ($app) {
  $amount = $app->request->params('amount');

});

