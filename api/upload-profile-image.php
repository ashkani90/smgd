<?php
header('Content-Type: application/json');
session_start();

// بررسی احراز هویت
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'احراز هویت نشده']);
    exit;
}

// بررسی وجود فایل
if (!isset($_FILES['profile_image']) || $_FILES['profile_image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'error' => 'فایلی ارسال نشده']);
    exit;
}

$file = $_FILES['profile_image'];
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$maxSize = 2 * 1024 * 1024; // 2MB

// اعتبارسنجی نوع فایل
if (!in_array($file['type'], $allowedTypes)) {
    echo json_encode(['success' => false, 'error' => 'فرمت فایل مجاز نیست (jpg, png, gif, webp)']);
    exit;
}

// اعتبارسنجی حجم فایل
if ($file['size'] > $maxSize) {
    echo json_encode(['success' => false, 'error' => 'حجم فایل بیشتر از 2 مگابایت است']);
    exit;
}

// ایجاد نام یکتا برای فایل
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = uniqid() . '_' . time() . '.' . $extension;
$uploadPath = '../images/profiles/' . $filename;

// ایجاد پوشه اگر وجود ندارد
if (!is_dir('../images/profiles/')) {
    mkdir('../images/profiles/', 0777, true);
}

// انتقال فایل
if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
    // برگرداندن مسیر نسبی برای ذخیره در دیتابیس
    // گزینه 1: فقط نام فایل
    $relativePath = $filename;
    
    // گزینه 2: مسیر کامل نسبی (باز کردن کامنت اگر نیاز دارید)
    // $relativePath = 'images/profiles/' . $filename;
    
    echo json_encode([
        'success' => true,
        'file_path' => $relativePath,
        'message' => 'تصویر با موفقیت آپلود شد'
    ]);
} else {
    echo json_encode(['success' => false, 'error' => 'خطا در ذخیره فایل']);
}
?>