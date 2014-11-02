<?php

// Return info about order

$app->get('/', function() use ($app) {
  
});


// Update info about order

$app->post('/', function() use ($app) {
  if (empty($_SESSION['user_id'])) {
    $app->halt(503, 'User is not defined in current session!');
  }

  if (empty($_SESSION['order_id'])) {
    $app->halt(503, 'Order is not defined in current session!');
  }

  $data = json_decode($app->request->getBody());

  $sqlData = [];
  $sqlValues = [];

  foreach ($data as $key => $value) {
    $sqlData[] = preg_replace('/[^a-zA-Z0-9_]/', '', $key) . '=?';
    $sqlValues[] = $value;
  }

  $sqlValues[] = $_SESSION['order_id'];
  $sqlValues[] = $_SESSION['user_id'];

  $sql = 'UPDATE user_order SET ' . implode(' , ', $sqlData) . ' WHERE id=? AND user_id=? LIMIT 1';

  $stmt = $app->db->prepare($sql);

  $result = $stmt->execute($sqlValues);

  if ($result === false) {
    $app->halt(503, 'Query is not executable!');
  }

  unset($_SESSION['order_id']);

  $app->response->write(json_encode([
    'result'=>$result,
  ]));
});


// Add one product with specific amount to order

$app->post('/products/:productId', function($productId) use ($app) {
  $amount = $app->request->params('amount', 1);

  if (empty($_SESSION['order_id'])) {
    $app->halt(503, 'Order is not defined in current session!');
  }

  $orderId = $_SESSION['order_id'];

  $sql = 'INSERT INTO order_product(order_id, product_id, amount) VALUES(:orderId, :productId, :amount)';

  $stmt = $app->db->prepare($sql);

  if ($stmt->execute([ ':orderId'=>$orderId, ':productId'=>$productId, ':amount'=>$amount ]) === false) {
    $app->halt(503, 'Query is not executable!');
  }

  $id = $app->db->lastInsertId();

  $app->response->write(json_encode([
    'result'=>$id,
  ]));
});


// List of products

$app->get('/products', function() use ($app) {
  if (empty($_SESSION['order_id'])) {
    $app->halt(503, 'Order is not defined in current session!');
  }

  $orderId = $_SESSION['order_id'];

  $sql = 'SELECT p.*, SUM(op.amount) AS amount FROM order_product op LEFT JOIN product p ON op.product_id=p.id WHERE op.order_id=:orderId GROUP BY op.product_id';

  $stmt = $app->db->prepare($sql);

  if ($stmt->execute([ ':orderId'=>$orderId ]) === false) {
    $app->halt(503, 'Query id not executable!');
  }

  $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

  $app->response->write(json_encode([
    'result'=>$result,
  ]));
});


// Delete one or more products

$app->delete('/products/:productId', function() use ($app) {
  if (empty($_SESSION['order_id'])) {
    $app->halt(503, 'Order is not defined in current session!');
  }

  $orderId = $_SESSION['order_id'];

  $sql = 'DELETE FROM order_product WHERE prduct_id=:productId AND order_id=:orderId';

  $stmt = $app->db->prepare($sql);

  $result = $stmt->execute([ ':orderId'=>$orderId, ':productId'=>$productId ]);

  if ($result === false) {
    $app->halt(503, 'Query is not executable!');
  }

  $app->response->write(json_encode([
    'result'=>$result,
  ]));
});

