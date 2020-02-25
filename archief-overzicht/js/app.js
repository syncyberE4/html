var vatenData = {}
var reloadVatenInterval = ""
var reloadLogboekInterval = ""
var logboekData = {}
var apiUrl = "http://192.168.0.10:8051/api/"

window.addEventListener("load", function () {
    console.log("app ready");
    init()
})

function init() {
    appContainer = document.getElementById("appContainer")
    showFilterModal(appContainer, false)
}

async function showFilterModal(appContainer, dismisable) {
    try {
        appContainer.appendChild(createModal("filterModal"))
        filterModal = document.getElementById("filterModal")
        filterModal.innerHTML = '<h3 class="filterModalHeader">Zoek een logboek</h3>'
        filterModal.appendChild(createPreloader("preloaderFilter"))
        var instance = M.Modal.init(filterModal, { dismissible: dismisable });
        instance.open()
        var response = await loadData(apiUrl + "getFilterData.php")
        removeEl(document.getElementById("preloaderFilter"))
        filterModal.append(createDropdown("vatSelect", response.vaten, "Alle vaten"))
        filterModal.append(createDropdown("druivenSelect", response.druiven, "Alle druiven soorten"))
        filterModal.append(createDropdown("wijnsoortenSelect", response.wijnsoorten, "Alle wijnsoorten"))
        filterModal.append(createDropdown("persprogrammas", response.persprogrammas, "Alle persprogrammas"))
        filterModal.append(createDateTimePicker("dateTimeLater", "na"))
        filterModal.append(createDateTimePicker("dateTimeEerder", "voor"))
        var elems = document.querySelectorAll('.datepicker');
        var instances = M.Datepicker.init(elems, {"format":"yyyy-mm-dd"});
        document.getElementById("vatSelect").addEventListener("change", () => {
            removeEl(document.getElementById("logboekTable"))
            listLogboeken(filterModal)
        })
        document.getElementById("druivenSelect").addEventListener("change", () => {
            removeEl(document.getElementById("logboekTable"))
            listLogboeken(filterModal)
        })
        document.getElementById("wijnsoortenSelect").addEventListener("change", () => {
            removeEl(document.getElementById("logboekTable"))
            listLogboeken(filterModal)
        })
        document.getElementById("persprogrammas").addEventListener("change", () => {
            removeEl(document.getElementById("logboekTable"))
            listLogboeken(filterModal)
        })
        document.getElementById("dateTimeLater").addEventListener("change", () => {
            removeEl(document.getElementById("logboekTable"))
            listLogboeken(filterModal)
        })
        document.getElementById("dateTimeEerder").addEventListener("change", () => {
            removeEl(document.getElementById("logboekTable"))
            listLogboeken(filterModal)
        })
        listLogboeken(filterModal)
    } catch (err) {
        console.error(err);
    }

}

async function listLogboeken(filterModal) {
    try {
        var params = new FormData;
        vatSelect = document.getElementById("vatSelect")
        persSelect = document.getElementById("persprogrammas")
        druifSelect = document.getElementById("druivenSelect")
        wijnsoortSelect = document.getElementById("wijnsoortenSelect")
        naDate = document.getElementById("dateTimeLater")
        voorDate = document.getElementById("dateTimeEerder")
        params.append("vatId", vatSelect.firstChild.options[vatSelect.firstChild.selectedIndex].value)
        params.append("persId", persSelect.firstChild.options[persSelect.firstChild.selectedIndex].value)
        params.append("druifId", druifSelect.firstChild.options[druifSelect.firstChild.selectedIndex].value)
        params.append("wijnsoortId", wijnsoortSelect.firstChild.options[wijnsoortSelect.firstChild.selectedIndex].value)
        if(naDate.value == "") {
            params.append("naDate", "0001-01-01 00:00:00")
        } else {
            params.append("naDate", naDate.value + " 00:00:00")
        }
        if(voorDate.value == "") {
            params.append("voorDate", "9999-01-01 00:00:00")
        } else {
            params.append("voorDate", voorDate.value + " 00:00:00")
        }
        console.log(voorDate.value);

        var response = await loadData(apiUrl + "haalLogboekenOp.php", params)
        console.log(response);
        filterModal.appendChild(createLogboekTable("logboekTable", response))
        rows = document.getElementsByClassName("logboekRow")
        for (i = 0; i < rows.length; i++) {
            (function () {
                var element = rows[i]
                element.addEventListener("click", function () {
                    showLogboek(appContainer, element.dataset.logboekid)
                })
            }())
        }
    } catch (err) {
        console.error(err);
        filterModal.appendChild(createLogboekTable("logboekTable", [{ "archief_logboek_id": "niets gevonden", "aanmaak_datum": "" }]))
    }
}

async function showLogboek(appContainer, logboekId) {
    try {
        appContainer.innerHTML = createHeader("Logboek", "header")
        appContainer.appendChild(createPreloader("preloader1"))
        var params = new FormData;
        params.append("logboekId", logboekId)
        const response = await loadData(apiUrl + "getLogboekData.php", params)
        console.log(response);
        logboekData = response
        appContainer.innerHTML += createButton("openFilterModal", "Zoek Logboek")
        appContainer.innerHTML += createButton("downloadCSV", "Download als CSV")
        appContainer.appendChild(createFiller(2, 1, "hide-on-med-and-down"))
        vatId = response.logboek.vat_id
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
        tijdbezig = Math.round((new Date(response.logboek.eind_datum) - new Date(response.logboek.aanmaak_datum)) / 1000 / 60 / 60)
        appContainer.innerHTML += createKpi("kpi-duur", tijdbezig, "Tijd bezig", "u")
        appContainer.appendChild(createFiller(2, 2, "hide-on-med-and-down"))
        appContainer.appendChild(createGraph("grafiek1", xTijd, yTemp, yEthanol, yCO2))
        appContainer.appendChild(createEvents("eventsDiv", response.events))
        document.getElementById("downloadCSV").addEventListener("click", function () { 
            console.log("test");
            
            CreateCSV(logboekData) 
        })
        document.getElementById("openFilterModal").addEventListener("click", function () {
            showFilterModal(appContainer, true)
        })
    } catch (err) {
        console.error(err)
    }
}

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
