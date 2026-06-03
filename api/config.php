<?php
error_reporting(E_ALL);
ini_set('display_errors', 0); // تغییر از 1 به 0 برای مخفی کردن خطاها
ini_set('log_errors', 1);

$cfg['DefaultCharset'] = 'utf8mb4';
$cfg['DefaultConnectionCollation'] = 'utf8mb4_persian_ci';

// تنظیمات session - اصلاح شده
if (session_status() === PHP_SESSION_NONE) {
    // فقط اگر session شروع نشده
    session_set_cookie_params([
        'lifetime' => 86400, // 24 ساعت
        'path' => '/',
        'domain' => $_SERVER['HTTP_HOST'] ?? 'localhost',
        'secure' => isset($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Strict'
    ]);
    session_start();
}

// تنظیمات دیتابیس محلی
$localhost = true;

if($localhost) {
    $host = "localhost";
    $dbname = "smgd_db";
    $username = "root";
    $password = "";
    $charset = 'utf8mb4';
} else {
    $host = "sql313.infinityfree.com";
    $dbname = "smgd_db";
    $username = "if0_40663660";
    $password = "NTmpd1353";
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", 
                   $username, 
                   $password,
                   [
                       PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                       PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                       PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_persian_ci"
                   ]);
    
} catch(PDOException $e) {
    error_log("Database connection error: " . $e->getMessage());
    die(json_encode([
        'error' => true,
        'message' => 'خطا در اتصال به دیتابیس',
        'debug' => $e->getMessage()
    ]));
}

// تابع هش کردن پسورد
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
}

// تابع بررسی پسورد
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}
?>