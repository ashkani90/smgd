<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$data = json_decode(file_get_contents('php://input'), true);
$userId = isset($data['id']) ? (int)$data['id'] : null;

if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'شناسه کاربر ارسال نشده']);
    exit;
}

// جلوگیری از حذف کاربر ادمین اصلی (id=1)
if ($userId === 1) {
    echo json_encode(['success' => false, 'message' => 'امکان حذف کاربر مدیر اصلی سیستم وجود ندارد']);
    exit;
}

try {
    // بررسی اینکه کاربر ادمین نباشد (اختیاری)
    $checkStmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $checkStmt->execute([$userId]);
    $user = $checkStmt->fetch();
    
    if ($user && $user['role'] === 'admin' && $userId !== 1) {
        // می‌توانید اجازه حذف ادمین‌های دیگر را بدهید یا ندهید
        // در اینجا اجازه حذف داده می‌شود
    }
    
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'کاربر با موفقیت حذف شد'
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    error_log("خطا در delete-user.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'خطا در حذف کاربر: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>