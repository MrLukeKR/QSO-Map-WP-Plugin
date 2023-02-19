import "leaflet.heat"
import "leaflet-path-flow"
import '@elfalem/leaflet-curve'
import "leaflet.fullscreen"
import "@ansur/leaflet-pulse-icon"
import "../../bower_components/leaflet-slider/SliderControl.js"
import "bootstrap"

import Edit from './edit';
import save from './save';
import metadata from './block.json'

const { __ } = wp.i18n
const { registerBlockType } = wp.blocks

registerBlockType(metadata, {
    edit: Edit, // End edit()
    save // End save()
});