var webpack = require('webpack');

module.exports = {
    productionSourceMap: true,
    configureWebpack: {
        devServer: {
            port: 80
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    PACKAGE_JSON: '"' + escape(JSON.stringify(require('./package.json'))) + '"'
                },
            }),
        ],
    },
    pwa: {
        workboxPluginMode: 'InjectManifest',
        workboxOptions: {
            swSrc: 'service-worker.js',
        },
    },
// the rest of your original module.exports code goes here
};