<?php
// api/delete_calendar_event.php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/config.php';

try {
    global $pdo;
    
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('لطفاً ابتدا وارد شوید');
    }
    
    $user_id = $_SESSION['user_id'];
    
    // دریافت ID از پارامترهای GET یا POST
    $input = json_decode(file_get_contents('php://input'), true);
    $event_id = $_GET['id'] ?? ($input['id'] ?? null);
    
    if (!$event_id) {
        throw new Exception('شناسه رویداد مشخص نشده است');
    }
    
    // بررسی مالکیت رویداد
    $checkStmt = $pdo->prepare("SELECT id FROM calendar_events WHERE id = ? AND user_id = ?");
    $checkStmt->execute([$event_id, $user_id]);
    if (!$checkStmt->fetch()) {
        throw new Exception('شما اجازه حذف این رویداد را ندارید');
    }
    
    // حذف رویداد
    $stmt = $pdo->prepare("DELETE FROM calendar_events WHERE id = ? AND user_id = ?");
    $stmt->execute([$event_id, $user_id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'رویداد با موفقیت حذف شد'
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>