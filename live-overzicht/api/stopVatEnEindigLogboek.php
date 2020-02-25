<?php
header('Access-Control-Allow-Origin: *'); 
include 'config.php';

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

$stmtZetVatOpBeschikbaar = $conn->prepare(
    "UPDATE `Vat` 
    SET `beschikbaar` = '1' 
    WHERE `Vat`.`vat_id` = ?;"
);  

$stmtZetEinddatumOpLogboek = $conn->prepare(
    "UPDATE Logboek 
    SET eind_datum=CURRENT_TIME 
    WHERE logboek_id = ?;"
); 

if ($stmtZetVatOpBeschikbaar === FALSE && $stmtZetEinddatumOpLogboek === FALSE) {
    $response["status"] = "error";
    $response["error-message"] = $conn->error;
} else {
    // check if parameters are passed
    if(isset($_POST["vatId"]) && isset($_POST["logboekId"])) {
        $vatId = $_POST["vatId"];
        $logboekId = $_POST["logboekId"];
        $stmtZetVatOpBeschikbaar->bind_param("i", $vatId);
        // set vat op beschikbaar
        if ($stmtZetVatOpBeschikbaar->execute() === true) {
            $stmtZetVatOpBeschikbaar->close();
            $stmtZetEinddatumOpLogboek->bind_param("i", $logboekId);
            // set einddatum bij logboek
            if($stmtZetEinddatumOpLogboek->execute() === true) {
                $stmtZetEinddatumOpLogboek->close();
                $response["status"] = "succes";
            } else {
                $response["status"] = "error";
                $response["error-message"] = "Logboek heeft geen einddatum gekregen!";
            }
        } else {
            $response["status"] = "error";
            $response["error-message"] = "Vat is niet op beschikbaar gezet!";
        }
    } else {
        $response["status"] = "error";
        $response["error-message"] = "Onvoldoende gegevens doorgekregen!";
    }
}

echo json_encode($response);

$conn->close();
?>