<?php

require '../vendor/autoload.php';

$app = new \Slim\Slim();

$app->get('/', function () use ($app) {
    $app->response->write('Go! Go! Go!');
});

$app->get('/test', function () {
    echo "test";
});

$app->run();
