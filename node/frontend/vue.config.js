var webpack = require('webpack');

module.exports = {
    configureWebpack: {
        devtool: 'source-map',
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
