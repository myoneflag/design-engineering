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


2. Information about an entity

e.g. entity ID e2c8fde9-3490-4eda-8265-b92265f899ba

Entity details
```
export ENTITY_ID=e2c8fde9-3490-4eda-8265-b92265f899ba
cat debug.json | jq '.levels[].entities[] | select(.uid == env.ENTITY_ID)'
```

Level of entity
```
cat debug.json | jq '. as $root | .levels[] | select(.entities[].uid == env.ENTITY_ID ) | .name'
```

If pipe, endpoint entities
```
cat debug.json | jq '. as $root | .levels[].entities[] | select(.uid == env.ENTITY_ID) | .endpointUid | map($root.levels[].entities[.]) | .[] | select( has("uid") == true) '
```



