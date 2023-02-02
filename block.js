/* block.js */
var el = wp.element.createElement;

wp.blocks.registerBlockType('m0lxx/qsomap', {

   title: 'QSO Map', // Block name visible to user

   icon: 'location', // Toolbar icon can be either using WP Dashicons or custom SVG

   category: 'common', // Under which category the block would appear

   attributes: { // The data this block will be storing

      type: { type: 'string', default: 'default' }, // Notice box type for loading the appropriate CSS class. Default class is 'default'.

      title: { type: 'string' }, // Notice box title in h4 tag

      content: { type: 'array', source: 'children', selector: 'p' } /// Notice box content in p tag

   },

   edit: function(props) {
      // How our block renders in the editor in edit mode
   
      function updateMap( event ) {
         props.setAttributes( { title: event.target.value } );
      }
   
      return el( 'div',
         {
            className: 'notice-box notice-' + props.attributes.type
         },
         el(
            'h4',
            null,
            "QSO Map",
         ),
         el('span',
            null,        
            el(
               'p',
               null,
               "Select ADIF File:"
            ),
            el(
               'input',
               {
                  type: 'file',
                  style: { width: '100%' }
               }
            )
         ),
         el(
            'div',
            {
               classname: 'leaflet-container leaflet-touch leaflet-fade-anim leaflet-grab leaflet-touch-drag leaflet-touch-zoom',
            },
            null
         )
      ); // End return
   
   },  // End edit()

   save: function(props) {
      // How our block renders on the frontend
   
      return el( 'div',
         {
            className: 'notice-box notice-' + props.attributes.type
         },
         el(
            'h4',
            null,
            props.attributes.title
         ),
         el( wp.editor.RichText.Content, {
            tagName: 'p',
            value: props.attributes.content
         })
   
      ); // End return
   
   } // End save()
});