<?php

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

$app->get('/:id', function($id) use ($app) {
  $stmt = $app->db->prepare('SELECT * FROM product WHERE id = :id LIMIT 1');
  $stmt->bindParam(':id', $id);
  
  if ($stmt->execute() === false) {
    $app->halt(503, 'Query not executable!');
  }

  $result = $stmt->fetch(PDO::FETCH_ASSOC);

  $app->response->write(json_encode([
    'result'=>$result,
  ]));
});