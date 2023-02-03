<?php
/**
* Plugin Name: QSO Map
* Plugin URI: http://www.m0lxx.co.uk/qso-map-wp-plugin
* Description: WP Embeddable ADIF to QSO Map [DEV]
* Version: 0.1
* Author: Luke M0LXX
* Author URI: http://www.m0lxx.co.uk/
**/

namespace M0LXX\qsomap;

// Exit if accessed directly.
defined('ABSPATH') || exit;

// Gets this plugin's absolute directory path.
function _get_plugin_directory() {
  return __DIR__;
}

// Gets this plugin's URL.
function _get_plugin_url() {
  static $plugin_url;

  if (empty($plugin_url)) {
    $plugin_url = plugins_url(null, __FILE__);
  }

  return $plugin_url;
}

// Enqueue JS and CSS
include __DIR__ . '/lib/enqueue-scripts.php';

// Load dynamic blocks
include __DIR__ . '/blocks/qso-map/index.php';