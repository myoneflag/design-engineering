# Installing the PDF Rendering lambda on AWS

Some functionality when uploading PDF files for floor plans are handled on production by a Lambda function triggered by the S3 upload of the background PDF file.
This document describes how to Deploy a new PDF render or configure an existing one for an environment.

> Installing a new Lambda is required only when creating a new environment that needs it's own PDF renderer - in case code changes that affect the render code must be done.
> For new environments or local developer configuration we can use the PDF render of the test environment. `pdf-renderer-test` stack in CloudFormation.

## Deploy new Lambda PDF renderer

```
cd node/pdf-renderer
```

```
sam build
```

Deploy to an existing environment
```
sam deploy --config-env ENVIRONMENT --profile AWS_PROFILE
```

List of currently configured environments in `samconfig.toml`

Deploy to a new environment
```
sam deploy --guided --profile AWS_PROFILE
```

## Configure new installation

1. Add `AmazonS3FullAccess` to Lambda role
2. Add S3 trigger for all object creation suffix `pdf`
3. Add layers to lambda in this merge order
```
1 arn:aws:lambda:us-west-1:891449579858:layer:ghostscript:1
2 arn:aws:lambda:us-west-1:891449579858:layer:image-magick:1
```
4. Add env variable for target bucket

## Configure existing PDF renderer for a new bucket

For all local dev environments for developers, use the `pdf-renderer-local` CloudFormation stack containing the `pdf-renderer-local` Lambda.


