# Installing the PDF Rendering lambda on AWS

TBD more details

## Deploy

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

## Configure

1. Add `AmazonS3FullAccess` to Lambda role
2. Add S3 trigger for all object creation suffix `pdf`
3. Add layers to lambda in this merge order
```
1 arn:aws:lambda:us-west-1:891449579858:layer:ghostscript:1
2 arn:aws:lambda:us-west-1:891449579858:layer:image-magick:1
```
4. Add env variable for target bucket

