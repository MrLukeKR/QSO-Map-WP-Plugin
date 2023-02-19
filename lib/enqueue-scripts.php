<?php

namespace M0LXX\qsomap;

/**
 *  Enqueue JavaScript and CSS
 *  for block editor only.
 */
function enqueue_block_editor_assets() {
  // Make paths variables
  $block_path = '/assets/js/editor.blocks.js';
  $style_path = '/assets/css/blocks.editor.css';

  // Enqueue the bundled block JS file
  wp_enqueue_script(
    'm0lxx/qsomap/blocks-js',
    _get_plugin_url() . $block_path,
    ['wp-i18n', 'wp-element', 'wp-blocks', 'wp-components', 'wp-editor'],
    null
  );

  // Enqueue optional editor-only styles
  wp_enqueue_style(
    'm0lxx/qsomap/blocks-editor-css',
    _get_plugin_url() . $style_path,
    [],
    null
  );

  wp_enqueue_style('L.Icon.Pulse.css', _get_plugin_url() . "/assets/css/L.Icon.Pulse.css", [], null);
  wp_enqueue_style('bootstrap.min.css', _get_plugin_url() . "/assets/css/bootstrap.min.css", [], null);
}

add_action('enqueue_block_editor_assets', __NAMESPACE__ . '\enqueue_block_editor_assets');