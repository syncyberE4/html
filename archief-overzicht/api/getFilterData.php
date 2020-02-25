<?php

// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);
header('Access-Control-Allow-Origin: *');  
include 'config.php';

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
} else {
    $stmtHaalVateOp = "SELECT vat_id, label FROM Vat ORDER BY label;";    
    $resultVaten = $conn->query($stmtHaalVateOp);
    
    $stmtHaalDruivensoortenOp = "SELECT druiven_soort_id, naam FROM Druivensoort ORDER BY naam;";    
    $resultDruiven = $conn->query($stmtHaalDruivensoortenOp);
    
    $stmtHaalWijnsoortenOp = $conn->prepare("SELECT wijnsoort_id, naam FROM Wijn_soort ORDER BY naam");
    $stmtHaalWijnsoortenOp->execute();
    $resultWijnsoorten = $stmtHaalWijnsoortenOp->get_result();

    $stmtHaalPersprogrammasOp = $conn->prepare("SELECT p.pers_programma_id, p.omschrijving FROM Pers_programma as p ORDER BY p.pers_programma_id");
    $stmtHaalPersprogrammasOp->execute();
    $resultPersprogrammas = $stmtHaalPersprogrammasOp->get_result();
    
    if($resultVaten->num_rows > 0){
        $response["answer"]["vaten"] = array();
        while($rowVat = $resultVaten->fetch_assoc()) {
            array_push($response["answer"]["vaten"], array(0 => $rowVat["vat_id"], 1 => $rowVat["label"]));
        }
    } else {
        $response["answer"]["vaten"] = array(0 => "0", 1 => "geen vaten gevonden!");
    }
    
    if($resultDruiven->num_rows > 0){
        $response["answer"]["druiven"] = array();
        while($rowDruif = $resultDruiven->fetch_assoc()) {
            array_push($response["answer"]["druiven"], array(0 => $rowDruif["druiven_soort_id"], 1 => $rowDruif["naam"]));
        }
    } else {
        $response["answer"]["druiven"] = array(0 => "0", 1 => "geen druiven gevonden!");
    }
    
    if($resultWijnsoorten->num_rows > 0){
        $response["answer"]["wijnsoorten"] = array();
        while($rowWijnsoort = $resultWijnsoorten->fetch_assoc()) {
            array_push($response["answer"]["wijnsoorten"], array(0 => $rowWijnsoort["wijnsoort_id"], 1 => utf8_encode($rowWijnsoort["naam"])));
        }
    } else {
        $response["answer"]["wijnsoorten"] = array(0 => "0", 1 => "geen wijnsoorten gevonden!");
    }

    if($resultPersprogrammas->num_rows > 0){
        $response["answer"]["persprogrammas"] = array();
        while($rowPersprogramma = $resultPersprogrammas->fetch_assoc()) {
            array_push($response["answer"]["persprogrammas"], array(0 => $rowPersprogramma["pers_programma_id"], 1 => utf8_encode($rowPersprogramma["omschrijving"])));
        }
    } else {
        $response["answer"]["persprogrammas"] = array(0 => "0", 1 => "geen persprogrammas gevonden!");
    }
    
    $response["status"] = "succes";
}; 
    
echo json_encode($response);

$conn->close();
?>