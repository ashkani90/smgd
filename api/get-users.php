<?php
// نمایش خطاها فقط برای دیباگ
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// تلاش برای پیدا کردن مسیر صحیح config.php
$possiblePaths = [
    __DIR__ . '/../config.php',           // یک سطح بالاتر
    __DIR__ . '/config.php',              // همین پوشه
    $_SERVER['DOCUMENT_ROOT'] . '/config.php',  // ریشه داکیومنت
    $_SERVER['DOCUMENT_ROOT'] . '/Maintenance-system/config.php', // پروژه خاص
    'C:/xampp/htdocs/config.php',
    'C:/xampp/htdocs/Maintenance-system/config.php',
];

$configLoaded = false;
foreach ($possiblePaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $configLoaded = true;
        break;
    }
}

if (!$configLoaded) {
    echo json_encode([
        'success' => false,
        'message' => 'فایل config.php پیدا نشد',
        'searched_paths' => $possiblePaths
    ]);
    exit;
}

// بررسی وجود اتصال PDO
if (!isset($pdo)) {
    echo json_encode([
        'success' => false,
        'message' => 'اتصال به دیتابیس برقرار نیست'
    ]);
    exit;
}

try {
    // دریافت لیست کاربران
    $sql = "SELECT id, username, full_name, email, phone, role, department, 
                   profile_image, is_active, last_login
            FROM users 
            WHERE id > 0
            ORDER BY id DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
// فرمت کردن داده‌ها
$formattedUsers = [];
foreach ($users as $user) {
    // بررسی و اصلاح آدرس تصویر
    $profileImage = null;
    if (!empty($user['profile_image'])) {
        // اگر آدرس تصویر کامل نیست، مسیر را اصلاح کن
        $imagePath = $user['profile_image'];
        if (!preg_match('/^(http|https|data:)/i', $imagePath)) {
            // فرض می‌کنیم تصاویر در پوشه uploads/profiles/ ذخیره می‌شوند
            $profileImage = '../uploads/profiles/' . $imagePath;
        } else {
            $profileImage = $imagePath;
        }
    }
    
    $formattedUsers[] = [
        'id' => $user['id'],
        'username' => $user['username'],
        'fullname' => $user['full_name'],
        'email' => $user['email'] ?? '',
        'phone' => $user['phone'] ?? '',
        'role' => $user['role'],
        'department' => $user['department'] ?? '',
        'isActive' => (bool)$user['is_active'],
        'lastLogin' => $user['last_login'] ? date('Y/m/d - H:i', strtotime($user['last_login'])) : 'هرگز وارد نشده',
        'profileImage' => $profileImage
    ];
}
    
    echo json_encode([
        'success' => true,
        'data' => $formattedUsers
    ], JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'خطا در دریافت اطلاعات از دیتابیس: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'خطای داخلی: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>