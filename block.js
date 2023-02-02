/* block.js */
var el = wp.element.createElement;

wp.blocks.registerBlockType('m0lxx/qsomap', {

   title: 'QSO Map', // Block name visible to user

   description: 'An ADIF log to QSO map tool by M0LXX',

   icon: 'location', // Toolbar icon can be either using WP Dashicons or custom SVG

   category: 'common', // Under which category the block would appear

   keywords: [ 'amateur', 'radio', 'qso', 'map', 'mapping' ],

   attributes: { // The data this block will be storing

      locator: { 
         type: 'string',
         source: 'meta',
         meta: 'locator'
      },

      logfile: { 
         type: 'string',
      },

   },

   edit: function(props) {
      // How our block renders in the editor in edit mode
      function updateLocator( event ) {
         props.setAttributes( { locator: event.target.value } );
      }

      return [
         el( 'div',
         {
            className: 'qsomap-container'
         },         
         [
            el('h3',
            {},
            'QSO Map'
            ),
            el('p',
            { className: 'components-placeholder__instructions' },
            'Upload an ADIF log file or link to a hosted log file with a URL.'),
            el('div',
            { className: 'components-form-file-upload' },
            [
               el('button',
            { className: 'components-button block-editor-media-placeholder__button block-editor-media-placeholder__upload-button is-primary' },
            'Upload ADIF'),
            el('button',
            { className: 'components-button block-editor-media-placeholder__button is-tertiary' },
            'Insert from URL')
            ]
            ),
            

            
            el( 'div',
             {
                id: 'qsomap',
             },
             null
         )
         ],
         
         el(wp.editor.InspectorControls,
            {},
            el(
                wp.components.PanelBody,
                {},
                el(
                  wp.components.TextControl,
                    {
                        label: 'QTH Maidenhead Locator',
                        value: props.attributes.locator,
                        onChange: function(e){
                            props.setAttributes({ locator: e });
                        }
                    }
                )
            )   

         )
      )
   ]; // End return
   
   },  // End edit()

   save: function(props) {
      // How our block renders on the frontend
   
      return el( 'div',
      {
         className: 'qsomap-container'
      },
      el(
         'div',
         {
            id: 'qsomap',
         },
         null
      )
   ); // End return
   } // End save()
});