<?php
/**
 * مدیریت هوشمند اعلان ها
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
        $sort = $_GET['sort'] ?? 'newest';
        
        try {
            if (!$user_id) {
                throw new Exception('User ID is required');
            }
            
            // بررسی وجود ستون sender_id
            $hasSenderId = $this->checkColumnExists('notifications', 'sender_id');
            
            // ساخت کوئری پایه
            if ($hasSenderId) {
                $query = "SELECT 
                            n.id,
                            n.title,
                            n.message,
                            n.type,
                            n.priority,
                            n.related_module,
                            n.is_read,
                            n.created_at,
                            n.expires_at,
                            n.read_at,
                            n.reporter_name,
                            sender.full_name as sender_name,
                            sender.role as sender_role
                          FROM notifications n
                          LEFT JOIN users sender ON n.sender_id = sender.id
                          WHERE n.user_id = :user_id";
            } else {
                // Fallback برای حالت بدون sender_id
                $query = "SELECT 
                            n.id,
                            n.title,
                            n.message,
                            n.type,
                            n.priority,
                            n.related_module,
                            n.is_read,
                            n.created_at,
                            n.expires_at,
                            n.read_at,
                            NULL as sender_name,
                            NULL as sender_role
                          FROM notifications n
                          WHERE n.user_id = :user_id";
            }
            
            $params = [':user_id' => $user_id];
            
            if ($unread_only) {
                $query .= " AND n.is_read = 0";
            } elseif ($read_only) {
                $query .= " AND n.is_read = 1";
            }
            
            if ($priority && in_array($priority, ['low', 'medium', 'high', 'critical'])) {
                $query .= " AND n.priority = :priority";
                $params[':priority'] = $priority;
            }
            
            if ($type && in_array($type, ['maintenance_request', 'work_order', 'inspection', 'equipment', 'parts', 'alert', 'system', 'defect_report'])) {
                $query .= " AND n.type = :type";
                $params[':type'] = $type;
            }
            
            if ($search) {
                $query .= " AND (n.title LIKE :search OR n.message LIKE :search)";
                $params[':search'] = '%' . $search . '%';
            }
            
            $orderBy = $sort === 'oldest' ? 'ASC' : 'DESC';
            $query .= " ORDER BY n.created_at $orderBy";
            $query .= " LIMIT :limit OFFSET :offset";
            $params[':limit'] = (int)$limit;
            $params[':offset'] = (int)$offset;
            
            $stmt = $this->pdo->prepare($query);
            
            foreach ($params as $key => $value) {
                $paramType = is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR;
                $stmt->bindValue($key, $value, $paramType);
            }
            
            $stmt->execute();
            $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // اگر sender_name و sender_role نداریم و ستون sender_id وجود ندارد،
            // سعی می‌کنیم از اطلاعات خود اعلان استفاده کنیم
            if (!$hasSenderId && !empty($notifications)) {
                foreach ($notifications as &$notif) {
                    // اگر در message یا title نام فرستنده وجود دارد، استخراج کن
                    if (preg_match('/گزارش[\s]دهنده:\s*([^\)]+)/', $notif['message'], $matches)) {
                        $notif['sender_name'] = trim($matches[1]);
                    }
                    if (preg_match('/نقش:\s*([^\)\s]+)/', $notif['message'], $matches)) {
                        $notif['sender_role'] = trim($matches[1]);
                    }
                }
            }
            
            // شمارش کل نتایج
            $countQuery = "SELECT COUNT(*) as total FROM notifications n WHERE n.user_id = :user_id";
            if ($unread_only) {
                $countQuery .= " AND n.is_read = 0";
            } elseif ($read_only) {
                $countQuery .= " AND n.is_read = 1";
            }
            if ($priority) $countQuery .= " AND n.priority = :priority";
            if ($type) $countQuery .= " AND n.type = :type";
            if ($search) $countQuery .= " AND (n.title LIKE :search OR n.message LIKE :search)";
            
            $countStmt = $this->pdo->prepare($countQuery);
            $countParams = [':user_id' => $user_id];
            if ($priority) $countParams[':priority'] = $priority;
            if ($type) $countParams[':type'] = $type;
            if ($search) $countParams[':search'] = '%' . $search . '%';
            
            foreach ($countParams as $key => $value) {
                $paramType = is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR;
                $countStmt->bindValue($key, $value, $paramType);
            }
            $countStmt->execute();
            $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // شمارش اعلان‌های خوانده نشده
            $unreadStmt = $this->pdo->prepare("SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = :user_id AND is_read = 0");
            $unreadStmt->execute([':user_id' => $user_id]);
            $unreadCount = $unreadStmt->fetch(PDO::FETCH_ASSOC)['unread_count'];
            
            echo json_encode([
                'success' => true,
                'data' => $notifications,
                'total' => $total,
                'unread_count' => $unreadCount,
                'has_sender_id' => $hasSenderId,
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
    
    // تابع کمکی برای بررسی وجود ستون
    private function checkColumnExists($table, $column) {
        try {
            $stmt = $this->pdo->prepare("SHOW COLUMNS FROM `$table` LIKE :column");
            $stmt->execute([':column' => $column]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            return false;
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
            $checkQuery = "SELECT is_read FROM notifications WHERE id = :id AND user_id = :user_id";
            $checkStmt = $this->pdo->prepare($checkQuery);
            $checkStmt->execute([':id' => $notificationId, ':user_id' => $userId]);
            $notification = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$notification) {
                throw new Exception('اعلان یافت نشد یا دسترسی ندارید');
            }
            
            if ($notification['is_read'] == 1) {
                echo json_encode(['success' => true, 'message' => 'اعلان قبلاً خوانده شده است', 'already_read' => true]);
                return;
            }
            
            $query = "UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = :id AND user_id = :user_id";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':id' => $notificationId, ':user_id' => $userId]);
            
            echo json_encode([
                'success' => true,
                'message' => 'اعلان خوانده شد',
                'affected_rows' => $stmt->rowCount(),
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    
    private function markAsUnread($notificationId, $userId) {
        try {
            $checkQuery = "SELECT is_read FROM notifications WHERE id = :id AND user_id = :user_id";
            $checkStmt = $this->pdo->prepare($checkQuery);
            $checkStmt->execute([':id' => $notificationId, ':user_id' => $userId]);
            $notification = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$notification) {
                throw new Exception('اعلان یافت نشد یا دسترسی ندارید');
            }
            
            if ($notification['is_read'] == 0) {
                echo json_encode(['success' => true, 'message' => 'اعلان قبلاً خوانده نشده است', 'already_unread' => true]);
                return;
            }
            
            $query = "UPDATE notifications SET is_read = 0, read_at = NULL WHERE id = :id AND user_id = :user_id";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':id' => $notificationId, ':user_id' => $userId]);
            
            echo json_encode([
                'success' => true,
                'message' => 'اعلان به حالت خوانده نشده تغییر یافت',
                'affected_rows' => $stmt->rowCount(),
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    
    private function markAllAsRead($userId) {
        try {
            $query = "UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = :user_id AND is_read = 0";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':user_id' => $userId]);
            
            echo json_encode([
                'success' => true,
                'message' => 'همه اعلان‌ها خوانده شدند',
                'affected_rows' => $stmt->rowCount()
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    
    private function markMultipleAsRead($notificationIds, $userId) {
        try {
            if (empty($notificationIds)) {
                throw new Exception('No notification IDs provided');
            }
            
            $placeholders = implode(',', array_fill(0, count($notificationIds), '?'));
            $query = "UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id IN ($placeholders) AND user_id = ?";
            $stmt = $this->pdo->prepare($query);
            
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
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    
    private function deleteNotification($notificationId, $userId) {
        try {
            $query = "DELETE FROM notifications WHERE id = :id AND user_id = :user_id";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':id' => $notificationId, ':user_id' => $userId]);
            
            echo json_encode([
                'success' => true,
                'message' => 'اعلان حذف شد',
                'deleted_count' => $stmt->rowCount()
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    
    private function deleteAllRead($userId) {
        try {
            $query = "DELETE FROM notifications WHERE user_id = :user_id AND is_read = 1";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':user_id' => $userId]);
            
            echo json_encode([
                'success' => true,
                'message' => 'اعلان‌های خوانده شده حذف شدند',
                'deleted_count' => $stmt->rowCount()
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
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
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    
    private function checkNewNotifications($user_id, $last_check) {
        try {
            if (!$user_id) {
                throw new Exception('User ID is required');
            }
            
            $last_check_time = $last_check ? date('Y-m-d H:i:s', strtotime($last_check)) : date('Y-m-d H:i:s', strtotime('-1 hour'));
            
            $query = "SELECT COUNT(*) as count FROM notifications 
                      WHERE user_id = :user_id AND created_at > :last_check AND is_read = 0";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':user_id' => $user_id, ':last_check' => $last_check_time]);
            
            $new_count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            echo json_encode([
                'success' => true,
                'new_count' => $new_count,
                'last_check' => $last_check_time
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }
}

$api = new NotificationAPI();
$api->handleRequest();
?>