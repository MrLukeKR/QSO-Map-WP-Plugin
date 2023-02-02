<?php
/**
* Plugin Name: QSO Map
* Plugin URI: http://www.m0lxx.co.uk/qso-map-wp-plugin
* Description: WP Embeddable ADIF to QSO Map [DEV]
* Version: 0.1
* Author: Luke M0LXX
* Author URI: http://www.m0lxx.co.uk/
**/

/**
 * Register the "qsomap" custom post type
 */
function qsomap_setup_post_type() {
	register_post_type( 'qsomap', ['public' => true ] ); 
} 
add_action( 'init', 'qsomap_setup_post_type' );

function qsomap_setup_options() {
    add_option( 'qsomap_openstreetmap_apikey', '', '' , 'yes' );
}
add_action( 'init', 'qsomap_setup_options');


/**
 * Activate the plugin.
 */
function qsomap_activate() { 
	// Trigger our function that registers the custom post type plugin.
	qsomap_setup_post_type(); 

    qsomap_setup_options();
	// Clear the permalinks after the post type has been registered.
	flush_rewrite_rules(); 
}
register_activation_hook( __FILE__, 'qsomap_activate' );

/**
 * Deactivation hook.
 */
function qsomap_deactivate() {
	// Unregister the post type, so the rules are no longer in memory.
	unregister_post_type( 'qsomap' );
	// Clear the permalinks to remove our post type's rules from the database.
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'qsomap_deactivate' );