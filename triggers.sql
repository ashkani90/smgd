-- توابع کمکی
-- تابع برای ترجمه اولویت به فارسی
DELIMITER $$
CREATE FUNCTION IF NOT EXISTS `translate_priority`(priority VARCHAR(20)) 
RETURNS VARCHAR(20) DETERMINISTIC
BEGIN
    RETURN CASE priority
        WHEN 'low' THEN 'پایین'
        WHEN 'medium' THEN 'متوسط'
        WHEN 'high' THEN 'بالا'
        WHEN 'critical' THEN 'بحرانی'
        ELSE priority
    END;
END$$
DELIMITER ;

-- تابع برای ترجمه وضعیت تجهیزات
DELIMITER $$
CREATE FUNCTION IF NOT EXISTS `translate_equipment_status`(status VARCHAR(50)) 
RETURNS VARCHAR(50) DETERMINISTIC
BEGIN
    RETURN CASE status
        WHEN 'operational' THEN 'عملیاتی'
        WHEN 'repair' THEN 'در حال تعمیر'
        WHEN 'out of service' THEN 'خارج از سرویس'
        WHEN 'obsolete' THEN 'منسوخ'
        ELSE status
    END;
END$$
DELIMITER ;

-- تابع برای ترجمه سطح بحرانی
DELIMITER $$
CREATE FUNCTION IF NOT EXISTS `translate_criticality`(criticality VARCHAR(20)) 
RETURNS VARCHAR(20) DETERMINISTIC
BEGIN
    RETURN CASE criticality
        WHEN 'low' THEN 'کم'
        WHEN 'medium' THEN 'متوسط'
        WHEN 'high' THEN 'بالا'
        WHEN 'critical' THEN 'بحرانی'
        ELSE criticality
    END;
END$$
DELIMITER ;






-- تریگر ایجاد درخواست تعمیر جدید
DELIMITER $$
CREATE TRIGGER `after_maintenance_request_insert` 
AFTER INSERT ON `maintenance_requests`
FOR EACH ROW
BEGIN
    DECLARE equipment_name_val VARCHAR(100);
    DECLARE reporter_name_val VARCHAR(100);
    DECLARE supervisor_id_val INT;
    
    -- دریافت نام تجهیز
    SELECT equipment_name INTO equipment_name_val 
    FROM equipments 
    WHERE id = NEW.equipment_id;
    
    -- دریافت نام گزارش‌دهنده
    SELECT full_name INTO reporter_name_val 
    FROM users 
    WHERE id = NEW.reported_by;
    
    -- پیدا کردن سوپروایزرها و ارسال اعلان
    DECLARE done INT DEFAULT FALSE;
    DECLARE supervisor_cursor CURSOR FOR 
        SELECT id FROM users 
        WHERE role = 'supervisor' AND is_active = 1;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN supervisor_cursor;
    
    read_loop: LOOP
        FETCH supervisor_cursor INTO supervisor_id_val;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- درج اعلان برای سوپروایزر
        INSERT INTO `notifications` (
            `user_id`, 
            `title`, 
            `message`, 
            `type`, 
            `priority`, 
            `related_module`, 
            `related_id`, 
            `expires_at`
        ) VALUES (
            supervisor_id_val,
            'درخواست تعمیر جدید',
            CONCAT(
                'درخواست تعمیر برای تجهیز ''', equipment_name_val, 
                ''' توسط ''', reporter_name_val, ''' ثبت شد.\n',
                'شماره درخواست: ', NEW.request_number, '\n',
                'اولویت: ', translate_priority(NEW.priority), '\n',
                'شرح مشکل: ', LEFT(NEW.problem_description, 150), '...'
            ),
            'maintenance_request',
            NEW.priority,
            'maintenance_requests',
            NEW.id,
            DATE_ADD(NOW(), INTERVAL 7 DAY)
        );
        
    END LOOP;
    
    CLOSE supervisor_cursor;
    
    -- ارسال اعلان به مدیر سیستم
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
        'درخواست تعمیر جدید (مدیریت)',
        CONCAT(
            'درخواست تعمیر جدید ثبت شد.\n',
            'تجهیز: ', equipment_name_val, '\n',
            'شماره: ', NEW.request_number, '\n',
            'اولویت: ', translate_priority(NEW.priority)
        ),
        'maintenance_request',
        NEW.priority,
        'maintenance_requests',
        NEW.id,
        DATE_ADD(NOW(), INTERVAL 7 DAY)
    FROM users 
    WHERE role = 'admin' AND is_active = 1;
    
END$$
DELIMITER ;







-- تریگر پس از تأیید درخواست تعمیر
DELIMITER $$
CREATE TRIGGER `after_maintenance_request_approved` 
AFTER UPDATE ON `maintenance_requests`
FOR EACH ROW
BEGIN
    DECLARE equipment_name_val VARCHAR(100);
    DECLARE approver_name_val VARCHAR(100);
    
    -- بررسی تغییر وضعیت به Approved
    IF OLD.status != 'Approved' AND NEW.status = 'Approved' THEN
        
        -- دریافت نام تجهیز
        SELECT equipment_name INTO equipment_name_val 
        FROM equipments 
        WHERE id = NEW.equipment_id;
        
        -- دریافت نام تاییدکننده
        SELECT full_name INTO approver_name_val 
        FROM users 
        WHERE id = NEW.approved_by;
        
        -- ارسال اعلان به گزارش‌دهنده
        INSERT INTO `notifications` (
            `user_id`, 
            `title`, 
            `message`, 
            `type`, 
            `priority`, 
            `related_module`, 
            `related_id`, 
            `expires_at`
        ) VALUES (
            NEW.reported_by,
            'درخواست تعمیر تایید شد',
            CONCAT(
                'درخواست تعمیر شما برای تجهیز ''', equipment_name_val, 
                ''' تایید شد.\n',
                'تاییدکننده: ', approver_name_val, '\n',
                'شماره درخواست: ', NEW.request_number
            ),
            'maintenance_request',
            'medium',
            'maintenance_requests',
            NEW.id,
            DATE_ADD(NOW(), INTERVAL 3 DAY)
        );
        
    END IF;
END$$
DELIMITER ;






-- تریگر برای ارسال اعلان پس از درج دستورکار جدید
DELIMITER $$
CREATE TRIGGER `after_work_order_insert` AFTER INSERT ON `work_orders` FOR EACH ROW 
BEGIN
    DECLARE equipment_name_val VARCHAR(100);
    DECLARE assigner_name_val VARCHAR(100);
    DECLARE request_number_val VARCHAR(50);
    
    -- دریافت اطلاعات مرتبط
    SELECT 
        IFNULL(e.equipment_name, 'تجهیز ناشناس'),
        IFNULL(u.full_name, 'سیستم'),
        IFNULL(mr.request_number, NEW.work_order_number)
    INTO 
        equipment_name_val,
        assigner_name_val,
        request_number_val
    FROM work_orders wo
    LEFT JOIN maintenance_requests mr ON wo.maintenance_request_id = mr.id
    LEFT JOIN equipments e ON mr.equipment_id = e.id
    LEFT JOIN users u ON u.full_name = NEW.assigned_by
    WHERE wo.id = NEW.id;
    
    -- ارسال اعلان به تکنسین تخصیص داده شده
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
        'دستورکار جدید',
        CONCAT(
            'یک دستورکار جدید برای تجهیز ''', equipment_name_val, 
            ''' به شما تخصیص یافت.\n',
            'تخصیص‌دهنده: ', assigner_name_val, '\n',
            'شماره درخواست: ', request_number_val, '\n',
            'شرح کار: ', LEFT(IFNULL(NEW.work_description, 'بدون شرح'), 100), '...'
        ),
        'work_order',
        IFNULL(NEW.priority, 'medium'),
        'work_orders',
        NEW.id,
        DATE_ADD(IFNULL(NEW.planned_end_date, DATE_ADD(NOW(), INTERVAL 7 DAY)), INTERVAL 2 DAY)
    FROM users 
    WHERE full_name = NEW.assigned_to
    LIMIT 1;
    
END$$
DELIMITER ;

-- تریگر برای ارسال اعلان پس از تغییر وضعیت دستورکار
DELIMITER $$
CREATE TRIGGER `after_work_order_status_update` AFTER UPDATE ON `work_orders` FOR EACH ROW 
BEGIN
    DECLARE equipment_name_val VARCHAR(100);
    DECLARE technician_name_val VARCHAR(100);
    
    -- فقط اگر وضعیت تغییر کرده باشد
    IF OLD.status != NEW.status THEN
        
        -- دریافت اطلاعات
        SELECT 
            IFNULL(e.equipment_name, 'تجهیز ناشناس'),
            IFNULL(NEW.assigned_to, 'تکنسین ناشناس')
        INTO 
            equipment_name_val,
            technician_name_val;
        
        -- اگر تکمیل شده باشد
        IF NEW.status = 'completed' THEN
            
            -- ارسال اعلان به مدیر و سوپروایزر
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
                'دستورکار تکمیل شد',
                CONCAT(
                    'دستورکار ', IFNULL(NEW.work_order_number, 'بدون شماره'), ' برای تجهیز ''', 
                    equipment_name_val, ''' تکمیل شد.\n',
                    'تکنسین: ', technician_name_val, '\n',
                    'تاریخ تکمیل: ', DATE_FORMAT(NEW.actual_end_date, '%Y/%m/%d')
                ),
                'work_order',
                'medium',
                'work_orders',
                NEW.id,
                DATE_ADD(NOW(), INTERVAL 3 DAY)
            FROM users 
            WHERE role IN ('admin', 'supervisor') AND is_active = 1;
            
        -- اگر لغو شده باشد
        ELSEIF NEW.status = 'cancelled' THEN
            
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
                'دستورکار لغو شد',
                CONCAT(
                    'دستورکار ', IFNULL(NEW.work_order_number, 'بدون شماره'), ' برای تجهیز ''', 
                    equipment_name_val, ''' لغو شد.'
                ),
                'work_order',
                'medium',
                'work_orders',
                NEW.id,
                DATE_ADD(NOW(), INTERVAL 2 DAY)
            FROM users 
            WHERE full_name = NEW.assigned_to
            LIMIT 1;
            
        END IF;
    END IF;
END$$
DELIMITER ;







-- تریگر پس از کم شدن موجودی قطعات
DELIMITER $$
CREATE TRIGGER `after_spare_parts_low_stock` 
AFTER UPDATE ON `spare_parts`
FOR EACH ROW
BEGIN
    -- بررسی اگر موجودی به سطح سفارش مجدد رسیده باشد
    IF NEW.stock_quantity <= NEW.reorder_level AND OLD.stock_quantity > NEW.reorder_level THEN
        
        -- ارسال اعلان به انبارداران و مدیران
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
            'موجودی قطعه کم شد',
            CONCAT(
                'موجودی قطعه ''', NEW.part_name, ''' (', NEW.part_number, 
                ') به ', NEW.stock_quantity, ' عدد رسیده است.\n',
                'سطح سفارش مجدد: ', NEW.reorder_level, ' عدد\n',
                'حداقل موجودی: ', NEW.minimum_stock, ' عدد\n',
                'لطفاً اقدام به سفارش نمایید.'
            ),
            'parts',
            'high',
            'spare_parts',
            NEW.id,
            DATE_ADD(NOW(), INTERVAL 14 DAY)
        FROM users 
        WHERE role IN ('admin', 'supervisor', 'technician') 
        AND is_active = 1;
        
    END IF;
END$$
DELIMITER ;







-- تریگر پس از تعمیر وضعیت تجهیزات
DELIMITER $$
CREATE TRIGGER `after_equipment_status_update` 
AFTER UPDATE ON `equipments`
FOR EACH ROW
BEGIN
    -- اگر وضعیت به حالت بحرانی تغییر کرده باشد
    IF OLD.status != NEW.status AND 
       (NEW.status IN ('repair', 'out of service') OR 
        NEW.criticality_level IN ('high', 'critical')) THEN
        
        -- ارسال اعلان به پرسنل فنی
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
            'تغییر وضعیت تجهیز',
            CONCAT(
                'وضعیت تجهیز ''', NEW.equipment_name, ''' (', NEW.equipment_code, 
                ') تغییر یافت.\n',
                'وضعیت جدید: ', translate_equipment_status(NEW.status), '\n',
                'سطح بحرانی: ', translate_criticality(NEW.criticality_level), '\n',
                'محل: ', NEW.location
            ),
            'equipment',
            CASE 
                WHEN NEW.status = 'out of service' OR NEW.criticality_level = 'critical' 
                THEN 'critical'
                ELSE 'high'
            END,
            'equipments',
            NEW.id,
            DATE_ADD(NOW(), INTERVAL 7 DAY)
        FROM users 
        WHERE role IN ('admin', 'supervisor', 'technician') 
        AND is_active = 1;
        
    END IF;
END$$
DELIMITER ;






-- تریگر پس از ثبت گزارش بازرسی
DELIMITER $$
CREATE TRIGGER `after_inspection_report_insert` 
AFTER INSERT ON `inspection_reports`
FOR EACH ROW
BEGIN
    DECLARE equipment_name_val VARCHAR(100);
    DECLARE inspector_name_val VARCHAR(100);
    
    -- دریافت اطلاعات
    SELECT 
        e.equipment_name,
        u.full_name
    INTO 
        equipment_name_val,
        inspector_name_val
    FROM equipments e
    JOIN users u ON u.id = NEW.inspector_id
    WHERE e.id = NEW.equipment_id;
    
    -- اگر نیاز به پیگیری یا تعمیر اضطراری باشد
    IF NEW.status IN ('Needs Follow-up', 'Needs Urgent Repair') THEN
        
        -- ارسال اعلان به سوپروایزرها و مدیران
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
            'گزارش بازرسی نیازمند اقدام',
            CONCAT(
                'گزارش بازرسی ', NEW.report_number, ' برای تجهیز ''', 
                equipment_name_val, ''' نیازمند اقدام است.\n',
                'وضعیت: ', NEW.status, '\n',
                'یافته‌ها: ', LEFT(NEW.findings, 120), '...\n',
                'تاریخ بازرسی: ', DATE_FORMAT(NEW.inspection_date, '%Y/%m/%d')
            ),
            'inspection',
            CASE 
                WHEN NEW.status = 'Needs Urgent Repair' THEN 'high'
                ELSE 'medium'
            END,
            'inspection_reports',
            NEW.id,
            DATE_ADD(NEW.follow_up_date, INTERVAL 1 DAY)
        FROM users 
        WHERE role IN ('admin', 'supervisor') 
        AND is_active = 1;
        
        -- اگر نیاز به تعمیر اضطراری باشد، به تکنسین‌ها هم اطلاع بده
        IF NEW.status = 'Needs Urgent Repair' THEN
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
                'تعمیر اضطراری مورد نیاز',
                CONCAT(
                    'تجهیز ''', equipment_name_val, ''' نیاز به تعمیر اضطراری دارد.\n',
                    'گزارش بازرسی: ', NEW.report_number, '\n',
                    'یافته‌ها: ', LEFT(NEW.findings, 100), '...'
                ),
                'inspection',
                'critical',
                'inspection_reports',
                NEW.id,
                DATE_ADD(NEW.follow_up_date, INTERVAL 1 DAY)
            FROM users 
            WHERE role = 'technician' 
            AND is_active = 1;
        END IF;
        
    END IF;
    
END$$
DELIMITER ;






-- تریگر برای لاگ فعالیت ها
-- تریگر برای ثبت فعالیت‌ها و ارسال اعلان
DELIMITER $$
CREATE TRIGGER `after_activity_log_insert` 
AFTER INSERT ON `activity_logs`
FOR EACH ROW
BEGIN
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
    
END$$
DELIMITER ;







