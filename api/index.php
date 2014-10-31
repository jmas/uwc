<?php

require '../vendor/autoload.php';

$app = new \Slim\Slim();

$app->get('/', function () use ($app) {
    $app->response->write('Go! Go! Go!');
});

$app->get('/product', function () use ($app) {

    $sqlite = new PDO('sqlite:..\db\database.sqlite3');
    $stmt = $sqlite->query('SELECT * FROM product');
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $app->response->headers->set('Content-Type', 'application/json');
    $app->response->write(json_encode($results));
    $sqlite = null;

});

$app->get('/product/:id', function ($id) use ($app) {

    $sqlite = new PDO('sqlite:..\db\database.sqlite3');
    $stmt = $sqlite->prepare('SELECT * FROM product WHERE id = :id');
    $stmt->bindParam(':id', $id);
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $app->response->headers->set('Content-Type', 'application/json');
    $app->response->write(json_encode($results));
    $sqlite = null;

});

$app->get('/install', function () {

    $sqlite = new PDO('sqlite:..\db\database.sqlite3');


    $sqlite->exec("DROP TABLE users");
    $sqlite->exec("DROP TABLE product");
    $sqlite->exec("DROP TABLE product_view");
    $sqlite->exec("DROP TABLE `order`");
    $sqlite->exec("DROP TABLE order_product");

    $sqlite->setAttribute(PDO::ATTR_ERRMODE, 
                        PDO::ERRMODE_EXCEPTION);

    $sqlite->exec("CREATE TABLE IF NOT EXISTS user (
                    id INTEGER PRIMARY KEY, 
                    session_key	TEXT)");

    $sqlite->exec("CREATE TABLE IF NOT EXISTS product (
                    id INTEGER PRIMARY KEY, 
                    name TEXT,
                    price REAL,
                    image TEXT)");

    $sqlite->exec("CREATE TABLE IF NOT EXISTS product_view (
                    id INTEGER PRIMARY KEY, 
                    product_id INTEGER,
                    user_id INTEGER)");

    $sqlite->exec("CREATE TABLE IF NOT EXISTS `order` (
                    id INTEGER PRIMARY KEY, 
                    customer_name TEXT,
                    bought INTEGER)");

    $sqlite->exec("CREATE TABLE IF NOT EXISTS order_product (
                    id INTEGER PRIMARY KEY, 
                    order_id INTEGER,
                    product_id INTEGER,
                    amount INTEGER)");

    $insert = "INSERT INTO product (name, price, image) 
                VALUES (:name, :price, :image)";

    $stmt = $sqlite->prepare($insert);

    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':price', $price);
    $stmt->bindParam(':image', $image);

    for ($i=0; $i < 40; $i++) { 
        $name = 'Товар #' . ($i + 1);
        $price = rand(1,100) . '.' . rand(0,99);
        $image = 'http://lorempixel.com/265/195/food/' . rand(0,10);
        $stmt->execute();
    }

    $result = $sqlite->query('SELECT * FROM product');

    $sqlite = null;

    echo 'Ready';

});

$app->run();
