CREATE TRIGGER `after_activity_log_insert` AFTER INSERT ON `activity_logs`
 FOR EACH ROW BEGIN
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

CREATE TRIGGER `after_defect_report_insert` AFTER INSERT ON `defect_reports`
 FOR EACH ROW BEGIN
    DECLARE reporter_name_val VARCHAR(100);
    DECLARE quality_manager_id INT;
    
    -- دریافت نام گزارش‌دهنده
    SELECT full_name INTO reporter_name_val 
    FROM users 
    WHERE id = NEW.reporter_name
    LIMIT 1;
    
    -- یافتن کاربر با نقش Quality-Manager
    SELECT id INTO quality_manager_id
    FROM users 
    WHERE role = 'Quality-Manager' AND is_active = 1
    LIMIT 1;
    
    -- اگر مدیر کیفیت وجود دارد، اعلان ارسال کن
    IF quality_manager_id IS NOT NULL THEN
        INSERT INTO `notifications` (
            `user_id`, 
            `title`, 
            `message`, 
            `type`, 
            `priority`, 
            `related_module`, 
            `related_id`, 
            `created_at`,
            `expires_at`
        ) VALUES (
            quality_manager_id,
            'گزارش عدم انطباق جدید',
            CONCAT(
                'گزارش قطعه معیوب شماره ', NEW.report_number, ' ثبت گردید.\n',
                'گزارش‌دهنده: ', IFNULL(reporter_name_val, 'کاربر ناشناس'), '\n',
                'قطعه: ', NEW.part_name_fa, '\n',
                'نوع عیب: ', NEW.defect_type, '\n',
                'وضعیت: منتظر ارزیابی کیفی'
            ),
            'defect_report',
            'high',
            'defect_reports',
            NEW.id,
            NOW(),
            DATE_ADD(NOW(), INTERVAL 7 DAY)
        );
    END IF;
    
END
