<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// شروع session به صورت ایمن
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/config.php';

// دریافت اطلاعات کاربر از session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$user_id = null;
$is_admin = false;

if (isset($_SESSION['user_id'])) {
    $user_id = $_SESSION['user_id'];
    
    // بررسی نقش کاربر
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();
    $is_admin = ($user && $user['role'] === 'admin');
}

// اگر کاربر لاگین نکرده، خطا بده
if (!$user_id) {
    echo json_encode([
        'success' => false,
        'message' => 'لطفاً ابتدا وارد شوید',
        'events' => []
    ]);
    exit;
}

try {
    // از اتصال PDO از config.php استفاده می‌کنیم
    global $pdo;
    
    if (!isset($pdo)) {
        throw new Exception('اتصال دیتابیس برقرار نشده است');
    }
    
    // دریافت پارامترهای تاریخ (ماه و سال)
    $month = isset($_GET['month']) ? intval($_GET['month']) : date('n');
    $year = isset($_GET['year']) ? intval($_GET['year']) : date('Y');
    
    // محاسبه اول و آخر ماه برای محدوده جستجو
    $startDate = date('Y-m-01', strtotime("$year-$month-01"));
    $endDate = date('Y-m-t', strtotime("$year-$month-01"));
    
    // محدوده گسترده‌تر برای رویدادهایی که ممکن است از ماه قبل شروع شده یا به ماه بعد ادامه یافته باشند
    $extendedStartDate = date('Y-m-01', strtotime("$year-$month-01 -1 month"));
    $extendedEndDate = date('Y-m-t', strtotime("$year-$month-01 +1 month"));
    
    // کوئری برای دریافت رویدادهای دقیقاً در بازه ماه جاری
    $sql = "SELECT 
                id,
                event_title as title,
                event_description as description,
                event_type as type,
                DATE(start_date) as start_date,
                DATE(end_date) as end_date,
                TIME(start_date) as start_time,
                TIME(end_date) as end_time,
                all_day,
                priority,
                location,
                color,
                status,
                user_id
            FROM calendar_events 
            WHERE (
                (DATE(start_date) BETWEEN :extendedStartDate AND :extendedEndDate)
                OR (DATE(end_date) BETWEEN :extendedStartDate AND :extendedEndDate)
                OR (:extendedStartDate BETWEEN DATE(start_date) AND DATE(end_date))
                OR (:extendedEndDate BETWEEN DATE(start_date) AND DATE(end_date))
            )
            AND status != 'cancelled'
            AND user_id = :user_id
            ORDER BY start_date, priority";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':extendedStartDate' => $extendedStartDate,
        ':extendedEndDate' => $extendedEndDate,
        ':user_id' => $user_id
    ]);
    
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // فرمت‌دهی رویدادها برای نمایش در FullCalendar
    $formattedEvents = [];
    foreach ($events as $event) {
        // تعیین رنگ رویداد
        $color = $event['color'] ?: getEventColor($event['type']);
        
        // ساخت تاریخ‌های FullCalendar
        $startDateTime = $event['start_date'];
        $endDateTime = $event['end_date'];
        
        // اگر زمان مشخص باشد، اضافه کن
        if ($event['start_time'] && $event['start_time'] != '00:00:00') {
            $startDateTime .= 'T' . $event['start_time'];
        }
        
        if ($event['end_time'] && $event['end_time'] != '00:00:00') {
            $endDateTime .= 'T' . $event['end_time'];
        }
        
        $formattedEvents[] = [
            'id' => (int)$event['id'],
            'title' => htmlspecialchars($event['title'], ENT_QUOTES, 'UTF-8'),
            'description' => htmlspecialchars($event['description'] ?? '', ENT_QUOTES, 'UTF-8'),
            'type' => $event['type'],
            'start' => $startDateTime,
            'end' => $endDateTime,
            'allDay' => (bool)$event['all_day'],
            'color' => $color,
            'textColor' => '#ffffff',
            'backgroundColor' => $color,
            'borderColor' => $color,
            'extendedProps' => [
                'priority' => $event['priority'],
                'location' => $event['location'],
                'status' => $event['status']
            ]
        ];
    }
    
    echo json_encode([
        'success' => true,
        'events' => $formattedEvents,
        'month' => $month,
        'year' => $year,
        'count' => count($formattedEvents),
        'debug' => [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'extendedStartDate' => $extendedStartDate,
            'extendedEndDate' => $extendedEndDate,
            'received_month' => $month,
            'received_year' => $year
        ]
    ], JSON_UNESCAPED_UNICODE);
    
    } catch (Exception $e) {
        error_log("Calendar error: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'خطا در دریافت رویدادها',
            'error' => $e->getMessage(),
            'events' => []
        ], JSON_UNESCAPED_UNICODE);
    }


    
    // تابع برای تعیین رنگ بر اساس نوع رویداد
    function getEventColor($type) {
        $colors = [
            'maintenance' => '#3788d8',
            'inspection' => '#dc3545',
            'work_order' => '#28a745',
            'meeting' => '#6f42c1',
            'training' => '#17a2b8',
            'holiday' => '#6c757d',
            'other' => '#20c997'
        ];
        return $colors[$type] ?? '#3788d8';
    }
?>