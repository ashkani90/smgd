<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// تنظیمات اتصال به دیتابیس پروژه شما
$host = "localhost";
$db_name = "smgd_db"; // نام دیتابیس خود را تنظیم کنید
$username = "root"; // نام کاربری دیتابیس
$password = ""; // کلمه عبور دیتابیس

try {
    $db = new PDO("mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8", $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    echo json_encode(["success" => false, "error" => "خطا در اتصال به دیتابیس: " . $exception->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// ==================== بخش پردازش درخواست‌های GET ====================
if ($method === 'GET') {
// دریافت لیست کامل کارتابل معوقه هر نقش
if (isset($_GET['pending_list_for_role'])) {
    $role = $_GET['pending_list_for_role'];
    $statusMap = [
        'operator1' => 'waiting_qc',
        'operator2' => 'waiting_warehouse',
        'operator3' => 'waiting_tech'
    ];
    $targetStatus = isset($statusMap[$role]) ? $statusMap[$role] : '';

    // همچنین پشتیبانی از نقش‌های مستقیم دیتابیس
    if ($role === 'Quality-Manager') $targetStatus = 'waiting_qc';
    if ($role === 'Warehouse-Manager') $targetStatus = 'waiting_warehouse';
    if ($role === 'Factory-manager') $targetStatus = 'waiting_tech';

    if (empty($targetStatus)) {
        echo json_encode(["success" => true, "data" => []]);
        exit;
    }

    try {
        // دریافت همه گزارش‌های در انتظار برای این نقش
        $stmt = $db->prepare("SELECT * FROM defect_reports WHERE status = ? ORDER BY id DESC");
        $stmt->execute([$targetStatus]);
        $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["success" => true, "data" => $reports]);
    } catch(Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
    exit;
}

    // دریافت اولین کارتابل معوقه هر نقش جهت لود مستقیم در فرم
    if (isset($_GET['pending_for_role'])) {
        $role = $_GET['pending_for_role'];
        $statusMap = [
            'operator1' => 'waiting_qc',
            'operator2' => 'waiting_warehouse',
            'operator3' => 'waiting_tech'
        ];
        $targetStatus = isset($statusMap[$role]) ? $statusMap[$role] : '';

    // همچنین پشتیبانی از نقش‌های مستقیم دیتابیس
    if ($role === 'Quality-Manager') $targetStatus = 'waiting_qc';
    if ($role === 'Warehouse-Manager') $targetStatus = 'waiting_warehouse';
    if ($role === 'Factory-manager') $targetStatus = 'waiting_tech';
            
        if (empty($targetStatus)) {
            echo json_encode(["success" => true, "data" => null]);
            exit;
        }

        try {
            $stmt = $db->prepare("SELECT * FROM defect_reports WHERE status = ? ORDER BY id DESC LIMIT 1");
            $stmt->execute([$targetStatus]);
            $report = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode(["success" => true, "data" => $report ? $report : null]);
        } catch(Exception $e) {
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
        exit;
    }
}

// ==================== بخش پردازش درخواست‌های POST ====================
if ($method === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input) {
        echo json_encode(["success" => false, "error" => "فرمت داده‌ها نامعتبر است."]);
        exit;
    }

    $step = isset($input['step']) ? (int)$input['step'] : 1;


//========================== مرحله 1 =======================================



// --- مرحله ۱: ثبت اولیه توسط گزارش‌گر و ارجاع به کنترل کیفیت ---
if ($step === 1) {
    try {
        // دریافت user_id کاربر لاگین شده از session
        $user_id = $_SESSION['user_id'] ?? 0;
        
        // اگر user_id در session نبود، از localStorage که در فرم ارسال می‌شود بگیر
        if ($user_id == 0 && isset($input['user_id'])) {
            $user_id = $input['user_id'];
        }
        
        $sql = "INSERT INTO defect_reports (
            report_number, report_date, reporter_name, employee_code, reporter_department,
            vehicle_type, vehicle_model, part_code, part_name_fa, part_name_en,
            defect_quantity, unit_of_measure, detection_location, is_replaced,
            part_image, defect_type, defect_description, possible_cause, status, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'waiting_qc', ?)";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            $input['reportNumber'], $input['reportDate'], $input['reporterName'], $input['employeeCode'], $input['reporterDepartment'],
            $input['vehicleType'], $input['vehicleModel'], $input['partCode'], $input['partNameFa'], $input['partNameEn'] ?? '',
            $input['defectQuantity'], $input['unitOfMeasure'] ?? '', $input['detectionLocation'], $input['isReplaced'],
            $input['partImage'] ?? '', $input['defectType'], $input['defectDescription'], $input['possibleCause'] ?? '',
            $user_id
        ]);

        $reportId = $db->lastInsertId();
        $reportNumber = $input['reportNumber'];
        
        // دریافت نام گزارش‌دهنده از دیتابیس (برای اطمینان از صحت)
        $reporterNameFromDb = $input['reporterName']; // مقدار مستقیم از فرم
        $reporterRole = 'reporter';
        
        // ============================================
        // اعلان شماره 1: برای خود کاربر گزارش‌دهنده (تأیید ثبت گزارش)
        // ============================================
        $notifSql1 = "INSERT INTO notifications (
            user_id, title, message, type, priority, related_module, related_id, 
            target_role, sender_id, sender_name, sender_role, reporter_name, created_at, expires_at
        ) VALUES (
            ?, 'تأیید ثبت گزارش عدم انطباق', ?, 'alert', 'high', 'defect_reports', ?,
            ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY)
        )";

        $notifStmt1 = $db->prepare($notifSql1);
        $notifStmt1->execute([
            $user_id,                                    // user_id گیرنده = خود گزارش‌دهنده
            "گزارش شما با شماره " . $reportNumber . " با موفقیت ثبت و به کنترل کیفیت ارجاع شد.",
            $reportId,                                   // related_id
            'reporter',                                  // target_role
            $user_id,                                    // sender_id (خود کاربر)
            $input['reporterName'],                      // sender_name
            'reporter',                                  // sender_role
            $input['reporterName']                       // reporter_name (نام گزارش‌دهنده اصلی)
        ]);

        // ============================================
        // اعلان شماره 2: برای مدیر کیفیت (Quality-Manager)
        // ============================================
        
        // ساخت پیام کامل با نام گزارش‌دهنده اصلی
        $fullMessage = "گزارش قطعه معیوب شماره " . $reportNumber . " ثبت گردید.\n" .
                    "گزارش‌دهنده: " . $input['reporterName'] . "\n" .
                    "قطعه: " . $input['partNameFa'] . "\n" .
                    "نوع عیب: " . $input['defectType'];

        // دریافت user_idهای دارای نقش Quality-Manager
        $qualityManagersStmt = $db->prepare("SELECT id, full_name FROM users WHERE role = 'Quality-Manager' OR role = 'quality_manager'");
        $qualityManagersStmt->execute();
        $qualityManagers = $qualityManagersStmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($qualityManagers)) {
            // اگر کاربر خاصی با این نقش وجود نداشت، یک اعلان عمومی برای نقش Quality-Manager ایجاد کن
            $notifSql2 = "INSERT INTO notifications (
                title, message, type, priority, related_module, related_id, 
                target_role, sender_id, sender_name, sender_role, reporter_name, created_at, expires_at
            ) VALUES (
                'گزارش عدم انطباق جدید', ?, 'alert', 'high', 'defect_reports', ?,
                'Quality-Manager', ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY)
            )";

            $notifStmt2 = $db->prepare($notifSql2);
            $notifStmt2->execute([
                $fullMessage,                            // message
                $reportId,                               // related_id
                $user_id,                                // sender_id
                $input['reporterName'],                  // sender_name
                'reporter',                              // sender_role
                $input['reporterName']                   // reporter_name
            ]);
        } else {
            // برای هر مدیر کیفیت، یک اعلان جداگانه ایجاد کن
            foreach ($qualityManagers as $manager) {
                $notifSql2 = "INSERT INTO notifications (
                    user_id, title, message, type, priority, related_module, related_id, 
                    target_role, sender_id, sender_name, sender_role, reporter_name, created_at, expires_at
                ) VALUES (
                    ?, 'گزارش عدم انطباق جدید', ?, 'alert', 'high', 'defect_reports', ?,
                    'Quality-Manager', ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY)
                )";

                $notifStmt2 = $db->prepare($notifSql2);
                $notifStmt2->execute([
                    $manager['id'],                      // user_id گیرنده
                    $fullMessage,                        // message
                    $reportId,                           // related_id
                    $user_id,                            // sender_id
                    $input['reporterName'],              // sender_name
                    'reporter',                          // sender_role
                    $input['reporterName']               // reporter_name (نام گزارش‌دهنده اصلی)
                ]);
            }
        }

        echo json_encode(["success" => true, "message" => "گزارش با موفقیت ثبت و به کنترل کیفیت ارجاع شد."]);
    } catch(Exception $e) {
        echo json_encode(["success" => false, "error" => "خطا در ثبت اطلاعات: " . $e->getMessage()]);
    }
    exit;
}


//=========================== مرجله 2 =======================================


// --- مرحله ۲: ثبت توسط کنترل کیفیت (operator1) و ارجاع به انباردار ---
if ($step === 2) {
    try {
        $reportNumber = $input['reportNumber'];
        
        // دریافت اطلاعات اصلی گزارش (از جمله reporter_name اصلی)
        $reportStmt = $db->prepare("SELECT id, reporter_name FROM defect_reports WHERE report_number = ?");
        $reportStmt->execute([$reportNumber]);
        $reportInfo = $reportStmt->fetch(PDO::FETCH_ASSOC);
        $reportId = $reportInfo['id'];
        $originalReporterName = $reportInfo['reporter_name'];
        
        // دریافت user_id کاربر لاگین شده (کنترل کیفیت)
        $operator1_id = $_SESSION['user_id'] ?? 0;
        if ($operator1_id == 0 && isset($input['user_id'])) {
            $operator1_id = $input['user_id'];
        }
        
        // دریافت نام و نقش کاربر کنترل کیفیت
        $sender_fullname = 'کنترل کیفیت';
        $sender_role = 'operator1';
        if ($operator1_id > 0) {
            $userStmt = $db->prepare("SELECT full_name, role FROM users WHERE id = ?");
            $userStmt->execute([$operator1_id]);
            $userInfo = $userStmt->fetch(PDO::FETCH_ASSOC);
            if ($userInfo) {
                $sender_fullname = $userInfo['full_name'];
                $sender_role = $userInfo['role'];
            }
        }
        
        // ۱. بروزرسانی گزارش عدم انطباق
        $sql = "UPDATE defect_reports SET 
                qc_detection_location = ?, part_status = ?, defect_reason = ?, quality_notes = ?, 
                status = 'waiting_warehouse', qc_submitted_at = CURRENT_TIMESTAMP 
                WHERE report_number = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            $input['qcDetectionLocation'], $input['partStatus'], $input['defectReason'], $input['qualityNotes'], $reportNumber
        ]);

        // ۲. علامت‌گذاری اعلان قبلی مربوط به کنترل کیفیت به عنوان خوانده شده
        $updateNotif = $db->prepare("UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE related_id = ? AND target_role = 'operator1'");
        $updateNotif->execute([$reportId]);
        
        // ۳. علامت‌گذاری اعلان Quality-Manager به عنوان خوانده شده
        $updateNotif2 = $db->prepare("UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE related_id = ? AND target_role = 'Quality-Manager'");
        $updateNotif2->execute([$reportId]);

        // ۴. ایجاد اعلان جدید برای انباردار (operator2)
        $warehouseStmt = $db->prepare("SELECT id FROM users WHERE role = 'Warehouse-Manager' OR role = 'operator2'");
        $warehouseStmt->execute();
        $warehouseUsers = $warehouseStmt->fetchAll(PDO::FETCH_ASSOC);

        $messageText = "کیفیت گزارش عدم انطباق " . $reportNumber . " بررسی شد. لطفاً موجودی و پارت نامبر انبار را مشخص کنید.";

        if (empty($warehouseUsers)) {
            $notifSql = "INSERT INTO notifications (title, message, type, priority, related_id, target_role, sender_id, sender_name, sender_role, reporter_name, created_at) 
                         VALUES (?, ?, 'parts', 'medium', ?, 'operator2', ?, ?, ?, ?, NOW())";
            $notifStmt = $db->prepare($notifSql);
            $notifStmt->execute([
                "ارزیابی عدم انطباق کیفی",
                $messageText,
                $reportId,
                $operator1_id,
                $sender_fullname,
                $sender_role,
                $originalReporterName
            ]);
        } else {
            foreach ($warehouseUsers as $warehouseUser) {
                $notifSql = "INSERT INTO notifications (user_id, title, message, type, priority, related_id, target_role, sender_id, sender_name, sender_role, reporter_name, created_at) 
                             VALUES (?, ?, ?, 'parts', 'medium', ?, 'operator2', ?, ?, ?, ?, NOW())";
                $notifStmt = $db->prepare($notifSql);
                $notifStmt->execute([
                    $warehouseUser['id'],
                    "ارزیابی عدم انطباق کیفی",
                    $messageText,
                    $reportId,
                    $operator1_id,
                    $sender_fullname,
                    $sender_role,
                    $originalReporterName
                ]);
            }
        }

        echo json_encode(["success" => true, "message" => "گزارش کنترل کیفیت ثبت و به انباردار ارجاع شد."]);
    } catch(Exception $e) {
        echo json_encode(["success" => false, "error" => "خطا: " . $e->getMessage()]);
    }
    exit;
}



//============================== مرحله 3 ========================================


    // --- مرحله ۳: ثبت توسط انباردار (operator3) و ارجاع به مدیر کارخانه ---
    if ($step === 3) {
        try {
            $reportNumber = $input['reportNumber'];

            // دریافت اطلاعات اصلی گزارش (از جمله reporter_name اصلی)
            $reportStmt = $db->prepare("SELECT id, reporter_name FROM defect_reports WHERE report_number = ?");
            $reportStmt->execute([$reportNumber]);
            $reportInfo = $reportStmt->fetch(PDO::FETCH_ASSOC);
            $reportId = $reportInfo['id'];
            $originalReporterName = $reportInfo['reporter_name'];

            // دریافت user_id کاربر لاگین شده (انباردار)
            $operator2_id = $_SESSION['user_id'] ?? 0;
            if ($operator2_id == 0 && isset($input['user_id'])) {
                $operator2_id = $input['user_id'];
            }
            
            // دریافت نام و نقش کاربر انباردار
            $sender_fullname = 'انباردار';
            $sender_role = 'operator3';
            if ($operator2_id > 0) {
                $userStmt = $db->prepare("SELECT full_name, role FROM users WHERE id = ?");
                $userStmt->execute([$operator2_id]);
                $userInfo = $userStmt->fetch(PDO::FETCH_ASSOC);
                if ($userInfo) {
                    $sender_fullname = $userInfo['full_name'];
                    $sender_role = $userInfo['role'];
                }
            }
            
            $sql = "UPDATE defect_reports SET 
                    tracking_code = ?, inventory_status = ?, warehouse_notes = ?, 
                    status = 'waiting_tech', warehouse_submitted_at = CURRENT_TIMESTAMP 
                    WHERE report_number = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                $input['trackingCode'], $input['inventoryStatus'], $input['warehouseNotes'], $reportNumber
            ]);

            $reportStmt = $db->prepare("SELECT id FROM defect_reports WHERE report_number = ?");
            $reportStmt->execute([$reportNumber]);
            $reportId = $reportStmt->fetchColumn();

            // علامت‌گذاری اعلان قبلی انباردار به عنوان خوانده شده
            $updateNotif = $db->prepare("UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE related_id = ? AND (target_role = 'operator2' OR target_role = 'Warehouse-Manager')");
            $updateNotif->execute([$reportId]);

            // ایجاد اعلان جدید برای مدیر کارخانه / کمیته فنی (operator3)
            // دریافت user_idهای دارای نقش مدیر کارخانه یا operator3
            $techStmt = $db->prepare("SELECT id, full_name FROM users WHERE  role = 'Factory-manager'");
            $techStmt->execute();
            $techUsers = $techStmt->fetchAll(PDO::FETCH_ASSOC);

        $messageText = "گزارش قطعه معیوب " . $reportNumber . " توسط انبار بررسی شد.\n" .
                      "لطفاً تصمیم نگیرید:\n" .
                      "- نتیجه بررسی فنی\n" .
                      "- تعیین تکلیف نهایی\n" .
                      "- مسئول اجرا و مهلت";

        if (empty($techUsers)) {
            // اعلان عمومی برای نقش operator3
            $notifSql = "INSERT INTO notifications (
                title, message, type, priority, related_id, target_role, 
                sender_id, sender_name, sender_role, reporter_name, created_at
            ) VALUES (
                'تعیین تکلیف عدم انطباق قطعه', ?, 'alert', 'high', ?, 'operator3', 
                ?, ?, ?, ?, NOW()
            )";
            $notifStmt = $db->prepare($notifSql);
            $notifStmt->execute([
                $messageText,
                $reportId,
                $operator2_id,
                $sender_fullname,
                $sender_role,
                $originalReporterName
            ]);
        } else {
            // برای هر مدیر فنی، یک اعلان جداگانه ایجاد کن
            foreach ($techUsers as $techUser) {
                $notifSql = "INSERT INTO notifications (
                    user_id, title, message, type, priority, related_id, target_role, 
                    sender_id, sender_name, sender_role, reporter_name, created_at
                ) VALUES (
                    ?, 'تعیین تکلیف عدم انطباق قطعه', ?, 'alert', 'high', ?, 'operator3', 
                    ?, ?, ?, ?, NOW()
                )";
                $notifStmt = $db->prepare($notifSql);
                $notifStmt->execute([
                    $techUser['id'],
                    $messageText,
                    $reportId,
                    $operator2_id,
                    $sender_fullname,
                    $sender_role,
                    $originalReporterName
                ]);
            }
        }

            echo json_encode(["success" => true, "message" => "گزارش انبار ثبت و به مدیر کارخانه ارجاع شد."]);
        } catch(Exception $e) {
            echo json_encode(["success" => false, "error" => "خطا: " . $e->getMessage()]);
        }
        exit;
    }

    // --- مرحله ۴: ثبت نهایی و تعیین تکلیف توسط کمیته فنی (operator3) ---
    if ($step === 4) {
        try {
            $reportNumber = $input['reportNumber'];
            
            // دریافت user_id کاربر لاگین شده (مدیر فنی)
            $operator3_id = $_SESSION['user_id'] ?? 0;
            if ($operator3_id == 0 && isset($input['user_id'])) {
                $operator3_id = $input['user_id'];
            }
            
            // دریافت نام و نقش کاربر مدیر فنی
            $sender_fullname = 'مدیر کارخانه';
            $sender_role = 'operator3';
            if ($operator3_id > 0) {
                $userStmt = $db->prepare("SELECT full_name, role FROM users WHERE id = ?");
                $userStmt->execute([$operator3_id]);
                $userInfo = $userStmt->fetch(PDO::FETCH_ASSOC);
                if ($userInfo) {
                    $sender_fullname = $userInfo['full_name'];
                    $sender_role = $userInfo['role'];
                }
            }
            
            $sql = "UPDATE defect_reports SET 
                    tech_review_result = ?, final_decision = ?, responsible_party = ?, 
                    deadline_date = ?, corrective_action_no = ?, 
                    status = 'completed', tech_submitted_at = CURRENT_TIMESTAMP 
                    WHERE report_number = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                $input['techReviewResult'], $input['finalDecision'], $input['responsibleParty'], 
                $input['deadlineDate'], $input['correctiveActionNo'], $reportNumber
            ]);

            $reportStmt = $db->prepare("SELECT id FROM defect_reports WHERE report_number = ?");
            $reportStmt->execute([$reportNumber]);
            $reportId = $reportStmt->fetchColumn();

            // علامت‌گذاری اعلان قبلی مدیر کارخانه به عنوان خوانده شده
            $updateNotif = $db->prepare("UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE related_id = ? AND (target_role = 'operator3' OR target_role = 'manager' OR target_role = 'factory_manager')");
            $updateNotif->execute([$reportId]);
            
            // ایجاد اعلان تکمیل برای گزارش‌دهنده اولیه (اختیاری)
            $reporterStmt = $db->prepare("SELECT user_id FROM defect_reports WHERE id = ?");
            $reporterStmt->execute([$reportId]);
            $reporterId = $reporterStmt->fetchColumn();
            
            if ($reporterId) {
                $notifSql = "INSERT INTO notifications (user_id, title, message, type, priority, related_id, target_role, sender_id, sender_name, sender_role, created_at) 
                             VALUES (?, 'تکمیل گزارش عدم انطباق', ?, 'info', 'medium', ?, 'reporter', ?, ?, ?, NOW())";
                $notifStmt = $db->prepare($notifSql);
                $notifStmt->execute([
                    $reporterId,
                    "گزارش عدم انطباق شماره " . $reportNumber . " با موفقیت تکمیل و بایگانی شد. تصمیم نهایی: " . $input['finalDecision'],
                    $reportId,
                    $operator3_id,
                    $sender_fullname,
                    $sender_role
                ]);
            }

            echo json_encode(["success" => true, "message" => "گزارش با موفقیت نهایی و بایگانی شد."]);
        } catch(Exception $e) {
            echo json_encode(["success" => false, "error" => "خطا: " . $e->getMessage()]);
        }
        exit;
    }
}
?>