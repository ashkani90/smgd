<?php
// api/logout.php
session_start();
header('Content-Type: application/json');

require_once '../config.php';

// دریافت توکن از هدر
$headers = getallheaders();
$token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');

if (!empty($token)) {
    // می‌توانید توکن را در دیتابیس باطل کنید
    // اینجا فقط پیام موفقیت برمی‌گردانیم
}

echo json_encode(['success' => true]);
?>