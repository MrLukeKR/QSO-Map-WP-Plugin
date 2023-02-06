<?php
/*
namespace M0LXX\qsomap\Blocks\qsomap;


add_action('plugins_loaded', __NAMESPACE__ . '\register_dynamic_block');


function register_dynamic_block() {
  // Only load if Gutenberg is available.
  if (!function_exists('register_block_type')) {
    return;
  }

  
  // Hook server side rendering into render callback
  // Make sure name matches registerBlockType in ./index.js
  register_block_type('m0lxx-qsomap/qsomap', array(
    'render_callback' => __NAMESPACE__ . '\render_dynamic_block'
  ));
}

function render_dynamic_block($attributes) {
  return 'Hello PHP block';
}
*/