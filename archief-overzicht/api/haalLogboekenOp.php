<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header('Access-Control-Allow-Origin: *');  
$servername = "192.168.137.10";
$username = "gregory";
$password = "badmuts";
$dbname = "syncyber"; 
// $servername = "ID248955_syncyber.db.webhosting.be";
// $username = "ID248955_syncyber";
// $password = "R1234-56";
// $dbname = "ID248955_syncyber";

$response = array(
    "status" => null,
    "answer" => null,
    "error-message" => null
);


// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
mysqli_set_charset($conn, "utf8");
// Check connection
if ($conn->connect_error) {
    $response["status"] = "error";
    $response["error-message"] = "$conn->connect_error";
}; 

$stmtHaalLogboekOp = $conn->prepare(
    "SELECT l.archief_logboek_id, l.aanmaak_datum
    FROM Archief_logboek AS l
    WHERE l.vat_id LIKE ? AND l.pers_programma_id LIKE ? AND l.druiven_soort_id LIKE ? 
    AND l.wijnsoort_id LIKE ? 
    AND l.aanmaak_datum > ? AND l.aanmaak_datum < ?
    ORDER BY l.archief_logboek_id DESC" 
);



if(isset($_POST['vatId']) && isset($_POST['persId']) && isset($_POST['druifId']) && isset($_POST['wijnsoortId']) && isset($_POST['naDate']) && isset($_POST['voorDate'])) {
    $vatId = $_POST["vatId"];    
    $persId = $_POST["persId"];    
    $druifId = $_POST["druifId"];
    $wijnsoortId = $_POST["wijnsoortId"];
    $voorDatum = $_POST["voorDate"];
    $naDatum = $_POST["naDate"];
    $stmtHaalLogboekOp->bind_param("ssssss", $vatId, $persId, $druifId, $wijnsoortId, $naDatum, $voorDatum);
    $stmtHaalLogboekOp->execute();
    $result = $stmtHaalLogboekOp->get_result();
    if($result->num_rows > 0){
        $logboeken = array();
        while($row = $result->fetch_assoc()) {
            array_push($logboeken, $row);
        }
        $response["answer"] = $logboeken;
        $response["status"] = "succes";

    } else {
        $response["status"] = "error";
        $response["error-message"] = "Geen logboek gevonden!";
    }
} else {
    $response["status"] = "error";
    $response["error-message"] = "niet genoeg parameters doorgekregen!";
}

echo json_encode($response);

$conn->close();
?>