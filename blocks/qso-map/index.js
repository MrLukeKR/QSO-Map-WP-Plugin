const { __ } = wp.i18n
const { registerBlockType } = wp.blocks
const { MediaUpload, MediaUploadCheck } = wp.blockEditor
const { FormFileUpload, Button } = wp.components;

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
        logfile: {
            type: 'object',
            selector: 'js-qso-map-logfile'
        },
        uploading: {
            type: 'boolean'
        }
    },

    edit: props => {
        // Pull out the props we'll use
        const { attributes, className, setAttributes } = props

        // Pull out specific attributes for clarity below
        const { logfile, uploading } = attributes

        return (
            <div className={className}>
                <h3>QSO Map</h3>
                <p>Upload an ADIF log file or link to a hosted log file with a URL.</p>
                <FormFileUpload
                accept=".adi,.adif"
                onChange={ ( event ) => { 
                    props.setAttributes({uploading: true})
                    uploadLogFile(event)
                 } }
                render={ ( { openFileDialog } ) => (
                    <div className="inline">
                        <Button 
                        isPrimary 
                        isBusy={ props.attributes.uploading }
                        disabled={ props.attributes.uploading }
                        onClick={ () => openFileDialog() }>
                            { !props.attributes.uploading ? "Upload Log" : "Uploading"}
                        </Button>
                        <Button 
                        isSecondary
                        disabled={ props.attributes.uploading }
                        onClick={ null }>
                            Insert from URL
                        </Button>
                    </div>
                )}
                >
                </FormFileUpload>
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

function uploadLogFile(event){
    console.log(event.currentTarget.files);

}