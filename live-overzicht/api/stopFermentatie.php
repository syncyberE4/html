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
    "error-message" => null
);

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
    $response["status"] = "error";
    $response["error-message"] = "$conn->connect_error";
};

$start_datum = null;
$eind_datum = null;  

$stmtHaalLogboekOp = $conn->prepare(
    "SELECT l.aanmaak_datum, l.eind_datum
    FROM Logboek AS l
    WHERE logboek_id = ?"
);

$stmtHaalSensorenOp = $conn->prepare(
    "SELECT *
    FROM Sensor AS s 
    WHERE s.vat_id = ?"
);

$stmtHaalAlleDataOpWhereSensorId = $conn->prepare(
    "SELECT * 
    FROM Sensor_data AS s 
    WHERE s.sensor_id = ? AND s.aanmaak_datum BETWEEN ? AND ?"
);

$stmtInsertDataInArchief = $conn->prepare(
    "INSERT INTO Archief_sensor_data (sensor_id, meetwaarde, aanmaak_datum) 
    VALUES (?, ?, ?)"
);

$stmtDeleteMovedSensorData = $conn->prepare(
    "DELETE FROM Sensor_data 
    WHERE sensor_data_id = ?"
);

$stmtGetLogboek = $conn->prepare(
    "SELECT * 
    FROM Logboek AS l 
    WHERE l.logboek_id = ?"
);

$stmtInsertLogboekInArchief = $conn->prepare(
    "INSERT INTO Archief_logboek (gebruiker_id, pers_programma_id, druiven_soort_id, opmerkingen, vat_id, aanmaak_datum, update_datum, eind_datum, wijnsoort_id, manueel) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);

$stmtDeleteMovedLogboek = $conn->prepare(
    "DELETE FROM Logboek 
    WHERE logboek_id = ?"
);

if ($stmtHaalLogboekOp === FALSE && $stmtHaalSensorenOp === FALSE && $stmtHaalAlleDataOpWhereSensorId === FALSE && $stmtInsertDataInArchief === FALSE && $stmtDeleteMovedSensorData === FALSE && $stmtGetLogboek === FALSE && $stmtInsertLogboekInArchief === FALSE && $stmtDeleteMovedLogboek === FALSE) {
    $response["status"] = "error";
    $response["error-message"] = $conn->error;
} else {
    // check if parameters are passed
    if(isset($_POST["vatId"]) && isset($_POST["logboekId"])) {
        $vatId = $_POST["vatId"];
        $logboekId = $_POST["logboekId"];
                $stmtHaalLogboekOp->bind_param("i", $logboekId);
                $stmtHaalLogboekOp->execute();
                $result = $stmtHaalLogboekOp->get_result();
                $stmtHaalLogboekOp->close();
                // haal start en eiddatum op van logboek
                if($result->num_rows > 0){
                    while($row = $result->fetch_assoc()) {
                        $start_datum = $row["aanmaak_datum"];
                        $eind_datum = $row["eind_datum"];
                    }
                    $stmtHaalSensorenOp->bind_param("i", $vatId);
                    $stmtHaalSensorenOp->execute();
                    $resultSensoren = $stmtHaalSensorenOp->get_result();
                    $stmtHaalSensorenOp->close();
                    // haal sensoren op van het logboek
                    if($resultSensoren->num_rows > 0){
                        while($rowSensoren = $resultSensoren->fetch_assoc()) {
                            $stmtHaalAlleDataOpWhereSensorId->bind_param("iss", $rowSensoren["sensor_id"], $start_datum, $eind_datum);
                            $stmtHaalAlleDataOpWhereSensorId->execute();
                            $resultData = $stmtHaalAlleDataOpWhereSensorId->get_result();
                            // haal de data van de sensore op
                            if($resultData->num_rows > 0) {
                                while($rowData = $resultData->fetch_assoc()) {
                                    $stmtInsertDataInArchief->bind_param("iss", $rowData["sensor_id"], $rowData["meetwaarde"], $rowData["aanmaak_datum"]);
                                    $stmtDeleteMovedSensorData->bind_param("i", $rowData["sensor_data_id"]);
                                    if($stmtInsertDataInArchief->execute() === true) {
                                        if($stmtDeleteMovedSensorData->execute() === true) {
                                            $response["status"] = "succes";
                                        } else {
                                            $response["status"] = "error";
                                            $response["error-message"] = "De verplaatste data is niet verwijderd"; 
                                        }
                                    } else {
                                        $response["status"] = "error";
                                        $response["error-message"] = "De data is niet verplaats naar de archief tabel";
                                    }
                                }
                            } else {
                                $response["status"] = "error";
                                $response["error-message"] = "Geen data gevonden voor sensor -> " . $row["sensor_id"];
                            }
                        }
                    } else {
                        $response["status"] = "error";
                        $response["error-message"] = "Geen sensoren gevonden!";
                    }
                } else {
                    $response["status"] = "error";
                    $response["error-message"] = "Geen logboek gevonden!";
                }

                // haal logboek op
                $stmtGetLogboek->bind_param("i", $logboekId);
                $stmtGetLogboek->execute();
                $resultLogboek = $stmtGetLogboek->get_result();
                if($resultLogboek->num_rows > 0) {
                    while($rowLogboek = $resultLogboek->fetch_assoc()) {
                        $stmtInsertLogboekInArchief->bind_param(
                            "iiisisssii", 
                            $rowLogboek["gebruiker_id"],
                            $rowLogboek["pers_programma_id"], 
                            $rowLogboek["druiven_soort_id"], 
                            $rowLogboek["opmerkingen"], 
                            $rowLogboek["vat_id"], 
                            $rowLogboek["aanmaak_datum"], 
                            $rowLogboek["update_datum"], 
                            $rowLogboek["eind_datum"],
                            $rowLogboek["wijnsoort_id"],
                            $rowLogboek["manueel"]
                        );
                        $stmtDeleteMovedLogboek->bind_param("i", $logboekId);
                        if($stmtInsertLogboekInArchief->execute() === true) {
                            if($stmtDeleteMovedLogboek->execute() === true){
                                $response["status"] = "succes";
                            } else {
                                $response["status"] = "error";
                                $response["error-message"] = "De verplaatste logboek is niet verwijderd"; 
                            } 
                        } else {
                            $response["status"] = "error";
                            $response["error-message"] = "De logboek is niet verplaats naar de archief tabel";
                        }
                    }
                }
    } else {
        $response["status"] = "error";
        $response["error-message"] = "Onvoldoende gegevens doorgekregen!";
    }
}

echo json_encode($response);

$conn->close();
?>