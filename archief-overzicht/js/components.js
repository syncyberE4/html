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
    component = document.createElement("div")
    component.className = "preloader-container"
    component.id = id
    wrapper = document.createElement("div")
    wrapper.className = "preloader-wrapper active"
    spinner = document.createElement("div")
    spinner.className = "spinner-layer spinner-blue-only"
    circle = document.createElement("div")
    circle.className = "circle"
    gap_patch = document.createElement("div")
    gap_patch.className = "gap-patch"
    circle_clipper_left = document.createElement("div")
    circle_clipper_left.className = "circle-clipper left"    
    circle_clipper_right = document.createElement("div")
    circle_clipper_right.className = "circle-clipper right"
    circle_clipper_left.appendChild(circle)
    circle = document.createElement("div")
    circle.className = "circle"
    circle_clipper_right.appendChild(circle)
    circle = document.createElement("div")
    circle.className = "circle"
    gap_patch.appendChild(circle)
    spinner.appendChild(circle_clipper_left)
    spinner.appendChild(gap_patch)
    spinner.appendChild(circle_clipper_right)
    wrapper.appendChild(spinner)
    component.appendChild(wrapper)

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

function createDropdown(id, data, defaultOption) {    
    component = document.createElement("div")
    component.className = "input_field modal-select"
    component.id = id
    select = document.createElement("select")
    select.className = "browser-default"
    option = document.createElement("option")
    option.innerHTML = defaultOption
    option.setAttribute("selected", "")
    option.value = "%"
    select.appendChild(option)
    data.forEach(item => {
        option = document.createElement("option")
        option.innerHTML = item[1]
        option.disabled = false
        option.selected = false
        option.value = item[0]
        select.appendChild(option)
    });
    component.appendChild(select)
    
    return component
}

function createDateTimePicker(id, voorOfNa) {
    component = document.createElement("input")
    component.className = "datepicker modal-date"
    component.type = "text"
    component.id = id
    if(voorOfNa == "na") {
        component.placeholder = "na deze datum"
    } else {
        component.placeholder = "voor deze datum"
    }
    return component
}

function createLogboekTable(id, logboeken) {
    console.log(logboeken);
    
    component = document.createElement("table")
    component.id = id
    component.className = "highlight"
    head = document.createElement("thead")
    row = document.createElement("tr")
    column = document.createElement("th")
    column.innerHTML = "Logboek nr."
    row.appendChild(column)
    column = document.createElement("th")
    column.innerHTML = "Aanmaak datum"
    row.appendChild(column)
    head.appendChild(row)
    component.appendChild(head)
    body = document.createElement("tbody")
    logboeken.forEach(logboek => {
        row = document.createElement("tr")
        row.className = "logboekRow"
        row.dataset.logboekid = logboek.archief_logboek_id
        column = document.createElement("td")
        column.innerHTML = logboek.archief_logboek_id
        row.appendChild(column)
        column = document.createElement("td")
        column.innerHTML = logboek.aanmaak_datum
        row.appendChild(column)
        body.appendChild(row)
    });
    component.appendChild(body)

    return component
}