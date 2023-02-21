<?php

namespace M0LXX\qsomap;


add_action('plugins_loaded', __NAMESPACE__ . '\register_dynamic_block');


function register_dynamic_block() {
  // Only load if Gutenberg is available.
  if (!function_exists('register_block_type')) {
    return;
  }
  
  // Hook server side rendering into render callback
  // Make sure name matches registerBlockType in ./index.js
  register_block_type_from_metadata( __DIR__, [
    'render_callback' => __NAMESPACE__ . '\render_dynamic_block'
  ]);
}

function render_dynamic_block($attributes) {
  $showStatistics = $attributes['showStatistics'];
  $showLog = $attributes['showLog'];
  $logs = $attributes['logs'];
  $furthestQSOStation = $attributes['furthestQSOStation'];
  $furthestQSODistance = $attributes['furthestQSODistance'];
  $myCall = $attributes['myCall'];
  $numberOfGridsquares = $attributes['numberOfGridsquares'];

  $logList = '';
  $logID = 0;

  foreach ($logs as $log) {
    $logList .= '<tr key="' . $logID++ . '">';
    $logList .= '<td><a target="_blank" href="https://www.qrz.com/db/' . $log["CALL"] . '" rel="noopener">' . $log["CALL"] . '</a></td>';
    $logList .= '<td> formatLogDate({date: log["QSO_DATE"], time: log["TIME_ON"], format: "UK" }) </td>';
    $logList .= '<td>' . $log["GRIDSQUARE"] . '</td>';
    $logList .= '<td>' . $log["MODE"] . '</td>';
    $logList .= '<td>' . $log["FREQ"] . '</td>';
    $logList .= $showStatistics ? '<td>{Math.round(calculateDistance(qthGrid, log["GRIDSQUARE"]) * 100) / 100}</td>' : '';
    $logList .= '<td><a href="#" onClick="zoomToGrid(map, log[`GRIDSQUARE`]">Zoom to QTH</a></td></tr>';
  }


  $statistics = $showStatistics ? '
  <div id="statistics">
            <h4>Statistics</h4>
            <table>
                <tr>
                    <th>Total QSOs</th>
                    <td>' . count($logs) . '</td>
                </tr>
                <tr>
                    <th>Furthest QSO</th>
                    <td>' . $furthestQSOStation . ', ' .  (round($furthestQSODistance * 100) / 100) . 'km</td>
                </tr>
                <tr>
                    <th>QSOs Per Minute</th>
                    <td>{ /* TODO: Calculate this */ }</td>
                </tr>
                <tr>
                    <th>Gridsquares</th>
                    <td>' . $numberOfGridsquares . '</td>
                </tr>
            </table>
        </div>' : '';

  $log = $showLog ? '
        <div id="log">
            <h4>Log for ' . $myCall .' , {formatLogDate({date: logs[0]["QSO_DATE"], time: logs[0]["TIME_ON"], format: "UK"})} - {formatLogDate({date: logs[logs.length-1]["QSO_DATE"], time: logs[logs.length-1]["TIME_ON"], format: "UK"})}</h4>
                <table className="table table-striped">
                    <tr>
                        <th>Callsign</th>
                        <th>Timestamp</th>
                        <th>Location</th>
                        <th>Mode</th>
                        <th>Frequency (MHz)</th>
                        ' . ($showStatistics ? '<th>Distance (KM)</th>' : '') . '
                        <th>Actions</th>
                        </tr>
                        ' . $logList . '
                </table>
            </div>' : '';

  return <<<HTML
    <div id="qsologcollection">
        <div id="mapcollection">
            <div id="qsomap"></div>
        </div>
        {$statistics}
        {$log}
        </div>
  HTML;
}
