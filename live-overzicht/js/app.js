var vatenData = {}
var reloadVatenInterval = ""
var reloadLogboekInterval = ""
var logboekData = {}
var apiUrl = "http://192.168.137.10:8050/api/"

window.addEventListener("load", function () {
    console.log("app ready");
    M.AutoInit();
    toonVatenScherm()
})

function toonVatenScherm() {
    appContainer = document.getElementById("appContainer")
    showVaten(appContainer)
}

function toonLogboekScherm() {
    appContainer = document.getElementById("appContainer")
    appContainer.innerHTML = createHeader("Overzicht vaten", "header")
    appContainer.innerHTML += createPreloader("preloader1")
    showLogboek(appContainer)
}

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
                stopFermentatie(appContainer, vatId, logboekId)
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

// function to load data from the server
// the url parameter is manadatory and refers to where the api file is situated
// the params parameter is manadatory and refers to where the api file is situated
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

function removeEl(element) {
    element.parentNode.removeChild(element);
}

async function stopFermentatie(appContainer, vatId, logboekId) {
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

function openMetingFormulier(sensoren, logboekId, modalContainer, modalContent, appContainer) {
    modalContent.innerHTML = ""
    modalContent.append(createHMetingFormulier("metingFormulier", sensoren))
    const instance = M.Modal.init(modalContainer, { dismissible: true });
    instance.open()
    document.getElementById("verzendButton").addEventListener("click", function () { verzendHandmeting(sensoren, logboekId, instance, appContainer) })

}

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

function initMaterialize() {
    M.AutoInit()
}

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
