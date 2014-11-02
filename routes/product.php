<?php

// Get list of products

$app->get('/', function () use ($app) {
  $sql = 'SELECT * FROM product';

  $stmt = $app->db->prepare($sql);
  
  if ($stmt->execute() === false) {
    $app->halt(503, 'Query is not executable!');
  }
  
  $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

  $app->response->write(json_encode([
    'result'=>$result,
  ]));
});


// Get one product

$app->get('/:id', function($id) use ($app) {

  $sql = 'INSERT INTO product_view (product_id, user_id) VALUES (:product_id, :user_id)';

  $stmt = $app->db->prepare($sql);
  $stmt->bindParam(':product_id', $id);
  $stmt->bindParam(':user_id', $_SESSION['user_id']);
  
  if ($stmt->execute() === false) {
    $app->halt(503, 'Query is not executable!');
  }  

  $sql = 'SELECT * FROM product WHERE id=:id LIMIT 1';

  $stmt = $app->db->prepare($sql);
  $stmt->bindParam(':id', $id);
  
  if ($stmt->execute() === false) {
    $app->halt(503, 'Query is not executable!');
  }

  $result = $stmt->fetch(PDO::FETCH_ASSOC);

  $app->response->write(json_encode([
    'result'=>$result,
  ]));
});


// Recomendation: Bought with

$app->get('/buy-with/:productId', function($productId) use ($app) {

  $sql = 'SELECT * FROM product WHERE id IN 
  (
    SELECT DISTINCT product_id FROM order_product WHERE order_id IN 
    (
      SELECT id FROM user_order WHERE id IN 
      (
        SELECT order_id FROM order_product WHERE product_id = :productId
      ) AND purchased = 1
    ) AND product_id <> :productId LIMIT 10
  ) ORDER BY RANDOM() LIMIT 4';

  $stmt = $app->db->prepare($sql);
  $stmt->bindParam(':productId', $productId);
  
  if ($stmt->execute() === false) {
    $app->halt(503, 'Query is not executable!');
  }

  $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

  $app->response->write(json_encode([
    'result'=>$result,
  ]));

});


// Recomendation: Viewed with

$app->get('/view-with/:productId', function($productId) use ($app) {

  $sql = 'SELECT * FROM product WHERE id IN 
  (
    SELECT DISTINCT product_id FROM product_view WHERE user_id IN 
    (
      SELECT user_id FROM product_view WHERE product_id = :productId
    ) AND product_id <> :productId LIMIT 10
  ) ORDER BY RANDOM() LIMIT 4';

  $stmt = $app->db->prepare($sql);
  $stmt->bindParam(':productId', $productId);
  
  if ($stmt->execute() === false) {
    $app->halt(503, 'Query is not executable!');
  }

  $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

  $app->response->write(json_encode([
    'result'=>$result,
  ]));

});


// Recomendation: Added to cart with

$app->get('/cart-with/:productId', function($productId) use ($app) {
  
  $sql = 'SELECT * FROM product WHERE id IN 
  (
    SELECT DISTINCT product_id FROM order_product WHERE order_id IN 
    (
      SELECT order_id FROM order_product WHERE product_id = :productId
    ) AND product_id <> :productId LIMIT 10
  ) ORDER BY RANDOM() LIMIT 4';

  $stmt = $app->db->prepare($sql);
  $stmt->bindParam(':productId', $productId);
  
  if ($stmt->execute() === false) {
    $app->halt(503, 'Query is not executable!');
  }

  $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

  $app->response->write(json_encode([
    'result'=>$result,
  ]));

});