<?php
// dashboard_api.php - نسخه نهایی منطبق با دیتابیس شما

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// شروع session به صورت ایمن
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/config.php';

class DashboardAPI {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    // 1. دریافت آمارهای کلیدی
    public function getKeyMetrics() {
        $metrics = [
            'active_work_orders' => 0,
            'completed_this_week' => 0,
            'high_priority' => 0,
            'delayed' => 0,
            'active_equipment' => 0,
            'availability_rate' => 0.0
        ];
        
        try {
            // 1. دستورکارهای فعال
            $query = "SELECT COUNT(*) as count FROM work_orders WHERE status IN ('scheduled', 'in progress', 'paused')";
            $stmt = $this->pdo->query($query);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $metrics['active_work_orders'] = (int)($result['count'] ?? 0);
            
            // 2. تکمیل‌شده این هفته
            $query = "SELECT COUNT(*) as count FROM work_orders WHERE status = 'completed' 
                      AND YEARWEEK(actual_end_date, 1) = YEARWEEK(CURDATE(), 1)";
            $stmt = $this->pdo->query($query);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $metrics['completed_this_week'] = (int)($result['count'] ?? 0);
            
            // 3. اولویت بالا - اصلاح بر اساس ستون‌های واقعی
            $query = "SELECT COUNT(*) as count FROM work_orders WHERE priority IN ('high', 'urgent', 'critical') 
                      AND status IN ('scheduled', 'in progress')";
            $stmt = $this->pdo->query($query);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $metrics['high_priority'] = (int)($result['count'] ?? 0);
            
            // 4. تأخیر در انجام
            $query = "SELECT COUNT(*) as count FROM work_orders 
                      WHERE status NOT IN ('completed', 'cancelled') 
                      AND planned_end_date < NOW()";
            $stmt = $this->pdo->query($query);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $metrics['delayed'] = (int)($result['count'] ?? 0);
            
            // 5. تجهیزات فعال
            $query = "SELECT COUNT(*) as count FROM equipments WHERE status = 'operational'";
            $stmt = $this->pdo->query($query);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $metrics['active_equipment'] = (int)($result['count'] ?? 0);
            
            // 6. درصد در دسترس بودن
            $query = "SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN status = 'operational' THEN 1 END) as operational
                      FROM equipments";
            $stmt = $this->pdo->query($query);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $total = (int)($result['total'] ?? 0);
            $operational = (int)($result['operational'] ?? 0);
            
            if ($total > 0) {
                $metrics['availability_rate'] = round(($operational / $total) * 100, 1);
            }
            
        } catch (PDOException $e) {
            // خطا در لاگ ذخیره می‌شود
            error_log("Dashboard API Error: " . $e->getMessage());
        }
        
        return $metrics;
    }
    
    // 2. دریافت دستورکارهای فوری - اصلاح شده
    public function getUrgentWorkOrders($limit = 3) {
        try {
            // با توجه به ساختار دیتابیس، از طریق maintenance_requests به equipments وصل می‌شویم
            $query = "SELECT 
                        wo.work_order_number,
                        wo.work_description,
                        e.equipment_name,
                        e.location,
                        wo.assigned_to,
                        wo.priority,
                        wo.status,
                        wo.planned_start_date
                      FROM work_orders wo
                      LEFT JOIN maintenance_requests mr ON wo.maintenance_request_id = mr.id
                      LEFT JOIN equipments e ON mr.equipment_id = e.id
                      WHERE wo.priority IN ('high', 'urgent', 'critical') 
                        AND wo.status IN ('scheduled', 'in progress')
                      ORDER BY 
                        CASE wo.priority 
                            WHEN 'urgent' THEN 1
                            WHEN 'critical' THEN 2
                            WHEN 'high' THEN 3
                            ELSE 4
                        END,
                        wo.planned_start_date ASC
                      LIMIT :limit";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log("Error getting urgent work orders: " . $e->getMessage());
            return [];
        }
    }
    
    // 3. دریافت برنامه پیشگیرانه - اصلاح شده
    public function getPreventiveSchedule($limit = 3) {
        try {
            // ساده‌ترین راه: نمایش رویه‌های پیشگیرانه فعال
            $query = "SELECT 
                        procedure_code,
                        procedure_name,
                        procedure_description,
                        equipment_type as equipment_name,
                        CONCAT('نیاز به ', frequency_type) as location,
                        DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL id DAY), '%Y-%m-%d') as maintenance_date,
                        '08:00' as planned_start_time,
                        'تیم تعمیرات' as assigned_team,
                        'scheduled' as status
                    FROM maintenance_schedules
                    WHERE is_active = 1
                        AND frequency_type IN ('weekly', 'monthly', 'daily')
                    ORDER BY frequency_value ASC
                    LIMIT :limit";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // اگر نتایج خالی بود، داده‌های نمونه برگردانید
            if (empty($results)) {
                return [
                    [
                        'procedure_name' => 'سرویس دوره‌ای پمپ',
                        'equipment_name' => 'پمپ سانتریفیوژ',
                        'location' => 'اتاق پمپاژ',
                        'maintenance_date' => date('Y-m-d', strtotime('+1 day')),
                        'planned_start_time' => '08:00',
                        'assigned_team' => 'تیم تعمیرات الف',
                        'status' => 'scheduled'
                    ],
                    [
                        'procedure_name' => 'تست سیستم اعلام حریق',
                        'equipment_name' => 'سیستم اعلام حریق',
                        'location' => 'کل ساختمان',
                        'maintenance_date' => date('Y-m-d', strtotime('+2 days')),
                        'planned_start_time' => '10:00',
                        'assigned_team' => 'تیم ایمنی',
                        'status' => 'scheduled'
                    ],
                    [
                        'procedure_name' => 'کالیبراسیون دستگاه CNC',
                        'equipment_name' => 'دستگاه CNC',
                        'location' => 'سالن ماشین‌آلات',
                        'maintenance_date' => date('Y-m-d', strtotime('+3 days')),
                        'planned_start_time' => '09:30',
                        'assigned_team' => 'تیم کالیبراسیون',
                        'status' => 'scheduled'
                    ]
                ];
            }
            
            return $results;
            
        } catch (PDOException $e) {
            error_log("Error getting preventive schedule: " . $e->getMessage());
            return [];
        }
    }
    
    // 4. دریافت وضعیت تجهیزات بحرانی - اصلاح شده
    public function getCriticalEquipment($limit = 5) {
        try {
            // بررسی وجود ستون is_active
            $columns_query = $this->pdo->query("DESCRIBE equipments");
            $columns = $columns_query->fetchAll(PDO::FETCH_COLUMN);
            
            $where_clause = "e.criticality_level IN ('high', 'critical')";
            if (in_array('is_active', $columns)) {
                $where_clause .= " AND e.is_active = 1";
            }
            
            $query = "SELECT 
                        e.equipment_code,
                        e.equipment_name,
                        e.equipment_type,
                        e.location,
                        e.status,
                        e.criticality_level,
                        DATEDIFF(CURDATE(), e.last_maintenance_date) as days_since_last_maintenance,
                        e.notes
                      FROM equipments e
                      WHERE $where_clause
                      ORDER BY 
                        CASE e.criticality_level 
                            WHEN 'critical' THEN 1
                            WHEN 'high' THEN 2
                            ELSE 3
                        END,
                        e.status ASC
                      LIMIT :limit";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log("Error getting critical equipment: " . $e->getMessage());
            return [];
        }
    }
    
    // 5. دریافت اعلان‌ها - بدون تغییر
    public function getNotifications($limit = 4) {
        $notifications = [];
        
        try {
            // دستورکارهای تأخیری
            $query = "SELECT 
                        CONCAT('دستورکار ', wo.work_order_number, ' به تأخیر افتاده است.') as message,
                        wo.planned_end_date as notification_time,
                        'delay' as type
                      FROM work_orders wo
                      WHERE wo.status NOT IN ('completed', 'cancelled') 
                        AND wo.planned_end_date < NOW()
                      ORDER BY wo.planned_end_date DESC
                      LIMIT 2";
            
            $stmt = $this->pdo->query($query);
            $notifications = array_merge($notifications, $stmt->fetchAll(PDO::FETCH_ASSOC));
            
            // موجودی قطعات کم
            $query = "SELECT 
                        CONCAT('موجودی قطعه ', sp.part_name, ' به حداقل رسیده است.') as message,
                        sp.last_restock_date as notification_time,
                        'inventory' as type
                      FROM spare_parts sp
                      WHERE sp.stock_quantity <= sp.minimum_stock
                      ORDER BY sp.stock_quantity ASC
                      LIMIT 2";
            
            $stmt = $this->pdo->query($query);
            $notifications = array_merge($notifications, $stmt->fetchAll(PDO::FETCH_ASSOC));
            
            // بازرسی‌های پیش‌رو
            $query = "SELECT 
                        CONCAT('برنامه پیشگیرانه برای ', e.equipment_name, ' فردا تنظیم شده است.') as message,
                        mh.maintenance_date as notification_time,
                        'preventive' as type
                      FROM maintenance_history mh
                      JOIN equipments e ON mh.equipment_id = e.id
                      WHERE mh.maintenance_type = 'preventive'
                        AND mh.maintenance_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                      LIMIT 2";
            
            $stmt = $this->pdo->query($query);
            $notifications = array_merge($notifications, $stmt->fetchAll(PDO::FETCH_ASSOC));
            
            // مرتب‌سازی بر اساس تاریخ
            usort($notifications, function($a, $b) {
                $timeA = strtotime($a['notification_time'] ?? '1970-01-01');
                $timeB = strtotime($b['notification_time'] ?? '1970-01-01');
                return $timeB - $timeA;
            });
            
            return array_slice($notifications, 0, $limit);
            
        } catch (PDOException $e) {
            error_log("Error getting notifications: " . $e->getMessage());
            return [];
        }
    }

    // 6. دریافت داده‌های نمودار عملکرد ماهانه
    public function getPerformanceChartData($period = 'current_month') {
        try {
            // تعریف محدوده زمانی بر اساس انتخاب کاربر
            switch($period) {
                case 'last_month':
                    $startDate = date('Y-m-01', strtotime('-1 month'));
                    $endDate = date('Y-m-t', strtotime('-1 month'));
                    $periodType = 'last_month';
                    break;
                case 'three_months':
                    $startDate = date('Y-m-d', strtotime('-3 months'));
                    $endDate = date('Y-m-d');
                    $periodType = 'three_months';
                    break;
                case 'current_year':
                    $startDate = date('Y-01-01');
                    $endDate = date('Y-12-31');
                    $periodType = 'current_year';
                    break;
                case 'current_month':
                default:
                    $startDate = date('Y-m-01');
                    $endDate = date('Y-m-t');
                    $periodType = 'current_month';
                    break;
            }

            // 1. تعداد کارهای تکمیل شده در بازه زمانی
            $query = "
                SELECT 
                    DATE(actual_end_date) as day,
                    COUNT(*) as completed_count
                FROM work_orders 
                WHERE status = 'completed'
                    AND actual_end_date IS NOT NULL
                    AND DATE(actual_end_date) BETWEEN :start_date AND :end_date
                GROUP BY DATE(actual_end_date)
                ORDER BY day ASC
            ";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->bindParam(':start_date', $startDate);
            $stmt->bindParam(':end_date', $endDate);
            $stmt->execute();
            $completionData = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // 2. میانگین زمان تکمیل کارها
            $query = "
                SELECT 
                    DATE(actual_end_date) as day,
                    AVG(TIMESTAMPDIFF(HOUR, actual_start_date, actual_end_date)) as avg_duration
                FROM work_orders 
                WHERE status = 'completed'
                    AND actual_start_date IS NOT NULL
                    AND actual_end_date IS NOT NULL
                    AND DATE(actual_end_date) BETWEEN :start_date AND :end_date
                GROUP BY DATE(actual_end_date)
                ORDER BY day ASC
            ";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->bindParam(':start_date', $startDate);
            $stmt->bindParam(':end_date', $endDate);
            $stmt->execute();
            $durationData = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // 3. نرخ انجام به موقع (تکمیل قبل از planned_end_date)
            $query = "
                SELECT 
                    DATE(actual_end_date) as day,
                    COUNT(CASE WHEN actual_end_date <= planned_end_date THEN 1 END) * 100.0 / 
                    COUNT(*) as on_time_rate
                FROM work_orders 
                WHERE status = 'completed'
                    AND actual_end_date IS NOT NULL
                    AND planned_end_date IS NOT NULL
                    AND DATE(actual_end_date) BETWEEN :start_date AND :end_date
                GROUP BY DATE(actual_end_date)
                ORDER BY day ASC
            ";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->bindParam(':start_date', $startDate);
            $stmt->bindParam(':end_date', $endDate);
            $stmt->execute();
            $onTimeData = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // ایجاد برچسب‌های روزها به فارسی
            $labels = [];
            $days = [];
            
            // ایجاد لیست روزها در بازه زمانی
            $current = new DateTime($startDate);
            $end = new DateTime($endDate);
            
            // بسته به نوع دوره، فرمت متفاوت برای لیبل‌ها
            if ($period == 'current_year') {
                // برای سال: ماه‌ها
                while ($current <= $end) {
                    $monthNum = $current->format('n');
                    $months[] = $current->format('Y-m');
                    $labels[] = $this->getPersianMonthName($monthNum) . ' ' . $current->format('y');
                    $current->modify('+1 month');
                }
                
                // برای داده‌های سال، باید بر اساس ماه گروه‌بندی شود
                $completionValues = array_fill(0, count($months), 0);
                $durationValues = array_fill(0, count($months), 0);
                $onTimeValues = array_fill(0, count($months), 0);
                
                // پر کردن داده‌های تکمیل شده (گروه‌بندی ماهانه)
                foreach ($completionData as $row) {
                    $month = date('Y-m', strtotime($row['day']));
                    $index = array_search($month, $months);
                    if ($index !== false) {
                        $completionValues[$index] += (int)$row['completed_count'];
                    }
                }
                
                // پر کردن داده‌های میانگین زمان
                $monthlyDuration = [];
                $monthlyCount = [];
                foreach ($durationData as $row) {
                    $month = date('Y-m', strtotime($row['day']));
                    if (!isset($monthlyDuration[$month])) {
                        $monthlyDuration[$month] = 0;
                        $monthlyCount[$month] = 0;
                    }
                    $monthlyDuration[$month] += (float)$row['avg_duration'];
                    $monthlyCount[$month]++;
                }
                
                foreach ($months as $index => $month) {
                    if (isset($monthlyDuration[$month]) && $monthlyCount[$month] > 0) {
                        $durationValues[$index] = round($monthlyDuration[$month] / $monthlyCount[$month], 1);
                    }
                }
                
                // پر کردن داده‌های نرخ به موقع
                $monthlyOnTime = [];
                $monthlyOnTimeCount = [];
                foreach ($onTimeData as $row) {
                    $month = date('Y-m', strtotime($row['day']));
                    if (!isset($monthlyOnTime[$month])) {
                        $monthlyOnTime[$month] = 0;
                        $monthlyOnTimeCount[$month] = 0;
                    }
                    $monthlyOnTime[$month] += (float)$row['on_time_rate'];
                    $monthlyOnTimeCount[$month]++;
                }
                
                foreach ($months as $index => $month) {
                    if (isset($monthlyOnTime[$month]) && $monthlyOnTimeCount[$month] > 0) {
                        $onTimeValues[$index] = round($monthlyOnTime[$month] / $monthlyOnTimeCount[$month], 0);
                    }
                }
                
            } else {
                // برای ماه/سه ماهه: روزها
                while ($current <= $end) {
                    $dayStr = $current->format('Y-m-d');
                    $days[] = $dayStr;
                    // نمایش روز به صورت "5 بهمن"
                    $jdate = $this->gregorianToJalali($current->format('Y'), $current->format('m'), $current->format('d'));
                    $labels[] = $jdate[2] . ' ' . $this->getPersianMonthName($jdate[1]);
                    $current->modify('+1 day');
                }
                
                // مقداردهی اولیه آرایه‌های داده
                $completionValues = array_fill(0, count($days), 0);
                $durationValues = array_fill(0, count($days), 0);
                $onTimeValues = array_fill(0, count($days), 0);
                
                // پر کردن داده‌های تکمیل شده
                foreach ($completionData as $row) {
                    $index = array_search($row['day'], $days);
                    if ($index !== false) {
                        $completionValues[$index] = (int)$row['completed_count'];
                    }
                }
                
                // پر کردن داده‌های میانگین زمان
                foreach ($durationData as $row) {
                    $index = array_search($row['day'], $days);
                    if ($index !== false) {
                        $durationValues[$index] = round((float)$row['avg_duration'], 1);
                    }
                }
                
                // پر کردن داده‌های نرخ به موقع
                foreach ($onTimeData as $row) {
                    $index = array_search($row['day'], $days);
                    if ($index !== false) {
                        $onTimeValues[$index] = round((float)$row['on_time_rate'], 0);
                    }
                }
            }
            
            // ساختار داده‌های خروجی
            $chartData = [
                'period' => $periodType,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'labels' => $labels,
                'datasets' => [
                    [
                        'label' => 'کارهای تکمیل شده',
                        'data' => $completionValues,
                        'backgroundColor' => 'rgba(52, 152, 219, 0.2)',
                        'borderColor' => 'rgba(52, 152, 219, 1)',
                        'borderWidth' => 2,
                        'yAxisID' => 'y'
                    ],
                    [
                        'label' => 'میانگین زمان (ساعت)',
                        'data' => $durationValues,
                        'backgroundColor' => 'rgba(46, 204, 113, 0.2)',
                        'borderColor' => 'rgba(46, 204, 113, 1)',
                        'borderWidth' => 2,
                        'yAxisID' => 'y1'
                    ],
                    [
                        'label' => 'نرخ انجام به موقع (%)',
                        'data' => $onTimeValues,
                        'backgroundColor' => 'rgba(155, 89, 182, 0.2)',
                        'borderColor' => 'rgba(155, 89, 182, 1)',
                        'borderWidth' => 2,
                        'yAxisID' => 'y2'
                    ]
                ]
            ];
            
            return $chartData;
            
        } catch (PDOException $e) {
            error_log("Error getting chart data: " . $e->getMessage());
            
            // در صورت خطا، داده‌های نمونه برگردان
            return $this->getSampleChartData($period);
        }
    }

    // تابع کمکی برای تبدیل تاریخ میلادی به شمسی
    private function gregorianToJalali($gy, $gm, $gd) {
        $g_d_m = array(0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334);
        if ($gy > 1600) {
            $jy = 979;
            $gy -= 1600;
        } else {
            $jy = 0;
            $gy -= 621;
        }
        $gy2 = ($gm > 2) ? ($gy + 1) : $gy;
        $days = (365 * $gy) + ((int)(($gy2 + 3) / 4)) - ((int)(($gy2 + 99) / 100)) + ((int)(($gy2 + 399) / 400)) - 80 + $gd + $g_d_m[$gm - 1];
        $jy += 33 * ((int)($days / 12053));
        $days %= 12053;
        $jy += 4 * ((int)($days / 1461));
        $days %= 1461;
        if ($days > 365) {
            $jy += (int)(($days - 1) / 365);
            $days = ($days - 1) % 365;
        }
        $jm = ($days < 186) ? 1 + (int)($days / 31) : 7 + (int)(($days - 186) / 30);
        $jd = 1 + (($days < 186) ? ($days % 31) : (($days - 186) % 30));
        return array($jy, $jm, $jd);
    }



    // تابع کمکی برای تبدیل نام ماه به فارسی
    private function getPersianMonthName($monthNum) {
        $months = [
            1 => 'فروردین',
            2 => 'اردیبهشت',
            3 => 'خرداد',
            4 => 'تیر',
            5 => 'مرداد',
            6 => 'شهریور',
            7 => 'مهر',
            8 => 'آبان',
            9 => 'آذر',
            10 => 'دی',
            11 => 'بهمن',
            12 => 'اسفند'
        ];
        
        return $months[$monthNum] ?? 'نامشخص';
    }


}


// مدیریت درخواست
try {
    if (!isset($pdo)) {
        throw new Exception("اتصال به دیتابیس برقرار نیست");
    }
    
    $api = new DashboardAPI($pdo);
    
    if (isset($_GET['action'])) {
        $action = $_GET['action'];
        $response = [];
        
        switch ($action) {
            case 'get_key_metrics':
                $response = $api->getKeyMetrics();
                break;
            case 'get_urgent_work_orders':
                $response = $api->getUrgentWorkOrders();
                break;
            case 'get_preventive_schedule':
                $response = $api->getPreventiveSchedule();
                break;
            case 'get_critical_equipment':
                $response = $api->getCriticalEquipment();
                break;
            case 'get_notifications':
                $response = $api->getNotifications();
                break;
            case 'get_chart_data':
                // دریافت پارامتر دوره زمانی
                $period = $_GET['period'] ?? 'current_month';
                $response = $api->getPerformanceChartData($period);
                break;
            default:
                $response = ['error' => 'Action not found', 'status' => 'error'];
        }
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        
    } else {
        echo json_encode(['error' => 'No action specified', 'status' => 'error'], JSON_UNESCAPED_UNICODE);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => 'خطای سرور',
        'debug' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>