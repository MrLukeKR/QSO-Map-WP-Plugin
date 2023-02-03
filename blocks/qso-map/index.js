import L from 'leaflet'
const { __ } = wp.i18n
const { registerBlockType } = wp.blocks
const { InspectorControls } = wp.blockEditor
const { FormFileUpload, Button, PanelBody, ToggleControl } = wp.components


registerBlockType('m0lxx-qsomap/qsomap', {
    title: __('QSO Map'), // Block name visible to user
    description: 'An ADIF log to QSO map tool by M0LXX',
    icon: 'location', // Toolbar icon can be either using WP Dashicons or custom SVG
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
            type: 'string'
        },
        uploading: {
            type: 'boolean',
            value: false
        },
        showHeatmap: {
            type: 'boolean'
        }
    },

    edit: props => {
        // Pull out the props we'll use
        const { attributes, className, setAttributes } = props

        // Pull out specific attributes for clarity below
        const { logfile, uploading, showHeatmap } = attributes

        return (
            <div className={className}>
                <h3>QSO Map</h3>
                <p>Upload an ADIF log file or link to a hosted log file with a URL.</p>
                <FormFileUpload
                accept=".adi,.adif"
                onChange={ ( event ) => { 
                    props.setAttributes({ uploading: true })
                    uploadLogFile(event, props)
                 } }
                render={ ( { openFileDialog } ) => (
                    <div className="inline">
                        <Button 
                        isPrimary 
                        isBusy={ uploading }
                        disabled={ uploading }
                        onClick={ () => openFileDialog() }>
                            { !uploading ? "Upload Log" : "Uploading"}
                        </Button>
                        <Button 
                        isSecondary
                        disabled={ uploading }
                        onClick={ null }>
                            Insert from URL
                        </Button>
                    </div>
                )}
                >
                <div id="qsomap">

                </div>
                </FormFileUpload>
                <InspectorControls>
                    <PanelBody title="Settings" initialOpen={ true }>
                        <ToggleControl
                            label="Show Heatmap"
                            checked={ showHeatmap }
                            onChange={() => setAttributes({ showHeatmap: !showHeatmap })}
                        >
                        </ToggleControl>
                    </PanelBody>
                </InspectorControls>
                <div id="qsomap"></div>
            </div>
        )        
    }, // End edit()

    save: props => {
        // How our block renders on the frontend

        return null /*(
            <div className="qsomap-container">
                <div className="qsomap">

                </div>
            </div>
        )*/
    } // End save()
});

function uploadLogFile(event, props){
    
    var fr=new FileReader();
    fr.onload=function(){
        props.attributes.logs = parseLogFile(fr.result)
        generateMap(props.attributes.logfile)
    }
      
    fr.readAsText(event.currentTarget.files[0])

    props.setAttributes({ uploading: false })
}

function parseLogFile(logfileContents) {
    const records = logfileContents.split("<EOH>")[1].split("<EOR>")
    
    records.forEach( (record) => {
        var dict = {}
        var sep = record.split("<")
        sep = sep.splice(1)
        sep.forEach((rec) => {
            dict[rec.split(':')[0]] = rec.split(">")[1].trim()
        })
        console.log(dict)
        
    });

    return null;
}

function generateMap(logs) {
    var map = L.map('qsomap').setView([51.505, -0.09], 13)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
}