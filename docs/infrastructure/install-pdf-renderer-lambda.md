# Installing the PDF Rendering lambda

TBD more details

## Deploy

```
cd node/pdf-renderer
```

```
sam build
```

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

