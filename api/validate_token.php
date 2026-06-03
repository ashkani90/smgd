<?php
// api/validate_token.php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

// دریافت توکن از هدر
$headers = getallheaders();
$token = str_replace('Bearer ', '', $headers['Authorization'] ?? $_POST['token'] ?? '');

if (empty($token)) {
    echo json_encode(['valid' => false, 'message' => 'توکن ارسال نشده']);
    exit;
}

// بررسی توکن در session
if (isset($_SESSION['user_token']) && $_SESSION['user_token'] === $token) {
    echo json_encode([
        'valid' => true,
        'user_id' => $_SESSION['user_id'] ?? null,
        'username' => $_SESSION['username'] ?? null,
        'role' => $_SESSION['role'] ?? null
    ]);
} else {
    echo json_encode(['valid' => false, 'message' => 'توکن نامعتبر یا منقضی شده']);
}
?>