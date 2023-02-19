var layerGroup = L.layerGroup([ ]);

export function formatLogDate(options) {
    if (!options["format"])
        throw "No format was specified"
    
    if(options["format"] == "ISO" && options["date"] && options["time"])
        return options["date"].slice(0, 4) + "-" + options["date"].slice(4, 6) + "-" + options["date"].slice(6) + " " + options["time"].slice(0, 2) + ":" + options["time"].slice(2, 4) + ":" + options["time"].slice(4) + "+00"
    if(options["format"] == "UK" && options["date"] && options["time"])
        return options["date"].slice(6) + "/" + options["date"].slice(4, 6) + "/" + options["date"].slice(0, 4) + " " + options["time"].slice(0, 2) + ":" + options["time"].slice(2, 4) + ":" + options["time"].slice(4)
}

export function calculateDistance(fromGrid, toGrid){
    var pos1 = gridToCoord(fromGrid)
    var pos2 = gridToCoord(toGrid)
    
    var p = 0.017453292519943295;    // Math.PI / 180
    var c = Math.cos;
    var a = 0.5 - c((pos2[0] - pos1[0]) * p)/2 + 
    c(pos1[0] * p) * c(pos2[0] * p) * 
    (1 - c((pos2[1] - pos1[1]) * p))/2;

    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

export function getFurthestQSO(qth, logs) {
    var furthestDistance = 0
    var furthestStation = null
    
    logs.forEach((log) => {
        var dist = calculateDistance(qth, log["GRIDSQUARE"])
        
        if (dist > furthestDistance) {
            furthestDistance = dist
            furthestStation = log["CALL"]
        }
    })

    return { distance: furthestDistance, station: furthestStation }
}

export function generateMap(map, pathLines, setAttributes, logs, qth, myCall, myGrid, showHeat, showLines, editMode=false) {
    console.log("Generating Map...")

    if (map) {
        map.off()
        map.remove()
    }

    if (pathLines.length > 0) {
        hideLines(pathLines, map)
        pathLines = []
    }
    
    if (logs.length == 0) {
        console.error("No logs!")
        return
    }

    map = L.map('qsomap', {
        fullscreenControl: true,
        fullscreenControlOptions: {
          position: 'topleft'
        }
    }).setView([qth['latitude'], qth['longitude']], 13)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    
    var bounds = []
    var heat = []
    qth['marker'] = L.marker([qth['latitude'], qth['longitude']], 
        { 
            title: myCall + "\r\n" + myGrid,
            draggable: true,
            icon: L.icon.pulse()
        }).addTo(map);

    logs.forEach((log) => {
        var grid = log['GRIDSQUARE']// ?? getGridsquareFromCallsign(log['CALL']) // TODO: Fix this
        if (grid && grid != 'null') {
            var coords = gridToCoord(grid)
            var dateStr = log['QSO_DATE']
            var timeStr = log['TIME_ON']
            var dateTimeStr = formatLogDate({date: dateStr, time:timeStr, format: "ISO"})

            L.marker(coords, { title: log['CALL'] + "\r\n" + log['MODE'] + "\r\n" + log['FREQ'] + "MHz", time: timeStr }).bindPopup(log['CALL'] + "\r\n" + log['MODE'] + "\r\n" + log['FREQ'] + "MHz", {autoClose: false, closeOnClick: false}).addTo(layerGroup)
            
            bounds.push(coords)
            if (showHeat)
                heat.push(coords)
            generateCurve(map, pathLines, [qth['latitude'], qth['longitude']], coords, log['MODE'], log['BAND'], showLines)
        }
    })

    map.fitBounds(bounds)    

    if (showHeat)
        var heatmap = L.heatLayer(heat, {blur:25, radius: 25, maxZoom: 8}).addTo(map)

        layerGroup.addTo(map)
        var sliderControl = L.control.sliderControl({position: "bottomright", layer: layerGroup, timeAttribute: "time",
        isEpoch: false,
        range: true});
        // sliderControl.addTo(map)
        //map.addControl(sliderControl)
    
        //sliderControl.startSlider()

    var furthestQSO = getFurthestQSO(myGrid, logs)
    setAttributes({ furthestQSODistance: furthestQSO['distance'], furthestQSOStation: furthestQSO['station'] })
    
    return { qth: qth, map: map, heatmap: heatmap, qsoBounds: map.getBounds() }
}

export async function getGridsquareFromCallsign(callsign) {
    return await fetch('https://api.g7vrd.co.uk/v1/locators/by-callsign/' + callsign, { mode: 'no-cors' }).then(response => {return response.json()})
}

export function zoomToQTH(map, qthMarker){
    console.log("Zooming to QTH...")
    map.flyTo(qthMarker.getLatLng(), 15)
}

export function zoomToGrid(map, grid){
    console.log("Zooming to Grid...")
    var latlng = gridToCoord(grid)
    map.flyTo({lat: latlng[0], lng: latlng[1]}, 15)
}

export function zoomToBounds(map, qsoBounds) {
    console.log("Zooming to Bounds...")
    map.flyToBounds(qsoBounds)
}

export function playQSOOrder() {

}

export function calculateMidpoint(latlng1, latlng2) {
    var coord1 = latlng1[1] > latlng2[1] ? latlng2 : latlng1
    var coord2 = latlng1[1] > latlng2[1] ? latlng1 : latlng2
    
var offsetX = coord2[1] - coord1[1],
	offsetY = coord2[0] - coord1[0];

var r = Math.sqrt( Math.pow(offsetX, 2) + Math.pow(offsetY, 2) ),
	theta = Math.atan2(offsetY, offsetX);


var thetaOffset = (3.14/10);

var r2 = (r/2)/(Math.cos(thetaOffset)),
	theta2 = theta + thetaOffset;

var midpointX = (r2 * Math.cos(theta2)) + parseFloat(coord1[1]),
	midpointY = (r2 * Math.sin(theta2)) + parseFloat(coord1[0])

    return [midpointY, midpointX]
}

export function generateCurve(map, pathLines, latlng1, latlng2, mode, band, show) {
var midpointLatLng = calculateMidpoint(latlng1, latlng2)

    var line = L.curve(
	[ 'M',
		latlng2,
    'Q',
        midpointLatLng,
        latlng1
	], 
    {
        color: bandToColour(band),
        weight: 1, 
        dashArray: 4,
        dashSpeed: 15,
    })
    if (show)
        line.addTo(map);

    pathLines.push(line)
}

export function bandToColour(band){
    switch(band) {
        /* SHF */
        case "6cm":
            return ''
        case "9cm":
            return ''
        case "13cm":
            return ''
        case "23cm":
            return ''
        
        /* UHF */
        case "70cm":
            return 'green'
        
        /* VHF */
        case "2m":
            return 'blue'
        case "4m":
            return ''
        case "6m":
            return ''

        /* HF */
        case "10m":
            return ''
        case "12m":
            return ''
        case "15m":
            return ''
        case "17m":
            return ''
        case "20m":
            return 'red'
        case "30m":
            return 'red'
        case "40m":
            return 'magenta'
        
        /* Unknown */
        default:
            return 'black'
    }
}

export function gridToCoord(grid) {
    var sanitisedGrid = sanitiseGrid(grid)

    if (!sanitisedGrid)
        return [0, 0]

    var lat = (((sanitisedGrid.charCodeAt(1) - 65) * 10) + parseInt(sanitisedGrid.charAt(3)) + (((sanitisedGrid.charCodeAt(5) - 97) / 24) + (1/48))) - 90
    var lon = (((sanitisedGrid.charCodeAt(0) - 65) * 20) + (parseInt(sanitisedGrid.charAt(2)) * 2) + (((sanitisedGrid.charCodeAt(4) - 97) / 12) + (1/24))) - 180

    return [lat, lon]
}

function hideLines(pathLines, map) {
    pathLines.forEach((line) => line.remove(map))
}

export function sanitiseGrid(grid) {
    if (!grid)
        return null
    
    if(grid.length == 4)
        grid = grid + "aa"

    var sanitisedGrid = grid.charAt(0).toUpperCase() + 
                        grid.charAt(1).toUpperCase() + 
                        parseInt(grid.charAt(2)).toString() +
                        parseInt(grid.charAt(3)).toString() +
                        grid.charAt(4).toLowerCase() + 
                        grid.charAt(5).toLowerCase()

    return sanitisedGrid
}

export function coordsToGrid(latitude, longitude) {
    latitude = parseFloat(latitude)
    longitude = parseFloat(longitude)

    if (latitude >= 90 || latitude < -90)
        throw new Error("Latitude must be between -90 and 90")
    if (longitude >= 180 || longitude < -180)
        throw new Error("Longitude must be between -180 and 180")

    var lat = latitude + 90.0
    var long = longitude + 180.0
    var square = String.fromCharCode(Math.trunc(long / 20) + 65)
    square += String.fromCharCode(Math.trunc(lat / 10) + 65)
    square += Math.trunc((long / 2) % 10).toString()
    square += Math.trunc(lat % 10).toString()

    var longrem = (long - Math.trunc(long / 2) * 2) * 60
    var latrem = (lat - Math.trunc(lat)) * 60
    square += String.fromCharCode(Math.trunc(longrem / 5) + 97)
    square += String.fromCharCode(Math.trunc(latrem / 2.5)  + 97)

    return square;
}

export function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

export function getNumberOfGridsquares(logs) {
    var gridsquares = []

    logs.forEach((log) => {
        if (!gridsquares.includes(log["GRIDSQUARE"].slice(0,4)))
            gridsquares.push(log["GRIDSQUARE"].slice(0,4))
    })

    return gridsquares.length
}