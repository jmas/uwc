<?php

// Get list of products

$app->get('/', function () use ($app) {
  $sql = 'SELECT * FROM product';

  $stmt = $app->db->prepare($sql);
  
  if ($stmt->execute() === false) {
    $app->halt(503, 'Query not executable!');
  }
  
  $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

  $app->response->write(json_encode([
    'result'=>$result,
  ]));
});


// Get one product

$app->get('/:id', function($id) use ($app) {
  $sql = 'SELECT * FROM product WHERE id=:id LIMIT 1';

  $stmt = $app->db->prepare($sql);
  $stmt->bindParam(':id', $id);
  
  if ($stmt->execute() === false) {
    $app->halt(503, 'Query not executable!');
  }

  $result = $stmt->fetch(PDO::FETCH_ASSOC);

  $app->response->write(json_encode([
    'result'=>$result,
  ]));
});