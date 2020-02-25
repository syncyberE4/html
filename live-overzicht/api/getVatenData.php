<?php
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
// Check connection
if ($conn->connect_error) {
    $response["status"] = "error";
    $response["error-message"] = "$conn->connect_error";
}; 
    
$stmtHaalVatenDataOp = "SELECT v.vat_id, v.label, v.beschikbaar, v.online, v.locatie, v.volume, l.logboek_id, l.aanmaak_datum
                        FROM Vat as v
                        LEFT JOIN Logboek AS l ON v.vat_id=l.vat_id
                        ORDER BY v.vat_id;";    
$result = $conn->query($stmtHaalVatenDataOp);

$stmtHaalEventsPerLogboek = $conn->prepare(
    "SELECT m.boodschap, m.bevestig, m.aanmaak_datum
    FROM Vat as v
    LEFT JOIN Sensor as s ON s.vat_id = v.vat_id
    INNER JOIN Alarm as a ON a.sensor_id = s.sensor_id
    RIGHT JOIN Melding as m ON m.alarm_id = a.alarm_id
    WHERE v.vat_id = ? AND m.aanmaak_datum > ?
    ORDER BY m.aanmaak_datum DESC
    LIMIT 5"
);



if($result->num_rows > 0){
    $vaten = array();
    while($row = $result->fetch_assoc()) {
        $row["events"] = array();
        if($row["logboek_id"] != null){
            $stmtHaalEventsPerLogboek->bind_param("is", $row["vat_id"], $row["aanmaak_datum"]);
            $stmtHaalEventsPerLogboek->execute();
            $resultEvents = $stmtHaalEventsPerLogboek->get_result();
            if($resultEvents->num_rows > 0) {
                while($rowEvent = $resultEvents->fetch_assoc()) {
                    array_push($row["events"], $rowEvent);
                }
            }
        }
        array_push($vaten, $row);
    }
    $response["status"] = "succes";
    $response["answer"] = $vaten;
} else {
    $response["status"] = "error";
    $response["error-message"] = "Geen vaten gevonden!";
}

echo json_encode($response);

$conn->close();
?>