<?php
// save-draft.php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

session_start();

// فعال کردن error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'config.php';

// دریافت داده‌ها
$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

// بررسی داده‌ها
if (empty($data)) {
    echo json_encode([
        'success' => false,
        'message' => 'داده‌ای دریافت نشد'
    ]);
    exit;
}

// لاگ برای دیباگ
$logFile = __DIR__ . '/draft_log.txt';
file_put_contents($logFile, "دریافت شده در: " . date('Y-m-d H:i:s') . "\n" . 
               print_r($data, true) . "\n\n", FILE_APPEND);

try {
    // بررسی وجود جدول drafts
    $checkTable = $conn->query("SHOW TABLES LIKE 'drafts'");
    
    if ($checkTable->num_rows == 0) {
        // ایجاد جدول اگر وجود ندارد
        $createTable = "CREATE TABLE drafts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            draft_id VARCHAR(50) UNIQUE,
            user_id VARCHAR(100),
            form_data JSON,
            step INT DEFAULT 1,
            equipment_data JSON,
            attachments TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 30 DAY),
            INDEX idx_user_id (user_id),
            INDEX idx_draft_id (draft_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci";
        
        $conn->query($createTable);
    }
    
    // ایجاد شناسه یکتا برای پیش‌نویس
    $draftId = 'DRAFT-' . date('YmdHis') . '-' . uniqid();
    $userId = $data['requesterName'] ?? 'anonymous';
    $formDataJson = json_encode($data, JSON_UNESCAPED_UNICODE);
    $currentStep = $data['currentStep'] ?? 1;
    
    // تبدیل equipment_data به JSON
    $equipmentDataJson = isset($data['selectedEquipment']) ? 
                        json_encode($data['selectedEquipment'], JSON_UNESCAPED_UNICODE) : 
                        null;
    
    // ذخیره یا آپدیت پیش‌نویس
    $sql = "INSERT INTO drafts (draft_id, user_id, form_data, step, equipment_data, attachments) 
            VALUES (?, ?, ?, ?, ?, '[]')
            ON DUPLICATE KEY UPDATE 
            form_data = VALUES(form_data),
            step = VALUES(step),
            equipment_data = VALUES(equipment_data),
            updated_at = CURRENT_TIMESTAMP";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('sssis', $draftId, $userId, $formDataJson, $currentStep, $equipmentDataJson);
    
    if ($stmt->execute()) {
        $response = [
            'success' => true,
            'message' => 'پیش‌نویس در سرور ذخیره شد',
            'data' => [
                'draft_id' => $draftId,
                'saved_at' => date('Y-m-d H:i:s'),
                'expires_at' => date('Y-m-d H:i:s', strtotime('+30 days'))
            ]
        ];
    } else {
        $response = [
            'success' => false,
            'message' => 'خطا در ذخیره پیش‌نویس: ' . $conn->error
        ];
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => 'خطا: ' . $e->getMessage()
    ];
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
$conn->close();
?>