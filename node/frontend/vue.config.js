var webpack = require("webpack");

module.exports = {
  productionSourceMap: true,
  configureWebpack: {
    devServer: {
      port: 80,
      // Uncomment below in case Vue Hotreload is not working
      // Might happen if you are on Windows or FSEvents on Mac are captured by another program
      // https://github.com/vuejs-templates/webpack/issues/378
      watchOptions: {
        poll: true
      }
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env": {
          PACKAGE_JSON: '"' + escape(JSON.stringify(require("./package.json"))) + '"'
        }
      })
    ]
  },
  pwa: {
    workboxPluginMode: "InjectManifest",
    workboxOptions: {
      swSrc: "service-worker.js"
    }
  }
  // the rest of your original module.exports code goes here
};
