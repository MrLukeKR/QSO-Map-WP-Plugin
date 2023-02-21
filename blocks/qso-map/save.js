import { getNumberOfGridsquares, formatLogDate, sanitiseGrid, calculateDistance } from "./funcs"
const { useBlockProps } = wp.blockEditor

var qthMarker = null

export default function save( { attributes } ) {
    const blockProps = useBlockProps.save();
    
    const { 
        qthLatitude, qthLongitude, qthGrid, 
        furthestQSODistance, furthestQSOStation, qsosPerMinute,
        showHeatmap, showStatistics, showLines, showLog,
        myCall, logs 
    } = attributes

    console.log("Saving block...")
    /*
    !loadedMap && logs.length > 0 && waitForElm('#qsomap').then(() => { 
        console.log("Generating live map...")
        var ret = generateMap(pathLines, null, logs, { latitude: qthLatitude, longitude: qthLongitude, marker: null }, myCall, qthGrid, showHeatmap, showLines, false)
        qthMarker = ret['qth']['marker']
        map = ret['map']
        heatmap = ret['heatmap']
        qsoBounds = ret['qsoBounds']
        loadedMap = true
    })
    */

    return <div>
        <div id="qsologcollection">
        <div id="mapcollection">
            <div id="qsomap" style="height: 500px;"></div>
            <button class="components-button is-secondary" onClick={ 'zoomToCoord(' + qthLatitude + ', ' + qthLongitude + ')' }>Zoom to QTH</button>
            <button class="components-button is-secondary" onClick="zoomToBounds()">Show All QSOs</button>
        </div>
        <br></br>
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
                    <td>{ qsosPerMinute }</td>
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
                        </tr>
                        { logs.length > 0 && logs.map((log, ind) => {
                    return <tr key={ind}>
                        <td><a target="_blank" href={"https://www.qrz.com/db/" + log["CALL"]} rel="noopener">{ log["CALL"] }</a></td>
                        <td>{ formatLogDate({date: log["QSO_DATE"], time: log["TIME_ON"], format: "UK" }) }</td>
                        <td>{ sanitiseGrid(log["GRIDSQUARE"]) }</td>
                        <td>{ log["MODE"] }</td>
                        <td>{ log["FREQ"] }</td>
                        {showStatistics ? <td>{Math.round(calculateDistance(qthGrid, log["GRIDSQUARE"]) * 100) / 100}</td> : null}
                        <td><a href="#" onClick={ "zoomToGrid('" + log['GRIDSQUARE'] + "')"} >Zoom to QTH</a></td>
                    </tr>
                })
                
                }
                </table>
            </div> : null}
        </div>
        
        <link rel="stylesheet" href="/wp-content/plugins/qso-map/assets/vendor/css/leaflet.css"></link>
        <link rel="stylesheet" href="/wp-content/plugins/qso-map/assets/vendor/css/L.Icon.Pulse.css"></link>
        <link rel="stylesheet" href="/wp-content/plugins/qso-map/assets/vendor/css/Control.FullScreen.css"></link>

        <script type="text/javascript" src="/wp-content/plugins/qso-map/assets/vendor/js/leaflet.js"></script>
        <script type="text/javascript" src="/wp-content/plugins/qso-map/assets/vendor/js/leaflet-heat.js"></script>
        <script type="text/javascript" src="/wp-content/plugins/qso-map/assets/vendor/js/dashflow.js"></script>
        <script type="text/javascript" src="/wp-content/plugins/qso-map/assets/vendor/js/leaflet.curve.js"></script>
        <script type="text/javascript" src="/wp-content/plugins/qso-map/assets/vendor/js/Control.FullScreen.js"></script>
        <script type="text/javascript" src="/wp-content/plugins/qso-map/assets/vendor/js/L.Icon.Pulse.js"></script>
        <script type="text/javascript" src="/wp-content/plugins/qso-map/assets/js/livemap.js"></script>
        <script>
            var qth = { JSON.stringify({latitude: qthLatitude, longitude: qthLongitude, marker: qthMarker})};
            var myCall = "{ myCall }";
            var logs = { JSON.stringify(logs) };
            var myGrid = "{ qthGrid }";
            var showHeat = { showHeatmap ? "true" : "false" };
            var showLines = { showLines ? "true" : "false" };
            generateMap(logs, qth, myCall, myGrid, showHeat, showLines);
        </script>
    </div>
}

