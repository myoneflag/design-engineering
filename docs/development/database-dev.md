# Database development

## Creating database migrations

When updating database schema, one approach is to perform the changes locally, generate a migration from the changes and commmit the migration file.

1. Install pgAdmin or another database UI management tool
2. Create schema changes
3. Run migration generation command
```
cd node/backend
npm run migration:generate --name=TheNameOfYourMigration
```
4. Inspect the generated file in `node/backend/src/migrations` and remove any extraneous unintended changes.  
   Make sure the `down` command contains the opposite of the action.

## Useful queries

### General statistics queries

Get the number of documents by version
```sql
select version, count(*) from document group by version 
```

Get the total number of operations per document
```sql
select "documentId", count("operation") as ct from operation group by "documentId" order by ct desc
```

Get the combined size of all opperations or each document - limit due to out of memory

```sql
select "documentId", count("operation"), length(string_agg(operation::varchar, ',')) from operation group by "documentId" limit 1000
```


