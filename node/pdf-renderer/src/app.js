// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
let response;
const util = require('util');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const cprocess = require('child_process');
const fs = require('fs');


const RenderSize = {
    SMALL: 0,
    MEDIUM: 1,
    LARGE: 2,
};

const RENDER_SIZES = [
    {id: RenderSize.SMALL, density: 20, suffix: '-small'},
    {id: RenderSize.MEDIUM, density: 72, suffix: '-medium'},
    {id: RenderSize.LARGE, density: 200, suffix: '-large'},
];


/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
exports.lambdaHandler = async (event, context, callback) => {

    // Read options from the event parameter.
    console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));
    const srcBucket = event.Records[0].s3.bucket.name;
    // Object key may have spaces or unicode non-ASCII characters.
    const srcKey    = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
    const dstBucket = process.env.DESTINATION_BUCKET;
    const splitByDot = srcKey.split(".");
    const dstKeyBase = splitByDot.splice(0, splitByDot.length - 1).join('.');

    // Infer the image type from the file suffix.
    const typeMatch = srcKey.match(/\.([^.]*)$/);
    if (!typeMatch) {
        console.log("Could not determine the image type.");
        return;
    }

    // Check that the image type is supported
    const extension = typeMatch[1].toLowerCase();
    if (!['pdf', 'ps', 'eps'].includes(extension)) {
        console.log(`Unsupported pdf type: ${extension}`);
        return;
    }

    // Download the image from the S3 source bucket.

    try {
        const params = {
            Bucket: srcBucket,
            Key: srcKey
        };
        var origPdf = await s3.getObject(params).promise();

    } catch (error) {
        console.log(error);
        return;
    }

    // Save file to /tmp
    const pdfPath = '/tmp/target.pdf';
    await fs.promises.writeFile(pdfPath, origPdf.Body);
    const pngPath = '/tmp/target.png';

    // Call the imagemagic and ghostscript function to convert the PDF.
    for (const {suffix, density, id} of RENDER_SIZES) {
        try {
            const result = await util.promisify(cprocess.exec)("convert -density " + density + " " + pdfPath + "[0] -quality 100 " + pngPath);

            // Upload the result!
            try {
                const destparams = {
                    Bucket: dstBucket,
                    Body: fs.createReadStream(pngPath).on("error", (err) => {
                        console.log("File error: ", err);
                    }),
                    Key: dstKeyBase + suffix + ".png",
                };


                const putResult = await s3.putObject(destparams).promise();

            } catch (error) {
                console.log(error);
                return;
            }

        } catch (e) {
            console.log("ImageMagic error while processing " + srcKey + " quality " + id);
            console.log(e);
            return;
        }
    }


    console.log('Successfully resized ' + srcBucket + '/' + srcKey +
        ' and uploaded to ' + dstBucket + '/' + dstKeyBase);
};
