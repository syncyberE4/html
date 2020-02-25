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
mysqli_set_charset($conn, "utf8");
// Check connection
if ($conn->connect_error) {
    $response["status"] = "error";
    $response["error-message"] = "$conn->connect_error";
}; 

$stmtHaalLogboekOp = $conn->prepare(
    "SELECT l.archief_logboek_id, l.aanmaak_datum, l.eind_datum, l.opmerkingen, v.label, d.naam, p.omschrijving, v.vat_id, l.manueel 
    FROM Archief_logboek AS l
    LEFT JOIN Vat AS v ON v.vat_id=l.vat_id
    LEFT JOIN Druivensoort AS d ON d.druiven_soort_id=l.druiven_soort_id
    LEFT JOIN Pers_programma AS p ON p.pers_programma_id=l.pers_programma_id
    WHERE l.archief_logboek_id=?"
);

$stmtHaalEventsPerLogboek = $conn->prepare(
    "SELECT m.boodschap, m.bevestig, m.aanmaak_datum
    FROM Vat as v
    LEFT JOIN Sensor as s ON s.vat_id = v.vat_id
    INNER JOIN Alarm as a ON a.sensor_id = s.sensor_id
    RIGHT JOIN Melding as m ON m.alarm_id = a.alarm_id
    WHERE v.vat_id = ? AND m.aanmaak_datum > ? and m.aanmaak_datum < ?
    ORDER BY m.aanmaak_datum DESC"
);

   
$stmtHaalLogboekDataOp = "";
$stmtHaalVatSensorenOp = "";


if(isset($_POST['logboekId'])) {
    $logboekId = $_POST["logboekId"];
    $stmtHaalLogboekOp->bind_param("i", $logboekId);
    $stmtHaalLogboekOp->execute();
    $result = $stmtHaalLogboekOp->get_result();
    if($result->num_rows > 0){
        $logboek = null;
        while($row = $result->fetch_assoc()) {
            $logboek = $row;
            $stmtHaalVatSensorenOp = 
                "SELECT s.sensor_id, st.naam, st.eenheid, st.kommagetal 
                FROM Sensor as s 
                LEFT JOIN Sensortype AS st ON s.sensor_type_id = st.sensor_type_id 
                RIGHT JOIN Vat AS v ON s.vat_id = v.vat_id 
                WHERE v.vat_id = " . $row["vat_id"];

            $stmtHaalLogboekDataOp = 
                "SELECT sd.meetwaarde, sd.aanmaak_datum, s.sensor_id
                FROM Sensor AS s 
                LEFT JOIN Vat AS v ON v.vat_id=s.vat_id
                LEFT JOIN Sensortype AS st ON s.sensor_type_id=st.sensor_type_id
                RIGHT JOIN Archief_sensor_data AS sd ON s.sensor_id=sd.sensor_id
                WHERE v.vat_id=" . $row["vat_id"] . " AND sd.aanmaak_datum >= '" . $row["aanmaak_datum"] . "' 
                ORDER BY st.naam, sd.aanmaak_datum";      
        }
        $resultVatSensoren = $conn->query($stmtHaalVatSensorenOp);
        if($resultVatSensoren->num_rows > 0){
            $sensoren = array();
            while($row = $resultVatSensoren->fetch_assoc()) {
                $sensoren[$row["sensor_id"]] = $row;
                $sensoren[$row["sensor_id"]]["metingen"] = null;
            }
            $resultMetingen = $conn->query($stmtHaalLogboekDataOp);
            if($resultMetingen->num_rows > 0) {
                while($row = $resultMetingen->fetch_assoc()) {
                    $sensoren[$row["sensor_id"]]["metingen"][$row["aanmaak_datum"]] = $row["meetwaarde"];
                }
            }
            $response["answer"]["logboek"] = $logboek;
            $response["answer"]["metingen"] = array();
            foreach ($sensoren as $sensor) {
                array_push($response["answer"]["metingen"], $sensor);
            }
            // haal de events op
            $response["answer"]["events"] = array();
            $stmtHaalEventsPerLogboek->bind_param("iss", $logboek["vat_id"], $logboek["aanmaak_datum"], $logboek["eind_datum"]);
            $stmtHaalEventsPerLogboek->execute();
            $resultEvents = $stmtHaalEventsPerLogboek->get_result();
            if($resultEvents->num_rows > 0) {
                while($rowEvent = $resultEvents->fetch_assoc()) {
                    array_push($response["answer"]["events"], $rowEvent);
                }
                $response["status"] = "succes";
            } else {
                $response["status"] = "succes";
            }
        } else {
            $response["status"] = "error";
            $response["error-message"] = "Geen sensoren gevonden voor dit vat!";
        }
    } else {
        $response["status"] = "error";
        $response["error-message"] = "Geen logboek gevonden!";
    }
} else {
    $response["status"] = "error";
    $response["error-message"] = "geen logboek id doorgekregen!";
}

echo json_encode($response);

$conn->close();
?>