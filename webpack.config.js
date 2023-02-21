const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const FixStyleOnlyEntriesPlugin = require('webpack-fix-style-only-entries');


// see https://webpack.js.org/plugins/mini-css-extract-plugin/#extracting-css-based-on-entry
const recursiveIssuer = (m, c) => {
  const issuer = m.issuer;

  if (issuer) {
    return recursiveIssuer(issuer, c);
  }

  const chunks = m._chunks;

  for (const chunk of chunks) {
    return chunk.name;
  }

  return false;
}

// CSS files to load into assets/css
const cssFiles = [
  {
    name : 'editor',
    path : './blocks/qso-map/editor.css'
  },
  {
    name: 'style',
    path: './blocks/qso-map/style.css'
  }
]

const entryPoints = {
  // default entry point (main JS file)
  'editor.blocks': './blocks/index.js'
}

// add cssFiles as entry points
cssFiles.map(cssFile => entryPoints[cssFile.name] = cssFile.path)

// set up empty cache groups object
const cacheGroups = {}

// add cssFiles to cache groups
cssFiles.map(cssFile => cacheGroups[cssFile.name] = {
  name: cssFile.name,
  test: (m,c,entry = cssFile.name) => m.constructor.name === 'CssModule' && recursiveIssuer(m) === entry,
  chunks: 'all',
  enforce: true
})


module.exports = {
  entry: entryPoints,
  output: {
    path: path.resolve(__dirname),
    publicPath: "/wp-content/plugins/qso-map/",
    filename: './assets/js/[name].js'
  },
  watch: 'production' !== process.env.NODE_ENV,
  devtool: 'cheap-eval-source-map',
  module: {
    rules: [
      {

      },
      {
        test: /\.js$/,
        exclude: /node_modules|bower_components/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
                '@babel/preset-env'
            ],
            "plugins": ['@babel/plugin-proposal-class-properties'],
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [ require('autoprefixer') ]
              }
            }
          }
        ]
      }
    ]
  },
  optimization: {
    splitChunks: {
      cacheGroups: cacheGroups
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      L: 'leaflet',
      $: 'jquery-ui'
    }),
    new CopyPlugin({
      patterns: [
        { from: require.resolve('./node_modules/leaflet/dist/leaflet.js'), to: "./assets/vendor/js", context: "node_modules" },
        { from: require.resolve('./node_modules/leaflet/dist/leaflet.js.map'), to: "./assets/vendor/js", context: "node_modules" },
        { from: require.resolve('./node_modules/leaflet.heat/dist/leaflet-heat.js'), to: "./assets/vendor/js", context: "node_modules" },
        { from: require.resolve('./node_modules/leaflet-path-flow/dashflow.js'), to: "./assets/vendor/js", context: "node_modules" },
        { from: require.resolve('./node_modules/@elfalem/leaflet-curve/dist/leaflet.curve.js'), to: "./assets/vendor/js", context: "node_modules" },
        { from: require.resolve('./node_modules/leaflet.fullscreen/Control.FullScreen.js'), to: "./assets/vendor/js/", context: "node_modules" },
        { from: require.resolve('./node_modules/@ansur/leaflet-pulse-icon/dist/L.Icon.Pulse.js'), to: "./assets/vendor/js", context: "node_modules" },

        { from: require.resolve('./node_modules/leaflet/dist/leaflet.css'), to: "./assets/vendor/css", context: "node_modules" },
        { from: require.resolve('./node_modules/leaflet.fullscreen/Control.FullScreen.css'), to: "./assets/vendor/css/", context: "node_modules" },
        { from: require.resolve('./node_modules/leaflet.fullscreen/icon-fullscreen.svg'), to: "./assets/vendor/css/", context: "node_modules" },
        { from: './leaflet/dist/images', to: "./assets/vendor/css/images", context: "node_modules" },
        { from: require.resolve('./node_modules/@ansur/leaflet-pulse-icon/dist/L.Icon.Pulse.css'), to: "./assets/vendor/css", context: "node_modules" }
      ]
    }),
    // remove erroneous JS files generated from CSS entry points
    new FixStyleOnlyEntriesPlugin(),

    // place extracted CSS files in assets/css directory
    new MiniCssExtractPlugin({
      filename: './assets/css/blocks.[name].css'
    })
  ]
}