import "leaflet.heat"
import "leaflet-path-flow"

const { __ } = wp.i18n
const { registerBlockType } = wp.blocks
const { InspectorControls, useBlockProps } = wp.blockEditor
const { FormFileUpload, Button, PanelBody, ToggleControl, TextControl } = wp.components

var map = null
var qthMarker = null
var pathLines = []
var qsoBounds = []
var loadedMap = false

registerBlockType('m0lxx-qsomap/qsomap', {
    title: __('QSO Map'), // Block name visible to user
    description: 'An ADIF log to QSO map tool by M0LXX',
    icon: 'location', // Toolbar icon can be either using WP Dashicons or custom SVG
    category: 'common', // Under which category the block would appear
    keywords: [
        __('amateur'),
        __('radio'),
        __('qso'),
        __('map'),
        __('mapping')
    ],

    supports: {
        // Turn off ability to edit HTML of block content
        html: false,
        // Turn off reusable block feature
        reusable: false,
        // Add alignwide and alignfull options
        align: false
    },

    attributes: { // The data this block will be storing
        logs: {
            type: 'array',
            default: []
        },
        myCall: {
            type: 'string'
        },
        furthestQSO: {
            type: 'string'
        },
        numberOfQSOs: {
            type: 'string'
        },
        qthGrid: {
          type:'string'  
        },
        originalQthLatitude: {
            type: 'string',
            default: 0
        },
        originalQthLongitude: {
            type: 'string',
            default: 0
        },
        qthLatitude: {
            type: 'string',
            default: 0
        },
        qthLongitude: {
            type: 'string',
            default: 0
        },
        uploading: {
            type: 'boolean',
            default: false
        },
        showHeatmap: {
            type: 'boolean'
        },
        showStatistics: {
            type: 'boolean'
        },
        showLines: {
            type: 'boolean'
        }
    },

    edit: props => {
        // Pull out the props we'll use
        const { attributes, setAttributes } = props

        // Pull out specific attributes for clarity below
        const { 
            originalQthLatitude, originalQthLongitude, qthLatitude, qthLongitude, qthGrid, 
            uploading, 
            showHeatmap, showStatistics, showLines,
            myCall, logs 
        } = attributes
        
        !loadedMap && logs.length > 0 && waitForElm('#qsomap').then(() => { 
            generateMapEdit(logs, qthLatitude, qthLongitude, myCall, qthGrid)


            props.setAttributes({ qsoMap: document.getElementById("qsomap").innerHTML }) 

            qthMarker.on('dragend', () => { 
                var latln = qthMarker.getLatLng()
                updateQTHLocation(latln['lat'], latln['lng'])
                props.setAttributes({ qthLatitude: latln['lat'].toString(), qthLongitude: latln['lng'].toString(), qthGrid: coordsToGrid(latln['lat'], latln['lng']) })
            })
         })

        return (
            <div { ...useBlockProps() }>
                <h3>QSO Map</h3>
                { logs.length == 0 ? 
                <div>
                <p>Upload an ADIF log file or link to a hosted log file with a URL.</p>
                <FormFileUpload
                id="uploadForm"
                accept=".adi,.adif"
                onChange={ ( event ) => { 
                    props.setAttributes({ uploading: true })
                    uploadLogFile(event, props)
                 } }
                render={ ( { openFileDialog } ) => (
                    <div className="inline">
                        <Button 
                        isPrimary 
                        isBusy={ uploading }
                        disabled={ uploading }
                        onClick={ () => openFileDialog() }>
                            { !uploading ? "Upload Log" : "Uploading"}
                        </Button>
                        <Button 
                        isSecondary
                        disabled={ uploading }
                        onClick={ null }>
                            Insert from URL
                        </Button>
                    </div>
                )}
                >
                
                </FormFileUpload>
                </div>
                : null }
                <InspectorControls>
                    <PanelBody title="Settings" initialOpen={ true }>
                        <ToggleControl
                            label="Show Heatmap"
                            checked={ showHeatmap }
                            onChange={() => setAttributes({ showHeatmap: !showHeatmap })}
                        >
                        </ToggleControl>
                        <ToggleControl
                            label="Show Statistics"
                            checked={ showStatistics }
                            onChange={() => setAttributes({ showStatistics: !showStatistics })}
                        >
                        </ToggleControl>
                        <ToggleControl
                            label="Show Lines"
                            checked={ showLines }
                            onChange={() => setAttributes({ showLines: !showLines })}
                        >
                        </ToggleControl>
                    </PanelBody>
                    <PanelBody title="QTH Location" initialOpen={ true }>
                        <TextControl
                            label="Gridsquare"
                            value={ qthGrid }
                            onChange={ (value) => { 
                                
                                var grid = value.length == 6 ? sanitiseGrid(value) : value
                                setAttributes({ qthGrid: grid })

                                if (grid.length != 6)
                                    return
                                    
                                var coords = gridToCoord(grid)
                                setAttributes({ qthLatitude: coords[0], qthLongitude: coords[1] })
                                updateQTHLocation(coords[0], coords[1])
                             }}
                        >
                        </TextControl>
                        <TextControl
                            label="Latitude"
                            value={ qthLatitude }
                            onChange={ (value) => { 
                                var grid = coordsToGrid(value, qthLongitude)
                                setAttributes({ qthGrid: grid, qthLatitude: value })
                                updateQTHLocation(value, qthLongitude)
                             }}
                        >
                        </TextControl>
                        <TextControl
                            label="Longitude"
                            value={ qthLongitude }
                            onChange={ (value) => { 
                                var grid = coordsToGrid(qthLatitude, value)
                                setAttributes({ qthGrid: grid, qthLongitude: value })
                                updateQTHLocation(qthLatitude, value)
                             }}
                        >
                        </TextControl>
                        <Button
                            isDestructive
                            onClick={ () => { 
                                setAttributes({
                                    qthLatitude: originalQthLatitude,
                                    qthLongitude: originalQthLongitude
                                })
                                updateQTHLocation(originalQthLatitude, originalQthLongitude)
                            } }>
                            { "Reset to Log Location" }
                        </Button>
                    </PanelBody>

                </InspectorControls>

                <div id="mapcollection">
                    <div id="qsomap"></div>
                    <div id="mapcontrol">
                        <Button 
                            isSecondary 
                            disabled={ logs.length == 0 }
                            onClick={ () => zoomToQTH() }>
                                { "Zoom to QTH" }
                        </Button>
                        <Button 
                            isSecondary 
                            disabled={ logs.length == 0 }
                            onClick={ () => zoomToBounds() }>
                                { "Fit All QSOs" }
                        </Button>
                        <Button
                            isSecondary
                            disabled={ logs.length == 0}
                            onClick={ () => playQSOOrder() }>
                                { "Play QSO Order" }
                            </Button>
                    </div>
                </div>
            </div>
        )        
    }, // End edit()

    save: props => {
        // How our block renders on the frontend
        const blockProps = useBlockProps.save()

        const { qthLatitude, qthLongitude, qthGrid, uploading, showHeatmap, showStatistics, myCall, logs } = props.attributes

//        if (logs.length > 0) waitForElm('#qsomap').then(() => { generateMapEdit(logs, qthLatitude, qthLongitude, myCall, qthGrid) })

        return (
            null
        
        ) 
    } // End save()
});

function uploadLogFile(event, props){
        var fr=new FileReader();
    fr.onload=function(){
        parseLogFile(fr.result, props)
        
        props.setAttributes({ uploading: false })
    }
      
    fr.readAsText(event.currentTarget.files[0])
}

function parseLogFile(logfileContents, props) {
    const { qthLatitude, qthLongitude, myCall, logs } = props.attributes

    console.log("Parsing log file...")
    const records = logfileContents.split("<EOH>")[1].split("<EOR>")
    
    var logEntries = []

    records.forEach( (record) => {
        var dict = {}
        var sep = record.split("<")
        sep = sep.splice(1)
        sep.forEach((rec) => {
            var key = rec.split(':')[0]
            var val = rec.split(">")[1].trim()
            dict[key] = val
        })
        if (Object.keys(dict).length > 0)
            logEntries.push(dict)
    });

    const first = logEntries[0]

    props.setAttributes( { logs: logEntries } )
    props.setAttributes( { myCall: first['STATION_CALLSIGN'] })
    const myGrid = first["MY_GRIDSQUARE"]
        
    const stationCoords = gridToCoord(myGrid)
        console.log(myGrid + " = " + stationCoords)
        props.setAttributes({ 
            qthGrid: myGrid,
            qthLatitude: stationCoords[0].toString(), 
            qthLongitude: stationCoords[1].toString(), 
            originalQthLatitude: stationCoords[0].toString(), 
            originalQthLongitude: stationCoords[1].toString()})
    
    console.log("Done parsing...")

    logEntries.length > 0 && waitForElm('#qsomap').then(() => { 
        generateMapEdit(logEntries, stationCoords[0], stationCoords[1], myCall, myGrid) 

        qthMarker.on('dragend', () => { 
            var latln = qthMarker.getLatLng()
            updateQTHLocation(latln['lat'], latln['lng'])
            props.setAttributes({ qthLatitude: latln['lat'].toString(), qthLongitude: latln['lng'].toString() })
        })
    })
}

function generateMapEdit(logs, qthLatitude, qthLongitude, myCall, myGrid) {
    console.log("Generating Map...")

    if (map) {
        map.off()
        map.remove()
    }
    
    if (logs.length == 0) {
        console.error("No logs!")
        return
    }

    map = L.map('qsomap').setView([qthLatitude, qthLongitude], 13)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    

    var bounds = []
    var heat = []
    qthMarker = L.marker([qthLatitude, qthLongitude], 
        { 
            title: myCall + "\r\n" + myGrid,
            draggable: true 
        }).addTo(map);

    logs.forEach((log) => {
        var grid = log['GRIDSQUARE']
        if (grid && grid != 'null') {
            var coords = gridToCoord(grid)
            L.marker(coords, { title: log['CALL'] + "\r\n" + log['MODE'] + "\r\n" + log['FREQ'] + "MHz" }).addTo(map)
            bounds.push(coords)
            heat.push(coords)
            generateCurve([qthLatitude, qthLongitude], coords, log['MODE'], log['BAND'])
        }
    })

    map.fitBounds(bounds)    
    qsoBounds = map.getBounds()
    L.heatLayer(heat, {blur:25, radius: 25, maxZoom: 8}).addTo(map)
    loadedMap = true
}


function zoomToQTH(){
    console.log("Zooming to QTH...")
    map.flyTo(qthMarker.getLatLng(), 15)
}

function zoomToBounds() {
    console.log("Zooming to Bounds...")
    map.flyToBounds(qsoBounds)
}

function playQSOOrder() {

}

function generateCurve(latlng1, latlng2, mode, band) {
var offsetX = latlng2[1] - latlng1[1],
	offsetY = latlng2[0] - latlng1[0];

var r = Math.sqrt( Math.pow(offsetX, 2) + Math.pow(offsetY, 2) ),
	theta = Math.atan2(offsetY, offsetX);

var thetaOffset = (3.14/10);

var r2 = (r/2)/(Math.cos(thetaOffset)),
	theta2 = theta + thetaOffset;

var midpointX = (r2 * Math.cos(theta2)) + latlng1[1],
	midpointY = (r2 * Math.sin(theta2)) + latlng1[0];

var midpointLatLng = [midpointY, midpointX];

//latlngs.push(latlng1, midpointLatLng, latlng2);


    var line = L.polyline(
	[
		latlng2,
        latlng1
		
	], 
    {
        color: bandToColour(band),
        weight: 1, 
        dashArray: 4,
        dashSpeed: 10
    }).addTo(map);

    pathLines.push(line)
}

function bandToColour(band){
    switch(band) {
        case "20m":
            return 'red'
        case "40m":
            return 'magenta'
        case "2m":
            return 'blue'
        case "70cm":
            return 'green'
    }
}

function gridToCoord(grid) {
    var sanitisedGrid = sanitiseGrid(grid)

    if (!sanitisedGrid)
        return [0, 0]

    var lat = (((sanitisedGrid.charCodeAt(1) - 65) * 10) + parseInt(sanitisedGrid.charAt(3)) + (((sanitisedGrid.charCodeAt(5) - 97) / 24) + (1/48))) - 90
    var lon = (((sanitisedGrid.charCodeAt(0) - 65) * 20) + (parseInt(sanitisedGrid.charAt(2)) * 2) + (((sanitisedGrid.charCodeAt(4) - 97) / 12) + (1/24))) - 180

    return [lat, lon]
}

function sanitiseGrid(grid) {
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

function coordsToGrid(latitude, longitude) {
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

function updateQTHLocation(lat, long) {
    qthMarker.setLatLng([lat, long])
    pathLines.forEach((line) => {
        var latlon = line.getLatLngs()
        line.setLatLngs([latlon[0], {lat:lat,lng:long}])
    })
}

function waitForElm(selector) {
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