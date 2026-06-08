
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
    // دریافت یک گزارش خاص بر اساس شماره یا شناسه
    if (isset($_GET['report_number'])) {
        try {
            $stmt = $db->prepare("SELECT * FROM defect_reports WHERE report_number = ?");
            $stmt->execute([$_GET['report_number']]);
            $report = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($report) {
                echo json_encode(["success" => true, "data" => $report]);
            } else {
                echo json_encode(["success" => false, "error" => "گزارش یافت نشد."]);
            }
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
                $user_id  // <-- اضافه شود
            ]);

            $reportId = $db->lastInsertId();

            // ایجاد اعلان واقعی در دیتابیس برای کنترل کیفیت (operator1)
// دریافت اطلاعات کامل کاربر لاگین شده از session
$user_id = $_SESSION['user_id'] ?? 0;

// اگر user_id در فرم ارسال شده، از آن استفاده کن
if ($user_id == 0 && isset($input['user_id'])) {
    $user_id = $input['user_id'];
}

// دریافت نام کامل و نقش کاربر از دیتابیس
$sender_fullname = $input['reporterName']; // مقدار پیش‌فرض
$sender_role = 'operator'; // مقدار پیش‌فرض

if ($user_id > 0) {
    $userStmt = $db->prepare("SELECT full_name, role FROM users WHERE id = ?");
    $userStmt->execute([$user_id]);
    $userInfo = $userStmt->fetch(PDO::FETCH_ASSOC);
    if ($userInfo) {
        $sender_fullname = $userInfo['full_name'];
        $sender_role = $userInfo['role'];
    }
}

// ساخت پیام کامل با نام گزارش‌دهنده
                $fullMessage = "گزارش قطعه معیوب شماره " . $input['reportNumber'] . " ثبت گردید.\n" .
                            "گزارش‌دهنده: " . $sender_fullname . " (" . $sender_role . ")\n" .
                            "قطعه: " . $input['partNameFa'] . "\n" .
                            "نوع عیب: " . $input['defectType'];

                        $notifSql = "INSERT INTO notifications (title, message, type, priority, related_module, related_id,target_role, sender_name, sender_role, created_at, expires_at
                        ) VALUES ('گزارش عدم انطباق جدید',?,'alert','high','defect_reports',?,'Quality-Manager',?,?,NOW(),DATE_ADD(NOW(), INTERVAL 7 DAY)
                        )";
                        $notifStmt = $db->prepare($notifSql);
                        $notifStmt->execute([
                            $fullMessage,
                            $reportId,
                            $sender_fullname,   // نام کامل: 
                            $sender_role        // نقش: admin
                ]);

            echo json_encode(["success" => true, "message" => "گزارش با موفقیت ثبت و به کنترل کیفیت ارجاع شد."]);
        } catch(Exception $e) {
            echo json_encode(["success" => false, "error" => "خطا در ثبت اطلاعات: " . $e->getMessage()]);
        }
        exit;
    }

    // --- مرحله ۲: ثبت توسط کنترل کیفیت (operator1) و ارجاع به انباردار ---
    if ($step === 2) {
        try {
            $reportNumber = $input['reportNumber'];
            
            // ۱. بروزرسانی گزارش عدم انطباق
            $sql = "UPDATE defect_reports SET 
                    qc_detection_location = ?, part_status = ?, defect_reason = ?, quality_notes = ?, 
                    status = 'waiting_warehouse', qc_submitted_at = CURRENT_TIMESTAMP 
                    WHERE report_number = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                $input['qcDetectionLocation'], $input['partStatus'], $input['defectReason'], $input['qualityNotes'], $reportNumber
            ]);

            // پیدا کردن شناسه گزارش جهت ثبت در اعلان
            $reportStmt = $db->prepare("SELECT id FROM defect_reports WHERE report_number = ?");
            $reportStmt->execute([$reportNumber]);
            $reportId = $reportStmt->fetchColumn();

            // ۲. علامت‌گذاری اعلان قبلی مربوط به کنترل کیفیت به عنوان خوانده شده
            $updateNotif = $db->prepare("UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE related_id = ? AND target_role = 'operator1'");
            $updateNotif->execute([$reportId]);

            // ۳. ایجاد اعلان جدید برای انباردار (operator2)
            $notifSql = "INSERT INTO notifications (title, message, type, priority, related_id, target_role, sender_name, sender_role) 
                         VALUES (?, ?, 'parts', 'medium', ?, 'operator2', 'کنترل کیفیت', 'operator1')";
            $notifStmt = $db->prepare($notifSql);
            $notifStmt->execute([
                "ارزیابی عدم انطباق کیفی",
                "کیفیت گزارش عدم انطباق " . $reportNumber . " بررسی شد. لطفاً موجودی و پارت نامبر انبار را مشخص کنید.",
                $reportId
            ]);

            echo json_encode(["success" => true, "message" => "گزارش کنترل کیفیت ثبت و به انباردار ارجاع شد."]);
        } catch(Exception $e) {
            echo json_encode(["success" => false, "error" => "خطا: " . $e->getMessage()]);
        }
        exit;
    }

    // --- مرحله ۳: ثبت توسط انباردار (operator2) و ارجاع به مدیر کارخانه ---
    if ($step === 3) {
        try {
            $reportNumber = $input['reportNumber'];
            
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
            $updateNotif = $db->prepare("UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE related_id = ? AND target_role = 'operator2'");
            $updateNotif->execute([$reportId]);

            // ایجاد اعلان جدید برای مدیر کارخانه / کمیته فنی (operator3)
            $notifSql = "INSERT INTO notifications (title, message, type, priority, related_id, target_role, sender_name, sender_role) 
                         VALUES (?, ?, 'maintenance_request', 'critical', ?, 'operator3', 'بخش انبار کالا', 'operator2')";
            $notifStmt = $db->prepare($notifSql);
            $notifStmt->execute([
                "تعیین تکلیف عدم انطباق قطعه",
                "گزارش قطعه معیوب " . $reportNumber . " توسط انبار بررسی شد. منتظر تصمیم نهایی مدیر کارخانه است.",
                $reportId
            ]);

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
            $updateNotif = $db->prepare("UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE related_id = ? AND target_role = 'operator3'");
            $updateNotif->execute([$reportId]);

            echo json_encode(["success" => true, "message" => "گزارش با موفقیت نهایی و بایگانی شد."]);
        } catch(Exception $e) {
            echo json_encode(["success" => false, "error" => "خطا: " . $e->getMessage()]);
        }
        exit;
    }
}
?>
