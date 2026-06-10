<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// دریافت داده‌های POST
$data = json_decode(file_get_contents('php://input'), true);

// پردازش تصویر پروفایل
$profileImage = null;
if (isset($data['profileImage']) && !empty($data['profileImage'])) {
    // اگر تصویر جدید ارسال شده (نام فایل یا مسیر)
    $profileImage = $data['profileImage'];
} elseif (isset($data['oldProfileImage']) && !empty($data['oldProfileImage'])) {
    // نگهداری تصویر قبلی
    $profileImage = $data['oldProfileImage'];
}

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'داده‌ای دریافت نشد']);
    exit;
}

try {
    $userId = isset($data['id']) && $data['id'] ? (int)$data['id'] : null;
    $fullName = trim($data['fullName'] ?? '');
    $username = trim($data['username'] ?? '');
    $email = $data['email'] ?? '';
    $phone = $data['phone'] ?? '';
    $role = $data['role'] ?? 'technician';
    $department = $data['department'] ?? '';
    $isActive = isset($data['isActive']) ? 1 : 0;
    $password = $data['password'] ?? '';
    $profileImage = $data['profileImage'] ?? '';
    
    // اعتبارسنجی
    if (empty($fullName) || empty($username)) {
        echo json_encode(['success' => false, 'message' => 'نام کامل و نام کاربری الزامی است']);
        exit;
    }
    
    // بررسی وجود نام کاربری تکراری (به جز خود کاربر در حالت ویرایش)
    $checkStmt = $pdo->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
    $checkStmt->execute([$username, $userId ?? 0]);
    if ($checkStmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'این نام کاربری قبلاً ثبت شده است']);
        exit;
    }
    
    if ($userId) {
        // ========== ویرایش کاربر ==========
        if (!empty($password)) {
            // با تغییر رمز عبور
            $hashedPassword = hashPassword($password);
            $sql = "UPDATE users SET 
                    full_name = :full_name,
                    username = :username,
                    email = :email,
                    phone = :phone,
                    role = :role,
                    department = :department,
                    is_active = :is_active,
                    password_hash = :password_hash,
                    profile_image = :profile_image,
                    updated_at = NOW()
                    WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':full_name' => $fullName,
                ':username' => $username,
                ':email' => $email,
                ':phone' => $phone,
                ':role' => $role,
                ':department' => $department,
                ':is_active' => $isActive,
                ':password_hash' => $hashedPassword,
                ':profile_image' => $profileImage,
                ':id' => $userId
            ]);
        } else {
            // بدون تغییر رمز عبور
            $sql = "UPDATE users SET 
                    full_name = :full_name,
                    username = :username,
                    email = :email,
                    phone = :phone,
                    role = :role,
                    department = :department,
                    is_active = :is_active,
                    profile_image = :profile_image,
                    updated_at = NOW()
                    WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':full_name' => $fullName,
                ':username' => $username,
                ':email' => $email,
                ':phone' => $phone,
                ':role' => $role,
                ':department' => $department,
                ':is_active' => $isActive,
                ':profile_image' => $profileImage,
                ':id' => $userId
            ]);
        }
        $message = 'کاربر با موفقیت ویرایش شد';
        
    } else {
        // ========== افزودن کاربر جدید ==========
        
        // بررسی وجود نام کاربری تکراری
        $checkStmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $checkStmt->execute([$username]);
        if ($checkStmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'این نام کاربری قبلاً ثبت شده است']);
            exit;
        }
        
        // تنظیم رمز عبور پیش‌فرض اگر وارد نشده باشد
        $finalPassword = !empty($password) ? $password : '12345678';
        $hashedPassword = hashPassword($finalPassword);
        
        $sql = "INSERT INTO users (full_name, username, email, phone, role, department, is_active, password_hash, profile_image, created_at, updated_at) 
                VALUES (:full_name, :username, :email, :phone, :role, :department, :is_active, :password_hash, :profile_image, NOW(), NOW())";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':full_name' => $fullName,
            ':username' => $username,
            ':email' => $email,
            ':phone' => $phone,
            ':role' => $role,
            ':department' => $department,
            ':is_active' => $isActive,
            ':password_hash' => $hashedPassword,
            ':profile_image' => $profileImage
        ]);
        $message = 'کاربر با موفقیت اضافه شد';
    }
    
    echo json_encode([
        'success' => true,
        'message' => $message
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    error_log("خطا در save-user.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'خطا در ذخیره کاربر: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>