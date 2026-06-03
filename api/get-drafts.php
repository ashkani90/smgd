<?php
// get-drafts.php
header('Content-Type: application/json; charset=utf-8');

require_once 'config.php';

$userId = $_GET['user_id'] ?? $_POST['user_id'] ?? 'anonymous';

$sql = "SELECT * FROM drafts WHERE user_id = ? ORDER BY updated_at DESC";
$stmt = $conn->prepare($sql);
$stmt->bind_param('s', $userId);
$stmt->execute();

$result = $stmt->get_result();
$drafts = [];

while ($row = $result->fetch_assoc()) {
    $row['form_data'] = json_decode($row['form_data'], true);
    $row['equipment_data'] = json_decode($row['equipment_data'], true);
    $drafts[] = $row;
}

echo json_encode([
    'success' => true,
    'data' => $drafts
]);

$stmt->close();
$conn->close();
?>