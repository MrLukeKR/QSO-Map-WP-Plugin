import "leaflet.heat"
import "leaflet-path-flow"
import '@elfalem/leaflet-curve'
import "leaflet.fullscreen"
import "@ansur/leaflet-pulse-icon"
import "../../bower_components/leaflet-slider/SliderControl.js"
import "bootstrap"

import Edit from './edit';
import save from './save';

const { __ } = wp.i18n
const { registerBlockType } = wp.blocks

registerBlockType('m0lxx-qsomap/qsomap', {
    title: __('QSO Map'), // Block name visible to user
    description: 'An ADIF log to QSO map tool by M0LXX',
    icon: 'location-alt', // Toolbar icon can be either using WP Dashicons or custom SVG
    category: 'common', // Under which category the block would appear
    keywords: [
        __('amateur'),
        __('radio'),
        __('qso'),
        __('map'),
        __('mapping')
    ],

    supports: {
        // Turn off ability to edit HTML of block content
        html: false,
        // Turn off reusable block feature
        reusable: false,
        // Add alignwide and alignfull options
        align: false
    },

    attributes: { // The data this block will be storing
        logs: {
            type: 'array',
            default: []
        },
        myCall: {
            type: 'string'
        },
        qthGrid: {
          type:'string'  
        },
        originalQthLatitude: {
            type: 'string',
            default: 0
        },
        originalQthLongitude: {
            type: 'string',
            default: 0
        },
        qthLatitude: {
            type: 'string',
            default: 0
        },
        qthLongitude: {
            type: 'string',
            default: 0
        },
        furthestQSODistance: {
            type: 'string',
            default: 0
        },
        furthestQSOStation: {
            type: 'string',
            default: ""
        },
        uploading: {
            type: 'boolean',
            default: false
        },
        showHeatmap: {
            type: 'boolean'
        },
        showStatistics: {
            type: 'boolean'
        },
        showLines: {
            type: 'boolean'
        },
        showLog: {
            type: 'boolean'
        }
    },

    edit: Edit, // End edit()
    save // End save()
});