import { waitForElm, getNumberOfGridsquares, formatLogDate, sanitiseGrid, calculateDistance, generateMap, calculateMidpoint, coordsToGrid, getFurthestQSO, gridToCoord, zoomToBounds, zoomToGrid, zoomToQTH } from "./funcs"

const { InspectorControls, useBlockProps } = wp.blockEditor
const { FormFileUpload, Button, PanelBody, ToggleControl, TextControl } = wp.components

var map = null
var heatmap = null
var loadedMap = false
var qthMarker = null
var qsoBounds = []
var pathLines = []

export default function Edit( { attributes, setAttributes } ) {
    // Pull out specific attributes for clarity below
    const { 
        originalQthLatitude, originalQthLongitude, qthLatitude, qthLongitude, qthGrid, furthestQSODistance, furthestQSOStation,
        uploading, 
        showHeatmap, showStatistics, showLines, showLog,
        myCall, logs 
    } = attributes
    
    !loadedMap && logs.length > 0 && waitForElm('#qsomap').then(() => { 
        var ret = generateMap(map, pathLines, setAttributes, logs, { latitude: qthLatitude, longitude: qthLongitude, marker: qthMarker }, myCall, qthGrid, showHeatmap, showLines, true)
        qthMarker = ret['qth']['marker']
        map = ret['map']
        heatmap = ret['heatmap']
        qsoBounds = ret['qsoBounds']
        loadedMap = true

        qthMarker.on('dragend', () => { 
            var latln = qthMarker.getLatLng()
            updateQTHLocation(latln['lat'], latln['lng'])

            var grid = coordsToGrid(latln['lat'], latln['lng'])
            var furthestQSO = getFurthestQSO(grid, logs)
            setAttributes({ qthLatitude: latln['lat'].toString(), qthLongitude: latln['lng'].toString(), qthGrid: grid, furthestQSODistance: furthestQSO['distance'], furthestQSOStation: furthestQSO['station'] })
        })

        setAttributes({ qsoMap: document.getElementById("qsomap").innerHTML })         
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
                setAttributes({ uploading: true })
                uploadLogFile(event, attributes, setAttributes)
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
                    isTertiary
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
                        onChange={() => {
                            setAttributes({ showHeatmap: !showHeatmap })
                            if (showHeatmap && heatmap != null)
                                map.removeLayer(heatmap)
                            else if (!showHeatmap && heatmap == null) {
                                var ret = generateMap(map, pathLines, setAttributes, logs, { latitude: qthLatitude, longitude: qthLongitude, marker: qthMarker }, myCall, qthGrid, !showHeatmap, showLines, true)
                                qthMarker = ret['qth']['marker']
                                map = ret['map']
                                heatmap = ret['heatmap']
                                qsoBounds = ret['qsoBounds']
                                loadedMap = true

                                qthMarker.on('dragend', () => { 
                                    var latln = qthMarker.getLatLng()
                                    updateQTHLocation(latln['lat'], latln['lng'])
                        
                                    var grid = coordsToGrid(latln['lat'], latln['lng'])
                                    var furthestQSO = getFurthestQSO(grid, logs)
                                    setAttributes({ qthLatitude: latln['lat'].toString(), qthLongitude: latln['lng'].toString(), qthGrid: grid, furthestQSODistance: furthestQSO['distance'], furthestQSOStation: furthestQSO['station'] })
                                })
                        
                             } else if (!showHeatmap && heatmap != null)
                                map.addLayer(heatmap)
                        }}
                    ></ToggleControl>
                    <ToggleControl
                        label="Show Statistics"
                        checked={ showStatistics }
                        onChange={() => setAttributes({ showStatistics: !showStatistics })}
                    ></ToggleControl>
                    <ToggleControl
                        label="Show Lines"
                        checked={ showLines }
                        onChange={() => {
                            setAttributes({ showLines: !showLines })
                            if (showLines && pathLines.length > 0)
                                hideLines(pathLines, map)
                            else if (!showLines && pathLines.length > 0)
                                showHiddenLines()
                        }}
                    ></ToggleControl>
                    <ToggleControl
                        label="Show Log"
                        checked={ showLog }
                        onChange={() => setAttributes({ showLog: !showLog })}
                    ></ToggleControl>
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
                            setAttributes({ qthLatitude: coords[0].toString(), qthLongitude: coords[1].toString() })
                            updateQTHLocation(coords[0], coords[1])

                            var furthestQSO = getFurthestQSO(grid, logs)
                            setAttributes({furthestQSODistance: furthestQSO["distance"], furthestQSOStation: furthestQSO["station"]})
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

                            var furthestQSO = getFurthestQSO(grid, logs)
                            setAttributes({furthestQSODistance: furthestQSO["distance"], furthestQSOStation: furthestQSO["station"]})
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
                            var furthestQSO = getFurthestQSO(grid, logs)
                            setAttributes({furthestQSODistance: furthestQSO["distance"], furthestQSOStation: furthestQSO["station"]})
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
                            var furthestQSO = getFurthestQSO(coordsToGrid(originalQthLatitude, originalQthLongitude), logs)
                            setAttributes({furthestQSODistance: furthestQSO["distance"], furthestQSOStation: furthestQSO["station"]})
                        } }>
                        { "Reset to Log Location" }
                    </Button>
                </PanelBody>

            </InspectorControls>

                        <div id="qsologcollection">
            <div id="mapcollection">
                <div id="qsomap"></div>
                <div id="mapcontrol">
                    <Button 
                        isSecondary 
                        disabled={ logs.length == 0 }
                        onClick={ () => zoomToQTH(map, qthMarker) }>
                            { "Zoom to QTH" }
                    </Button>
                    <Button 
                        isSecondary 
                        disabled={ logs.length == 0 }
                        onClick={ () => zoomToBounds(map, qsoBounds) }>
                            { "Fit All QSOs" }
                    </Button>
                    <Button
                        isSecondary
                        disabled={ true || logs.length == 0} //TODO: Implement time animation
                        onClick={ () => playQSOOrder() }>
                            { "Play QSO Order" }
                        </Button>
                </div>
            </div>
        </div>
        { showStatistics ? 
        <div id="statistics">
            <h4>Statistics</h4>
            <table>
                <tr>
                    <th>Total QSOs</th>
                    <td>{ logs.length }</td>
                </tr>
                <tr>
                    <th>Furthest QSO</th>
                    <td>{ furthestQSOStation + ", " +  (Math.round(furthestQSODistance * 100) / 100) + "km"}</td>
                </tr>
                <tr>
                    <th>QSOs Per Minute</th>
                    <td>{ /* TODO: Calculate this */ }</td>
                </tr>
                <tr>
                    <th>Gridsquares</th>
                    <td>{ getNumberOfGridsquares(logs) }</td>
                </tr>
            </table>
        </div> : null}
        { showLog ? 
        <div>
            <h4>Log for { myCall }, {formatLogDate({date: logs[0]["QSO_DATE"], time: logs[0]["TIME_ON"], format: "UK"})} - {formatLogDate({date: logs[logs.length-1]["QSO_DATE"], time: logs[logs.length-1]["TIME_ON"], format: "UK"})}</h4>
                <table className="table table-striped">
                    <tr>
                        <th>Callsign</th>
                        <th>Timestamp</th>
                        <th>Location</th>
                        <th>Mode</th>
                        <th>Frequency (MHz)</th>
                        {showStatistics ? <th>Distance (KM)</th> : null}
                        <th>Actions</th>
                        </tr>{
                logs.length > 0 && logs.map((log, ind) => {
                    return <tr key={ind}>
                        <td><a target="_blank" href={"https://www.qrz.com/db/" + log["CALL"]}>{ log["CALL"] }</a></td>
                        <td>{ formatLogDate({date:log["QSO_DATE"], time: log["TIME_ON"], format: "UK" }) }</td>
                        <td>{ sanitiseGrid(log["GRIDSQUARE"]) }</td>
                        <td>{ log["MODE"] }</td>
                        <td>{ log["FREQ"] }</td>
                        {showStatistics ? <td>{Math.round(calculateDistance(qthGrid, log["GRIDSQUARE"]) * 100) / 100}</td> : null}
                        <td>
                            <Button 
                        isLink
                        onClick={ () => zoomToGrid(map, log["GRIDSQUARE"]) }>
                            { "Zoom to QTH" }
                    </Button>
                    </td>
                    </tr>
                })
                
                }
                </table>
            </div> : null}
        </div>
    )        
}

function parseLogFile(logfileContents, attributes, setAttributes) {
    const { myCall, showHeatmap, showLines } = attributes

    console.log("Parsing log file...")
    
    const fixedLogfileContents = logfileContents.replaceAll(/<[^>]*>/g, function(v) { return v.toUpperCase(); })
    const records = fixedLogfileContents.split("<EOH>")[1].split("<EOR>")

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

    setAttributes( { logs: logEntries } )
    setAttributes( { myCall: first['STATION_CALLSIGN'] ?? first['OPERATOR'] })
    const myGrid = first["MY_GRIDSQUARE"] ?? ""
        
    const stationCoords = gridToCoord(myGrid)
        
        setAttributes({ 
            qthGrid: myGrid,
            qthLatitude: stationCoords[0].toString(), 
            qthLongitude: stationCoords[1].toString(), 
            originalQthLatitude: stationCoords[0].toString(), 
            originalQthLongitude: stationCoords[1].toString()})
    
    console.log("Done parsing...")

    logEntries.length > 0 && waitForElm('#qsomap').then(() => { 
        var ret = generateMap(map, pathLines, setAttributes, logEntries, { latitude: stationCoords[0], longitude: stationCoords[1], marker: qthMarker }, myCall, myGrid, showHeatmap, showLines, true) 
        qthMarker = ret['qth']['marker']
        map = ret['map']
        heatmap = ret['heatmap']
        qsoBounds = ret['qsoBounds']
        loadedMap = true

        qthMarker.on('dragend', () => { 
            var latln = qthMarker.getLatLng()
            updateQTHLocation(latln['lat'], latln['lng'])

            var grid = coordsToGrid(latln['lat'], latln['lng'])
            var furthestQSO = getFurthestQSO(grid, logs)
            setAttributes({ qthLatitude: latln['lat'].toString(), qthLongitude: latln['lng'].toString(), qthGrid: grid, furthestQSODistance: furthestQSO['distance'], furthestQSOStation: furthestQSO['station'] })
        })

    })
}

function showHiddenLines() {
    pathLines.forEach((line) => line.addTo(map))
}

function updateQTHLocation(lat, long) {
    qthMarker.setLatLng([lat, long])
    pathLines.forEach((line) => { 
        var latlon = line.getLatLngs()
        
        var newMidpoint = calculateMidpoint(latlon[1], [lat,long])
        line.setLatLngs(['M', latlon[1], 'Q', newMidpoint, [lat,long]])
    })
}

function uploadLogFile(event, attributes, setAttributes){
    var fr=new FileReader();
fr.onload=function(){
    parseLogFile(fr.result, attributes, setAttributes)
    
    setAttributes({ uploading: false })
}
  
fr.readAsText(event.currentTarget.files[0])
}