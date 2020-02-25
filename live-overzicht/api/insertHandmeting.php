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

$stmtInsertData = $conn->prepare(
    "INSERT INTO Sensor_data 
    (sensor_id, meetwaarde, aanmaak_datum) 
    VALUES (?, ?, CURRENT_TIME)"
);  

$stmtGetLastSensorData = $conn->prepare(
    "SELECT s.meetwaarde
    FROM Sensor_data AS s
    WHERE s.sensor_id = ?
    ORDER BY s.sensor_data_id DESC
    LIMIT 1"
);

if ($stmtInsertData === FALSE && $stmtGetLastSensorData === FALSE) {
    $response["status"] = "error";
    $response["error-message"] = $conn->error;
} 
else {
    // check if parameters are passed
    if(isset($_POST["sensorenData"])) {
        $sensorenData = $_POST["sensorenData"];
        $sensorenData = json_decode($sensorenData);
        $response["status"] = "error";
        $response["error-message"] = $sensorenData;
        foreach ($sensorenData as $sensorId => $waarde) {
            if($waarde == "NaN") {
                $stmtGetLastSensorData->bind_param("i", $sensorId);
                $stmtGetLastSensorData->execute();
                $result = $stmtGetLastSensorData->get_result();
                if($result->num_rows > 0){
                    while($row = $result->fetch_assoc()) {
                        $waarde = $row["meetwaarde"];
                    }
                } else {
                    $waarde = 0;
                }
            }
            $stmtInsertData->bind_param("id", $sensorId, $waarde);
            if($stmtInsertData->execute()) {
                $response["status"] = "succes";
                $response["error-message"] = null;
            } else {
                $response["status"] = "error";
                $response["error-message"] = $waarde;
            }
        }
    } 
    else {
        $response["status"] = "error";
        $response["error-message"] = "Onvoldoende gegevens doorgekregen!";
    }
}

echo json_encode($response);

$conn->close();
?>