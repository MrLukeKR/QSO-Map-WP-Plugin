import { getNumberOfGridsquares, formatLogDate, sanitiseGrid, calculateDistance } from "./funcs"
const { useBlockProps } = wp.blockEditor
const { Button } = wp.components

export default function save( { attributes } ) {
    const blockProps = useBlockProps.save();
    
    const { 
        originalQthLatitude, originalQthLongitude, qthLatitude, qthLongitude, qthGrid, furthestQSODistance, furthestQSOStation,
        uploading, 
        showHeatmap, showStatistics, showLines, showLog,
        myCall, logs 
    } = attributes

    return null
    
    return <div>
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
        <div /*className={ props.className }*/>
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
                        onClick={ () => zoomToGrid(log["GRIDSQUARE"]) }>
                            { "Zoom to QTH" }
                    </Button>
                    </td>
                    </tr>
                })
                
                }
                </table>
            </div> : null}
    </div>
}
