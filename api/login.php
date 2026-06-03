<?php
    // api/login.php
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST');
    header('Access-Control-Allow-Headers: Content-Type');

    // فعال کردن نمایش خطاها
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);

    // افزودن هدر برای دیباگ
    header('Content-Type: text/html; charset=utf-8');

    require_once 'config.php';

    // خواندن داده‌های ارسالی
    $data = json_decode(file_get_contents('php://input'), true);

    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    $remember = $data['remember'] ?? false;

    // بررسی ورودی‌ها
    if (empty($username) || empty($password)) {
        echo json_encode([
            'success' => false,
            'message' => 'لطفاً نام کاربری و رمز عبور را وارد کنید'
        ]);
        exit;
    }

    try {
        // 1. بررسی وجود کاربر - استفاده از ستون‌های صحیح
        $stmt = $pdo->prepare("SELECT id, username, password_hash, full_name, email, role, department, profile_image FROM users WHERE username = ? AND is_active = 1");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            // ثبت تلاش ناموفق - ستون success به جای successful
            $ip = $_SERVER['REMOTE_ADDR'];
            $stmt = $pdo->prepare("INSERT INTO login_attempts (username, ip_address, success, attempt_time) VALUES (?, ?, 0, NOW())");
            $stmt->execute([$username, $ip]);
            
            echo json_encode([
                'success' => false,
                'message' => 'نام کاربری یا رمز عبور اشتباه است'
            ]);
            exit;
        }
        
        // 2. بررسی رمز عبور
        if (!password_verify($password, $user['password_hash'])) {
            // ثبت تلاش ناموفق
            $ip = $_SERVER['REMOTE_ADDR'];
            $stmt = $pdo->prepare("INSERT INTO login_attempts (username, ip_address, success, attempt_time) VALUES (?, ?, 0, NOW())");
            $stmt->execute([$username, $ip]);
            
            echo json_encode([
                'success' => false,
                'message' => 'نام کاربری یا رمز عبور اشتباه است'
            ]);
            exit;
        }
        
        // 3. دریافت دسترسی‌های کاربر
        // ابتدا بررسی کنید چه ستون‌هایی در جدول user_permissions وجود دارد
        $stmt = $pdo->prepare("SHOW COLUMNS FROM user_permissions LIKE 'permission'");
        $stmt->execute();
        $hasPermissionColumn = $stmt->fetch();
        
        if ($hasPermissionColumn) {
            // اگر ستون permission وجود دارد
            $stmt = $pdo->prepare("SELECT permission FROM user_permissions WHERE user_id = ?");
        } else {
            // اگر ستون permission وجود ندارد، از module استفاده کن
            $stmt = $pdo->prepare("SELECT module FROM user_permissions WHERE user_id = ? AND can_view = 1");
        }
        
        $stmt->execute([$user['id']]);
        $permissions = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // 4. ثبت تلاش موفق
        $ip = $_SERVER['REMOTE_ADDR'];
        $stmt = $pdo->prepare("INSERT INTO login_attempts (username, ip_address, success, attempt_time) VALUES (?, ?, 1, NOW())");
        $stmt->execute([$username, $ip]);
        
        // 5. آپدیت زمان آخرین لاگین
        $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        // 6. تولید توکن و ذخیره در session
        $token = bin2hex(random_bytes(32));
        $_SESSION['user_token'] = $token;
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
        
        // 7. ذخیره توکن در دیتابیس اگر Remember Me انتخاب شده
        $rememberToken = null;
        if ($remember) {
            $rememberToken = bin2hex(random_bytes(32));
            $expiry = date('Y-m-d H:i:s', strtotime('+30 days'));
            
            $stmt = $pdo->prepare("UPDATE users SET remember_token = ?, token_expiry = ? WHERE id = ?");
            $stmt->execute([$rememberToken, $expiry, $user['id']]);
        }
        
        // 8. برگرداندن اطلاعات کاربر
        echo json_encode([
            'success' => true,
            'message' => 'ورود موفقیت‌آمیز بود',
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'fullname' => $user['full_name'], // توجه: ستون full_name است
                'phone' => $user['phone'] ?? '', // این خط را اضافه کنید
                'email' => $user['email'],
                'role' => $user['role'],
                'department' => $user['department'],
                'profile_image' => $user['profile_image'] ?? '' // این خط را اضافه کنید
            ],
            'permissions' => $permissions,
            'token' => $token,
            'remember_token' => $rememberToken
        ]);
        
    } 
    catch(PDOException $e) {
        error_log("Login error: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'خطا در سرور، لطفاً بعداً تلاش کنید',
            'error' => $e->getMessage()
        ]);
    }
?>