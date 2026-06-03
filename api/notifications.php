<?php
/**
 * این فایل جهت مدیریت هوشمند اعلان ها است
 * وظیفه آن دریافت لیست اعلان‌های کاربر، چک کردن اعلان‌های جدید، علامت‌گذاری یک اعلان به عنوان خوانده شده
 * علامت‌گذاری همه اعلان‌ها به عنوان خوانده شده ، ایجاد اعلان جدید، ایجاد اعلان گروهی است
 */
// api/notifications.php

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/notifications_errors.log');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// برای درخواست‌های OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/config.php';

class NotificationAPI {
    private $pdo;
    
    public function __construct() {
        global $pdo;
        $this->pdo = $pdo;
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        
        switch ($method) {
            case 'GET':
                $this->getNotifications();
                break;
            case 'POST':
                $this->handlePostRequest();
                break;
            case 'OPTIONS':
                http_response_code(200);
                break;
            default:
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
        }
    }
    
    private function getNotifications() {
        $user_id = $_GET['user_id'] ?? 0;
        $limit = $_GET['limit'] ?? 10;
        $offset = $_GET['offset'] ?? 0;
        $unread_only = isset($_GET['unread_only']) && $_GET['unread_only'] == 'true';
        $read_only = isset($_GET['read_only']) && $_GET['read_only'] == 'true';
        $priority = $_GET['priority'] ?? null;
        $type = $_GET['type'] ?? null;
        $search = $_GET['search'] ?? null;
        $sort = $_GET['sort'] ?? 'newest'; // newest یا oldest
        
        try {
            if (!$user_id) {
                throw new Exception('User ID is required');
            }
            
            // ساخت کوئری پایه
            $query = "SELECT 
                        n.id,
                        n.title,
                        n.message,
                        n.type,
                        n.priority,
                        n.related_module,
                        n.related_id,
                        n.is_read,
                        n.created_at,
                        n.expires_at,
                        n.read_at,
                        u.full_name as sender_name,
                        u.role as sender_role
                      FROM notifications n
                      LEFT JOIN users u ON n.user_id = u.id
                      WHERE n.user_id = :user_id";
            
            $params = [':user_id' => $user_id];
            
            // اعمال فیلتر خوانده شده/نخوانده
            if ($unread_only) {
                $query .= " AND n.is_read = 0";
            } elseif ($read_only) {
                $query .= " AND n.is_read = 1";
            }
            
            // اعمال فیلتر اولویت
            if ($priority && in_array($priority, ['low', 'medium', 'high', 'critical'])) {
                $query .= " AND n.priority = :priority";
                $params[':priority'] = $priority;
            }
            
            // اعمال فیلتر نوع
            if ($type && in_array($type, ['maintenance_request', 'work_order', 'inspection', 'equipment', 'parts', 'alert', 'system'])) {
                $query .= " AND n.type = :type";
                $params[':type'] = $type;
            }
            
            // اعمال جستجو
            if ($search) {
                $query .= " AND (n.title LIKE :search OR n.message LIKE :search)";
                $params[':search'] = '%' . $search . '%';
            }
            
            // اعمال مرتب‌سازی
            $orderBy = $sort === 'oldest' ? 'ASC' : 'DESC';
            $query .= " ORDER BY n.created_at $orderBy";
            
            // محدودیت و آفست
            $query .= " LIMIT :limit OFFSET :offset";
            $params[':limit'] = (int)$limit;
            $params[':offset'] = (int)$offset;
            
            $stmt = $this->pdo->prepare($query);
            
            // اتصال پارامترها
            foreach ($params as $key => $value) {
                $paramType = is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR;
                $stmt->bindValue($key, $value, $paramType);
            }
            
            $stmt->execute();
            $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // شمارش کل نتایج (برای صفحه‌بندی)
            $countQuery = "SELECT COUNT(*) as total FROM notifications n WHERE n.user_id = :user_id";
            
            if ($unread_only) {
                $countQuery .= " AND n.is_read = 0";
            } elseif ($read_only) {
                $countQuery .= " AND n.is_read = 1";
            }
            
            if ($priority) {
                $countQuery .= " AND n.priority = :priority";
            }
            
            if ($type) {
                $countQuery .= " AND n.type = :type";
            }
            
            if ($search) {
                $countQuery .= " AND (n.title LIKE :search OR n.message LIKE :search)";
            }
            
            $countStmt = $this->pdo->prepare($countQuery);
            $countParams = [':user_id' => $user_id];
            
            if ($priority) {
                $countParams[':priority'] = $priority;
            }
            
            if ($type) {
                $countParams[':type'] = $type;
            }
            
            if ($search) {
                $countParams[':search'] = '%' . $search . '%';
            }
            
            foreach ($countParams as $key => $value) {
                $paramType = is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR;
                $countStmt->bindValue($key, $value, $paramType);
            }
            
            $countStmt->execute();
            $totalResult = $countStmt->fetch(PDO::FETCH_ASSOC);
            $total = $totalResult['total'];
            
            // شمارش اعلان‌های خوانده نشده
            $unreadQuery = "SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = :user_id AND is_read = 0";
            $unreadStmt = $this->pdo->prepare($unreadQuery);
            $unreadStmt->execute([':user_id' => $user_id]);
            $unreadResult = $unreadStmt->fetch(PDO::FETCH_ASSOC);
            $unreadCount = $unreadResult['unread_count'];
            
            // آمار بر اساس نوع
            $typeStatsQuery = "SELECT type, COUNT(*) as count FROM notifications WHERE user_id = :user_id GROUP BY type";
            $typeStatsStmt = $this->pdo->prepare($typeStatsQuery);
            $typeStatsStmt->execute([':user_id' => $user_id]);
            $typeStats = $typeStatsStmt->fetchAll(PDO::FETCH_ASSOC);
            
            $byType = [];
            foreach ($typeStats as $stat) {
                $byType[$stat['type']] = $stat['count'];
            }
            
            // آمار بر اساس اولویت
            $priorityStatsQuery = "SELECT priority, COUNT(*) as count FROM notifications WHERE user_id = :user_id GROUP BY priority";
            $priorityStatsStmt = $this->pdo->prepare($priorityStatsQuery);
            $priorityStatsStmt->execute([':user_id' => $user_id]);
            $priorityStats = $priorityStatsStmt->fetchAll(PDO::FETCH_ASSOC);
            
            $byPriority = [];
            foreach ($priorityStats as $stat) {
                $byPriority[$stat['priority']] = $stat['count'];
            }
            
            echo json_encode([
                'success' => true,
                'data' => $notifications,
                'total' => $total,
                'unread_count' => $unreadCount,
                'by_type' => $byType,
                'by_priority' => $byPriority,
                'current_page' => floor($offset / $limit) + 1,
                'total_pages' => ceil($total / $limit)
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    private function handlePostRequest() {
        $action = $_GET['action'] ?? '';
        $data = json_decode(file_get_contents('php://input'), true);
        
        switch ($action) {
            case 'mark-read':
                $this->markAsRead($data['id'] ?? 0, $data['user_id'] ?? 0);
                break;
            case 'mark-unread':
                $this->markAsUnread($data['id'] ?? 0, $data['user_id'] ?? 0);
                break;
            case 'mark-all-read':
                $this->markAllAsRead($data['user_id'] ?? 0);
                break;
            case 'mark-multiple-read':
                $this->markMultipleAsRead($data['ids'] ?? [], $data['user_id'] ?? 0);
                break;
            case 'delete':
                $this->deleteNotification($data['id'] ?? 0, $data['user_id'] ?? 0);
                break;
            case 'delete-read':
                $this->deleteAllRead($data['user_id'] ?? 0);
                break;
            case 'delete-multiple':
                $this->deleteMultipleNotifications($data['ids'] ?? [], $data['user_id'] ?? 0);
                break;
            case 'create':
                $this->createNotification($data);
                break;
            case 'create-group':
                $this->createGroupNotification($data);
                break;
            case 'check-new':
                $this->checkNewNotifications($data['user_id'] ?? 0, $data['last_check'] ?? null);
                break;
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
        }
    }
    
private function markAsRead($notificationId, $userId) {
    try {
        // ابتدا بررسی کن که اعلان وجود دارد و متعلق به کاربر است
        $checkQuery = "SELECT is_read FROM notifications WHERE id = :id AND user_id = :user_id";
        $checkStmt = $this->pdo->prepare($checkQuery);
        $checkStmt->execute([':id' => $notificationId, ':user_id' => $userId]);
        $notification = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$notification) {
            throw new Exception('اعلان یافت نشد یا دسترسی ندارید');
        }
        
        // اگر قبلاً خوانده شده، نیازی به آپدیت نیست
        if ($notification['is_read'] == 1) {
            echo json_encode([
                'success' => true,
                'message' => 'اعلان قبلاً خوانده شده است',
                'already_read' => true
            ]);
            return;
        }
        
        $query = "UPDATE notifications SET is_read = 1, read_at = NOW() 
                 WHERE id = :id AND user_id = :user_id";
        $stmt = $this->pdo->prepare($query);
        $stmt->bindParam(':id', $notificationId, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        
        // گرفتن اطلاعات اعلان بروزرسانی شده برای بازگشت
        $updatedQuery = "SELECT * FROM notifications WHERE id = :id";
        $updatedStmt = $this->pdo->prepare($updatedQuery);
        $updatedStmt->execute([':id' => $notificationId]);
        $updatedNotification = $updatedStmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'اعلان خوانده شد',
            'affected_rows' => $stmt->rowCount(),
            'notification' => $updatedNotification,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}

private function markAsUnread($notificationId, $userId) {
    try {
        // ابتدا بررسی کن که اعلان وجود دارد و متعلق به کاربر است
        $checkQuery = "SELECT is_read FROM notifications WHERE id = :id AND user_id = :user_id";
        $checkStmt = $this->pdo->prepare($checkQuery);
        $checkStmt->execute([':id' => $notificationId, ':user_id' => $userId]);
        $notification = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$notification) {
            throw new Exception('اعلان یافت نشد یا دسترسی ندارید');
        }
        
        // اگر قبلاً خوانده نشده، نیازی به آپدیت نیست
        if ($notification['is_read'] == 0) {
            echo json_encode([
                'success' => true,
                'message' => 'اعلان قبلاً خوانده نشده است',
                'already_unread' => true
            ]);
            return;
        }
        
        $query = "UPDATE notifications SET is_read = 0, read_at = NULL 
                 WHERE id = :id AND user_id = :user_id";
        $stmt = $this->pdo->prepare($query);
        $stmt->bindParam(':id', $notificationId, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        
        // گرفتن اطلاعات اعلان بروزرسانی شده برای بازگشت
        $updatedQuery = "SELECT * FROM notifications WHERE id = :id";
        $updatedStmt = $this->pdo->prepare($updatedQuery);
        $updatedStmt->execute([':id' => $notificationId]);
        $updatedNotification = $updatedStmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'اعلان به حالت خوانده نشده تغییر یافت',
            'affected_rows' => $stmt->rowCount(),
            'notification' => $updatedNotification,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}
    
    private function markAllAsRead($userId) {
        try {
            $query = "UPDATE notifications SET is_read = 1, read_at = NOW() 
                     WHERE user_id = :user_id AND is_read = 0";
            $stmt = $this->pdo->prepare($query);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            
            echo json_encode([
                'success' => true,
                'message' => 'همه اعلان‌ها خوانده شدند',
                'affected_rows' => $stmt->rowCount()
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    private function markMultipleAsRead($notificationIds, $userId) {
        try {
            if (empty($notificationIds)) {
                throw new Exception('No notification IDs provided');
            }
            
            $placeholders = implode(',', array_fill(0, count($notificationIds), '?'));
            $query = "UPDATE notifications SET is_read = 1, read_at = NOW() 
                     WHERE id IN ($placeholders) AND user_id = ?";
            
            $stmt = $this->pdo->prepare($query);
            
            // اتصال پارامترها
            $paramIndex = 1;
            foreach ($notificationIds as $id) {
                $stmt->bindValue($paramIndex++, $id, PDO::PARAM_INT);
            }
            $stmt->bindValue($paramIndex, $userId, PDO::PARAM_INT);
            
            $stmt->execute();
            
            echo json_encode([
                'success' => true,
                'message' => 'اعلان‌های انتخاب شده خوانده شدند',
                'affected_rows' => $stmt->rowCount()
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    private function deleteNotification($notificationId, $userId) {
        try {
            $query = "DELETE FROM notifications WHERE id = :id AND user_id = :user_id";
            $stmt = $this->pdo->prepare($query);
            $stmt->bindParam(':id', $notificationId, PDO::PARAM_INT);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            
            echo json_encode([
                'success' => true,
                'message' => 'اعلان حذف شد',
                'deleted_count' => $stmt->rowCount()
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    private function deleteAllRead($userId) {
        try {
            $query = "DELETE FROM notifications WHERE user_id = :user_id AND is_read = 1";
            $stmt = $this->pdo->prepare($query);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            
            echo json_encode([
                'success' => true,
                'message' => 'اعلان‌های خوانده شده حذف شدند',
                'deleted_count' => $stmt->rowCount()
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    private function deleteMultipleNotifications($notificationIds, $userId) {
        try {
            if (empty($notificationIds)) {
                throw new Exception('No notification IDs provided');
            }
            
            $placeholders = implode(',', array_fill(0, count($notificationIds), '?'));
            $query = "DELETE FROM notifications WHERE id IN ($placeholders) AND user_id = ?";
            
            $stmt = $this->pdo->prepare($query);
            
            // اتصال پارامترها
            $paramIndex = 1;
            foreach ($notificationIds as $id) {
                $stmt->bindValue($paramIndex++, $id, PDO::PARAM_INT);
            }
            $stmt->bindValue($paramIndex, $userId, PDO::PARAM_INT);
            
            $stmt->execute();
            
            echo json_encode([
                'success' => true,
                'message' => 'اعلان‌های انتخاب شده حذف شدند',
                'deleted_count' => $stmt->rowCount()
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    private function createNotification($data) {
        try {
            $required_fields = ['user_id', 'title', 'message'];
            foreach ($required_fields as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    throw new Exception("فیلد $field الزامی است");
                }
            }
            
            // اضافه کردن sender_id اگر موجود باشد
            $sender_id = $data['sender_id'] ?? null;
            
            $query = "INSERT INTO notifications 
                     (user_id, sender_id, title, message, type, priority, related_module, related_id, expires_at)
                     VALUES (:user_id, :sender_id, :title, :message, :type, :priority, :related_module, :related_id, :expires_at)";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                ':user_id' => $data['user_id'],
                ':sender_id' => $sender_id,
                ':title' => $data['title'],
                ':message' => $data['message'],
                ':type' => $data['type'] ?? 'system',
                ':priority' => $data['priority'] ?? 'medium',
                ':related_module' => $data['related_module'] ?? null,
                ':related_id' => $data['related_id'] ?? null,
                ':expires_at' => isset($data['expires_at']) ? date('Y-m-d H:i:s', strtotime($data['expires_at'])) : null
            ]);
            
            $notificationId = $this->pdo->lastInsertId();
            
            echo json_encode([
                'success' => true,
                'message' => 'اعلان ایجاد شد',
                'notification_id' => $notificationId
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    private function createGroupNotification($data) {
        try {
            if (!isset($data['role']) || empty($data['role'])) {
                throw new Exception("نقش کاربران الزامی است");
            }
            
            // دریافت کاربران با نقش مشخص شده
            $query = "SELECT id FROM users WHERE role = :role AND is_active = 1";
            $stmt = $this->pdo->prepare($query);
            $stmt->bindParam(':role', $data['role'], PDO::PARAM_STR);
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            if (empty($users)) {
                throw new Exception("کاربری با این نقش یافت نشد");
            }
            
            $inserted_count = 0;
            
            foreach ($users as $user_id) {
                $query = "INSERT INTO notifications 
                         (user_id, sender_id, title, message, type, priority, related_module, related_id, expires_at)
                         VALUES (:user_id, :sender_id, :title, :message, :type, :priority, :related_module, :related_id, :expires_at)";
                
                $stmt = $this->pdo->prepare($query);
                $stmt->execute([
                    ':user_id' => $user_id,
                    ':sender_id' => $data['sender_id'] ?? null,
                    ':title' => $data['title'],
                    ':message' => $data['message'],
                    ':type' => $data['type'] ?? 'system',
                    ':priority' => $data['priority'] ?? 'medium',
                    ':related_module' => $data['related_module'] ?? null,
                    ':related_id' => $data['related_id'] ?? null,
                    ':expires_at' => isset($data['expires_at']) ? date('Y-m-d H:i:s', strtotime($data['expires_at'])) : null
                ]);
                
                $inserted_count++;
            }
            
            echo json_encode([
                'success' => true,
                'message' => "اعلان برای $inserted_count کاربر ارسال شد"
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    private function checkNewNotifications($user_id, $last_check) {
        try {
            if (!$user_id) {
                throw new Exception('User ID is required');
            }
            
            $last_check_time = $last_check ? date('Y-m-d H:i:s', strtotime($last_check)) : 
                                           date('Y-m-d H:i:s', strtotime('-1 hour'));
            
            // شمارش اعلان‌های جدید برای کاربر
            $query = "SELECT COUNT(*) as count FROM notifications 
                      WHERE user_id = :user_id 
                      AND created_at > :last_check
                      AND is_read = 0";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                ':user_id' => $user_id,
                ':last_check' => $last_check_time
            ]);
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $new_count = $result['count'];
            
            echo json_encode([
                'success' => true,
                'new_count' => $new_count,
                'last_check' => $last_check_time
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
}

// اجرای API
$api = new NotificationAPI();
$api->handleRequest();































?>