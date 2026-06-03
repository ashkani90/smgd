<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// اطلاعات اتصال به دیتابیس
$localhost = true;

if($localhost) {
    $host = "localhost";
    $dbname = "if0_40663660_automotive_maintenance";
    $username = "root";
    $password = "";
    $charset = 'utf8mb4';
} else {
    $host = "sql313.infinityfree.com";
    $dbname = "if0_40663660_automotive_maintenance";
    $username = "if0_40663660";
    $password = "NTmpd1353";
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", 
                   $username, 
                   $password,
                   [
                       PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                       PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                       PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_persian_ci"
                   ]);
} catch(PDOException $e) {
    error_log("Database connection error: " . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'message' => 'خطا در اتصال به پایگاه داده',
        'debug' => $e->getMessage() // برای دیباگ
    ]);
    exit;
}

// دریافت داده‌های POST
$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'] ?? '';

// اعتبارسنجی ایمیل
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'ایمیل نامعتبر است']);
    exit;
}

// بررسی وجود ایمیل در دیتابیس
$stmt = $pdo->prepare("SELECT id, username, email FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['success' => false, 'message' => 'ایمیل در سیستم ثبت نشده است']);
    exit;
}

// تولید رمز عبور تصادفی
$newPassword = generateRandomPassword(10);

// هش کردن رمز عبور جدید
$hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

// به‌روزرسانی رمز عبور در دیتابیس
$updateStmt = $pdo->prepare("UPDATE users SET password = ?, password_reset_at = NOW() WHERE id = ?");
$updateStmt->execute([$hashedPassword, $user['id']]);

// ارسال ایمیل (در اینجا از یک تابع شبیه‌سازی استفاده می‌کنیم)
$emailSent = sendPasswordResetEmail($user['email'], $user['username'], $newPassword);

if ($emailSent) {
    echo json_encode([
        'success' => true,
        'message' => 'رمز عبور جدید به ایمیل شما ارسال شد. لطفاً ایمیل خود را بررسی کنید.'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'خطا در ارسال ایمیل. لطفاً با پشتیبانی تماس بگیرید.'
    ]);
}

// تابع تولید رمز تصادفی
function generateRandomPassword($length = 10) {
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    $password = '';
    for ($i = 0; $i < $length; $i++) {
        $password .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $password;
}

// تابع ارسال ایمیل (شبیه‌سازی - در عمل باید از یک کتابخانه ایمیل استفاده کنید)
function sendPasswordResetEmail($to, $username, $newPassword) {
    $subject = 'بازیابی رمز عبور - سیستم CMMS';
    $message = "
    <html>
    <head>
        <title>بازیابی رمز عبور</title>
        <style>
            body { font-family: 'Vazirmatn', sans-serif; direction: rtl; text-align: right; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .password-box { background: #e9ecef; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 18px; text-align: center; margin: 20px 0; }
            .warning { color: #dc3545; background: #f8d7da; padding: 10px; border-radius: 5px; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>سیستم جامع CMMS</h2>
            </div>
            <div class='content'>
                <h3>سلام {$username}</h3>
                <p>درخواست بازیابی رمز عبور برای حساب کاربری شما ثبت شده است.</p>
                <p>رمز عبور جدید شما:</p>
                <div class='password-box'>{$newPassword}</div>
                <div class='warning'>
                    <strong>توجه:</strong> لطفاً پس از ورود به سیستم، از بخش پروفایل یا تغییر رمز عبور، رمز خود را تغییر دهید.
                </div>
                <p>با تشکر،<br>تیم پشتیبانی CMMS</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: no-reply@cmms-system.com" . "\r\n";
    
    // در محیط واقعی، این را با استفاده از PHPMailer یا SwiftMailer انجام دهید
    return mail($to, $subject, $message, $headers);
}
?>