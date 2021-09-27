# Developing and debugging the PDF Renderer Lambda

Some functionality when uploading PDF files for floor plans are handled on production by a Lambda function triggered by the S3 upload of the background PDF file.
This document describes how to invoke the lambda function locally for development and troubleshooting.

## Commands

### Deployment

For information about how to deploy a new land a function for a new environment or configure an existing lambda function for a new environment see:
[Install PDF Renderer Lambda](../infrastructure/install-pdf-renderer-lambda.md)

### Local development

Enable Lambda layers - only for local development - do not COMMIT
* Uncomment lines in `template.yaml`
* Invoke with image rebuild
```
sam local invoke --env-vars test-envvars.json --event test-event.json --profile AWS_PROFILE --force-image-build
```

Invoke locally
```
sam local invoke --env-vars test-envvars.json --event test-event.json --profile AWS_PROFILE
```

Modify `test-event.json` to configure the name of the PDF to convert.
Output will be converted PNG files in the `h2x-s3-pdfrenders-local` bucket, configured in `test-envvars.json`.
