var vatenData = {}
var reloadVatenInterval = ""
var reloadLogboekInterval = ""
var logboekData = {}
var apiUrl = "http://192.168.137.4:8050/live-overzicht/"

// waits for the app to be ready to use and then show the main view
window.addEventListener("load", function () {
    console.log("app ready");
    M.AutoInit();
    toonVatenScherm()
})

// this function gets the appcontainer and passes it to the show vaten function
function toonVatenScherm() {
    appContainer = document.getElementById("appContainer")
    showVaten(appContainer)
}

// this functio gets the appContainer empties it
// adds a header with text "Overzicht vaten" and a preloader to the container
// then it passes the container to the function showLogbook
function toonLogboekScherm() {
    appContainer = document.getElementById("appContainer")
    appContainer.innerHTML = createHeader("Overzicht vaten", "header")
    appContainer.innerHTML += createPreloader("preloader1")
    showLogboek(appContainer)
}

// retrieves all the vats from the server and shows it in the overview screen
// appContainer parameter (HTML object) (mandetory): the container where all the elements will be shown
async function showVaten(appContainer) {
    try {
        appContainer.innerHTML = createHeader("Overzicht vaten", "header")
        appContainer.innerHTML += createPreloader("preloader1")
        reloadVatenInterval = setInterval(function () { reloadVaten(appContainer) }, 5000)
        const response = await loadData(apiUrl + "getVatenData.php")
        removeEl(document.getElementById("preloader1"))
        response.forEach(vat => {
            appContainer.innerHTML += createVatCard("vat" + vat["vat_id"], vat)
        })

        actieveVaten = document.getElementsByClassName("activeVatCard")
        for (i = 0; i < actieveVaten.length; i++) {
            (function () {
                var element = actieveVaten[i]
                element.addEventListener("click", function () {
                    showLogboek(appContainer, element.dataset.logboekid)
                })
            }())
        }
        var elems = document.querySelectorAll('.tooltipped');
        var instances = M.Tooltip.init(elems);
        for (i = 1; i < instances.length; i++) {
            instances[i].destroy()
        }
    } catch (err) {
        clearInterval(reloadVatenInterval);
        console.error(err)
    }
}

// this function reloads and updates the data shown on the overview screen
// appContainer parameter (HTML object) (mandetory): the container where all the overview data is shown
async function reloadVaten(appContainer) {
    try {
        var elems = document.querySelectorAll('.tooltipped');
        var instances = M.Tooltip.init(elems);
        for (i = 1; i < instances.length; i++) {
            instances[i].destroy()
        }
        const response = await loadData(apiUrl + "getVatenData.php")
        appContainer.innerHTML = createHeader("Overzicht vaten", "header")
        response.forEach(vat => {
            appContainer.innerHTML += createVatCard("vat" + vat["vat_id"], vat)
        })

        actieveVaten = document.getElementsByClassName("activeVatCard")
        for (i = 0; i < actieveVaten.length; i++) {
            (function () {
                var element = actieveVaten[i]
                element.addEventListener("click", function () { showLogboek(appContainer, element.dataset.logboekid) })
            }())
        }
        var elems = document.querySelectorAll('.tooltipped');
        var instances = M.Tooltip.init(elems);
    } catch (err) {
        console.error(err)
    }
}

// this function loads and shows all the data of a given logbook
// appContainer parameter (HTML object) (mandetory): the container wher all the elements will be shown
// logboekId parameter (int) (mandetory): the id of the requested logbook
async function showLogboek(appContainer, logboekId) {
    try {
        var elems = document.querySelectorAll('.tooltipped');
        var instances = M.Tooltip.init(elems);
        for (i = 1; i < instances.length; i++) {
            instances[i].destroy()
        }
        clearInterval(reloadVatenInterval);
        appContainer.innerHTML = createHeader("Logboek", "header")
        appContainer.innerHTML += createButton("toHomeButton", "Ga naar overzicht")
        appContainer.innerHTML += createPreloader("preloader1")
        document.getElementById("toHomeButton").addEventListener("click", function () {
            clearInterval(reloadLogboekInterval)
            showVaten(appContainer)
        })
        var params = new FormData;
        params.append("logboekId", logboekId)
        const response = await loadData(apiUrl + "getLogboekData.php", params)
        console.log(response);
        logboekData = response
        appContainer.innerHTML += createButton("stopFermentatie", "Stop fermentatie")
        appContainer.innerHTML += createButton("metingToevoegen", "Voeg meting toe")
        appContainer.innerHTML += createButton("downloadCSV", "Download als CSV")
        appContainer.appendChild(createModal("logboekModal"))
        initMaterialize()
        vatId = response.logboek.vat_id
        reloadLogboekInterval = setInterval(function () { reloadLogboek(appContainer, logboekId) }, 5000)
        var xTijd, yTemp, yEthanol, yCO2
        removeEl(document.getElementById("preloader1"))
        response.metingen.forEach(sensor => {
            if (sensor.metingen == null) {
                var metingen = [0]
                var tijdstippen = [response.logboek.aanmaak_datum]
                var laatsteMeting = 0
            } else {
                var metingen = Object.values(sensor.metingen)
                var tijdstippen = Object.keys(sensor.metingen)
                var laatsteMeting = metingen[metingen.length - 1]
            }
            switch (sensor.naam) {
                case "temp":
                    yTemp = metingen
                    break;
                case "ethanol":
                    yEthanol = metingen
                    break;
                case "co2":
                    yCO2 = metingen
                    break;
                default:
            }
            xTijd = tijdstippen
            appContainer.innerHTML += createKpi(
                "sensor-" + sensor.sensor_id,
                laatsteMeting,
                sensor.naam,
                sensor.eenheid
            )
        })
        tijdbezig = Math.round((new Date - new Date(response.logboek.aanmaak_datum)) / 1000 / 60 / 60)
        appContainer.innerHTML += createKpi("kpi-duur", tijdbezig, "Tijd bezig", "u")
        appContainer.appendChild(createFiller(2,2, "hide-on-med-and-down"))
        appContainer.appendChild(createGraph("grafiek1", xTijd, yTemp, yEthanol, yCO2))
        appContainer.appendChild(createEvents("eventsDiv", response.events))
        var elems = document.querySelectorAll('.tooltipped');
        var instances = M.Tooltip.init(elems);
        document.getElementById("toHomeButton").addEventListener("click", function () {
            clearInterval(reloadLogboekInterval);
            showVaten(appContainer)
        })
        document.getElementById("stopFermentatie").addEventListener("click", async function () {
            try {
                clearInterval(reloadLogboekInterval);
                var params = new FormData;
                params.append("vatId", vatId)
                params.append("logboekId", logboekId)
                const response = await sendData(apiUrl + "stopVatEnEindigLogboek.php", params);
                showVaten(appContainer)
                stopFermentatie(vatId, logboekId)
            } catch (err) {
                console.error(err);
            }
        })
        document.getElementById("metingToevoegen").addEventListener("click", function () {
            openMetingFormulier(response.metingen, response.logboek.logboek_id, document.getElementById("logboekModal"), document.getElementById("content-logboekModal"), appContainer)
        })
        document.getElementById("downloadCSV").addEventListener("click", function () { CreateCSV(logboekData) })
    } catch (err) {
        console.error(err)
    }
}

// async function that update the data that is shown on the logboek page.
// appContainer parameter (HTML object) (mandetory): the container where all the updateble data is situated
// logboekId parameter (int) (mandetory): the id of the logbook which data has to be retrieved
async function reloadLogboek(appContainer, logboekId) {
    var elems = document.querySelectorAll('.tooltipped');
    var instances = M.Tooltip.init(elems);
    for (i = 1; i < instances.length; i++) {
        instances[i].destroy()
    }
    kpiEls = document.getElementsByClassName("kpi-container")
    graphEls = document.getElementsByClassName("graph-container")
    var params = new FormData;
    params.append("logboekId", logboekId)
    const response = await loadData(apiUrl + "getLogboekData.php", params)
    logboekData = response
    var xTijd, yTemp, yEthanol, yCO2

    response.metingen.forEach(sensor => {
        if (sensor.metingen == null) {
            var metingen = [0]
            var tijdstippen = [response.logboek.aanmaak_datum]
            var laatsteMeting = 0
        } else {
            var metingen = Object.values(sensor.metingen)
            var tijdstippen = Object.keys(sensor.metingen)
            var laatsteMeting = metingen[metingen.length - 1]
        }
        switch (sensor.naam) {
            case "temp":
                yTemp = metingen
                break;
            case "ethanol":
                yEthanol = metingen
                break;
            case "co2":
                yCO2 = metingen
                break;
            default:
        }
        xTijd = tijdstippen
        for (let i = 0; i < kpiEls.length; i++) {
            if ("sensor-" + sensor.sensor_id == kpiEls[i].id) {
                kpiEls[i].children[0].children[1].innerHTML = laatsteMeting + " " + sensor.eenheid
            } else {
                if (kpiEls[i].id == "kpi-duur") {
                    kpiEls[i].children[0].children[1].innerHTML = tijdbezig + " u"
                }
            }
        }
        tijdbezig = Math.round((new Date - new Date(response.logboek.aanmaak_datum)) / 1000 / 60 / 60)
        removeEl(document.getElementById("grafiek1"))
        appContainer.appendChild(createGraph("grafiek1", xTijd, yTemp, yEthanol, yCO2))
        removeEl(document.getElementById("eventsDiv"))
        appContainer.appendChild(createEvents("eventsDiv", response.events))
        var elems = document.querySelectorAll('.tooltipped');
        var instances = M.Tooltip.init(elems);
    })
}

// this function is used to retrieve data from the server. 
// url parameter (string) (mandetory): is the url where the api file is situated
// params parameter (FormData) (optional): are the parameters you want to pass to the server
function loadData(url, params = null) {
    return new Promise((resolve, reject) => {
        var xmlhttp = new XMLHttpRequest()
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var response = this.responseText;
                response = JSON.parse(response)
                if (response["status"] == "succes") {
                    resolve(response["answer"])
                } else {
                    reject(response["error-message"])
                }
            }
        };
        xmlhttp.open("POST", url, true);
        if (params == null) {
            xmlhttp.send();
        }
        else {
            xmlhttp.send(params)
        }
    })
}

// this function is used to send data to the server and to retrieve a succes or an error of the action from the server
// url parameter (string) (mandetory): is the url where the api file is situated
// params parameter (FormData) (mandetory): are the parameters you want to pass to the server
function sendData(url, params = null) {
    return new Promise((resolve, reject) => {
        if (params != null) {
            var xmlhttp = new XMLHttpRequest()
            xmlhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    var response = this.responseText;
                    response = JSON.parse(response)
                    if (response["status"] == "succes") {
                        resolve(response["status"])
                    } else {
                        reject(response["error-message"])
                    }
                }
            };
            xmlhttp.open("POST", url, true);
            xmlhttp.send(params)
        }
    })
}

// function to remove an element and all it's children from the application
// element parameter (string) (mandetory): the id of the element you want to delete
function removeEl(element) {
    element.parentNode.removeChild(element);
}

// the function to stop and archive a active fermentation process
// vatId parameter (int) (mandetory): the id of the vat that has to be shut down
// logboekId parameter (int) (mandetory): the id of the logbook that has to be archived
async function stopFermentatie(vatId, logboekId) {
    try {
        clearInterval(reloadLogboekInterval);
        var params = new FormData;
        params.append("vatId", vatId)
        params.append("logboekId", logboekId)
        const response = await sendData(apiUrl + "stopFermentatie.php", params)
        M.toast({ html: response })
    } catch (err) {
        console.error(err)
        M.toast({ html: err })
    }
}

// this opens the modal where the user can put his manual data
// sensoren parameter (array) (mandetory): all the sensors that are attached to this process
// logboekId parameter (int) (mandetory): the id of the logbook where the added data has to be attached to
// modalContainer parameter (HTML object) (mandetory): the modal that has to be opened
// modalContent parameter (HTML object) (mandetory): the modal where all the input fields have to be added at
// appContainer parameter (HTML object) (mandetory): the container where all the data is shown in
function openMetingFormulier(sensoren, logboekId, modalContainer, modalContent, appContainer) {
    modalContent.innerHTML = ""
    modalContent.append(createHMetingFormulier("metingFormulier", sensoren))
    const instance = M.Modal.init(modalContainer, { dismissible: true });
    instance.open()
    document.getElementById("verzendButton").addEventListener("click", function () { verzendHandmeting(sensoren, logboekId, instance, appContainer) })

}

// this function read all the inputs and and prepares them to be send to the server
// sensoren parameter (array) (mandetory): all the sensors that are attached to the logbook and vat
// logbookId parameter (int) (mandetory): the id of the logbook where the data has to be added to
// modal parameter (HTML object) (mandetory): the modal that has to be closed
// appContainer parameter (HTML object) (mandetory): the container wher all the comonent in exist 
function verzendHandmeting(sensoren, logboekId, modal, appContainer) {
    sensorenData = {}
    sensoren.forEach(sensor => {
        sensorenData[sensor.sensor_id] = parseFloat(document.getElementById("input-sensor-" + sensor.sensor_id).value).toFixed(sensor.kommagetal)
    })
    sensorenData = JSON.stringify(sensorenData);
    var params = new FormData;
    params.append("sensorenData", sensorenData)
    modal.close()
    verstuurHandmetingData(params, appContainer, logboekId)
}

// this function sends the manual data to the server
// params parameter (FormData) (mandetory): all the data that has to be send to the server
// appContainer parameter (HTML object) (mandetory): the container wher all the component exist in
// logboekId parameter (int) (mandetory): the id of the logbook which you want to show after the data is added
async function verstuurHandmetingData(params, appContainer, logboekId) {
    try {
        const response = await sendData(apiUrl + "insertHandmeting.php", params)
        if (response == "succes") {
            reloadLogboek(appContainer, logboekId)
            console.log("Gelukt!")
        }
    } catch (err) {
        console.error(err)
    }
}

// initializes all the materialize components
function initMaterialize() {
    M.AutoInit()
}

// function to extract the current logbook his data as a CSV file (, seperated)
// logboek parameter (int) (mendatory): contains the id of the logbook where the user wants the data from
function CreateCSV(logboek) {
    console.log(logboek);
    var header = [["sensor", "meting tijdstip", "meetwaarde", "eenheid"]]
    var inhoud = []
    logboek.metingen.forEach(sensor => {
        var metingen = Object.values(sensor.metingen)
        var tijdstippen = Object.keys(sensor.metingen)
        for (let i = 0; i < metingen.length; i++) {
            inhoud.push([sensor.naam, tijdstippen[i], metingen[i], sensor.eenheid])
        }
    })
    let CSVContent = "data:text/csv;charset=utf-8,"
        + header.map(e => e.join(",")).join("\n")
        + "\n"
        + inhoud.map(e => e.join(",")).join("\n");

    var encodedUri = encodeURI(CSVContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", logboek.logboek.label + "_" + logboek.logboek.aanmaak_datum + ".csv");
    document.body.appendChild(link); // Required for FF
    link.click();
}
