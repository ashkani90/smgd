<?php
// upload-attachments.php
header('Content-Type: application/json; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

// لاگ برای دیباگ
$logFile = __DIR__ . '/upload_debug.txt';
file_put_contents($logFile, "=== آپلود فایل در " . date('Y-m-d H:i:s') . " ===\n", FILE_APPEND);

session_start();

require_once 'config.php';

// بررسی وجود فایل
if (!isset($_FILES['attachments'])) {
    file_put_contents($logFile, "❌ فایلی ارسال نشده است\n", FILE_APPEND);
    echo json_encode([
        'success' => false,
        'message' => 'فایلی برای آپلود انتخاب نشده است'
    ]);
    exit;
}

// بررسی وجود work_order_id
$work_order_id = isset($_POST['work_order_id']) ? (int)$_POST['work_order_id'] : 0;
if ($work_order_id === 0) {
    file_put_contents($logFile, "❌ work_order_id وجود ندارد\n", FILE_APPEND);
    echo json_encode([
        'success' => false,
        'message' => 'شناسه دستور کار مشخص نیست'
    ]);
    exit;
}

$uploaded_files = [];

// تنظیمات آپلود - مسیر مطلق
$upload_dir = dirname(__DIR__) . '/uploads/work_requests/';
$max_file_size = 10 * 1024 * 1024; // 10MB
$allowed_types = [
    'image/jpeg', 
    'image/png', 
    'image/jpg', 
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/rtf'
];

file_put_contents($logFile, "📂 مسیر آپلود: " . $upload_dir . "\n", FILE_APPEND);

// ایجاد پوشه آپلود اگر وجود ندارد
if (!file_exists($upload_dir)) {
    file_put_contents($logFile, "📁 ایجاد پوشه آپلود...\n", FILE_APPEND);
    if (!mkdir($upload_dir, 0755, true)) {
        file_put_contents($logFile, "❌ خطا در ایجاد پوشه\n", FILE_APPEND);
        echo json_encode([
            'success' => false,
            'message' => 'خطا در ایجاد پوشه آپلود'
        ]);
        exit;
    }
}

// بررسی قابل نوشتن بودن پوشه
if (!is_writable($upload_dir)) {
    file_put_contents($logFile, "❌ پوشه آپلود قابل نوشتن نیست\n", FILE_APPEND);
    // تلاش برای تغییر دسترسی
    chmod($upload_dir, 0755);
}

// پردازش هر فایل
foreach ($_FILES['attachments']['tmp_name'] as $key => $tmp_name) {
    $file_name = $_FILES['attachments']['name'][$key];
    $file_size = $_FILES['attachments']['size'][$key];
    $file_type = $_FILES['attachments']['type'][$key];
    $file_error = $_FILES['attachments']['error'][$key];
    
    file_put_contents($logFile, "📄 فایل: $file_name - سایز: $file_size - نوع: $file_type\n", FILE_APPEND);
    
    // بررسی خطای آپلود
    if ($file_error !== UPLOAD_ERR_OK) {
        $error_message = '';
        switch ($file_error) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                $error_message = 'حجم فایل بیش از حد مجاز است';
                break;
            case UPLOAD_ERR_PARTIAL:
                $error_message = 'فایل ناقص آپلود شده است';
                break;
            case UPLOAD_ERR_NO_FILE:
                $error_message = 'فایلی آپلود نشده است';
                break;
            default:
                $error_message = 'خطای ناشناخته در آپلود';
        }
        file_put_contents($logFile, "❌ خطای آپلود: $error_message\n", FILE_APPEND);
        continue;
    }
    
    // بررسی سایز فایل
    if ($file_size > $max_file_size) {
        file_put_contents($logFile, "❌ حجم فایل بیش از حد مجاز: $file_size > $max_file_size\n", FILE_APPEND);
        continue;
    }
    
    // بررسی نوع فایل
    if (!in_array($file_type, $allowed_types)) {
        file_put_contents($logFile, "❌ نوع فایل نامعتبر: $file_type\n", FILE_APPEND);
        continue;
    }
    
    // ایجاد نام منحصر به فرد برای فایل
    $file_extension = pathinfo($file_name, PATHINFO_EXTENSION);
    $unique_name = uniqid() . '_' . date('Ymd_His') . '.' . $file_extension;
    $file_path = $upload_dir . $unique_name;
    
    file_put_contents($logFile, "💾 ذخیره فایل در: $file_path\n", FILE_APPEND);
    
    // انتقال فایل
    if (move_uploaded_file($tmp_name, $file_path)) {
        file_put_contents($logFile, "✅ فایل با موفقیت آپلود شد\n", FILE_APPEND);
        
        // تنظیم دسترسی فایل
        chmod($file_path, 0644);
        
        // ذخیره اطلاعات در پایگاه داده
        $sql = "INSERT INTO attachments (
            work_order_id,
            file_name,
            file_path,
            file_size,
            file_type,
            uploaded_at
        ) VALUES (?, ?, ?, ?, ?, NOW())";
        
        $stmt = $conn->prepare($sql);
        if ($stmt) {
            $stmt->bind_param(
                'issss',
                $work_order_id,
                $file_name,
                $unique_name,
                $file_size,
                $file_type
            );
            
            if ($stmt->execute()) {
                $uploaded_files[] = [
                    'name' => $file_name,
                    'path' => $unique_name,
                    'size' => $file_size,
                    'type' => $file_type,
                    'id' => $stmt->insert_id
                ];
                file_put_contents($logFile, "✅ اطلاعات در دیتابیس ثبت شد - ID: " . $stmt->insert_id . "\n", FILE_APPEND);
            } else {
                file_put_contents($logFile, "❌ خطا در ثبت دیتابیس: " . $conn->error . "\n", FILE_APPEND);
            }
            $stmt->close();
        } else {
            file_put_contents($logFile, "❌ خطا در آماده‌سازی کوئری: " . $conn->error . "\n", FILE_APPEND);
        }
    } else {
        file_put_contents($logFile, "❌ خطا در انتقال فایل\n", FILE_APPEND);
    }
}

file_put_contents($logFile, "📤 تعداد فایل‌های آپلود شده: " . count($uploaded_files) . "\n", FILE_APPEND);

if (!empty($uploaded_files)) {
    echo json_encode([
        'success' => true,
        'message' => count($uploaded_files) . ' فایل با موفقیت آپلود شد',
        'files' => $uploaded_files
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'هیچ فایلی آپلود نشد'
    ], JSON_UNESCAPED_UNICODE);
}

$conn->close();
?>