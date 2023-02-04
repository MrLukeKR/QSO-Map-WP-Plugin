import L from "leaflet";

const { __ } = wp.i18n
const { registerBlockType } = wp.blocks
const { InspectorControls } = wp.blockEditor
const { FormFileUpload, Button, PanelBody, ToggleControl, TextControl } = wp.components


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
    },

    edit: props => {
        // Pull out the props we'll use
        const { attributes, className, setAttributes } = props

        // Pull out specific attributes for clarity below
        const { originalQthLatitude, originalQthLongitude, qthLatitude, qthLongitude, uploading, showHeatmap, showStatistics, logs } = attributes

        if (logs.length > 0) waitForElm('#qsomap').then(() => { generateMap(logs, props) })

        return (
            <div className={className}>
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
                <div id="qsomap">

                </div>
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
                    </PanelBody>
                    <PanelBody title="QTH Location" initialOpen={ true }>
                        <TextControl
                            label="Latitude"
                            value={ qthLatitude }
                            onChange={ (value) => { 
                                setAttributes({ qthLatitude: value })
                                updateQTHLocation(value, qthLongitude)
                             }}
                        >
                        </TextControl>
                        <TextControl
                            label="Longitude"
                            value={ qthLongitude }
                            onChange={ (value) => { 
                                setAttributes({ qthLongitude: value })
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
                <div id="qsomap"></div>
            </div>
        )        
    }, // End edit()

    save: props => {
        // How our block renders on the frontend

        return null /*(
            <div className="qsomap-container">
                <div className="qsomap">

                </div>
            </div>
        )*/
    } // End save()
});

function uploadLogFile(event, props){
    
    var fr=new FileReader();
    fr.onload=function(){
        props.setAttributes( { logs: parseLogFile(fr.result) } )
        generateMap(props.attributes.logs, props)
    }
      
    fr.readAsText(event.currentTarget.files[0])

    props.setAttributes({ uploading: false })
}

function parseLogFile(logfileContents) {
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
    
    return logEntries;
}

var map = null
var qthMarker = null
var pathLines = []

function generateMap(logs, props) {
    if (map != null) return
    console.log(logs)
    var myGrid = logs[0]['MY_GRIDSQUARE']
    var myCall = logs[0]['STATION_CALLSIGN']

    var stationCoords = gridToCoord(myGrid)

    console.log("Your grid: " + stationCoords)

    map = L.map('qsomap').setView(stationCoords, 13)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    var bounds = []
    qthMarker = L.marker(stationCoords, { title: "QTH (" + myCall + ")", draggable: true }).addTo(map);
    qthMarker.on('dragend', () => { 
        var latln = qthMarker.getLatLng()
        updateQTHLocation(latln['lat'], latln['lng'])
        props.setAttributes({ qthLatitude: latln['lat'], qthLongitude: latln['lng']})
    })
    logs.forEach((log) => {
        var grid = log['GRIDSQUARE']
        if (grid && grid != 'null') {
            var coords = gridToCoord(grid)
            L.marker(coords, { title: log['CALL'] + "\r\n" + log['MODE'] + "\r\n" + log['FREQ'] + "MHz" }).addTo(map)
            bounds.push(coords)
            props.setAttributes({ qthLatitude: stationCoords[0], qthLongitude: stationCoords[1]})
            props.setAttributes({ originalQthLatitude: stationCoords[0], originalQthLongitude: stationCoords[1]})
            generateCurve(stationCoords, coords, log['MODE'], log['BAND'])
        }
    })

    map.fitBounds(bounds)    
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
		latlng1,
		latlng2
	], 
    {
        color: bandToColour(band),
        weight: 1, 
        dashArray: 4
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
    //TODO: Finished up to Step 1c of https://www.m0nwk.co.uk/how-to-convert-maidenhead-locator-to-latitude-and-longitude/ 
    var lat = (((sanitisedGrid.charCodeAt(1) - 65) * 10) + parseInt(sanitisedGrid.charAt(3)) + (((sanitisedGrid.charCodeAt(5) - 97) / 24) + (1/48))) - 90
    var lon = (((sanitisedGrid.charCodeAt(0) - 65) * 20) + (parseInt(sanitisedGrid.charAt(2)) * 2) + (((sanitisedGrid.charCodeAt(4) - 97) / 12) + (1/24))) - 180

    return [lat, lon]
}

function sanitiseGrid(grid) {
    if (!grid || grid.length != 6) // TODO: Add support for 4 char locators
        return null

    var sanitisedGrid = grid.charAt(0).toUpperCase() + 
                        grid.charAt(1).toUpperCase() + 
                        parseInt(grid.charAt(2)).toString() +
                        parseInt(grid.charAt(3)).toString() +
                        grid.charAt(4).toLowerCase() + 
                        grid.charAt(5).toLowerCase()

    return sanitisedGrid
}

function updateQTHLocation(lat, long) {
    qthMarker.setLatLng([lat, long])
    pathLines.forEach((line) => {
        var latlon = line.getLatLngs()
        line.setLatLngs([{lat:lat,lng:long}, latlon[1]])
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