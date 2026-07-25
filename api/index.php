<?php

ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

// Let's print debug progress to see where it crashes
echo "DEBUG_START | ";

$autoloadPath = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    echo "ERROR: vendor/autoload.php not found at $autoloadPath | ";
    exit;
}
echo "Autoload found | ";

require $autoloadPath;
echo "Autoload loaded | ";

$appPath = __DIR__ . '/../bootstrap/app.php';
if (!file_exists($appPath)) {
    echo "ERROR: bootstrap/app.php not found at $appPath | ";
    exit;
}
echo "bootstrap/app.php found | ";

try {
    $app = require_once $appPath;
    echo "App instance created | ";
} catch (\Throwable $e) {
    echo "ERROR bootstrapping app: " . $e->getMessage() . " | " . $e->getFile() . ":" . $e->getLine() . " | ";
    exit;
}

use Illuminate\Http\Request;

try {
    echo "Handling request... | ";
    $app->handleRequest(Request::capture());
    echo "DEBUG_END";
} catch (\Throwable $e) {
    echo "ERROR handling request: " . $e->getMessage() . " | " . $e->getFile() . ":" . $e->getLine() . " | ";
}
