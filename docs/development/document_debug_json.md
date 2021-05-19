# How to view and inspect a document debug json

## Install JQ
Install: https://stedolan.github.io/jq/download/  
Learn: https://stedolan.github.io/jq/tutorial/  
JQ is your friend!

## Run queries

1. Background images in a document

```
cat debug.json | jq '.levels[].entities[] | select(.type == "BACKGROUND_IMAGE") | { key, filename }'
```
> The uploaded PDF originally `filename` is stored in S3 with name `key`


