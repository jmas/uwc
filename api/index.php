<?php
require '../vendor/autoload.php';

$app = new \Slim\Slim();

$app->get('/', function () {
    echo "Api";
});

$app->get('/test', function () {
    echo "test";
});


$app->run();