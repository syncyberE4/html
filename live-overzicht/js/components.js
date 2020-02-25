function createHeader(titel, id) {
    component = `
    <div class="header-container" id="` + id + `">
        <div class="header">
            <p class="header-text">` + titel + `</p>
        </div>
    </div>`
    return component
}

function createPreloader(id) {
    component = `
    <div class="preloader-container" id="` + id + `">
        <div class="preloader-wrapper active">
            <div class="spinner-layer spinner-blue-only">
                <div class="circle-clipper left">
                    <div class="circle"></div>
                </div>
                <div class="gap-patch">
                    <div class="circle"></div>
                </div>
                <div class="circle-clipper right">
                    <div class="circle"></div>
                </div>
            </div>
        </div>
    </div>`

    return component
}

function createVatCard(id, vatData) {    
    tijdBezig = null
    // convert start datum to javascript datetime
    if(vatData.aanmaak_datum != null) {
        vatData.aanmaak_datum = vatData.aanmaak_datum.split(" ")
        vatData.aanmaak_datum = Date.parse(vatData.aanmaak_datum[0] + "T" + vatData.aanmaak_datum[1])
        tijdBezig = Math.floor(Math.abs(vatData.aanmaak_datum - new Date()) / 36e5)
    }

    // event div maken
    eventsDiv = `<div class="events-div">`
    if(vatData.events.length > 0) {
        vatData.events.reverse().forEach(event => {            
            if(event.bevestig == 1) {
                eventsDiv += '<p class="event bevestigt tooltipped" data-position="top" data-tooltip="' + event.aanmaak_datum + '">' + event.boodschap + '</p>'
            } else {
                eventsDiv += '<p class="event niet-bevestigt tooltipped" data-position="top" data-tooltip="' + event.aanmaak_datum + '">' + event.boodschap + '</p>'
            }
        })
    }
    eventsDiv += `</div>`
    

    
    if(vatData.beschikbaar == 0){
        component = `
        <div class="vatCard-container vatCard-actief" id="` + id + `">
            <div class="vatCard hoverable activeVatCard" data-logboekid="` + vatData.logboek_id + `">
                <p class="vatLabel">` + vatData.label + `</p>
                <div class="divider"></div>
                <p>Locatie: ` + vatData.locatie + `</p>
                <div class="divider"></div>
                <p>Volume: ` + vatData.volume + `L</p>
                <div class="divider"></div>
                <p>Events:</p>
                ` + eventsDiv + `
                <div class="divider"></div>
            </div>
        </div>`
    } else {
        component = `
        <div class="vatCard-container" id="` + id + `">
            <div class="vatCard blue lighten-2">
            <p class="vatLabel">` + vatData.label + `</p>
            <div class="divider"></div>
            <p>Locatie: ` + vatData.locatie + `</p>
            <div class="divider"></div>
            <p>Volume: ` + vatData.volume + `L</p>
            <div class="divider"></div>
            </div>
        </div>`
    }

    return component
}

function createKpi(id, waarde, titel, eenheid) {
    component = `
        <div class="kpi-container" id="` + id + `">
            <div class="kpi">
                <p class="kpi-titel">` + titel + `</p>
                <p class="kpi-waarde">` + waarde + " " + eenheid + `</p>
            </div>
        </div>`

    return component
}

function createButton(id, buttonText) {
    component = `
    <div class="button-container" id="` + id + `">
        <div class="button hoverable">` + buttonText + `</div>
    </div>`

    return component 
}

function createGraph(id, xTijd, yTemp, yEthanol, yCO2) {
    var graphContainer = document.createElement("div")
    graphContainer.className += "graph-container"
    graphContainer.id = id
    var graphDiv = document.createElement("div")
    graphDiv.className += "graph"
    graphDiv.id = "div-" + id
    var ctx = document.createElement("CANVAS")
    ctx.className = "graph-canvas"
    ctx.id = id + "-canvas"
    var myLineChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: xTijd,
          datasets: [{ 
              data: yTemp,
              label: "Temp",
              borderColor: "#e02a2a",
              fill: false
            }, { 
              data: yEthanol,
              label: "Ethanol",
              borderColor: "#2a7fe0",
              fill: false
            }, { 
              data: yCO2,
              label: "CO2",
              borderColor: "#3cba9f",
              fill: false
            }
          ]
        },
        options: {
            maintainAspectRatio: false,
        }
      });
    graphDiv.appendChild(ctx)
    graphContainer.appendChild(graphDiv)
    component = graphContainer

    return component
}

function createModal(id) {
    var modalContainer = document.createElement("div")
    modalContainer.className = "modal"
    modalContainer.id = id
    var modalContent = document.createElement("div")
    modalContent.className = "modal-content"
    modalContent.id = "content-" + id
    modalContainer.appendChild(modalContent)
    component = modalContainer
    return component
}

function createHMetingFormulier(id, sensoren) {
    var formulierContainer = document.createElement("div")
    formulierContainer.id = id
    formulierContainer.className = "formulier-container"

    sensoren.forEach(sensor => {
        var inputContainer = document.createElement("div")
        inputContainer.id = sensor.sensor_id
        inputContainer.className = "input-field"
        var input = document.createElement("input")
        input.id = "input-sensor-" + sensor.sensor_id
        input.type = "number"
        input.min = "0"
        var label = document.createElement("label")
        label.for = "input-sensor-" + sensor.sensor_id
        label.innerHTML = sensor.naam
        inputContainer.append(input)
        inputContainer.append(label)
        formulierContainer.append(inputContainer)
    })

    var verzendButton = document.createElement("div")
    verzendButton.id = "verzendButton"
    verzendButton.className = "buttonFormulier hoverable valign-wrapper"
    var verzendButtonText = document.createElement("p")
    verzendButtonText.innerHTML = "Verzend"
    verzendButtonText.className = "buttonText"
    verzendButton.append(verzendButtonText)

    formulierContainer.append(verzendButton)
    return formulierContainer
}

function createFiller(ncols, nrows, showOn) {
    var component = document.createElement("div")
    component.className = showOn
    component.style.gridRow = "auto / span " + nrows
    component.style.gridColumn = "auto / span " + ncols
    return component
}

function createEvents(id, events) {       
    component = document.createElement("div")
    component.className = "events-container"
    component.id = id
    // event div maken
    content = document.createElement("div")
    content.className = "events"
    if(events.length > 0) {
        events.reverse().forEach(event => {  
            eventItem = document.createElement("p")    
            if(event.bevestig == 1) {
                eventItem.className = "event bevestigt tooltipped"
            } else {
                eventItem.className = "event niet-bevestigt tooltipped"
            }
            eventItem.dataset.position = "top"
            eventItem.dataset.tooltip = event.aanmaak_datum
            eventItem.innerHTML = event.boodschap
            content.appendChild(eventItem)
        })
    }
    component.appendChild(content)
    return component
}