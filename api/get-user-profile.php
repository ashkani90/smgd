<?php
// api/get-user-profile.php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/config.php';

// شروع سشن اگر شروع نشده
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// دریافت شناسه کاربر
$userId = $_GET['user_id'] ?? $_POST['user_id'] ?? null;

if (isset($_SESSION['user_id'])) {
    $userId = $_SESSION['user_id'];
}

if (!$userId) {
    $userId = 'guest';
}

try {
    if ($userId === 'guest') {
        echo json_encode([
            'success' => true,
            'data' => [
                'id' => 0,
                'username' => 'guest',
                'fullname' => 'کاربر مهمان',
                'email' => '',
                'phone' => '',  // استفاده از phone به جای phoneNumber
                'department' => '',
                'role' => 'guest'
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // بررسی اتصال PDO
    if (!isset($pdo)) {
        throw new Exception('اتصال به دیتابیس برقرار نیست');
    }
    
    // حذف فیلد avatar از کوئری
    $sql = "SELECT id, username, full_name as fullname, email, phone, department, role 
            FROM users WHERE id = ? OR username = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId, $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo json_encode([
            'success' => true,
            'data' => $user
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode([
            'success' => true,
            'data' => [
                'id' => 0,
                'username' => 'unknown',
                'fullname' => 'کاربر',
                'email' => '',
                'phone' => '09123456789',
                'department' => 'انتخاب کنید',
                'role' => 'operator'
            ]
        ], JSON_UNESCAPED_UNICODE);
    }
    
} catch (Exception $e) {
    error_log("خطا در get-user-profile.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'خطا در دریافت اطلاعات کاربر',
        'error_details' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>