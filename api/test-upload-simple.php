<?php
// test-upload-simple.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<pre>";
echo "=== تست آپلود فایل ===\n\n";

echo "1. بررسی \$_FILES:\n";
print_r($_FILES);

echo "\n2. بررسی \$_POST:\n";
print_r($_POST);

echo "\n3. بررسی سرور:\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Script Path: " . __DIR__ . "\n";

if (isset($_FILES['attachments'])) {
    $upload_dir = dirname(__DIR__) . '/uploads/work_requests/';
    echo "\n4. مسیر آپلود: " . $upload_dir . "\n";
    
    // بررسی وجود پوشه
    if (file_exists($upload_dir)) {
        echo "✅ پوشه وجود دارد\n";
    } else {
        echo "❌ پوشه وجود ندارد - در حال ایجاد...\n";
        if (mkdir($upload_dir, 0777, true)) {
            echo "✅ پوشه ایجاد شد\n";
        } else {
            echo "❌ خطا در ایجاد پوشه\n";
        }
    }
    
    // بررسی دسترسی نوشتن
    if (is_writable($upload_dir)) {
        echo "✅ پوشه قابل نوشتن است\n";
    } else {
        echo "❌ پوشه قابل نوشتن نیست - تلاش برای تغییر دسترسی...\n";
        chmod($upload_dir, 0777);
        if (is_writable($upload_dir)) {
            echo "✅ دسترسی با موفقیت تغییر کرد\n";
        } else {
            echo "❌ هنوز قابل نوشتن نیست\n";
        }
    }
    
    // تلاش برای آپلود
    foreach ($_FILES['attachments']['tmp_name'] as $key => $tmp_name) {
        if (!empty($tmp_name) && is_uploaded_file($tmp_name)) {
            $file_name = $_FILES['attachments']['name'][$key];
            $target_path = $upload_dir . $file_name;
            
            echo "\n5. تلاش برای آپلود فایل: " . $file_name . "\n";
            echo "   مسیر موقت: " . $tmp_name . "\n";
            echo "   مسیر نهایی: " . $target_path . "\n";
            
            if (move_uploaded_file($tmp_name, $target_path)) {
                echo "   ✅ فایل با موفقیت آپلود شد\n";
            } else {
                echo "   ❌ خطا در آپلود فایل\n";
                echo "   خطای PHP: " . error_get_last()['message'] . "\n";
            }
        }
    }
}

echo "</pre>";
?>