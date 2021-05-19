# Developing and debugging the PDF Renderer Lambda

## Commands

### Deployment

`cd node/pdf-renderer`

Build
```
sam build
```

Deploy to an environment
```
sam deploy --config-env ENVIRONMENT --profile AWS_PROFILE
```

List of currently configured environments in `samconfig.toml`

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
