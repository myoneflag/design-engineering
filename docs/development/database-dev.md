# Database development


## Useful queries

### General statistics queries

Get the total number of operations per document
```sql
select "documentId", count("operation") as ct from operation group by "documentId" order by ct desc
```

Get the combined size of all opperations or each document - limit due to out of memory

```sql
select "documentId", count("operation"), length(string_agg(operation::varchar, ',')) from operation group by "documentId" limit 1000
```

