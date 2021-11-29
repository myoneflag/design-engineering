# Worker commands

## Document upgrade

To start the entire upgrade process:  
```sh
npm run worker:upgrade:scan
```

To upgrade only one document:  
```sh
export DOCID=123 && npm run worker:upgrade:scan
```  

## Manufacturer reports

To start the entire reporting flow:  
```sh
npm run worker:reports:start
```
The `start` commands also creates a temporary file containing a report id, that is required for all subsequent commands.

To execute only one document report creation:  
```sh
export DOCID=123
npm run worker:reports:doc
```

To process teh data for only one manufacturer:  
```sh
export MANUFACTURER=generic
npm run worker:reports:manufacturer
```


