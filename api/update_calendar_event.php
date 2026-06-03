<?php
// api/update_calendar_event.php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, POST');
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
    
    // دریافت داده‌های PUT
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('داده‌ای دریافت نشد');
    }
    
    // بررسی وجود ID
    if (empty($input['id'])) {
        throw new Exception('شناسه رویداد مشخص نشده است');
    }
    
    // اعتبارسنجی
    if (empty($input['title'])) {
        throw new Exception('عنوان رویداد الزامی است');
    }
    
    if (empty($input['start_date'])) {
        throw new Exception('تاریخ شروع الزامی است');
    }
    
    // بررسی مالکیت رویداد
    $checkStmt = $pdo->prepare("SELECT id FROM calendar_events WHERE id = ? AND user_id = ?");
    $checkStmt->execute([$input['id'], $user_id]);
    if (!$checkStmt->fetch()) {
        throw new Exception('شما اجازه ویرایش این رویداد را ندارید');
    }
    
    // ساخت تاریخ کامل با زمان
    $start_date = $input['start_date'];
    if (!empty($input['start_time'])) {
        $start_date .= ' ' . $input['start_time'];
    } else {
        $start_date .= ' 00:00:00';
    }
    
    $end_date = !empty($input['end_date']) ? $input['end_date'] : $input['start_date'];
    if (!empty($input['end_time'])) {
        $end_date .= ' ' . $input['end_time'];
    } else {
        $end_date .= ' 23:59:59';
    }
    
    // به‌روزرسانی در دیتابیس
    $sql = "UPDATE calendar_events SET
                event_title = :title,
                event_description = :description,
                event_type = :type,
                start_date = :start_date,
                end_date = :end_date,
                all_day = :all_day,
                priority = :priority,
                location = :location,
                color = :color
            WHERE id = :id AND user_id = :user_id";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id' => $input['id'],
        ':title' => $input['title'],
        ':description' => $input['description'] ?? '',
        ':type' => $input['type'] ?? 'other',
        ':start_date' => $start_date,
        ':end_date' => $end_date,
        ':all_day' => isset($input['all_day']) ? 1 : 0,
        ':priority' => $input['priority'] ?? 'medium',
        ':location' => $input['location'] ?? '',
        ':color' => $input['color'] ?? '#3788d8',
        ':user_id' => $user_id
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'رویداد با موفقیت ویرایش شد',
        'event_id' => $input['id']
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
