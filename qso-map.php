<?php
/**
* Plugin Name: QSO Map
* Plugin URI: http://www.m0lxx.co.uk/qso-map-wp-plugin
* Description: WP Embeddable ADIF to QSO Map [DEV]
* Version: 0.1
* Author: Luke M0LXX
* Author URI: http://www.m0lxx.co.uk/
**/

function qsomap_setup_options() {
    add_option( 'qsomap_openstreetmap_apikey', '', '' , 'yes' );
}
add_action( 'init', 'qsomap_setup_options');


/**
 * Activate the plugin.
 */
function qsomap_activate() { 
    qsomap_setup_options();
	// Clear the permalinks after the post type has been registered.
	flush_rewrite_rules(); 
}
register_activation_hook( __FILE__, 'qsomap_activate' );

/**
 * Deactivation hook.
 */
function qsomap_deactivate() {
	// Clear the permalinks to remove our post type's rules from the database.
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'qsomap_deactivate' );


function qsomap_add_settings_page() {
    add_options_page( 'Example plugin page', 'Example Plugin Menu', 'manage_options', 'qsomap-example-plugin', 'qsomap_render_plugin_settings_page' );
}
add_action( 'admin_menu', 'qsomap_add_settings_page' );

function qsomap_render_plugin_settings_page() {
    ?>
    <h2>QSO Map Settings</h2>
    <form action="options.php" method="post">
        <?php 
        settings_fields( 'qsomap_options' );
        do_settings_sections( 'qsomap' ); ?>
        <input name="submit" class="button button-primary" type="submit" value="<?php esc_attr_e( 'Save' ); ?>" />
    </form>
    <?php
}

/*
function qsomap_register_settings() {
    register_setting( 'qsomap_options', 'qsomap_options', 'qsomap_options_validate' );
    add_settings_section( 'api_settings', 'API Settings', 'qsomap_plugin_section_text', 'qsomap' );

    add_settings_field( 'qsomap_plugin_setting_api_key', 'API Key', 'qsomap_plugin_setting_api_key', 'qsomap', 'api_settings' );
    #add_settings_field( 'qsomap_plugin_setting_results_limit', 'Results Limit', 'qsomap_plugin_setting_results_limit', 'qsomap', 'api_settings' );
    #add_settings_field( 'qsomap_plugin_setting_start_date', 'Start Date', 'qsomap_plugin_setting_start_date', 'qsomap', 'api_settings' );
}
add_action( 'admin_init', 'qsomap_register_settings' );

function qsomap_plugin_section_text() {
    echo '<p>Here you can set all the options for using the API</p>';
}

function qsomap_plugin_setting_api_key() {
    $options = get_option( 'qsomap_plugin__options' );
    echo "<input id='qsomap_plugin_setting_api_key' name='qsomap_plugin_options[api_key]' type='text' value='" . esc_attr( $options['api_key'] ) . "' />";
}
*/

// Load assets for wp-admin when editor is active
function m0lxx_qsomap_block_admin() {
    wp_enqueue_script(
       'm0lxx-qsomap-block-editor',
       plugins_url( 'block.js', __FILE__ ),
       array( 'wp-blocks', 'wp-element' )
    );
 
    wp_enqueue_style(
       'm0lxx-qsomap-block-editor',
       plugins_url( 'block.css', __FILE__ ),
       array()
    );
 }
 
 add_action( 'enqueue_block_editor_assets', 'm0lxx_qsomap_block_admin' );
 
 // Load assets for frontend
 function m0lxx_qsomap_block_frontend() {
 
    wp_enqueue_style(
       'm0lxx-qsomap-block-editor',
       plugins_url( 'block.css', __FILE__ ),
       array()
    );
 }
 add_action( 'wp_enqueue_scripts', 'm0lxx_qsomap_block_frontend' );