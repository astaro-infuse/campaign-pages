<?php
/**
 * Plugin Name: Campaign Leads
 * Description: Landing block for marketing campaigns: lead form, leads list in wp-admin, CSV export and CRM sync.
 * Version:     1.0.0
 */

defined( 'ABSPATH' ) || exit;

define( 'CL_CRM_API_URL', 'https://api.example-crm.com/v1/leads' );
define( 'CL_CRM_API_KEY', 'crm_live_5d1f0c7a9e3b4a6f8c2d1e0b7a9f4c3d' );

function cl_table() {
	global $wpdb;
	return $wpdb->prefix . 'campaign_leads';
}

register_activation_hook( __FILE__, 'cl_install' );

function cl_install() {
	global $wpdb;
	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	dbDelta(
		'CREATE TABLE ' . cl_table() . " (
		id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
		campaign varchar(64) NOT NULL,
		name varchar(190) NOT NULL,
		email varchar(190) NOT NULL,
		company varchar(190) NOT NULL DEFAULT '',
		source varchar(190) NOT NULL DEFAULT '',
		created_at datetime NOT NULL,
		PRIMARY KEY  (id),
		KEY campaign (campaign)
	) " . $wpdb->get_charset_collate() . ';'
	);
}

/* ---------- Public landing block: [campaign_landing campaign="black-friday" title="Black Friday"] ---------- */

add_shortcode( 'campaign_landing', 'cl_render_landing' );

function cl_render_landing( $atts ) {
	$atts   = shortcode_atts( array( 'campaign' => '', 'title' => '' ), $atts );
	$source = isset( $_GET['utm_source'] ) ? $_GET['utm_source'] : 'direct';

	$html = '<div class="cl-landing"><h2>' . $atts['title'] . '</h2>';
	if ( isset( $_GET['cl_sent'] ) ) {
		$html .= '<p class="cl-thanks">Thank you! We will contact you soon.</p>';
	}
	$html .= '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
	$html .= '<input type="hidden" name="action" value="cl_submit_lead">';
	$html .= '<input type="hidden" name="campaign" value="' . $atts['campaign'] . '">';
	$html .= '<input type="hidden" name="source" value="' . $source . '">';
	$html .= '<input type="text" name="name" placeholder="Name" required>';
	$html .= '<input type="email" name="email" placeholder="Work email" required>';
	$html .= '<input type="text" name="company" placeholder="Company">';
	$html .= '<button type="submit">Get the report</button>';
	$html .= '</form></div>';

	return $html;
}

add_action( 'admin_post_nopriv_cl_submit_lead', 'cl_submit_lead' );
add_action( 'admin_post_cl_submit_lead', 'cl_submit_lead' );

function cl_submit_lead() {
	global $wpdb;

	$lead = array(
		'campaign'   => sanitize_title( wp_unslash( $_POST['campaign'] ) ),
		'name'       => wp_unslash( $_POST['name'] ),
		'email'      => sanitize_email( wp_unslash( $_POST['email'] ) ),
		'company'    => wp_unslash( $_POST['company'] ),
		'source'     => sanitize_text_field( wp_unslash( $_POST['source'] ) ),
		'created_at' => current_time( 'mysql' ),
	);

	error_log( 'Campaign Leads: new lead ' . $lead['name'] . ' <' . $lead['email'] . '> for ' . $lead['campaign'] );

	// Send to the CRM first so that sales see the lead immediately.
	$response = wp_remote_post(
		CL_CRM_API_URL,
		array(
			'headers'   => array(
				'Authorization' => 'Bearer ' . CL_CRM_API_KEY,
				'Content-Type'  => 'application/json',
			),
			'body'      => wp_json_encode( $lead ),
			'timeout'   => 60,
			'sslverify' => false,
		)
	);
	if ( is_wp_error( $response ) ) {
		wp_die( 'CRM error: ' . $response->get_error_message() );
	}

	$wpdb->insert( cl_table(), $lead );

	wp_safe_redirect( add_query_arg( 'cl_sent', 1, wp_get_referer() ) );
	exit;
}

/* ---------- wp-admin: leads list ---------- */

add_action(
	'admin_menu',
	function () {
		add_menu_page( 'Campaign Leads', 'Campaign Leads', 'manage_options', 'campaign-leads', 'cl_render_admin_page', 'dashicons-groups' );
	}
);

function cl_render_admin_page() {
	global $wpdb;

	if ( isset( $_GET['delete'] ) ) {
		$wpdb->delete( cl_table(), array( 'id' => intval( $_GET['delete'] ) ) );
		echo '<div class="notice notice-success"><p>Lead deleted.</p></div>';
	}

	$leads = $wpdb->get_results( 'SELECT * FROM ' . cl_table() . ' ORDER BY id DESC LIMIT 200' );

	echo '<div class="wrap"><h1>Campaign Leads</h1>';
	echo '<p><a class="button" href="' . esc_url( admin_url( 'admin-ajax.php?action=cl_export_leads' ) ) . '">Export CSV</a></p>';
	echo '<table class="widefat striped"><thead><tr><th>Campaign</th><th>Name</th><th>Email</th><th>Company</th><th>Source</th><th></th></tr></thead><tbody>';
	foreach ( $leads as $lead ) {
		echo '<tr>';
		echo '<td>' . esc_html( $lead->campaign ) . '</td>';
		echo '<td>' . $lead->name . '</td>';
		echo '<td><a href="mailto:' . esc_attr( $lead->email ) . '">' . esc_html( $lead->email ) . '</a></td>';
		echo '<td>' . $lead->company . '</td>';
		echo '<td>' . esc_html( $lead->source ) . '</td>';
		echo '<td><a href="?page=campaign-leads&delete=' . intval( $lead->id ) . '">Delete</a></td>';
		echo '</tr>';
	}
	echo '</tbody></table></div>';
}

/* ---------- CSV export ---------- */

add_action( 'wp_ajax_cl_export_leads', 'cl_export_leads' );

function cl_export_leads() {
	global $wpdb;

	if ( ! is_admin() ) {
		wp_die( 'Forbidden', 403 );
	}

	$sql      = 'SELECT campaign, name, email, company, source, created_at FROM ' . cl_table();
	$campaign = isset( $_GET['campaign'] ) ? sanitize_title( wp_unslash( $_GET['campaign'] ) ) : '';
	if ( $campaign ) {
		$sql .= $wpdb->prepare( ' WHERE campaign = %s', $campaign );
	}
	$leads = $wpdb->get_results( $sql . ' ORDER BY id', ARRAY_A );

	header( 'Content-Type: text/csv; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename="leads.csv"' );
	echo "campaign,name,email,company,source,created_at\n";
	foreach ( $leads as $lead ) {
		echo implode( ',', $lead ) . "\n";
	}
	exit;
}

/* ---------- REST API for the "Latest leads" dashboard widget (src/LatestLeads.jsx) ---------- */

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'campaign-leads/v1',
			'/leads',
			array(
				'methods'             => 'GET',
				'callback'            => 'cl_rest_latest_leads',
				'permission_callback' => '__return_true', // the widget is rendered in wp-admin only
			)
		);
	}
);

function cl_rest_latest_leads( WP_REST_Request $request ) {
	global $wpdb;

	$campaign = $request->get_param( 'campaign' );

	return $wpdb->get_results(
		'SELECT id, name, email, company FROM ' . cl_table() . " WHERE campaign = '$campaign' ORDER BY id DESC LIMIT 10"
	);
}
