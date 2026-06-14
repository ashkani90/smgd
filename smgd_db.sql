-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 14, 2026 at 11:09 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `smgd_db`
--

DELIMITER $$
--
-- Functions
--
CREATE DEFINER=`root`@`localhost` FUNCTION `translate_criticality` (`criticality` VARCHAR(20)) RETURNS VARCHAR(20) CHARSET utf8mb4 COLLATE utf8mb4_persian_ci DETERMINISTIC BEGIN
    RETURN CASE criticality
        WHEN 'low' THEN 'کم'
        WHEN 'medium' THEN 'متوسط'
        WHEN 'high' THEN 'بالا'
        WHEN 'critical' THEN 'بحرانی'
        ELSE criticality
    END;
END$$

CREATE DEFINER=`root`@`localhost` FUNCTION `translate_equipment_status` (`status` VARCHAR(50)) RETURNS VARCHAR(50) CHARSET utf8mb4 COLLATE utf8mb4_persian_ci DETERMINISTIC BEGIN
    RETURN CASE status
        WHEN 'operational' THEN 'عملیاتی'
        WHEN 'repair' THEN 'در حال تعمیر'
        WHEN 'out of service' THEN 'خارج از سرویس'
        WHEN 'obsolete' THEN 'منسوخ'
        ELSE status
    END;
END$$

CREATE DEFINER=`root`@`localhost` FUNCTION `translate_priority` (`priority` VARCHAR(20)) RETURNS VARCHAR(20) CHARSET utf8mb4 COLLATE utf8mb4_persian_ci DETERMINISTIC BEGIN
    RETURN CASE priority
        WHEN 'low' THEN 'پایین'
        WHEN 'medium' THEN 'متوسط'
        WHEN 'high' THEN 'بالا'
        WHEN 'critical' THEN 'بحرانی'
        ELSE priority
    END;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(100) NOT NULL,
  `table_name` varchar(50) DEFAULT NULL,
  `record_id` int(11) DEFAULT NULL,
  `old_values` mediumtext DEFAULT NULL,
  `new_values` mediumtext DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` mediumtext DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `user_id`, `action`, `table_name`, `record_id`, `old_values`, `new_values`, `ip_address`, `user_agent`, `timestamp`) VALUES
(1, 102, 'insert', 'users', 500, NULL, '{\"name\":\"احمد رضایی\",\"email\":\"ahmad@example.com\",\"role\":\"user\"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2024-01-15 05:00:00'),
(2, 101, 'update', 'products', 75, '{\"price\":120000,\"stock\":50}', '{\"price\":135000,\"stock\":45}', '89.221.45.12', 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36', '2024-01-15 05:45:22'),
(3, 103, 'delete', 'orders', 300, '{\"order_number\":\"ORD-2024-001\",\"status\":\"pending\"}', NULL, '::1', 'PostmanRuntime/7.32.3', '2024-01-15 06:35:10'),
(4, 101, 'login', NULL, NULL, NULL, NULL, '192.168.1.150', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15', '2024-01-15 07:50:05'),
(5, 104, 'update', 'customers', 89, '{\"city\":\"تهران\",\"phone\":\"09123456789\"}', '{\"city\":\"مشهد\",\"phone\":\"09129876543\"}', '203.0.113.5', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0', '2024-01-15 11:10:33'),
(6, 102, 'view', 'reports', NULL, NULL, NULL, '192.168.1.200', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', '2024-01-15 12:48:47');

--
-- Triggers `activity_logs`
--
DELIMITER $$
CREATE TRIGGER `after_activity_log_insert` AFTER INSERT ON `activity_logs` FOR EACH ROW BEGIN
    DECLARE actor_name_val VARCHAR(100);
    DECLARE actor_role_val VARCHAR(20);
    
    -- دریافت اطلاعات کاربر
    SELECT full_name, role INTO actor_name_val, actor_role_val
    FROM users WHERE id = NEW.user_id;
    
    -- ارسال اعلان برای فعالیت‌های مهم
    IF NEW.action IN ('insert', 'update', 'delete') AND NEW.table_name IS NOT NULL THEN
        
        -- تعیین پیام بر اساس نوع فعالیت
        SET @action_text = CASE NEW.action
            WHEN 'insert' THEN 'ایجاد'
            WHEN 'update' THEN 'ویرایش'
            WHEN 'delete' THEN 'حذف'
            ELSE NEW.action
        END;
        
        SET @table_text = CASE NEW.table_name
            WHEN 'users' THEN 'کاربران'
            WHEN 'equipments' THEN 'تجهیزات'
            WHEN 'maintenance_requests' THEN 'درخواست‌های تعمیر'
            WHEN 'work_orders' THEN 'دستورکارها'
            WHEN 'spare_parts' THEN 'قطعات یدکی'
            ELSE NEW.table_name
        END;
        
        -- ارسال اعلان به مدیران برای فعالیت‌های حساس
        IF NEW.table_name IN ('users', 'work_orders', 'maintenance_requests') THEN
            INSERT INTO `notifications` (
                `user_id`, 
                `title`, 
                `message`, 
                `type`, 
                `priority`, 
                `related_module`, 
                `related_id`, 
                `expires_at`
            )
            SELECT 
                id,
                'فعالیت سیستم',
                CONCAT(
                    'عملیات ', @action_text, ' روی ', @table_text, ' انجام شد.\n',
                    'انجام‌دهنده: ', actor_name_val, ' (', actor_role_val, ')\n',
                    'زمان: ', DATE_FORMAT(NEW.timestamp, '%Y/%m/%d %H:%i')
                ),
                'system',
                'medium',
                'activity_logs',
                NEW.id,
                DATE_ADD(NOW(), INTERVAL 1 DAY)
            FROM users 
            WHERE role = 'admin' 
            AND is_active = 1
            AND id != NEW.user_id; -- به خود کاربر اعلان نده
        END IF;
        
    END IF;
    
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `attachments`
--

CREATE TABLE `attachments` (
  `id` int(11) NOT NULL,
  `work_order_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int(11) NOT NULL,
  `file_type` varchar(100) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_map` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `calendar_events`
--

CREATE TABLE `calendar_events` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `event_title` varchar(200) NOT NULL,
  `event_description` text DEFAULT NULL,
  `event_type` enum('maintenance','inspection','work_order','holiday','meeting','training','other') NOT NULL DEFAULT 'maintenance',
  `start_date` datetime NOT NULL,
  `end_date` datetime DEFAULT NULL,
  `all_day` tinyint(1) DEFAULT 0,
  `equipment_id` int(11) DEFAULT NULL,
  `work_order_id` int(11) DEFAULT NULL,
  `maintenance_request_id` int(11) DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `priority` enum('low','medium','high','critical') DEFAULT 'medium',
  `location` varchar(200) DEFAULT NULL,
  `color` varchar(20) DEFAULT '#3788d8',
  `is_recurring` tinyint(1) DEFAULT 0,
  `recurring_pattern` enum('daily','weekly','monthly','yearly') DEFAULT NULL,
  `recurring_end_date` date DEFAULT NULL,
  `status` enum('scheduled','in_progress','completed','cancelled') DEFAULT 'scheduled',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

--
-- Dumping data for table `calendar_events`
--

INSERT INTO `calendar_events` (`id`, `user_id`, `event_title`, `event_description`, `event_type`, `start_date`, `end_date`, `all_day`, `equipment_id`, `work_order_id`, `maintenance_request_id`, `assigned_to`, `created_by`, `priority`, `location`, `color`, `is_recurring`, `recurring_pattern`, `recurring_end_date`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'سرویس دوره‌ای پمپ سانتریفیوژ', 'سرویس دوره‌ای شش‌ماهه پمپ آب ساختمان A', 'maintenance', '2026-02-10 08:00:00', '2026-02-10 12:00:00', 0, 1, 1, NULL, 3, 1, 'high', 'اتاق پمپاژ ساختمان A', '#3788d8', 0, NULL, NULL, 'scheduled', '2026-02-09 13:26:31', '2026-02-17 07:06:47'),
(2, 1, 'بازرسی ایمنی سالیانه', 'بازرسی کامل سیستم اعلام و اطفاء حریق', 'inspection', '2026-02-06 09:00:00', '2026-02-08 16:00:00', 0, 11, NULL, NULL, 2, 1, 'critical', 'سراسر ساختمان', '#dc3545', 0, NULL, NULL, 'scheduled', '2026-02-09 13:26:31', '2026-02-15 08:11:54'),
(3, 0, 'تعمیر دستگاه CNC', 'تعویض یاتاقان‌های دستگاه CNC سه محوره', 'work_order', '2026-01-16 08:00:00', '2026-01-12 17:00:00', 0, 4, 4, NULL, 3, 2, 'high', 'سالن ماشین‌آلات', '#28a745', 0, NULL, NULL, 'in_progress', '2026-02-09 13:26:31', '2026-02-10 07:47:08'),
(4, 1, 'جلسه فنی ماهانه', 'جلسه بررسی عملکرد ماهانه بخش تعمیرات', 'meeting', '2026-03-05 10:00:00', '2026-03-05 12:00:00', 0, NULL, NULL, NULL, 2, 1, 'medium', 'سالن کنفرانس', '#6f42c1', 0, NULL, NULL, 'completed', '2026-02-09 13:26:31', '2026-02-15 08:12:44'),
(5, 1, 'تست ژنراتور اضطراری', 'تست هفتگی ژنراتور دیزلی', 'maintenance', '2026-03-08 14:00:00', '2026-03-08 15:00:00', 0, 3, NULL, NULL, 5, 3, 'critical', 'اتاق ژنراتور', '#fd7e14', 0, NULL, NULL, 'scheduled', '2026-02-09 13:26:31', '2026-02-15 08:12:36'),
(6, 0, 'آموزش ایمنی پرسنل', 'دوره آموزش ایمنی برای تکنسین‌های جدید', 'training', '2026-03-20 08:30:00', '2026-03-20 16:30:00', 1, NULL, NULL, NULL, NULL, 1, 'medium', 'آموزشگاه شرکت', '#17a2b8', 0, NULL, NULL, 'scheduled', '2026-02-09 13:26:31', '2026-02-10 11:58:55'),
(7, 3, 'روز طبیعت', 'تعطیل رسمی - روز طبیعت', 'holiday', '2026-04-02 00:00:00', '2026-04-02 23:59:59', 1, NULL, NULL, NULL, NULL, NULL, 'low', NULL, '#6c757d', 0, NULL, NULL, 'scheduled', '2026-02-09 13:26:31', '2026-02-15 08:12:51'),
(8, 0, 'سرویس چیلر صنعتی', 'بازسازی و تعمیر اساسی چیلر صنعتی', 'maintenance', '2026-03-25 08:00:00', '2026-03-27 17:00:00', 0, 5, 5, NULL, 3, 2, 'high', 'پشت بام', '#20c997', 0, NULL, NULL, 'scheduled', '2026-02-09 13:26:31', '2026-02-10 11:59:11'),
(9, 4, 'کالیبراسیون دستگاه‌های اندازه‌گیری', 'کالیبراسیون سالیانه تجهیزات آزمایشگاهی', 'inspection', '2026-03-18 08:00:00', '2026-03-20 16:00:00', 0, 9, NULL, NULL, 9, 1, 'medium', 'آزمایشگاه کنترل کیفیت', '#e83e8c', 0, NULL, NULL, 'scheduled', '2026-02-09 13:26:31', '2026-02-15 08:12:58'),
(10, 0, 'تعمیر سیستم UPS', 'تعویض باتری‌های سیستم UPS اتاق سرور', 'maintenance', '2024-03-22 10:00:00', '2024-03-22 14:00:00', 0, 15, 2, NULL, 3, 1, 'critical', 'اتاق سرور', '#dc3545', 0, NULL, NULL, 'scheduled', '2026-02-09 13:26:31', '2026-02-09 13:26:31'),
(11, 0, 'گزارش هفتگی', 'جلسه گزارش عملکرد هفتگی بخش فنی', 'meeting', '2024-03-08 09:00:00', '2024-03-08 10:00:00', 0, NULL, NULL, NULL, 2, 1, 'medium', NULL, '#3788d8', 1, 'weekly', '2024-12-31', 'scheduled', '2026-02-09 13:26:31', '2026-02-09 13:26:31'),
(12, 0, 'بازرسی ماهانه تجهیزات', 'بازرسی کلیه تجهیزات بحرانی', 'inspection', '2024-03-01 08:00:00', '2024-03-01 16:00:00', 0, NULL, NULL, NULL, NULL, 1, 'high', NULL, '#3788d8', 1, 'monthly', '2024-12-31', 'scheduled', '2026-02-09 13:26:31', '2026-02-09 13:26:31'),
(13, 1, 'بازرسی تابلو برق سالن A', 'تابلوها گرد گیری شوند و از نظر داشتن عایق ها کنترل شوند', 'inspection', '2026-02-16 00:00:00', '2026-02-16 23:59:59', 1, NULL, NULL, NULL, NULL, NULL, 'medium', 'سالن A', '#0400fa', 0, NULL, NULL, '', '2026-02-15 09:10:23', '2026-02-16 07:58:08'),
(26, 1, 'بازرسی', 'بازرسی اتوبوس', 'inspection', '2026-02-16 00:00:00', '2026-02-18 23:59:59', 0, NULL, NULL, NULL, NULL, NULL, 'medium', 'سالن A', '#3788d8', 0, NULL, NULL, '', '2026-02-16 09:14:21', '2026-02-16 09:14:21');

-- --------------------------------------------------------

--
-- Table structure for table `defect_reports`
--

CREATE TABLE `defect_reports` (
  `id` int(11) NOT NULL,
  `report_number` varchar(50) NOT NULL,
  `report_date` varchar(50) NOT NULL,
  `reporter_name` varchar(100) NOT NULL,
  `employee_code` varchar(50) NOT NULL,
  `reporter_department` varchar(50) NOT NULL,
  `vehicle_type` varchar(50) NOT NULL,
  `vehicle_model` varchar(100) NOT NULL,
  `part_code` varchar(50) NOT NULL,
  `part_name_fa` varchar(100) NOT NULL,
  `part_name_en` varchar(100) DEFAULT NULL,
  `defect_quantity` int(11) NOT NULL,
  `unit_of_measure` varchar(20) DEFAULT NULL,
  `detection_location` varchar(50) NOT NULL,
  `is_replaced` varchar(10) NOT NULL,
  `part_image` varchar(255) DEFAULT NULL,
  `defect_type` varchar(50) NOT NULL,
  `defect_description` text NOT NULL,
  `possible_cause` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'waiting_qc',
  `qc_detection_location` varchar(100) DEFAULT NULL,
  `part_status` varchar(100) DEFAULT NULL,
  `defect_reason` varchar(100) DEFAULT NULL,
  `quality_notes` text DEFAULT NULL,
  `qc_submitted_at` timestamp NULL DEFAULT NULL,
  `tracking_code` varchar(100) DEFAULT NULL,
  `inventory_status` text DEFAULT NULL,
  `warehouse_notes` text DEFAULT NULL,
  `warehouse_submitted_at` timestamp NULL DEFAULT NULL,
  `tech_review_result` text DEFAULT NULL,
  `final_decision` varchar(100) DEFAULT NULL,
  `responsible_party` varchar(100) DEFAULT NULL,
  `deadline_date` varchar(50) DEFAULT NULL,
  `corrective_action_no` varchar(100) DEFAULT NULL,
  `tech_submitted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

--
-- Dumping data for table `defect_reports`
--

INSERT INTO `defect_reports` (`id`, `report_number`, `report_date`, `reporter_name`, `employee_code`, `reporter_department`, `vehicle_type`, `vehicle_model`, `part_code`, `part_name_fa`, `part_name_en`, `defect_quantity`, `unit_of_measure`, `detection_location`, `is_replaced`, `part_image`, `defect_type`, `defect_description`, `possible_cause`, `status`, `qc_detection_location`, `part_status`, `defect_reason`, `quality_notes`, `qc_submitted_at`, `tracking_code`, `inventory_status`, `warehouse_notes`, `warehouse_submitted_at`, `tech_review_result`, `final_decision`, `responsible_party`, `deadline_date`, `corrective_action_no`, `tech_submitted_at`, `created_at`, `user_id`) VALUES
(95, 'NC-20260613-598', '2026/06/13 - 12:00', 'حمید صبوری', '654', 'quality_control', 'اتوبوس', '44', '2134124', 'سنسور ترمز', 'break sensor', 1, 'عدد', 'برگشت از تولید', 'بله', '', 'عملکردی', 'عملکرد ندارد', 'خرابی قطعه', 'waiting_tech', 'کنترل ورودی', 'قطعه مورد تأیید و قابل استفاده می باشد', 'خطای اپراتور', 'توضیحات کنترل کیفیت', '2026-06-13 12:46:28', '1111111', 'قطعه سالم وجود دارد و می توان بدون ایجاد مشکل در موجودی کالا قطعه را جایگزین نمود', 'توضیحات انبار', '2026-06-13 12:47:32', NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-13 12:45:35', 1);

-- --------------------------------------------------------

--
-- Table structure for table `drafts`
--

CREATE TABLE `drafts` (
  `id` int(11) NOT NULL,
  `draft_id` varchar(50) DEFAULT NULL,
  `user_id` varchar(100) DEFAULT NULL,
  `form_data` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

--
-- Dumping data for table `drafts`
--

INSERT INTO `drafts` (`id`, `draft_id`, `user_id`, `form_data`) VALUES
(1, 'DRAFT_001', 'USER_1001', '{\"name\": \"علی رضایی\", \"email\": \"ali@example.com\", \"age\": 30, \"city\": \"تهران\", \"education\": \"کارشناسی ارشد\"}'),
(2, 'DRAFT_002', 'USER_1002', '{\"product_name\": \"لپ‌تاپ\", \"category\": \"الکترونیکی\", \"price\": 15000000, \"quantity\": 5, \"description\": \"لپ‌تاپ گیمینگ\"}'),
(3, 'DRAFT_003', 'USER_1001', '{\"title\": \"گزارش ماهانه\", \"department\": \"مالی\", \"month\": \"دی\", \"year\": 1402, \"content\": \"متن گزارش مالی...\"}'),
(4, 'DRAFT_004', 'USER_1003', '{\"full_name\": \"مریم محمدی\", \"national_id\": \"1234567890\", \"phone\": \"09123456789\", \"address\": \"مشهد، خیابان امام\"}'),
(5, 'DRAFT_005', 'USER_1002', '{\"order_id\": \"ORD_789\", \"items\": [{\"id\": 1, \"name\": \"کتاب\", \"qty\": 2}, {\"id\": 2, \"name\": \"دفتر\", \"qty\": 5}], \"total_amount\": 250000}'),
(6, 'DRAFT_006', 'USER_1004', NULL),
(7, 'DRAFT_007', 'USER_1003', '{\"project_title\": \"طراحی وبسایت\", \"status\": \"در حال انجام\", \"deadline\": \"1403/03/15\", \"team_members\": [\"علی\", \"فاطمه\", \"محمد\"]}'),
(8, 'DRAFT_008', 'USER_1005', '{\"survey_title\": \"نظرسنجی رضایت\", \"questions\": [{\"q1\": \"راضی هستید؟\", \"ans\": \"بله\"}, {\"q2\": \"امتیاز شما؟\", \"ans\": 8}]}');

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` int(11) NOT NULL,
  `employee_code` varchar(20) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `department` varchar(50) NOT NULL,
  `position` varchar(50) NOT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `employee_code`, `full_name`, `department`, `position`, `specialization`, `contact_number`, `email`, `hire_date`, `is_active`, `created_at`) VALUES
(1, 'EMP-001', 'علی رضایی', 'فناوری اطلاعات', 'توسعه‌دهنده بک‌اند', 'PHP, Laravel', '09123456789', 'ali.rezaei@company.com', '2020-05-15', 1, '2024-01-10 05:00:00'),
(2, 'EMP-002', 'مریم محمدی', 'منابع انسانی', 'کارشناس جذب', 'مصاحبه و گزینش', '09129876543', 'maryam.mohammadi@company.com', '2019-11-22', 1, '2024-01-10 05:05:00'),
(3, 'EMP-003', 'رضا کریمی', 'مالی', 'حسابدار', 'حسابداری مالیاتی', '09351234567', 'reza.karimi@company.com', '2021-03-10', 1, '2024-01-10 05:10:00'),
(4, 'EMP-004', 'سارا احمدی', 'فروش', 'مدیر فروش', 'بازاریابی دیجیتال', '09107654321', 'sara.ahmadi@company.com', '2018-08-05', 1, '2024-01-10 05:15:00'),
(5, 'EMP-005', 'محمد حسینی', 'پشتیبانی فنی', 'کارشناس پشتیبانی', 'شبکه و امنیت', '09369874521', 'mohammad.hosseini@company.com', '2022-01-30', 1, '2024-01-10 05:20:00'),
(6, 'EMP-006', 'فاطمه جعفری', 'تولید', 'ناظر کیفیت', 'کنترل کیفیت ISO', '09151236987', 'fatemeh.jafari@company.com', '2020-09-12', 0, '2024-01-10 05:25:00'),
(7, 'EMP-007', 'حسین نظری', 'تحقیق و توسعه', 'پژوهشگر', 'هوش مصنوعی', '09374561239', 'hosein.nazari@company.com', '2023-06-18', 1, '2024-01-10 05:30:00'),
(8, 'EMP-008', 'نازنین قدوسی', 'بازاریابی', 'متخصص سئو', 'بهینه‌سازی موتور جستجو', '09103216547', 'nazanin.ghodousi@company.com', '2021-07-25', 1, '2024-01-10 05:35:00'),
(9, 'EMP-009', 'امیرعلی شریفی', 'فناوری اطلاعات', 'مدیر پروژه', 'مدیریت چابک (Agile)', '09124563210', 'amirali.sharifi@company.com', '2017-12-01', 1, '2024-01-10 05:40:00'),
(10, 'EMP-010', 'لیلا محمودی', 'حقوقی', 'وکیل', 'قراردادهای تجاری', '09381234567', 'leila.mahmoudi@company.com', '2019-04-14', 1, '2024-01-10 05:45:00');

-- --------------------------------------------------------

--
-- Table structure for table `equipments`
--

CREATE TABLE `equipments` (
  `id` int(11) NOT NULL,
  `equipment_code` varchar(50) NOT NULL,
  `equipment_name` varchar(100) NOT NULL,
  `equipment_type` varchar(50) NOT NULL,
  `manufacturer` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `status` enum('operational','repair','out of service','obsolete') DEFAULT 'operational',
  `last_maintenance_date` date DEFAULT NULL,
  `next_maintenance_date` date DEFAULT NULL,
  `criticality_level` enum('low','medium','high','critical') DEFAULT 'medium',
  `notes` mediumtext DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

--
-- Dumping data for table `equipments`
--

INSERT INTO `equipments` (`id`, `equipment_code`, `equipment_name`, `equipment_type`, `manufacturer`, `model`, `serial_number`, `purchase_date`, `location`, `status`, `last_maintenance_date`, `next_maintenance_date`, `criticality_level`, `notes`, `created_at`) VALUES
(1, 'EQP-001', 'پمپ سانتریفیوژ آب', 'پمپ', 'Grundfos', 'UPS 32-80', 'GRF-2023-001', '2023-01-15', 'اتاق پمپاژ ساختمان A', 'operational', '2024-01-10', '2024-07-10', 'high', 'نیاز به بررسی دوره‌ی ماهانه', '2026-01-27 11:57:43'),
(2, 'EQP-002', 'کمپرسور هوای فشرده', 'کمپرسور', 'Atlas Copco', 'GA 7-11', 'ATL-2022-045', '2022-03-20', 'کارگاه تولید', 'repair', '2023-12-15', '2024-06-15', 'critical', 'در حال تعمیر - قطعه در راه است', '2026-01-27 11:57:43'),
(3, 'EQP-003', 'ژنراتور دیزلی', 'ژنراتور', 'Cummins', 'C550 D5', 'CMM-2021-112', '2021-11-10', 'اتاق ژنراتور', 'operational', '2024-02-01', '2024-08-01', 'critical', 'منبع برق اضطراری - تست هفتگی', '2026-01-27 11:57:43'),
(4, 'EQP-004', 'دستگاه CNC سه محوره', 'ماشین‌آلات', 'Haas', 'VF-2', 'HAS-2020-078', '2020-08-05', 'سالن ماشین‌آلات', 'operational', '2024-03-15', '2024-09-15', 'high', 'برنامه کاری ۲۴/۷', '2026-01-27 11:57:43'),
(5, 'EQP-005', 'چیلر صنعتی', 'سیستم تهویه', 'Trane', 'RTAC 130', 'TRN-2019-023', '2019-05-30', 'پشت بام', 'out of service', '2023-10-20', '2024-04-20', 'medium', 'نیاز به تعمیر اساسی - بودجه در حال بررسی', '2026-01-27 11:57:43'),
(6, 'EQP-006', 'دستگاه تزریق پلاستیک', 'ماشین‌آلات', 'Arburg', 'Allrounder 370', 'ARB-2022-067', '2022-07-12', 'خط تولید ۱', 'operational', '2024-01-25', '2024-07-25', 'high', 'تولید روزانه ۲۰۰۰ قطعه', '2026-01-27 11:57:43'),
(7, 'EQP-007', 'سیستم فیلتراسیون آب', 'تجهیزات تصفیه', 'Pentair', 'Filtrite 1000', 'PNT-2023-011', '2023-02-28', 'اتاق تصفیه آب', 'operational', NULL, '2024-05-01', 'medium', 'اولین سرویس پس از نصب نیاز است', '2026-01-27 11:57:43'),
(8, 'EQP-008', 'آسانسور باربر', 'آسانسور', 'Kone', 'MiniSpace', 'KON-2018-156', '2018-12-01', 'سالن بارگیری', 'repair', '2023-11-30', '2024-05-30', 'high', 'تعمیرات دوره‌ای - در دسترس با محدودیت', '2026-01-27 11:57:43'),
(9, 'EQP-009', 'میکروسکوپ الکترونی', 'تجهیزات آزمایشگاهی', 'JEOL', 'JSM-IT200', 'JEL-2021-089', '2021-09-15', 'آزمایشگاه کنترل کیفیت', 'obsolete', '2023-08-10', NULL, 'low', 'منسوخ شده - برنامه جایگزینی در سال آینده', '2026-01-27 11:57:43'),
(10, 'EQP-010', 'دستگاه بسته‌بندی اتوماتیک', 'ماشین‌آلات بسته‌بندی', 'Bosch', 'SVH 2602', 'BSC-2023-034', '2023-06-22', 'خط بسته‌بندی', 'operational', '2024-02-14', '2024-08-14', 'medium', 'ظرفیت ۱۲۰ بسته در دقیقه', '2026-01-27 11:57:43'),
(11, 'EQP-011', 'سیستم اعلام حریق', 'تجهیزات ایمنی', 'Notifier', 'AFP-320', 'NOT-2022-099', '2022-04-18', 'سراسر ساختمان', 'operational', '2024-03-01', '2024-09-01', 'critical', 'بازرسی ماهانه اجباری', '2026-01-27 11:57:43'),
(12, 'EQP-012', 'کوره حرارتی', 'تجهیزات عملیات حرارتی', 'Nabertherm', 'L 9/12', 'NAB-2020-044', '2020-10-11', 'بخش عملیات حرارتی', 'out of service', '2023-09-05', NULL, 'high', 'خرابی المنت‌ها - در انتظار قطعه', '2026-01-27 11:57:43'),
(13, 'EQP-013', 'پمپ خلاء', 'پمپ', 'Busch', 'R5 0250', 'BUS-2023-022', '2023-03-05', 'آزمایشگاه تحقیقاتی', 'operational', '2024-01-30', '2024-07-30', 'medium', 'کارکرد متناوب', '2026-01-27 11:57:43'),
(14, 'EQP-014', 'دستگاه برش لیزری', 'ماشین‌آلات برش', 'Trumpf', 'TruLaser 5030', 'TRM-2021-077', '2021-07-19', 'سالن ماشین‌آلات پیشرفته', 'operational', '2024-02-20', '2024-08-20', 'critical', 'تنها دستگاه برش لیزری موجود', '2026-01-27 11:57:43'),
(15, 'EQP-015', 'سیستم UPS', 'تجهیزات الکتریکی', 'Eaton', '9PX 6k', 'EAT-2022-033', '2022-11-08', 'اتاق سرور', 'operational', '2024-03-10', '2024-09-10', 'critical', 'محافظت از سرورهای مرکزی', '2026-01-27 11:57:43');

-- --------------------------------------------------------

--
-- Table structure for table `inspection_reports`
--

CREATE TABLE `inspection_reports` (
  `id` int(11) NOT NULL,
  `report_number` varchar(50) NOT NULL,
  `equipment_id` int(11) NOT NULL,
  `inspector_id` int(11) NOT NULL,
  `inspection_date` date NOT NULL,
  `next_inspection_date` date DEFAULT NULL,
  `inspection_type` varchar(50) DEFAULT NULL,
  `findings` mediumtext DEFAULT NULL,
  `recommendations` mediumtext DEFAULT NULL,
  `status` enum('Passed','Needs Follow-up','Needs Urgent Repair') DEFAULT 'Passed',
  `corrective_action_required` tinyint(1) DEFAULT 0,
  `corrective_action_description` mediumtext DEFAULT NULL,
  `follow_up_date` date DEFAULT NULL,
  `signed_by` int(11) DEFAULT NULL,
  `signature_date` date DEFAULT NULL,
  `attachments` mediumtext DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

--
-- Dumping data for table `inspection_reports`
--

INSERT INTO `inspection_reports` (`id`, `report_number`, `equipment_id`, `inspector_id`, `inspection_date`, `next_inspection_date`, `inspection_type`, `findings`, `recommendations`, `status`, `corrective_action_required`, `corrective_action_description`, `follow_up_date`, `signed_by`, `signature_date`, `attachments`) VALUES
(1, 'IR-2023-001', 105, 22, '2023-10-15', '2024-04-15', 'دوره‌ای (سالانه)', 'کلیه اجزای اصلی دستگاه در وضعیت مطلوب و استاندارد کار می‌کنند. هیچ نشانه‌ای از سایش یا نشتی غیرعادی مشاهده نشد.', 'به شرایط فعلی ادامه دهید. بازرسی بعدی طبق برنامه‌ریزی.', 'Passed', 0, NULL, NULL, 12, '2023-10-16', '[\"چک لیست تکمیل شده\", \"عکس‌های دستگاه\"]'),
(2, 'IR-2023-002', 78, 23, '2023-11-02', '2023-12-02', 'فوق‌العاده (پس از تعمیر)', 'تراز دستگاه اندکی خارج از محدوده مجاز است. عملکرد کلی نرمال است اما نیاز به تنظیم جزئی دارد.', 'عملیات تراز دستگاه توسط واحد فنی ظرف دو هفته آینده انجام شود.', 'Needs Follow-up', 1, 'تنظیم تراز دستگاه با استفاده از تجهیزات کالیبره شده.', '2023-11-16', 12, '2023-11-02', '[\"گزارش کالیبراسیون\", \"نمودار ارتعاش\"]'),
(3, 'IR-2023-003', 42, 22, '2023-11-20', NULL, 'عیب‌یابی', 'شناسایی نشتی روغن در سیلندر اصلی. فشار سیستم ۲۰٪ پایین‌تر از حداقل استاندارد است. ادامه کار ایمن نیست.', 'دستگاه بلافاصله از خط خارج شده و تعمیر اساسی روی سیلندر و سیستم هیدرولیک انجام شود.', 'Needs Urgent Repair', 1, 'تعویض اورینگ‌ها و شیلنگ‌های فرسوده سیلندر اصلی. پرکردن مجدد روغن و تست فشار.', '2023-11-27', 13, '2023-11-20', '[\"عکس‌های محل نشتی\", \"گزارش فشارسنجی\", \"دستور توقف دستگاه\"]'),
(4, 'IR-2023-004', 91, 24, '2023-12-05', '2024-06-05', 'دوره‌ای (شش‌ماهه)', 'بازرسی الکتریکی: کلیه اتصالات سالم، عایق‌بندی بدون مشکل، جریان کشی موتور در محدوده پلاک.', 'نیاز به اقدام خاصی نیست.', 'Passed', 0, NULL, NULL, 13, '2023-12-05', '[\"گزارش تست عایق\", \"پلاک دستگاه\"]'),
(5, 'IR-2023-005', 56, 23, '2023-12-12', '2024-01-12', 'کنترل کیفیت', 'لرزش دستگاه در دور بالا کمی از حد مجاز بیشتر است. احتمال عدم بالانس چرخ طیار وجود دارد.', 'بالانس چرخ طیار و بررسی یاتاقان‌ها توسط تیم تعمیرات.', 'Needs Follow-up', 1, 'بالانس دینامیکی چرخ طیار و در صورت نیاز سفت‌کردن اتصالات پایه.', '2023-12-26', NULL, NULL, '[\"فیلم عملکرد دستگاه\", \"گزارش آنالیز ارتعاش\"]');

-- --------------------------------------------------------

--
-- Table structure for table `kpis`
--

CREATE TABLE `kpis` (
  `id` int(11) NOT NULL,
  `kpi_code` varchar(50) NOT NULL,
  `kpi_name` varchar(100) NOT NULL,
  `description` mediumtext DEFAULT NULL,
  `department` varchar(50) DEFAULT NULL,
  `calculation_formula` mediumtext DEFAULT NULL,
  `target_value` decimal(10,2) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `frequency` enum('daily','weekly','monthly','seasonal','yearly') DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

--
-- Dumping data for table `kpis`
--

INSERT INTO `kpis` (`id`, `kpi_code`, `kpi_name`, `description`, `department`, `calculation_formula`, `target_value`, `unit`, `frequency`, `is_active`, `created_at`) VALUES
(1, 'REV_MONTHLY', 'درآمد ماهانه', 'کل درآمد کسب شده در یک ماه تقویمی', 'مالی', 'SUM(فاکتورهای تایید شده در ماه)', 50000000.00, 'ریال', 'monthly', 1, '2024-01-15 06:00:00'),
(2, 'CUST_SAT', 'رضایت مشتری', 'میانگین نمره رضایت مشتریان از نظرسنجی', 'فروش', 'AVG(امتیاز نظرسنجی‌های دریافت شده)', 4.50, 'امتیاز', 'monthly', 1, '2024-01-16 06:45:00'),
(3, 'EMP_TURNOVER', 'نرخ جابجایی کارکنان', 'درصد کارکنانی که در بازه زمانی مشخص شرکت را ترک می‌کنند', 'منابع انسانی', '(تعداد ترک خدمت در دوره / تعداد متوسط کارکنان در دوره) * 100', 5.00, 'درصد', 'yearly', 1, '2024-01-17 07:30:00'),
(4, 'PROD_DEFECT_RATE', 'نرخ قطعه معیوب', 'درصد محصولات تولیدی که دارای عیب هستند', 'تولید', '(تعداد محصولات معیوب / کل تولید) * 100', 1.50, 'درصد', 'daily', 1, '2024-01-18 05:15:00'),
(5, 'AVG_RESP_TIME', 'میانگین زمان پاسخگویی', 'میانگین زمان پاسخگویی به درخواست‌های مشتریان', 'پشتیبانی', 'AVG(زمان پاسخ - زمان درخواست)', 2.50, 'ساعت', 'weekly', 1, '2024-01-19 10:50:00'),
(6, 'WEBSITE_TRAFFIC', 'ترافیک وبسایت', 'تعداد بازدیدکنندگان منحصربه‌فرد روزانه از وبسایت', 'فناوری اطلاعات', 'COUNT(DISTINCT session_id)', 10000.00, 'بازدید', 'daily', 1, '2024-01-20 12:40:00'),
(7, 'PROJECT_ON_TIME', 'تحویل به موقع پروژه', 'درصد پروژه‌هایی که در مهلت مقرر تحویل داده شده‌اند', 'مدیریت پروژه', '(تعداد پروژه‌های تحویل‌شده در زمان / کل پروژه‌های اختتام‌یافته) * 100', 90.00, 'درصد', 'monthly', 1, '2024-01-21 10:00:00'),
(8, 'INV_TURNOVER', 'نرخ گردش موجودی', 'میانگین دفعاتی که موجودی کالا در یک دوره فروخته و جایگزین می‌شود', 'تدارکات', 'هزینه کالای فروخته شده / میانگین موجودی', 8.00, 'دفعه', 'seasonal', 0, '2024-01-22 06:15:00'),
(9, 'SOCIAL_MEDIA_GROWTH', 'رشد دنبال‌کنندگان شبکه‌های اجتماعی', 'درصد رشد ماهانه دنبال‌کنندگان در شبکه‌های اجتماعی اصلی', 'مارکتینگ', '((دنبال‌کنندگان پایان ماه - دنبال‌کنندگان ابتدای ماه) / دنبال‌کنندگان ابتدای ماه) * 100', 10.00, 'درصد', 'monthly', 1, '2024-01-23 11:30:00'),
(10, 'ENERGY_CONSUMPTION', 'مصرف انرژی به ازای هر واحد تولید', 'میانگین مصرف انرژی (برق، گاز) برای تولید هر واحد محصول', 'تولید', 'کل مصرف انرژی (کیلووات ساعت) / تعداد واحدهای تولیدشده', 15.50, 'کیلووات‌ساعت', 'monthly', 1, '2024-01-24 08:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `kpi_data`
--

CREATE TABLE `kpi_data` (
  `id` int(11) NOT NULL,
  `kpi_id` int(11) NOT NULL,
  `period_date` date NOT NULL,
  `actual_value` decimal(10,2) DEFAULT NULL,
  `calculated_value` decimal(10,2) DEFAULT NULL,
  `notes` mediumtext DEFAULT NULL,
  `recorded_by` int(11) NOT NULL,
  `recorded_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

--
-- Dumping data for table `kpi_data`
--

INSERT INTO `kpi_data` (`id`, `kpi_id`, `period_date`, `actual_value`, `calculated_value`, `notes`, `recorded_by`, `recorded_at`) VALUES
(1, 101, '2023-10-01', 1500.50, 1520.75, 'مقدار واقعی از سیستم فروش استخراج شد', 5, '2023-10-01 05:45:00'),
(2, 102, '2023-10-01', 85.00, 82.50, 'رضایت مشتری از نظرسنجی فصل سوم', 5, '2023-10-01 07:00:00'),
(3, 101, '2023-11-01', 1620.00, 1605.25, 'افزایش به دلیل کمپین جدید بازاریابی', 8, '2023-11-01 05:15:00'),
(4, 103, '2023-10-15', 120.75, 115.20, 'تعداد خطاهای سیستم در ماه اکتبر', 12, '2023-11-02 10:50:00'),
(5, 105, '2023-12-01', 95.50, 96.80, 'نرخ تحویل به موقع سفارشات', 5, '2023-12-01 07:40:00'),
(6, 102, '2023-11-01', 88.25, 87.90, NULL, 8, '2023-11-02 13:15:00'),
(7, 104, '2024-01-01', 45000.00, 45250.00, 'درآمد کل فصل چهارم', 12, '2024-01-01 09:30:00'),
(8, 101, '2023-12-01', 1700.00, 1685.60, 'رشد ثابت در سهم بازار', 5, '2023-12-02 06:00:00'),
(9, 101, '2023-10-01', 1500.50, 1520.75, 'مقدار واقعی از سیستم فروش استخراج شد', 5, '2023-10-01 05:45:00');

-- --------------------------------------------------------

--
-- Table structure for table `login_attempts`
--

CREATE TABLE `login_attempts` (
  `id` int(11) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `attempt_time` timestamp NULL DEFAULT current_timestamp(),
  `success` tinyint(1) DEFAULT 0
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

--
-- Dumping data for table `login_attempts`
--

INSERT INTO `login_attempts` (`id`, `username`, `ip_address`, `attempt_time`, `success`) VALUES
(100, 'admin', '::1', '2026-01-28 10:01:00', 1),
(101, 'admin', '::1', '2026-01-29 05:52:45', 1),
(102, 'admin', '::1', '2026-01-29 07:26:38', 1),
(103, 'admin', '::1', '2026-01-29 07:43:44', 1),
(104, 'admin', '::1', '2026-01-29 07:46:54', 1),
(105, 'admin', '::1', '2026-01-29 08:16:32', 1),
(106, 'admin', '::1', '2026-01-29 08:22:47', 1),
(107, 'admin', '::1', '2026-01-29 08:23:06', 1),
(108, 'admin', '::1', '2026-01-29 08:23:45', 1),
(109, 'admin', '::1', '2026-01-29 08:28:05', 1),
(110, 'admin', '::1', '2026-01-29 08:35:26', 1),
(111, 'admin', '::1', '2026-01-29 09:10:50', 1),
(112, 'admin', '::1', '2026-01-29 09:23:16', 1),
(113, 'admin', '::1', '2026-01-29 09:26:38', 1),
(114, 'admin', '::1', '2026-01-29 09:33:17', 1),
(115, 'admin', '::1', '2026-01-29 12:18:02', 1),
(116, 'admin', '::1', '2026-01-31 05:24:44', 1),
(117, 'admin', '::1', '2026-01-31 06:35:47', 1),
(118, 'admin', '::1', '2026-01-31 09:18:17', 1),
(119, 'admin', '::1', '2026-02-01 09:40:02', 1),
(120, 'admin', '::1', '2026-02-02 13:10:53', 1),
(121, 'admin', '::1', '2026-02-04 07:38:36', 1),
(122, 'admin', '::1', '2026-02-04 08:26:30', 1),
(123, 'admin', '::1', '2026-02-05 07:06:59', 1),
(124, 'admin', '::1', '2026-02-05 09:35:46', 1),
(125, 'admin', '::1', '2026-02-05 10:14:32', 1),
(126, 'admin', '::1', '2026-02-05 10:20:42', 1),
(127, 'admin', '::1', '2026-02-05 10:39:44', 1),
(128, 'admin', '::1', '2026-02-05 10:41:40', 1),
(129, 'admin', '::1', '2026-02-05 10:43:07', 1),
(130, 'admin', '::1', '2026-02-05 10:43:31', 1),
(131, 'admin', '::1', '2026-02-05 10:46:27', 1),
(132, 'admin', '::1', '2026-02-05 10:50:34', 1),
(133, 'admin', '::1', '2026-02-05 10:57:13', 1),
(134, 'admin', '::1', '2026-02-05 11:04:36', 1),
(135, 'admin', '::1', '2026-02-05 11:07:28', 1),
(136, 'admin', '::1', '2026-02-05 11:14:54', 1),
(137, 'admin', '::1', '2026-02-05 11:18:37', 1),
(138, 'admin', '::1', '2026-02-05 11:29:56', 1),
(139, 'admin', '::1', '2026-02-05 11:45:43', 1),
(140, 'admin', '::1', '2026-02-07 09:27:11', 1),
(141, 'admin', '::1', '2026-02-07 09:45:51', 1),
(142, 'admin', '::1', '2026-02-07 09:49:48', 1),
(143, 'admin', '::1', '2026-02-07 09:52:18', 1),
(144, 'admin', '::1', '2026-02-07 09:54:59', 1),
(145, 'admin', '::1', '2026-02-07 09:58:03', 1),
(146, 'admin', '::1', '2026-02-07 10:25:36', 1),
(147, 'admin', '::1', '2026-02-07 10:47:49', 1),
(148, 'admin', '::1', '2026-02-07 10:51:12', 1),
(149, 'admin', '::1', '2026-02-07 10:53:26', 1),
(150, 'admin', '::1', '2026-02-08 04:45:37', 1),
(151, 'admin', '::1', '2026-02-08 05:10:48', 1),
(152, 'admin', '::1', '2026-02-08 05:11:13', 1),
(153, 'admin', '::1', '2026-02-08 05:11:40', 1),
(154, 'admin', '::1', '2026-02-08 05:12:33', 1),
(155, 'admin', '::1', '2026-02-08 10:08:46', 1),
(156, 'admin', '::1', '2026-02-08 10:11:22', 1),
(157, 'admin', '::1', '2026-02-08 10:13:46', 1),
(158, 'admin', '::1', '2026-02-08 11:00:26', 1),
(159, 'admin', '::1', '2026-02-08 12:11:53', 1),
(160, 'admin', '::1', '2026-02-08 12:17:19', 1),
(161, 'admin', '::1', '2026-02-08 12:26:40', 1),
(162, 'admin', '::1', '2026-02-08 13:07:24', 1),
(163, 'admin', '::1', '2026-02-08 14:17:13', 1),
(164, 'admin', '::1', '2026-02-09 06:56:46', 1),
(165, 'admin', '::1', '2026-02-09 09:18:23', 1),
(166, 'admin', '::1', '2026-02-09 12:28:51', 1),
(167, 'admin', '::1', '2026-02-09 12:58:59', 1),
(168, 'admin', '::1', '2026-02-10 05:48:51', 1),
(169, 'admin', '::1', '2026-02-15 05:19:58', 1),
(170, 'admin', '::1', '2026-02-15 05:24:03', 1),
(171, 'admin', '::1', '2026-02-15 06:10:26', 1),
(172, 'admin', '::1', '2026-02-15 06:28:55', 1),
(173, 'admin', '::1', '2026-02-15 08:00:26', 1),
(174, 'admin', '::1', '2026-02-15 08:02:32', 1),
(175, 'admin', '::1', '2026-02-15 08:23:39', 1),
(176, 'admin', '::1', '2026-02-15 12:48:11', 1),
(177, 'admin', '::1', '2026-02-15 14:03:54', 1),
(178, 'admin', '::1', '2026-02-16 04:05:03', 1),
(179, 'admin', '::1', '2026-02-16 05:23:04', 1),
(180, 'admin', '::1', '2026-02-16 05:27:04', 1),
(181, 'admin', '::1', '2026-02-16 08:06:02', 1),
(182, 'admin', '::1', '2026-02-17 04:54:42', 1),
(183, 'admin', '::1', '2026-02-17 05:06:43', 1),
(184, 'admin', '::1', '2026-02-17 05:29:58', 1),
(185, 'admin', '::1', '2026-02-17 05:42:39', 1),
(186, 'admin', '::1', '2026-02-17 07:21:03', 1),
(187, 'admin', '::1', '2026-02-18 09:07:57', 1),
(188, 'admin', '::1', '2026-02-19 04:29:17', 1),
(189, 'admin', '::1', '2026-02-19 08:06:57', 1),
(190, 'admin', '::1', '2026-02-21 09:16:14', 1),
(191, 'admin', '::1', '2026-02-22 05:06:24', 1),
(192, 'admin', '::1', '2026-02-22 07:42:37', 1),
(193, 'admin', '::1', '2026-02-22 12:35:02', 1),
(194, 'admin', '::1', '2026-02-23 09:15:53', 1),
(195, 'admin', '::1', '2026-03-02 09:01:29', 1),
(196, 'admin', '::1', '2026-03-07 09:53:13', 1),
(197, 'admin', '::1', '2026-03-07 10:00:51', 1),
(198, 'poursan', '::1', '2026-03-10 11:17:44', 0),
(199, 'admin', '::1', '2026-03-14 12:21:36', 1),
(200, 'admin', '::1', '2026-03-14 12:56:53', 1),
(201, 'admin', '::1', '2026-03-14 13:23:28', 1),
(202, 'admin', '::1', '2026-03-28 05:17:55', 0),
(203, 'admin', '::1', '2026-03-28 05:18:15', 1),
(204, 'admin', '::1', '2026-03-28 05:48:08', 1),
(205, 'admin', '::1', '2026-03-28 06:05:19', 1),
(206, 'admin', '::1', '2026-03-28 08:23:33', 1),
(207, 'admin', '::1', '2026-03-28 10:22:39', 1),
(208, 'admin', '::1', '2026-03-28 11:15:35', 1),
(209, 'admin', '::1', '2026-03-28 11:35:14', 1),
(210, 'admin', '::1', '2026-03-29 09:44:16', 1),
(211, 'admin', '::1', '2026-03-29 10:00:41', 1),
(212, 'admin', '::1', '2026-03-29 10:06:00', 1),
(213, 'admin', '::1', '2026-03-29 10:35:06', 1),
(214, 'admin', '::1', '2026-03-29 12:44:39', 1),
(215, 'admin', '::1', '2026-03-30 10:45:22', 1),
(216, 'admin', '::1', '2026-03-30 13:06:33', 0),
(217, 'admin', '::1', '2026-03-30 13:06:48', 0),
(218, 'admin', '::1', '2026-03-30 13:06:56', 1),
(219, 'admin', '::1', '2026-04-07 06:36:25', 1),
(220, 'admin', '::1', '2026-04-19 08:25:45', 1),
(221, 'admin', '::1', '2026-05-13 04:13:41', 1),
(222, 'admin', '::1', '2026-05-13 04:20:46', 1),
(223, 'admin', '::1', '2026-05-30 08:51:13', 1),
(224, 'admin', '::1', '2026-05-30 12:04:23', 1),
(225, 'admin', '::1', '2026-05-30 12:08:16', 1),
(226, 'admin', '::1', '2026-05-30 12:28:44', 1),
(227, 'admin', '::1', '2026-05-31 13:17:47', 1),
(228, 'admin', '::1', '2026-06-02 05:35:37', 1),
(229, 'operator3', '::1', '2026-06-02 13:32:26', 1),
(230, 'admin', '::1', '2026-06-02 13:40:02', 1),
(231, 'admin', '::1', '2026-06-03 10:54:17', 1),
(232, 'operator1', '::1', '2026-06-03 11:30:54', 1),
(233, 'admin', '::1', '2026-06-03 11:32:50', 1),
(234, 'operator1', '::1', '2026-06-03 11:33:41', 1),
(235, 'admin', '::1', '2026-06-03 11:35:07', 1),
(236, 'operator1', '::1', '2026-06-03 11:37:17', 1),
(237, 'admin', '::1', '2026-06-03 11:46:55', 1),
(238, 'operator1', '::1', '2026-06-03 11:47:42', 1),
(239, 'admin', '::1', '2026-06-03 11:48:29', 1),
(240, 'operator1', '::1', '2026-06-03 11:50:26', 1),
(241, 'admin', '::1', '2026-06-03 12:14:28', 1),
(242, 'admin', '::1', '2026-06-03 13:35:33', 1),
(243, 'admin', '::1', '2026-06-06 05:44:14', 1),
(244, 'operator1', '::1', '2026-06-06 07:56:50', 1),
(245, 'admin', '::1', '2026-06-06 07:58:56', 1),
(246, 'operator1', '::1', '2026-06-06 08:12:21', 1),
(247, 'admin', '::1', '2026-06-06 08:52:29', 1),
(248, 'operator1', '::1', '2026-06-06 08:52:52', 1),
(249, 'admin', '::1', '2026-06-06 08:53:58', 1),
(250, 'operator1', '::1', '2026-06-06 08:57:24', 1),
(251, 'admin', '::1', '2026-06-06 09:18:31', 1),
(252, 'operator1', '::1', '2026-06-06 09:23:15', 1),
(253, 'admin', '::1', '2026-06-06 09:26:11', 1),
(254, 'admin', '::1', '2026-06-06 09:39:59', 1),
(255, 'admin1', '::1', '2026-06-06 09:42:55', 0),
(256, 'admin', '::1', '2026-06-06 09:43:08', 1),
(257, 'admin', '::1', '2026-06-06 09:45:13', 1),
(258, 'admin1', '::1', '2026-06-06 10:47:23', 0),
(259, 'admin1', '::1', '2026-06-06 10:47:32', 0),
(260, 'admin', '::1', '2026-06-06 10:47:36', 0),
(261, 'admin', '::1', '2026-06-06 10:47:38', 0),
(262, 'admin', '::1', '2026-06-06 10:47:46', 1),
(263, 'admin1', '::1', '2026-06-06 12:12:13', 0),
(264, 'admin1', '::1', '2026-06-06 12:12:17', 0),
(265, 'admin1', '::1', '2026-06-06 12:12:18', 0),
(266, 'admin1', '::1', '2026-06-06 12:12:19', 0),
(267, 'admin1', '::1', '2026-06-06 12:12:22', 0),
(268, 'admin1', '::1', '2026-06-06 12:12:23', 0),
(269, 'admin1', '::1', '2026-06-06 12:12:23', 0),
(270, 'admin', '::1', '2026-06-06 12:12:27', 0),
(271, 'admin', '::1', '2026-06-06 12:12:31', 0),
(272, 'admin', '::1', '2026-06-06 12:12:36', 1),
(273, 'operator1', '::1', '2026-06-06 12:26:49', 1),
(274, 'admin', '::1', '2026-06-06 13:33:23', 1),
(275, 'admin', '::1', '2026-06-07 12:18:44', 1),
(276, 'operator1', '::1', '2026-06-07 12:22:09', 1),
(277, 'operator2', '::1', '2026-06-07 12:24:00', 1),
(278, 'operator1', '::1', '2026-06-07 12:27:44', 1),
(279, 'admin', '::1', '2026-06-07 12:47:02', 1),
(280, 'operator1', '::1', '2026-06-07 12:48:07', 1),
(281, 'admin', '::1', '2026-06-07 13:02:09', 1),
(282, 'operator1', '::1', '2026-06-07 13:10:09', 1),
(283, 'admin', '::1', '2026-06-07 13:18:21', 1),
(284, 'operator1', '::1', '2026-06-07 13:22:03', 1),
(285, 'admin', '::1', '2026-06-08 06:58:29', 1),
(286, 'operator1', '::1', '2026-06-08 07:07:38', 1),
(287, 'admin', '::1', '2026-06-08 07:11:19', 1),
(288, 'operator1', '::1', '2026-06-08 07:12:10', 1),
(289, 'admin', '::1', '2026-06-08 07:16:42', 1),
(290, 'operator1', '::1', '2026-06-08 07:24:48', 1),
(291, 'admin', '::1', '2026-06-08 07:28:34', 1),
(292, 'operator1', '::1', '2026-06-08 07:50:14', 0),
(293, 'operator1', '::1', '2026-06-08 07:50:18', 1),
(294, 'admin', '::1', '2026-06-08 07:55:04', 1),
(295, 'operator1', '::1', '2026-06-08 07:56:09', 1),
(296, 'admin', '::1', '2026-06-08 08:05:10', 1),
(297, 'operator1', '::1', '2026-06-08 08:05:57', 1),
(298, 'admin', '::1', '2026-06-08 08:14:06', 1),
(299, 'operator1', '::1', '2026-06-08 08:15:02', 1),
(300, 'operator1', '::1', '2026-06-08 08:18:52', 1),
(301, 'admin', '::1', '2026-06-08 08:29:42', 1),
(302, 'operator1', '::1', '2026-06-08 08:30:22', 1),
(303, 'admin', '::1', '2026-06-08 09:37:21', 1),
(304, 'operator1', '::1', '2026-06-08 09:38:30', 1),
(305, 'admin', '::1', '2026-06-08 09:39:49', 1),
(306, 'operator1', '::1', '2026-06-08 09:46:51', 1),
(307, 'admin', '::1', '2026-06-08 09:49:32', 1),
(308, 'operator1', '::1', '2026-06-08 09:52:07', 1),
(309, 'admin', '::1', '2026-06-08 11:25:57', 1),
(310, 'operator1', '::1', '2026-06-08 11:28:08', 1),
(311, 'admin', '::1', '2026-06-08 11:56:56', 1),
(312, 'operator1', '::1', '2026-06-08 11:59:26', 1),
(313, 'admin', '::1', '2026-06-08 12:29:55', 1),
(314, 'operator1', '::1', '2026-06-08 12:31:50', 1),
(315, 'admin', '::1', '2026-06-08 12:49:31', 1),
(316, 'operator1', '::1', '2026-06-08 12:51:10', 1),
(317, 'operator1', '::1', '2026-06-08 13:02:04', 1),
(318, 'admin', '::1', '2026-06-09 06:04:05', 1),
(319, 'admin', '::1', '2026-06-09 07:59:30', 1),
(320, 'admin', '::1', '2026-06-09 08:09:42', 1),
(321, 'admin', '::1', '2026-06-09 08:13:41', 1),
(322, 'admin', '::1', '2026-06-09 08:29:38', 1),
(323, 'admin', '::1', '2026-06-09 08:30:37', 1),
(324, 'admin', '::1', '2026-06-09 12:39:06', 1),
(325, 'admin', '::1', '2026-06-09 12:56:18', 1),
(326, 'operator2', '::1', '2026-06-09 13:40:55', 1),
(327, 'admin', '::1', '2026-06-10 05:44:00', 1),
(328, 'admin', '::1', '2026-06-10 07:19:08', 1),
(329, 'operator1', '::1', '2026-06-10 07:20:55', 1),
(330, 'admin', '::1', '2026-06-10 07:52:24', 1),
(331, 'operator1', '::1', '2026-06-10 07:52:48', 1),
(332, 'admin', '::1', '2026-06-10 08:05:12', 1),
(333, 'operator1', '::1', '2026-06-10 08:07:04', 1),
(334, 'admin', '::1', '2026-06-10 09:22:47', 1),
(335, 'operator1', '::1', '2026-06-10 09:30:24', 1),
(336, 'admin', '::1', '2026-06-10 09:37:08', 1),
(337, 'operator1', '::1', '2026-06-10 09:38:26', 1),
(338, 'admin', '::1', '2026-06-10 10:17:27', 1),
(339, 'admin', '::1', '2026-06-10 10:41:27', 1),
(340, 'operator1', '::1', '2026-06-10 10:41:43', 1),
(341, 'admin', '::1', '2026-06-10 10:42:24', 1),
(342, 'operator1', '::1', '2026-06-10 10:43:59', 1),
(343, 'admin', '::1', '2026-06-10 10:45:22', 1),
(344, 'operator1', '::1', '2026-06-10 10:50:57', 1),
(345, 'admin', '::1', '2026-06-10 10:57:25', 1),
(346, 'operator1', '::1', '2026-06-10 10:58:12', 1),
(347, 'admin', '::1', '2026-06-10 10:58:55', 1),
(348, 'operator1', '::1', '2026-06-10 11:11:20', 1),
(349, 'admin', '::1', '2026-06-10 11:17:07', 1),
(350, 'operator1', '::1', '2026-06-10 11:42:41', 1),
(351, 'admin', '::1', '2026-06-10 11:55:02', 1),
(352, 'operator1', '::1', '2026-06-10 11:56:34', 1),
(353, 'admin', '::1', '2026-06-10 12:05:42', 1),
(354, 'operator1', '::1', '2026-06-10 12:06:29', 1),
(355, 'operator1', '::1', '2026-06-10 12:12:23', 1),
(356, 'operator2', '::1', '2026-06-10 12:26:41', 1),
(357, 'operator1', '::1', '2026-06-10 12:38:55', 1),
(358, 'admin', '::1', '2026-06-13 10:32:13', 1),
(359, 'operator1', '::1', '2026-06-13 10:39:14', 1),
(360, 'operator1', '::1', '2026-06-13 10:44:03', 1),
(361, 'admin', '::1', '2026-06-13 10:44:36', 1),
(362, 'operator1', '::1', '2026-06-13 10:44:54', 1),
(363, 'operator1', '::1', '2026-06-13 10:46:13', 1),
(364, 'operator2', '::1', '2026-06-13 10:46:28', 1),
(365, 'operator1', '::1', '2026-06-13 10:47:40', 1),
(366, 'admin', '::1', '2026-06-13 10:49:02', 1),
(367, 'admin', '::1', '2026-06-13 10:49:49', 1),
(368, 'admin', '::1', '2026-06-13 11:24:19', 1),
(369, 'admin', '::1', '2026-06-13 11:34:19', 1),
(370, 'operator1', '::1', '2026-06-13 11:37:01', 1),
(371, 'operator2', '::1', '2026-06-13 11:38:10', 1),
(372, 'operator3', '::1', '2026-06-13 12:14:33', 1),
(373, 'operator3', '::1', '2026-06-13 12:29:41', 1),
(374, 'operator3', '::1', '2026-06-13 12:35:25', 1),
(375, 'operator2', '::1', '2026-06-13 12:43:25', 1),
(376, 'admin', '::1', '2026-06-13 12:44:10', 1),
(377, 'operator1', '::1', '2026-06-13 12:45:49', 0),
(378, 'operator1', '::1', '2026-06-13 12:45:54', 1),
(379, 'operator2', '::1', '2026-06-13 12:46:56', 1),
(380, 'operator3', '::1', '2026-06-13 12:47:47', 1),
(381, 'admin', '::1', '2026-06-14 08:19:36', 1);

-- --------------------------------------------------------

--
-- Table structure for table `maintenance_costs`
--

CREATE TABLE `maintenance_costs` (
  `id` int(11) NOT NULL,
  `cost_code` varchar(50) NOT NULL,
  `work_order_id` int(11) DEFAULT NULL,
  `equipment_id` int(11) DEFAULT NULL,
  `cost_type` enum('Wages','Parts','Tools','Outsourcing','Other') NOT NULL,
  `description` mediumtext DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'IRT',
  `transaction_date` date NOT NULL,
  `recorded_by` int(11) NOT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approval_date` date DEFAULT NULL,
  `invoice_number` varchar(100) DEFAULT NULL,
  `supplier` varchar(100) DEFAULT NULL,
  `notes` mediumtext DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

--
-- Dumping data for table `maintenance_costs`
--

INSERT INTO `maintenance_costs` (`id`, `cost_code`, `work_order_id`, `equipment_id`, `cost_type`, `description`, `amount`, `currency`, `transaction_date`, `recorded_by`, `approved_by`, `approval_date`, `invoice_number`, `supplier`, `notes`) VALUES
(1, 'MC-2023-001', 1001, 5, 'Parts', 'تعویض بلبرینگ موتور اصلی', 1250000.00, 'IRT', '2023-10-15', 12, 8, '2023-10-16', 'INV-78945', 'تامین قطعات صنعتی پارس', 'قطعات با گارانتی 12 ماهه'),
(2, 'MC-2023-002', 1002, 7, 'Wages', 'حقوق تکنسین برای سرویس دوره‌ای', 850000.00, 'IRT', '2023-10-18', 12, 8, '2023-10-18', NULL, NULL, 'کار بر اساس قرارداد ساعتی'),
(3, 'MC-2023-003', NULL, 12, 'Tools', 'خرید آچار تنظیم مخصوص', 320000.00, 'IRT', '2023-10-20', 15, NULL, NULL, 'INV-79122', 'ابزارستان تهران', 'ابزار تحویل انبار مرکزی شد'),
(4, 'MC-2023-004', 1005, 3, 'Outsourcing', 'برون‌سپاری بازسازی پنل کنترل', 4500000.00, 'IRT', '2023-10-22', 15, 8, '2023-10-25', 'INV-45001', 'شرکت فنی رادین', 'پرداخت پس از تایید کیفیت'),
(5, 'MC-2023-005', 1003, NULL, 'Other', 'هزینه ایاب و ذهاب برای تعمیرات خارج سایت', 250000.00, 'IRT', '2023-10-25', 12, 8, '2023-10-26', NULL, NULL, 'به ازای 500 کیلومتر طی مسافت'),
(6, 'MC-2023-006', 1004, 9, 'Parts', 'خرید روغن هیدرولیک و فیلتر', 980000.00, 'IRT', '2023-11-01', 15, 9, '2023-11-02', 'INV-79500', 'نفت ایران', 'مصرف برای دستگاه شماره 9 و 11'),
(7, 'MC-2023-007', NULL, NULL, 'Tools', 'تهیه مجموعه‌ای از پیچ و مهره‌های استاندارد', 175000.00, 'IRT', '2023-11-05', 12, NULL, NULL, NULL, 'تکوین پیچ', 'موجودی انبار ابزار تکمیل شد'),
(8, 'MC-2023-008', 1008, 6, 'Wages', 'اضافه‌کاری تیم تعمیرات برای اورهال فوری', 1200000.00, 'IRT', '2023-11-10', 15, 9, '2023-11-10', NULL, NULL, 'طی قرارداد داخلی تایید شد');

-- --------------------------------------------------------

--
-- Table structure for table `maintenance_history`
--

CREATE TABLE `maintenance_history` (
  `id` int(11) NOT NULL,
  `equipment_id` int(11) NOT NULL,
  `work_order_id` int(11) DEFAULT NULL,
  `maintenance_type` enum('preventive','corrective','planned','emergency') NOT NULL,
  `maintenance_date` date NOT NULL,
  `completed_by` int(11) DEFAULT NULL,
  `description` mediumtext DEFAULT NULL,
  `performed_actions` mediumtext DEFAULT NULL,
  `spare_parts_used` mediumtext DEFAULT NULL,
  `total_cost` decimal(12,2) DEFAULT NULL,
  `downtime_hours` decimal(8,2) DEFAULT NULL,
  `notes` mediumtext DEFAULT NULL,
  `recorded_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

--
-- Dumping data for table `maintenance_history`
--

INSERT INTO `maintenance_history` (`id`, `equipment_id`, `work_order_id`, `maintenance_type`, `maintenance_date`, `completed_by`, `description`, `performed_actions`, `spare_parts_used`, `total_cost`, `downtime_hours`, `notes`, `recorded_at`) VALUES
(1, 101, 5001, 'preventive', '2026-02-01', 10, 'تعویض روغن و فیلترهای دستگاه پرس', 'بررسی سطح روغن، تخلیه روغن قدیمی، تعویض فیلتر روغن، شارژ روغن جدید، تست عملکرد', 'فیلتر روغن مدل P-102 (2 عدد)، روغن هیدرولیک گرید 46 (20 لیتر)', 450000.00, 3.50, 'دستگاه پس از سرویس نرم‌تر کار می‌کند، لرزش کاهش یافته', '2024-03-01 11:00:00'),
(2, 45, 5002, 'emergency', '2024-03-05', 12, 'رفع نشتی هیدرولیک خط تولید', 'تعیین محل نشتی، تخلیه فشار، تعویض اورینگ‌های خراب، پر کردن مجدد روغن، تست فشار', 'اورینگ سایز 15mm (4 عدد)، واشر آب‌بندی، روغن هیدرولیک گرید 46 (5 لیتر)', 280000.00, 6.75, 'نشتی در اتصال پمپ اصلی بود، فشار سیستم به حالت نرمال بازگشت', '2024-03-05 14:50:00'),
(3, 78, 5003, 'corrective', '2024-03-10', 15, 'تعمیر سنسور دمای کوره', 'تشخیص خطای سنسور، جداکردن سنسور معیوب، نصب سنسور جدید، کالیبراسیون، تست دما در سطوح مختلف', 'سنسور دمای نوع K، کابل ارتباطی 3 متری، کانکتور ضدحرارت', 1850000.00, 8.00, 'سنسور قبلی کالیبره نمی‌شد، دمای واقعی 50 درجه اختلاف داشت', '2024-03-10 09:15:00'),
(4, 33, 5004, 'planned', '2024-03-15', 10, 'بازرسی سالیانه سیستم برق اضطراری', 'بررسی باتری‌ها، تست سیستم شارژ، تست روشن شدن خودکار، بررسی ژنراتور، تست تحت بار', 'باتری 12V 100Ah (2 عدد)، تسمه ژنراتور، روغن موتور', 3200000.00, 4.00, 'دو باتری نیاز به تعویض داشتند، ژنراتور سالم است', '2024-03-15 12:40:00'),
(5, 22, 5005, 'preventive', '2024-03-18', 18, 'سرویس ماهیانه دستگاه CNC', 'تمیزکاری محورها، بررسی سطوح روانکاری، کالیبراسیون موقعیت‌یاب، بررسی ابزارها', 'گریس مخصوص محور، روغن اسپیندل، فیلتر هوا', 850000.00, 5.25, 'دقت موقعیت‌یابی پس از کالیبراسیون بهبود یافت', '2024-03-18 08:00:00'),
(6, 56, NULL, 'corrective', '2024-03-20', 12, 'تعویض تسمه نوارنقاله خط بسته‌بندی', 'توقف خط، بازکردن پوشش ایمنی، شل کردن تنظیمات، تعویض تسمه پاره شده، تنظیم کشش، تست', 'تسمه نوارنقاله 4 متری نوع PVC، رولیک 2 عدد', 1250000.00, 10.50, 'تسمه به دلیل فرسودگی پاره شده بود، پیشنهاد ثبت برای تعویض دوره‌ای', '2024-03-20 16:45:00'),
(7, 89, 5007, 'preventive', '2024-03-25', 15, 'سرویس فصلی کمپرسور هوا', 'تخلیه رطوبت از تانک، تعویض فیلتر هوا، بررسی فشار رله، تست شیر اطمینان، روغن‌کاری', 'فیلتر هوای مدل AF-200، روغن کمپرسور (2 لیتر)', 650000.00, 2.75, 'فشار کاری پایدار شده، مصرف انرژی کاهش یافته', '2024-03-25 06:15:00'),
(8, 67, 5008, 'emergency', '2024-03-28', 18, 'رفع خطای کنترلر پنل دستگاه تزریق پلاستیک', 'ریست کردن خطا، بررسی ورودی‌های سنسور، تست خروجی‌های PLC، تعویض ماژول خروجی معیوب', 'ماژول خروجی PLC مدل FX-16EYT', 4500000.00, 14.00, 'یک خروجی کنترل شیر برقی سوخته بود، باعث توقف سیکل تزریق می‌شد', '2024-03-28 20:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `maintenance_requests`
--

CREATE TABLE `maintenance_requests` (
  `id` int(11) NOT NULL,
  `request_number` varchar(50) NOT NULL,
  `equipment_id` int(11) NOT NULL,
  `reported_by` int(11) NOT NULL,
  `problem_description` mediumtext NOT NULL,
  `priority` enum('low','medium','high','critical') DEFAULT 'medium',
  `request_date` timestamp NULL DEFAULT current_timestamp(),
  `requested_completion_date` date DEFAULT NULL,
  `status` enum('Registered','Awaiting Approval','Approved','In Progress','Paused','Completed','Cancelled') DEFAULT 'Registered',
  `approval_date` date DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

--
-- Dumping data for table `maintenance_requests`
--

INSERT INTO `maintenance_requests` (`id`, `request_number`, `equipment_id`, `reported_by`, `problem_description`, `priority`, `request_date`, `requested_completion_date`, `status`, `approval_date`, `approved_by`) VALUES
(0, 'TEST-001', 1, 3, 'تست تریگر اعلان', 'high', '2026-01-29 10:44:19', NULL, 'Registered', NULL, NULL),
(1, 'MNT-2024-001', 101, 15, 'دستگاه CNC صدای غیرعادی هنگام کارکرد تولید می‌کند. احتمالاً یاتاقان‌ها نیاز به تعویض دارند.', 'high', '2024-01-15 05:00:00', '2024-01-25', 'Approved', '2024-01-15', 22),
(2, 'MNT-2024-002', 205, 18, 'نشت روغن در پایین پرس هیدرولیک شماره 3 مشاهده شده است.', 'critical', '2024-01-16 05:45:00', '2024-01-18', 'In Progress', '2024-01-16', 22),
(3, 'MNT-2024-003', 89, 12, 'سیستم روشنایی بخش انبار، 5 لامپ سوخته دارد.', 'low', '2024-01-14 10:50:00', '2024-02-01', 'Completed', '2024-01-15', 22),
(4, 'MNT-2024-004', 310, 16, 'کولر گازی سالن تولید 1، عملکرد ضعیف و سرمایش ناکافی دارد.', 'medium', '2024-01-17 07:30:00', '2024-01-30', 'Awaiting Approval', NULL, NULL),
(5, 'MNT-2024-005', 178, 14, 'درب اتوماتیک واگن‌بر، گاهی اوقات به درستی بسته نمی‌شود.', 'high', '2024-01-18 10:15:00', '2024-01-22', 'Registered', NULL, NULL),
(6, 'MNT-2024-006', 42, 20, 'کامپیوتر کنترل خط بسته‌بندی، گاهی هنگ می‌کند. نیاز به بررسی نرم‌افزار و سخت‌افزار دارد.', 'critical', '2024-01-16 12:40:00', '2024-01-19', 'Completed', '2024-01-17', 24),
(7, 'MNT-2024-007', 56, 13, 'فشار سنج دیگ بخار شماره 2، عقربه ثابت مانده است.', 'high', '2024-01-19 06:30:00', '2024-01-23', 'In Progress', '2024-01-19', 24),
(8, 'MNT-2024-008', 93, 11, 'صندلی اداری واحد مالی خراب شده است.', 'low', '2024-01-15 12:00:00', '2024-02-10', 'Paused', '2024-01-16', 22);

-- --------------------------------------------------------

--
-- Table structure for table `maintenance_schedules`
--

CREATE TABLE `maintenance_schedules` (
  `id` int(11) NOT NULL,
  `procedure_code` varchar(50) NOT NULL,
  `related_document_id` int(11) DEFAULT NULL,
  `equipment_type` varchar(50) DEFAULT NULL,
  `procedure_name` varchar(200) NOT NULL,
  `procedure_description` mediumtext DEFAULT NULL,
  `frequency_type` enum('hourly','daily','weekly','monthly','seasonal','semi-annual','annual','usage-based','after failure') DEFAULT NULL,
  `frequency_value` int(11) DEFAULT NULL,
  `estimated_duration_hours` decimal(5,2) DEFAULT NULL,
  `required_skills` mediumtext DEFAULT NULL,
  `required_tools` mediumtext DEFAULT NULL,
  `required_materials` mediumtext DEFAULT NULL,
  `safety_precautions` mediumtext DEFAULT NULL,
  `step_by_step_instructions` mediumtext DEFAULT NULL,
  `checklist` mediumtext DEFAULT NULL,
  `doc_link` varchar(500) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `last_updated` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

--
-- Dumping data for table `maintenance_schedules`
--

INSERT INTO `maintenance_schedules` (`id`, `procedure_code`, `related_document_id`, `equipment_type`, `procedure_name`, `procedure_description`, `frequency_type`, `frequency_value`, `estimated_duration_hours`, `required_skills`, `required_tools`, `required_materials`, `safety_precautions`, `step_by_step_instructions`, `checklist`, `doc_link`, `created_by`, `created_at`, `last_updated`, `is_active`) VALUES
(1, 'PM-PUMP-001', 1, 'centrifugal_pump', 'تعویض آب‌بند مکانیکی', 'تعویض آب‌بند مکانیکی پمپ سانتریفیوژ برای جلوگیری از نشتی روغن', 'monthly', 1, 2.50, 'مکانیک صنعتی سطح 2, تجربه کار با پمپ‌های گریز از مرکز', 'آچار آلن, انبردست, پیچ‌گوشتی, کولیس', 'آب‌بند مکانیکی (سایز 50mm), گریس سیلیکونی, دستکش نیتریل', 'قطع برق پمپ, قرقر کردن فشار سیستم, استفاده از دستکش ایمنی', '1. قطع برق پمپ\n2. تخلیه فشار سیستم\n3. بازکردن پوسته\n4. خارج کردن آب‌بند قدیمی\n5. نصب آب‌بند جدید\n6. مونتاژ مجدد\n7. تست فشار', '☐ قطع برق\n☐ تخلیه فشار\n☐ بازرسی آب‌بند قدیمی\n☐ نصب آب‌بند جدید\n☐ تست نشتی\n☐ ثبت در گزارش', '/docs/procedures/pump_repair_v2.1.pdf', 1, '2026-01-31 14:27:19', '2026-02-02 14:05:42', 1),
(2, 'PM-COMP-002', 2, 'air_compressor', 'سرویس فیلتر هوای کمپرسور', 'تعویض و تمیز کردن فیلتر هوای کمپرسور برای بهبود راندمان', 'monthly', 1, 1.00, 'اپراتور کمپرسور, مکانیک عمومی', 'پیچ‌گوشتی, جاروبرقی صنعتی', 'فیلتر هوای جدید (مدل C-405), دستمال تمیز', 'قطع برق, استفاده از ماسک گرد و غبار', '1. خاموش کردن کمپرسور\n2. باز کردن درب فیلتر\n3. خارج کردن فیلتر قدیمی\n4. تمیز کردن محفظه\n5. نصب فیلتر جدید\n6. تست عملکرد', '☐ خاموش کردن دستگاه\n☐ تمیز کردن محفظه\n☐ نصب فیلتر جدید\n☐ بررسی فشار هوا\n☐ ثبت زمان سرویس', '/docs/checklists/compressor_monthly.xlsx', 2, '2026-01-31 14:27:19', '2026-02-02 14:05:42', 1),
(3, 'PM-CNV-003', 9, 'conveyor_belt', 'تنظیم تسمه نقاله', 'تنظیم کشش تسمه نقاله و بررسی غلتک‌ها', 'weekly', 1, 3.00, 'مکانیک نوار نقاله, برقکار صنعتی', 'آچار قابل تنظیم, تنسومتر, تراز لیزری', 'گریس, دستکش کار', 'قفل‌گذاری انرژی, استفاده از کلاه ایمنی', '1. قفل‌گذاری انرژی\n2. بررسی کشش تسمه\n3. تنظیم غلتک‌ها\n4. روان‌کاری یاتاقان‌ها\n5. تست حرکت تسمه\n6. بررسی تراز', '☐ قفل‌گذاری\n☐ بررسی کشش\n☐ تنظیم غلتک‌ها\n☐ روان‌کاری\n☐ تست عملکرد\n☐ بررسی ایمنی', '/docs/checklists/weekly_inspection.xlsx', 1, '2026-01-31 14:27:19', '2026-02-02 14:05:43', 1),
(4, 'PM-GEN-004', 5, 'diesel_generator', 'سرویس دوره‌ای دیزل ژنراتور', 'تعویض روغن، فیلترها و تست بار ژنراتور اضطراری', 'monthly', 1, 4.50, 'تکنسین دیزل, برقکار فشار قوی', 'آچار بکس, پمپ تخلیه روغن, مالتی‌متر', 'روغن موتور 15W-40, فیلتر روغن, فیلتر هوا, فیلتر سوخت', 'کار در محیط با تهویه مناسب, جلوگیری از جرقه', '1. گرم کردن موتور\n2. تخلیه روغن قدیمی\n3. تعویض فیلترها\n4. پر کردن روغن جدید\n5. تست استارت سرد\n6. تست بار 50%\n7. ثبت پارامترها', '☐ بررسی سطح روغن\n☐ تعویض فیلترها\n☐ تست باتری\n☐ تست استارت\n☐ تست بار\n☐ ثبت گزارش', '/docs/manuals/diesel_generator_manual.pdf', 3, '2026-01-31 14:27:19', '2026-02-02 14:05:43', 1),
(5, 'PM-AC-005', 3, 'air_conditioner', 'سرویس سالانه چیلر', 'شستشو کویل‌ها، بررسی گاز مبرد و سرویس الکتریکی', 'annual', 1, 6.00, 'تکنسین تهویه مطبوع, برقکار صنعتی', 'مانومتر, گاز نشت‌یاب, پیچ‌گوشتی عایق', 'گاز مبرد R410A, مواد شوینده مخصوص, فیلترهای جدید', 'کار با گازهای تحت فشار, استفاده از عینک ایمنی', '1. خاموش کردن سیستم\n2. شستشو کویل‌ها\n3. بررسی فشار گاز\n4. سرویس قطعات الکتریکی\n5. تست عملکرد\n6. کالیبره ترموستات', '☐ شستشو کویل‌ها\n☐ بررسی فشار گاز\n☐ سرویس الکتریکال\n☐ تست عملکرد\n☐ کالیبراسیون\n☐ ثبت داده‌ها', '/docs/safety/cnc_safety_guide.pdf', 2, '2026-01-31 14:27:19', '2026-02-02 14:05:43', 1),
(6, 'PM-HV-006', NULL, 'hydraulic_valve', 'بازبینی شیرهای هیدرولیک', 'بازرسی، تمیزکاری و تعویض اورینگ شیرهای کنترل هیدرولیک', 'semi-annual', 6, 2.00, 'تکنسین هیدرولیک, مکانیک سیالات', 'آچار ترکمتر, پنس مخصوص, دستگاه تمیزکاری اولتراسونیک', 'اورینگ کیت, روغن هیدرولیک ISO 46, دستمال بدون پرز', 'تخلیه فشار هیدرولیک, استفاده از عینک محافظ', '1. تخلیه فشار سیستم\n2. دمونتاژ شیر\n3. تمیزکاری قطعات\n4. تعویض اورینگ‌ها\n5. مونتاژ مجدد\n6. تست فشار', '☐ تخلیه فشار\n☐ بازرسی شیر\n☐ تعویض اورینگ\n☐ تست نشتی\n☐ تنظیم فشار\n☐ ثبت نتایج', NULL, 1, '2026-01-31 14:27:19', '2026-01-31 14:27:19', 1),
(7, 'PM-ROB-007', 6, 'industrial_robot', 'کالیبراسیون ربات صنعتی', 'کالیبره کردن محورهای ربات و بررسی دقت موقعیت‌یابی', 'monthly', 1, 2.00, 'تکنسین رباتیک, برنامه‌نویس PLC', 'کیت کالیبراسیون, لیزر تراز, لپ‌تاپ مخصوص', 'نرم‌افزار کالیبراسیون, باتری‌های جدید', 'قفل‌گذاری ربات, کار در حالت دستی', '1. قفل‌گذاری ربات\n2. اجرای برنامه کالیبراسیون\n3. تنظیم پارامترهای محورها\n4. تست دقت موقعیت‌یابی\n5. ذخیره کالیبراسیون\n6. تست عملیاتی', '☐ قفل‌گذاری\n☐ اجرای برنامه\n☐ تنظیم محورها\n☐ تست دقت\n☐ ذخیره داده‌ها\n☐ تست نهایی', '/docs/procedures/calibration_procedure.pdf', 3, '2026-01-31 14:27:19', '2026-02-02 14:05:43', 1),
(8, 'PM-TRN-008', NULL, 'transformer', 'اندازه‌گیری مقاومت عایقی ترانسفورماتور', 'تست مگا اهم سیم پیچ‌ها و بررسی سطح روغن', 'semi-annual', 6, 1.50, 'تکنسین برق فشار قوی, اپراتور تست تجهیزات', 'مگا اهم متر, دماسنج مادون قرمز, وسایل نمونه‌برداری روغن', 'روغن ترانسفورماتور, دستکش عایق', 'قطع برق فشار قوی, استفاده از تجهیزات حفاظتی کامل', '1. قطع برق و ارت کردن\n2. اتصال مگا اهم متر\n3. اندازه‌گیری مقاومت\n4. بررسی سطح روغن\n5. نمونه‌برداری روغن\n6. ثبت نتایج', '☐ قطع برق\n☐ ارت کردن\n☐ تست مگا اهم\n☐ بررسی روغن\n☐ نمونه‌برداری\n☐ ثبت گزارش', NULL, 2, '2026-01-31 14:27:19', '2026-01-31 14:27:19', 1),
(9, 'PM-BLR-009', 8, 'steam_boiler', 'شستشو و رسوب‌زدایی دیگ بخار', 'شستشو شیمیایی و مکانیکی دیگ بخار برای حذف رسوبات', 'seasonal', 3, 8.00, 'اپراتور بویلر, تکنسین شیمیایی', 'پمپ شستشو, برس‌های مخصوص, پیچ‌گوشتی', 'مواد شوینده مخصوص, خنثی‌کننده اسید, دستکش شیمیایی', 'کار با مواد شیمیایی, تهویه مناسب, لباس محافظ', '1. تخلیه بویلر\n2. تزریق مواد شوینده\n3. شستشوی مکانیکی\n4. خنثی‌سازی\n5. آبکشی\n6. پر کردن مجدد\n7. تست فشار', '☐ تخلیه بویلر\n☐ شستشو شیمیایی\n☐ شستشو مکانیکی\n☐ آبکشی کامل\n☐ پر کردن مجدد\n☐ تست فشار و نشتی', '/docs/specs/hydraulic_valve_specs.pdf', 1, '2026-01-31 14:27:19', '2026-02-02 14:05:43', 1),
(10, 'PM-FLT-010', 4, 'filtration_system', 'تعویض فیلترهای کربن فعال', 'تعویض فیلترهای کربن فعال در سیستم فیلتراسیون آب', 'monthly', 1, 1.50, 'اپراتور سیستم فیلتراسیون, تکنسین شیمیایی', 'آچار لوله, پیچ‌گوشتی, سطل', 'فیلتر کربن فعال (سایز 20\"), دستکش نیتریل', 'کار در محیط مرطوب, جلوگیری از تنفس گرد کربن', '1. بستن شیر ورودی\n2. تخلیه فشار\n3. باز کردن محفظه\n4. تعویض فیلتر قدیمی\n5. نصب فیلتر جدید\n6. آب‌بندی\n7. تست عملکرد', '☐ بستن شیرها\n☐ تخلیه فشار\n☐ تعویض فیلتر\n☐ آب‌بندی\n☐ تست فشار\n☐ تست کیفیت آب', '/docs/forms/repair_report_form.docx', 2, '2026-01-31 14:27:19', '2026-02-02 14:05:43', 1),
(11, 'PM-EMG-011', 7, 'emergency_system', 'تست سیستم‌های اضطراری', 'تست کامل سیستم‌های اعلام و اطفاء حریق', 'monthly', 1, 3.00, 'تکنسین سیستم‌های ایمنی, مسئول HSE', 'تستر دتکتور, فشارسنج, تایمر', 'باتری دتکتور, مواد تست اعلام حریق', 'هماهنگی با واحد ایمنی, جلوگیری از هشدار کاذب', '1. تست دتکتورهای دود\n2. تست شستی اعلام حریق\n3. بررسی فشار سیستم اطفاء\n4. تست چراغ‌های راهنما\n5. بررسی باتری‌ها\n6. ثبت نتایج تست', '☐ تست دتکتورها\n☐ تست شستی‌ها\n☐ بررسی فشار\n☐ تست چراغ‌ها\n☐ بررسی باتری\n☐ ثبت گزارش', '/docs/instructions/welding_instruction.pdf', 3, '2026-01-31 14:27:19', '2026-02-02 14:05:43', 1),
(12, 'PM-LFT-012', NULL, 'forklift', 'سرویس کامل لیفتراک', 'بررسی ترمز، فرمان، هیدرولیک و موتور لیفتراک', 'weekly', 1, 2.50, 'مکانیک لیفتراک, تکنسین هیدرولیک', 'جک هیدرولیک, گیج فشار روغن, استروبوسکوپ', 'روغن هیدرولیک, فیلتر هوا, تسمه تایم', 'کار با وسایل بالابر, استفاده از کفش ایمنی', '1. بررسی سطح مایعات\n2. تست ترمز\n3. بررسی سیستم هیدرولیک\n4. تست فرمان\n5. بررسی چرخ‌ها\n6. تست نهایی رانندگی', '☐ بررسی مایعات\n☐ تست ترمز\n☐ تست هیدرولیک\n☐ تست فرمان\n☐ بررسی چرخ‌ها\n☐ تست عملیاتی', NULL, 1, '2026-01-31 14:27:19', '2026-01-31 14:27:19', 0);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('maintenance_request','work_order','inspection','equipment','parts','alert','system') DEFAULT 'system',
  `priority` enum('low','medium','high','critical') DEFAULT 'medium',
  `related_module` varchar(50) DEFAULT NULL,
  `related_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `sender_id` int(11) DEFAULT NULL,
  `sender_name` varchar(100) DEFAULT NULL,
  `sender_role` varchar(50) DEFAULT NULL,
  `reporter_name` varchar(100) DEFAULT NULL,
  `target_role` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `priority`, `related_module`, `related_id`, `is_read`, `read_at`, `created_at`, `expires_at`, `sender_id`, `sender_name`, `sender_role`, `reporter_name`, `target_role`) VALUES
(389, 1, 'تأیید ثبت گزارش عدم انطباق', 'گزارش شما با شماره NC-20260613-598 با موفقیت ثبت و به کنترل کیفیت ارجاع شد.', 'alert', 'high', 'defect_reports', 95, 0, NULL, '2026-06-13 12:45:35', '2026-06-20 12:45:35', 1, 'حمید صبوری', 'reporter', 'حمید صبوری', 'reporter'),
(390, 4, 'گزارش عدم انطباق جدید', 'گزارش قطعه معیوب شماره NC-20260613-598 ثبت گردید.\nگزارش‌دهنده: حمید صبوری\nقطعه: سنسور ترمز\nنوع عیب: عملکردی', 'alert', 'high', 'defect_reports', 95, 1, '2026-06-13 12:46:28', '2026-06-13 12:45:35', '2026-06-20 12:45:35', 1, 'حمید صبوری', 'reporter', 'حمید صبوری', 'Quality-Manager'),
(391, 7, 'ارزیابی عدم انطباق کیفی', 'کیفیت گزارش عدم انطباق NC-20260613-598 بررسی شد. لطفاً موجودی و پارت نامبر انبار را مشخص کنید.', 'parts', 'medium', NULL, 95, 1, '2026-06-13 12:47:32', '2026-06-13 12:46:28', NULL, 4, 'محمد پورسان دلیر', 'Quality-Manager', 'حمید صبوری', 'operator2'),
(392, 7, 'تأیید ثبت گزارش انبار', 'گزارش انبار برای قطعه معیوب NC-20260613-598 با موفقیت ثبت و به مدیر کارخانه ارجاع شد.', 'alert', 'high', 'defect_reports', 95, 0, NULL, '2026-06-13 12:47:32', '2026-06-20 12:47:32', 7, 'وحید خانی', 'Warehouse-Manager', NULL, 'operator2'),
(393, 0, 'تعیین تکلیف عدم انطباق قطعه', 'گزارش قطعه معیوب NC-20260613-598 توسط انبار بررسی شد. منتظر تصمیم نهایی مدیر کارخانه است.', 'maintenance_request', 'critical', NULL, 95, 0, NULL, '2026-06-13 12:47:32', NULL, 7, 'وحید خانی', 'Warehouse-Manager', NULL, 'operator3'),
(394, 1, 'تعیین تکلیف عدم انطباق قطعه', 'گزارش قطعه معیوب NC-20260613-598 توسط انبار بررسی شد. منتظر تصمیم نهایی مدیر کارخانه است.', 'maintenance_request', 'critical', NULL, 95, 0, NULL, '2026-06-13 12:47:32', NULL, 7, 'وحید خانی', 'Warehouse-Manager', NULL, 'operator3'),
(395, 8, 'تعیین تکلیف عدم انطباق قطعه', 'گزارش قطعه معیوب NC-20260613-598 توسط انبار بررسی شد. منتظر تصمیم نهایی مدیر کارخانه است.', 'maintenance_request', 'critical', NULL, 95, 0, NULL, '2026-06-13 12:47:32', NULL, 7, 'وحید خانی', 'Warehouse-Manager', NULL, 'operator3');

-- --------------------------------------------------------

--
-- Table structure for table `old_users`
--

CREATE TABLE `old_users` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('Admin','Supervisor','Technician','Operator','Manager') NOT NULL,
  `permissions` mediumtext DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

--
-- Dumping data for table `old_users`
--

INSERT INTO `old_users` (`id`, `employee_id`, `username`, `password_hash`, `role`, `permissions`, `last_login`, `is_active`, `created_at`) VALUES
(1, 1001, 'admin_user', '$2y$10$X4N9W8vJkLmRfGhT7qZbEe', 'Admin', '{\"view_dashboard\": true, \"manage_users\": true, \"generate_reports\": true}', '2024-01-15 06:00:00', 1, '2023-06-01 04:30:00'),
(2, 1002, 'supervisor_ali', '$2y$10$AbC5FgH2IjKlMnOpQrStUv', 'Supervisor', '{\"view_dashboard\": true, \"approve_requests\": true, \"view_reports\": true}', '2024-01-14 10:50:00', 1, '2023-06-05 06:45:00'),
(3, 1003, 'tech_reza', '$2y$10$CdEfGhIjKlMnOpQrStUvWx', 'Technician', '{\"view_tasks\": true, \"update_tasks\": true, \"upload_docs\": true}', '2024-01-13 08:15:00', 1, '2023-07-10 06:00:00'),
(4, 1004, 'operator_sara', '$2y$10$YzAbCdEfGhIjKlMnOpQrSt', 'Operator', '{\"view_machines\": true, \"log_data\": true}', '2024-01-12 12:40:00', 1, '2023-08-15 10:15:00'),
(5, 1005, 'manager_ahmad', '$2y$10$XyZaBcDeFgHiJkLmNoPqRsT', 'Manager', '{\"view_dashboard\": true, \"view_reports\": true, \"manage_team\": true}', '2024-01-10 05:15:00', 1, '2023-09-20 07:50:00'),
(6, 1006, 'tech_navid', '$2y$10$TuVwXyZaBcDeFgHiJkLmNoP', 'Technician', '{\"view_tasks\": true, \"update_tasks\": true}', '2024-01-09 10:00:00', 0, '2023-10-05 10:40:00'),
(7, NULL, 'guest_operator', '$2y$10$QrStUvWxYzAbCdEfGhIjKl', 'Operator', '{\"view_machines\": true}', NULL, 1, '2023-11-12 06:30:00'),
(8, 1008, 'supervisor_mahsa', '$2y$10$MnOpQrStUvWxYzAbCdEfGh', 'Supervisor', '{\"view_dashboard\": true, \"approve_requests\": true}', '2024-01-08 06:30:00', 1, '2023-12-01 05:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `parts_usage`
--

CREATE TABLE `parts_usage` (
  `id` int(11) NOT NULL,
  `work_order_id` int(11) NOT NULL,
  `spare_part_id` int(11) NOT NULL,
  `quantity_used` int(11) NOT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `total_cost` decimal(10,2) DEFAULT NULL,
  `usage_date` timestamp NULL DEFAULT current_timestamp(),
  `used_by` int(11) NOT NULL,
  `notes` mediumtext DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

--
-- Dumping data for table `parts_usage`
--

INSERT INTO `parts_usage` (`id`, `work_order_id`, `spare_part_id`, `quantity_used`, `unit_price`, `total_cost`, `usage_date`, `used_by`, `notes`) VALUES
(1, 1001, 201, 2, 150.50, 301.00, '2024-01-15 05:00:00', 5, 'تعویض فن اصلی دستگاه'),
(2, 1001, 202, 1, 75.25, 75.25, '2024-01-15 05:05:00', 5, NULL),
(3, 1002, 203, 3, 42.00, 126.00, '2024-01-16 06:45:00', 8, 'سرویس دوره‌ای - تعویض فیلترها'),
(4, 1003, 204, 1, 890.00, 890.00, '2024-01-17 10:50:00', 12, 'تعویض برد اصلی - تحت گارانتی'),
(5, 1004, 205, 5, 12.75, 63.75, '2024-01-18 06:15:00', 5, 'کابل اتصال برق'),
(6, 1004, 206, 2, 35.40, 70.80, '2024-01-18 06:20:00', 5, 'پیچ و مهره مونتاژ'),
(7, 1005, 201, 1, 150.50, 150.50, '2024-01-19 08:00:00', 8, 'تعمیر اورژانسی'),
(8, 1006, 207, 4, 22.00, 88.00, '2024-01-20 12:40:00', 12, 'سنسور دما'),
(9, 1007, 208, 1, 450.00, 450.00, '2024-01-21 09:55:00', 5, 'آداپتور تغذیه اصلی'),
(10, 1008, 209, 10, 8.90, 89.00, '2024-01-22 06:35:00', 8, 'کلیدهای پنل جلو'),
(11, 1009, 210, 1, 1200.00, 1200.00, '2024-01-23 12:10:00', 12, 'تعویض نمایشگر لمسی'),
(12, 1010, 211, 3, 65.30, 195.90, '2024-01-24 08:30:00', 5, 'شیلنگ آب ورودی'),
(13, 1010, 212, 2, 110.00, 220.00, '2024-01-24 08:45:00', 5, 'شیر برقی'),
(14, 1011, 213, 1, 340.75, 340.75, '2024-01-25 06:00:00', 8, 'میکروکنترلر'),
(15, 1012, 214, 6, 15.20, 91.20, '2024-01-26 13:50:00', 12, 'لامپ نشانگر');

-- --------------------------------------------------------

--
-- Table structure for table `spare_parts`
--

CREATE TABLE `spare_parts` (
  `id` int(11) NOT NULL,
  `part_number` varchar(50) NOT NULL,
  `part_name` varchar(100) NOT NULL,
  `description` mediumtext DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `manufacturer` varchar(100) DEFAULT NULL,
  `supplier` varchar(100) DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `stock_quantity` int(11) DEFAULT 0,
  `minimum_stock` int(11) DEFAULT 5,
  `reorder_level` int(11) DEFAULT 10,
  `location` varchar(100) DEFAULT NULL,
  `shelf_number` varchar(20) DEFAULT NULL,
  `last_restock_date` date DEFAULT NULL,
  `next_restock_date` date DEFAULT NULL,
  `notes` mediumtext DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

--
-- Dumping data for table `spare_parts`
--

INSERT INTO `spare_parts` (`id`, `part_number`, `part_name`, `description`, `category`, `manufacturer`, `supplier`, `unit_price`, `stock_quantity`, `minimum_stock`, `reorder_level`, `location`, `shelf_number`, `last_restock_date`, `next_restock_date`, `notes`, `created_at`) VALUES
(1, 'FILT-2023-AIR', 'فیلتر هوای موتور', 'فیلتر هوای اصلی موتور خودروهای سواری - جنس کاغذ با لایه‌های چندگانه', 'فیلتر', 'Mann Filter', 'تامین قطعات البرز', 45.50, 3, 5, 10, 'انبار A', 'A-12-4', '2023-10-15', '2024-01-20', 'مورد استفاده برای خودروهای پژو و رنو', '2026-01-28 09:36:11'),
(2, 'BRAK-PAD-FRONT', 'لنت ترمز جلو', 'لنت ترمز سرامیکی جلو - مناسب برای خودروهای شهری', 'ترمز', 'Brembo', 'پارسان خودرو', 120.00, 8, 4, 8, 'انبار B', 'B-03-1', '2023-11-10', '2024-02-01', 'مدل سرامیکی - ضریب اصطکاک 0.42', '2026-01-28 09:36:11'),
(3, 'BATT-12V-60AH', 'باتری 12 ولت 60 آمپر', 'باتری اسیدی خشک 12 ولت با ظرفیت 60 آمپر ساعت', 'الکتریکال', 'GS Battery', 'باطری سازان', 350.75, 15, 3, 6, 'انبار C', 'C-07-2', '2023-12-05', NULL, 'گارانتی 24 ماهه - بدون نیاز به نگهداری', '2026-01-28 09:36:11'),
(4, 'SPRK-PLUG-IR', 'شمع آی‌آر', 'شمع ایریدیوم با طول عمر 100000 کیلومتر', 'موتور', 'NGK', 'موتورپارت', 28.90, 42, 10, 20, 'انبار A', 'A-08-3', '2023-09-22', '2024-03-10', 'قطر الکترود 0.6mm - مقاوم در برابر سرب', '2026-01-28 09:36:11'),
(5, 'OIL-5W30-SYN', 'روغن موتور 5W30', 'روغن سنتتیک موتور - ظرفیت 1 لیتری', 'روانکارها', 'Mobil', 'نفت پارس', 65.00, 80, 20, 40, 'انبار D', 'D-15-5', '2023-12-18', '2024-04-15', 'استاندارد API SN Plus - مناسب موتورهای توربو', '2026-01-28 09:36:11'),
(6, 'BELT-TIMING', 'تسمه تایم', 'تسمه تایمینگ دندانه‌دار برای موتورهای 1.6 لیتری', 'تسمه و پولی', 'Continental', 'تامین خودرو', 85.25, 12, 3, 6, 'انبار B', 'B-10-2', '2023-10-30', '2024-02-28', 'طول عمر توصیه شده: 60000 کیلومتر', '2026-01-28 09:36:11'),
(7, 'LAMP-H7-12V', 'لامپ هدلایت H7', 'لامپ هالوژن 12V 55W برای چراغ‌های جلو', 'لوازم روشنایی', 'Osram', 'چراغ سازان', 15.40, 55, 15, 30, 'انبار C', 'C-05-7', '2023-11-25', '2024-05-10', 'رنگ نور سفید 3200K - عمر مفید 450 ساعت', '2026-01-28 09:36:11'),
(8, 'FLT-OIL-PRESS', 'فیلتر روغن فشار بالا', 'فیلتر روغن فلزی با شیر تنظیم فشار', 'فیلتر', 'Mahle', 'فیلتر ایران', 32.60, 18, 5, 10, 'انبار A', 'A-09-1', '2023-12-12', '2024-03-30', 'مقاومت تا فشار 8 بار', '2026-01-28 09:36:11'),
(9, 'SENS-O2-FRONT', 'سنسور اکسیژن جلویی', 'سنسور لامبدای جلو - 4 سیمه', 'الکتریکال', 'Bosch', 'الکتروپارت', 145.80, 7, 2, 4, 'انبار B', 'B-06-4', '2023-10-05', '2024-01-25', 'سازگار با سیستم‌های OBD-II', '2026-01-28 09:36:11'),
(10, 'COOLANT-RED', 'ضد یخ/ضد جوش', 'مایع خنک‌کننده موتور - رنگ قرمز - ظرفیت 1.5 لیتری', 'مایعات', 'Prestone', 'شیمی خودرو', 40.30, 35, 8, 16, 'انبار D', 'D-12-3', '2023-12-20', '2024-06-01', 'محافظت در دمای -35 تا +130 درجه سانتیگراد', '2026-01-28 09:36:11');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('admin','Managing-Director','Factory-manager','Quality-Manager','Warehouse-Manager','supervisor','technician','operator') DEFAULT 'operator',
  `department` varchar(50) DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password_hash`, `full_name`, `email`, `phone`, `role`, `department`, `profile_image`, `is_active`, `last_login`, `created_at`, `updated_at`) VALUES
(0, 'admin1', '$2y$10$abcdefghijklmnopqrstuvwxyz123456', 'مدیر سیستم', 'admin@company.com', '09123456789', 'admin', 'فنی', '', 1, '2024-01-15 14:30:00', '2023-01-10 06:30:00', '2026-06-06 10:24:59'),
(1, 'admin', '$2y$10$TYMp3ksCe50H2x20cM9ZtOOGfrC0JM1J8wsVTsh.S3BGlLSd95svq', 'محمد پورسان دلیر', 'admin@cmms.local', '09127557315', 'admin', 'کنترل کیفیت', 'http://localhost/smgd/images/profiles/admin.jpg', 1, '2026-06-14 11:49:36', '0000-00-00 00:00:00', '2026-06-14 08:19:36'),
(2, 'supervisor1', '$2y$10$NF2Q9EtxButl8RnNUB2r7.U6hiiR91fbKQEJgjCr5B8zDec0fiKgm', 'ناظر فنی', 'supervisor@company.com', '09123456788', 'supervisor', 'production', '', 1, '2024-01-14 09:15:00', '2023-02-15 07:50:00', '2026-06-06 12:05:50'),
(3, 'tech1', '$2y$10$abcdefghijklmnopqrstuvwxyz123456', 'تکنسین برق', 'tech1@company.com', '09123456787', 'technician', 'تعمیرات', '', 1, '2024-01-13 16:45:00', '2023-03-20 05:00:00', '2026-06-02 07:41:37'),
(4, 'operator1', '$2y$10$cezQ4mgA6aP68ir7H4ISoe5kKG.86hzxWh79seXPnZgdM9tHRgHRS', 'محمد پورسان دلیر', 'operator1@company.com', '09123456786', 'Quality-Manager', 'quality', 'http://localhost/smgd/images/profiles/operator.jpg', 1, '2026-06-13 16:15:54', '2023-04-05 10:45:00', '2026-06-13 12:45:54'),
(5, 'tech2', '$2y$10$abcdefghijklmnopqrstuvwxyz123456', 'تکنسین مکانیک', 'tech2@company.com', '09123456785', 'technician', 'تعمیرات', NULL, 1, '2024-01-10 13:10:00', '2023-05-12 06:10:00', '2024-01-10 09:45:00'),
(6, 'supervisor2', '$2y$10$bU6h3i55eoOSH.Fk28T3tuHUvVLjMjV9jA0LLltjuZGsB7CLb.SAy', 'ناظر تولید', 'supervisor2@company.com', '09123456784', 'supervisor', 'facilities', '/smgd/images/profiles/6a290ef5441a2_1781075701.jpg', 1, '2024-01-09 10:05:00', '2023-06-18 12:55:00', '2026-06-10 07:15:19'),
(7, 'operator2', '$2y$10$/KfEuXOmjZn8nsa1IjtSceOAhkfhd0kxtSif03V7sbMqlnpOBTY6W', 'وحید خانی', 'operator2@company.com', '09123456789', 'Warehouse-Manager', 'warehouse', '/smgd/images/profiles/6a290eccda925_1781075660.jpg', 1, '2026-06-13 16:16:56', '2023-07-22 09:00:00', '2026-06-13 12:46:56'),
(8, 'admin2', '$2y$10$abcdefghijklmnopqrstuvwxyz123456', 'مدیر فنی', 'admin2@company.com', '09123456782', 'admin', 'فنی', '', 1, '2024-01-08 15:40:00', '2023-08-30 06:40:00', '2026-06-02 07:41:54'),
(9, 'tech3', '$2y$10$PpnpyfoS5JZBT63Dn/yMC.cgwbFWrLlab4N.oO/gncGKfu.LhRv6S', 'تکنسین ابزار دقیق', 'tech3@company.com', '09123456781', 'technician', 'maintenance', '', 1, '2024-01-07 11:25:00', '2023-09-14 10:20:00', '2026-06-06 10:17:28'),
(10, 'operator3', '$2y$10$mBJmMWGIv35KSmOAFgUVE.llxY08CE.WIKvQ.kQha.gW9VQckoC4m', 'فضل الله جمالی', 'operator3@company.com', '09123456780', 'Factory-manager', 'Management', 'http://localhost/smgd/images/profiles/انبار.png', 1, '2026-06-13 16:17:47', '2023-10-28 03:50:00', '2026-06-13 12:47:47');

-- --------------------------------------------------------

--
-- Table structure for table `user_permissions`
--

CREATE TABLE `user_permissions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `module` varchar(50) NOT NULL,
  `can_view` tinyint(1) DEFAULT 0,
  `can_create` tinyint(1) DEFAULT 0,
  `can_edit` tinyint(1) DEFAULT 0,
  `can_delete` tinyint(1) DEFAULT 0
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

--
-- Dumping data for table `user_permissions`
--

INSERT INTO `user_permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`) VALUES
(4, 0, 'equipment', 1, 1, 1, 1),
(3, 0, 'preventive_maintenance', 1, 1, 1, 1),
(2, 0, 'work_orders', 1, 1, 1, 1),
(1, 0, 'dashboard', 1, 1, 1, 1),
(5, 0, 'inventory', 1, 1, 1, 1),
(6, 0, 'users', 1, 1, 1, 1),
(7, 0, 'reports', 1, 1, 1, 1),
(8, 0, 'settings', 1, 1, 1, 1),
(9, 1, 'dashboard', 1, 0, 0, 0),
(10, 1, 'work_orders', 1, 1, 1, 0),
(11, 1, 'preventive_maintenance', 1, 0, 0, 0),
(12, 1, 'equipment', 1, 0, 0, 0),
(13, 1, 'inventory', 1, 0, 1, 0),
(14, 1, 'reports', 1, 0, 0, 0),
(15, 2, 'dashboard', 1, 0, 0, 0),
(16, 2, 'work_orders', 1, 1, 0, 0),
(17, 2, 'equipment', 1, 0, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `work_orders`
--

CREATE TABLE `work_orders` (
  `id` int(11) NOT NULL,
  `work_order_number` varchar(50) DEFAULT NULL,
  `maintenance_request_id` varchar(50) DEFAULT NULL,
  `assigned_to` varchar(100) DEFAULT NULL,
  `assigned_by` varchar(100) DEFAULT NULL,
  `assignment_date` timestamp NULL DEFAULT current_timestamp(),
  `planned_start_date` datetime DEFAULT NULL,
  `planned_end_date` datetime DEFAULT NULL,
  `actual_start_date` datetime DEFAULT NULL,
  `actual_end_date` datetime DEFAULT NULL,
  `estimated_duration_hours` decimal(5,2) DEFAULT NULL,
  `actual_duration_hours` decimal(5,2) DEFAULT NULL,
  `work_description` text DEFAULT NULL,
  `safety_instructions` text DEFAULT NULL,
  `required_tools` text DEFAULT NULL,
  `required_spare_parts` text DEFAULT NULL,
  `status` enum('scheduled','in progress','paused','completed','cancelled') DEFAULT 'scheduled',
  `priority` varchar(30) DEFAULT NULL,
  `completion_notes` text DEFAULT NULL,
  `quality_check` varchar(20) DEFAULT NULL,
  `quality_check_by` varchar(100) DEFAULT NULL,
  `quality_check_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

--
-- Dumping data for table `work_orders`
--

INSERT INTO `work_orders` (`id`, `work_order_number`, `maintenance_request_id`, `assigned_to`, `assigned_by`, `assignment_date`, `planned_start_date`, `planned_end_date`, `actual_start_date`, `actual_end_date`, `estimated_duration_hours`, `actual_duration_hours`, `work_description`, `safety_instructions`, `required_tools`, `required_spare_parts`, `status`, `priority`, `completion_notes`, `quality_check`, `quality_check_by`, `quality_check_date`) VALUES
(0, 'WO-20260218-3132', 'WR-20260218-723', 'در انتظار تخصیص', 'محمد پورسان دلیر', '2026-02-18 11:16:06', NULL, NULL, NULL, NULL, 2.00, NULL, '📋 عنوان درخواست: تعمیر کمپرسور\n\n📝 شرح کامل: دارای نشتی روغن، عدم جذب آب، افت فشار هوا، عدم نظافت کمپرسورخانه\n\n🏭 تجهیز: کمپرسور هوای فشرده (2)\n📍 محل: building-d - طبقه ground - جنوبی\n⚡ اولویت: high\n🔧 نوع درخواست: repair\n📊 تأثیر بر تولید: low\n⚠️ خطر ایمنی: none\n⏱️ برآورد زمان توقف: 2 ساعت\n📌 توضیحات اضافی: جهت تست می باشد', '✅ خطر ایمنی کم\n1. رعایت نکات ایمنی عمومی\n', 'ابزار عمومی تعمیرات', 'در صورت نیاز اعلام خواهد شد', 'scheduled', 'high', NULL, NULL, NULL, NULL),
(9, 'WO-2026-007', 'MR-2026-007', 'احمد رضایی', 'محمد کریمی', '2026-02-02 04:30:00', '2026-02-04 08:00:00', '2026-02-04 16:00:00', '2026-02-04 08:10:00', '2026-02-04 14:30:00', 8.00, 6.33, 'تعمیر پمپ آب ساختمان اداری', 'قطع برق قبل از شروع کار', 'آچار، پیچ‌گوشتی', 'یاتاقان جدید', 'completed', 'medium', 'پمپ تعمیر شد', 'passed', 'علی نوری', '2026-02-04'),
(10, 'WO-2026-008', 'MR-2026-008', 'رضا محمدی', 'محمد کریمی', '2026-02-03 04:00:00', '2026-02-05 09:00:00', '2026-02-05 17:00:00', '2026-02-05 09:15:00', '2026-02-05 16:45:00', 8.00, 7.50, 'سرویس سیستم تهویه', 'کار در ارتفاع نیازمند تجهیزات ایمنی', 'نردبان، ابزار برقی', 'فیلتر هوا', 'completed', 'medium', 'سرویس انجام شد', 'passed', 'احمد رضایی', '2026-02-05'),
(11, 'WO-2026-009', 'MR-2026-009', 'فاطمه اکبری', 'پرویز علی‌زاده', '2026-02-05 06:30:00', '2026-02-08 08:00:00', '2026-02-08 12:00:00', '2026-02-08 08:20:00', '2026-02-08 13:30:00', 4.00, 5.17, 'تعمیر درب اتوماتیک', 'قفل گذاری انرژی', 'ابزار الکترونیکی', 'سنسور درب', 'completed', 'high', 'دقیقاً طبق برنامه انجام شد', 'passed', 'محمد کریمی', '2026-02-08'),
(12, 'WO-2026-010', 'MR-2026-010', 'مهدی قاسمی', 'پرویز علی‌زاده', '2026-02-08 05:30:00', '2026-02-10 08:00:00', '2026-02-10 16:00:00', '2026-02-10 08:30:00', '2026-02-10 18:00:00', 8.00, 9.50, 'تعویض کابل‌های برق', 'کار با برق فشار ضعیف', 'انبردست، تستر برق', 'کابل 4×16', 'completed', 'urgent', 'یک ساعت تاخیر داشت', 'passed', 'احمد رضایی', '2026-02-10'),
(13, 'WO-2026-011', 'MR-2026-011', 'سارا موسوی', 'محمد کریمی', '2026-02-10 05:00:00', '2026-02-12 08:00:00', '2026-02-12 16:00:00', '2026-02-12 08:15:00', '2026-02-12 15:00:00', 8.00, 6.75, 'تعمیر کمپرسور هوا', 'تخلیه فشار سیستم', 'آچار بکس، فشارسنج', 'رینگ پیستون', 'completed', 'medium', 'زودتر از موعد تکمیل شد', 'passed', 'علی نوری', '2026-02-12'),
(14, 'WO-2026-012', 'MR-2026-012', 'حسن نظری', 'پرویز علی‌زاده', '2026-02-12 03:30:00', '2026-02-15 08:00:00', '2026-02-15 12:00:00', '2026-02-15 08:30:00', '2026-02-15 14:30:00', 4.00, 6.00, 'تعویض پمپ هیدرولیک', 'کار با روغن تحت فشار', 'آچار تخت، جک', 'پمپ هیدرولیک', 'completed', 'high', '2 ساعت تاخیر داشت', 'passed', 'محمد کریمی', '2026-02-15'),
(15, 'WO-2026-013', 'MR-2026-013', 'علی نوری', 'محمد کریمی', '2026-02-15 05:30:00', '2026-02-18 08:00:00', '2026-02-18 16:00:00', '2026-02-18 08:10:00', NULL, 8.00, 4.50, 'بازسازی موتور الکتریکی', 'کار با برق سه فاز', 'مولتی‌متر، اهم متر', 'سیم پیچ جدید', 'in progress', 'medium', 'در حال انجام', NULL, NULL, NULL),
(16, 'WO-2025-010', 'MR-2025-010', 'احمد رضایی', 'محمد کریمی', '2025-12-01 04:30:00', '2025-12-03 08:00:00', '2025-12-03 16:00:00', '2025-12-03 08:05:00', '2025-12-03 14:00:00', 8.00, 5.92, 'سرویس ژنراتور اضطراری', 'کار با سوخت دیزل', 'آچار، تستر باتری', 'روغن موتور، فیلتر', 'completed', 'critical', 'ژنراتور آماده به کار', 'passed', 'علی نوری', '2025-12-03'),
(17, 'WO-2025-011', 'MR-2025-011', 'رضا محمدی', 'محمد کریمی', '2025-12-05 04:00:00', '2025-12-07 09:00:00', '2025-12-07 13:00:00', '2025-12-07 09:15:00', '2025-12-07 15:30:00', 4.00, 6.25, 'تعمیر سیستم اطفاء حریق', 'عدم ایجاد جرقه', 'تستر دتکتور', 'دتکتور دود', 'completed', 'high', 'سیستم فعال شد', 'passed', 'احمد رضایی', '2025-12-07'),
(18, 'WO-2025-012', 'MR-2025-012', 'فاطمه اکبری', 'پرویز علی‌زاده', '2025-12-10 06:30:00', '2025-12-12 08:00:00', '2025-12-12 16:00:00', '2025-12-12 08:20:00', '2025-12-12 18:45:00', 8.00, 10.42, 'نصب سیستم نظارت تصویری', 'کار در ارتفاع', 'دریل، پیچ گوشتی', 'دوربین، کابل', 'completed', 'medium', 'نصب 16 دوربین', 'passed', 'محمد کریمی', '2025-12-12'),
(19, 'WO-2025-013', 'MR-2025-013', 'مهدی قاسمی', 'پرویز علی‌زاده', '2025-12-15 05:30:00', '2025-12-17 08:00:00', '2025-12-17 12:00:00', '2025-12-17 08:30:00', '2025-12-17 14:15:00', 4.00, 5.75, 'تعمیر آسانسور باربر', 'قفل گذاری کابین', 'آچار، جک هیدرولیک', 'کابل فولادی', 'scheduled', 'urgent', 'آسانسور فعال شد', 'passed', 'احمد رضایی', '2025-12-17'),
(20, 'WO-2025-014', 'MR-2025-014', 'سارا موسوی', 'محمد کریمی', '2025-12-20 05:00:00', '2025-12-22 08:00:00', '2025-12-22 16:00:00', '2025-12-22 08:15:00', '2025-12-22 19:30:00', 8.00, 11.25, 'بازسازی سیستم HVAC', 'کار با گاز مبرد', 'مانومتر، پمپ خلا', 'کمپرسور، کندانسور', 'completed', 'high', 'سیستم راه‌اندازی شد', 'passed', 'علی نوری', '2025-12-22'),
(21, 'WO-2026-014', 'MR-2026-014', 'احمد رضایی', 'محمد کریمی', '2026-02-16 04:30:00', '2026-02-18 08:00:00', '2026-02-18 12:00:00', '2026-02-18 08:05:00', NULL, 4.00, NULL, 'تعویض پمپ تخلیه', 'کار در محیط مرطوب', 'آچار لوله، پیچ گوشتی', 'پمپ شناوری', 'paused', 'medium', 'منتظر قطعه', NULL, NULL, NULL),
(22, 'WO-2026-015', 'MR-2026-015', 'رضا محمدی', 'محمد کریمی', '2026-02-17 04:00:00', '2026-02-20 09:00:00', '2026-02-20 13:00:00', NULL, NULL, 4.00, NULL, 'تعمیر سیستم صوت', 'کار با تجهیزات صوتی', 'اسیلوسکوپ، مولتی‌متر', 'آمپلی فایر', 'scheduled', 'medium', NULL, NULL, NULL, NULL),
(23, 'WO-2026-016', 'MR-2026-016', 'فاطمه اکبری', 'پرویز علی‌زاده', '2026-02-18 06:30:00', '2026-02-21 08:00:00', '2026-02-21 16:00:00', NULL, NULL, 8.00, NULL, 'نصب سیستم امنیتی', 'کار در محیط اداری', 'دریل، پیچ گوشتی', 'دوربین، ضبط کننده', 'scheduled', 'low', NULL, NULL, NULL, NULL),
(24, 'WO-2026-017', 'MR-2026-017', 'مهدی قاسمی', 'پرویز علی‌زاده', '2026-10-01 05:30:00', '2026-10-03 08:00:00', '2026-10-03 16:00:00', '2026-10-03 08:30:00', '2026-10-03 19:00:00', 8.00, 10.50, 'بازسازی کوره حرارتی', 'کار در دمای بالا', 'آچار، دماسنج', 'آجر نسوز، المنت', 'completed', 'high', 'کوره آماده به کار', 'passed', 'احمد رضایی', '2026-10-03'),
(25, 'WO-2026-018', 'MR-2026-018', 'سارا موسوی', 'محمد کریمی', '2026-10-05 05:00:00', '2026-10-07 08:00:00', '2026-10-07 12:00:00', '2026-10-07 08:15:00', '2026-10-07 11:30:00', 4.00, 3.25, 'تعمیر پرس هیدرولیک', 'کار با فشار هیدرولیک', 'آچار، فشارسنج', 'شیر هیدرولیک', 'completed', 'urgent', 'پرس فعال شد', 'passed', 'علی نوری', '2026-10-07'),
(26, 'WO-2026-019', 'MR-2026-019', 'حسن نظری', 'پرویز علی‌زاده', '2026-11-01 08:30:00', '2026-11-03 08:00:00', '2026-11-03 16:00:00', '2026-11-03 08:10:00', '2026-11-03 17:00:00', 8.00, 8.83, 'تعمیر دستگاه برش لیزری', 'استفاده از عینک محافظ لیزر', 'ابزار کالیبراسیون', 'آینه لیزر', 'completed', 'critical', 'دقت برش بهبود یافت', 'passed', 'محمد کریمی', '2026-11-03'),
(27, 'WO-2026-020', 'MR-2026-020', 'علی نوری', 'محمد کریمی', '2026-12-01 05:30:00', '2026-12-03 09:00:00', '2026-12-03 17:00:00', '2026-12-03 09:15:00', '2026-12-03 16:30:00', 8.00, 7.25, 'سرویس سالیانه دیزل ژنراتور', 'کار با سوخت قابل اشتعال', 'آچار بکس، تستر باتری', 'فیلتر سوخت، روغن', 'completed', 'high', 'ژنراتور تست شد', 'passed', 'احمد رضایی', '2026-12-03'),
(28, 'WO-2026-021', 'MR-2026-021', 'احمد رضایی', 'محمد کریمی', '2026-12-10 04:30:00', '2026-12-12 08:00:00', '2026-12-12 16:00:00', '2026-12-12 08:05:00', '2026-12-12 15:00:00', 8.00, 6.92, 'تعمیر سیستم توزین', 'کار با بارهای سنگین', 'کرنومتر، وزنه کالیبره', 'لودسل جدید', 'completed', 'medium', 'دقت توزین 0.1%', 'passed', 'علی نوری', '2026-12-12'),
(29, 'WO-2026-022', 'MR-2026-022', 'رضا محمدی', 'محمد کریمی', '2026-01-20 04:00:00', '2026-01-22 09:00:00', '2026-01-22 17:00:00', '2026-01-22 09:15:00', '2026-01-22 16:30:00', 8.00, 7.25, 'تعمیر سیستم آبیاری', 'کار در فضای باز', 'بیل، آچار', 'لوله PVC، شیرآلات', 'completed', 'low', 'سیستم فعال شد', 'passed', 'احمد رضایی', '2026-01-22'),
(30, 'WO-2026-023', 'MR-2026-023', 'فاطمه اکبری', 'پرویز علی‌زاده', '2026-01-25 06:30:00', '2026-01-27 08:00:00', '2026-01-27 16:00:00', '2026-01-27 08:20:00', '2026-01-27 14:15:00', 8.00, 5.92, 'نصب سیستم روشنایی LED', 'کار با برق', 'دریل، سیم لخت کن', 'لامپ LED، سیم', 'completed', 'medium', '40 لامپ نصب شد', 'passed', 'محمد کریمی', '2026-01-27'),
(31, 'WO-2026-024', 'MR-2026-024', 'مهدی قاسمی', 'پرویز علی‌زاده', '2026-02-01 05:30:00', '2026-02-03 08:00:00', '2026-02-03 16:00:00', '2026-02-03 08:30:00', '2026-02-03 17:45:00', 8.00, 9.25, 'تعمیر دستگاه CNC', 'قفل گذاری انرژی', 'آچار آلن، کولیس', 'بلبرینگ خطی', 'completed', 'critical', 'دقت دستگاه بهبود یافت', 'passed', 'محمد کریمی', '2026-02-03'),
(32, 'WO-2026-025', 'MR-2026-025', 'سارا موسوی', 'محمد کریمی', '2026-02-05 05:00:00', '2026-02-07 09:00:00', '2026-02-07 17:00:00', '2026-02-07 09:20:00', '2026-02-07 16:30:00', 8.00, 7.17, 'سرویس ترانسفورماتور', 'کار با برق فشار قوی', 'تستر عایق، دوربین حرارتی', 'روغن ترانسفورماتور', 'completed', 'high', 'ترانس سرویس شد', 'passed', 'احمد رضایی', '2026-02-07');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `attachments`
--
ALTER TABLE `attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_work_order` (`work_order_id`);

--
-- Indexes for table `calendar_events`
--
ALTER TABLE `calendar_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `start_date` (`start_date`),
  ADD KEY `event_type` (`event_type`),
  ADD KEY `assigned_to` (`assigned_to`),
  ADD KEY `equipment_id` (`equipment_id`),
  ADD KEY `work_order_id` (`work_order_id`);

--
-- Indexes for table `defect_reports`
--
ALTER TABLE `defect_reports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `report_number` (`report_number`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `employee_code` (`employee_code`);

--
-- Indexes for table `equipments`
--
ALTER TABLE `equipments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `equipment_code` (`equipment_code`);

--
-- Indexes for table `inspection_reports`
--
ALTER TABLE `inspection_reports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `report_number` (`report_number`),
  ADD KEY `equipment_id` (`equipment_id`),
  ADD KEY `inspector_id` (`inspector_id`),
  ADD KEY `signed_by` (`signed_by`);

--
-- Indexes for table `kpis`
--
ALTER TABLE `kpis`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kpi_code` (`kpi_code`);

--
-- Indexes for table `kpi_data`
--
ALTER TABLE `kpi_data`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kpi_id` (`kpi_id`),
  ADD KEY `recorded_by` (`recorded_by`);

--
-- Indexes for table `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `maintenance_costs`
--
ALTER TABLE `maintenance_costs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cost_code` (`cost_code`),
  ADD KEY `work_order_id` (`work_order_id`),
  ADD KEY `equipment_id` (`equipment_id`),
  ADD KEY `recorded_by` (`recorded_by`),
  ADD KEY `approved_by` (`approved_by`);

--
-- Indexes for table `maintenance_history`
--
ALTER TABLE `maintenance_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `equipment_id` (`equipment_id`),
  ADD KEY `work_order_id` (`work_order_id`),
  ADD KEY `completed_by` (`completed_by`);

--
-- Indexes for table `maintenance_requests`
--
ALTER TABLE `maintenance_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `request_number` (`request_number`),
  ADD KEY `equipment_id` (`equipment_id`),
  ADD KEY `reported_by` (`reported_by`),
  ADD KEY `approved_by` (`approved_by`);

--
-- Indexes for table `maintenance_schedules`
--
ALTER TABLE `maintenance_schedules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `procedure_code` (`procedure_code`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `is_read` (`is_read`),
  ADD KEY `type` (`type`),
  ADD KEY `created_at` (`created_at`),
  ADD KEY `idx_sender_id` (`sender_id`),
  ADD KEY `idx_reporter_name` (`reporter_name`);

--
-- Indexes for table `old_users`
--
ALTER TABLE `old_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `employee_id` (`employee_id`);

--
-- Indexes for table `parts_usage`
--
ALTER TABLE `parts_usage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `work_order_id` (`work_order_id`),
  ADD KEY `spare_part_id` (`spare_part_id`),
  ADD KEY `used_by` (`used_by`);

--
-- Indexes for table `spare_parts`
--
ALTER TABLE `spare_parts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `part_number` (`part_number`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `work_orders`
--
ALTER TABLE `work_orders`
  ADD UNIQUE KEY `work_order_number` (`work_order_number`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `attachments`
--
ALTER TABLE `attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=71;

--
-- AUTO_INCREMENT for table `calendar_events`
--
ALTER TABLE `calendar_events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `defect_reports`
--
ALTER TABLE `defect_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=96;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `equipments`
--
ALTER TABLE `equipments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `inspection_reports`
--
ALTER TABLE `inspection_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `kpis`
--
ALTER TABLE `kpis`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `kpi_data`
--
ALTER TABLE `kpi_data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `login_attempts`
--
ALTER TABLE `login_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=382;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=396;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
