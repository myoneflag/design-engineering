# Emergency procedures

## Log into production EC2 instance

1. Log in AWS Prod account
2. Select EC2, select a prod instance. Go to Connection tab. Use `EC2 instance connect`

## Running SQL scripts on prod database

Logged in on an EC2 instance:

1. Install `psql`
   ```bash
   sudo amazon-linux-extras install postgresql12
   ```
2. Get RDS instance hostname from RDS
3. Run query against database
   ```bash
   # example with test database
   psql -U user -h h2x-db-test-08-10-2021.cazfz3zzhugt.us-west-1.rds.amazonaws.com
   ```

## Rollback to a previous version

1. In Gitlab, under CI/CD > Piplelines, find the Pipeline corresponding to the tag ov the previous version.
e.g. for v1.7.11: https://gitlab.com/info892/H2X/-/pipelines?page=1&scope=all&ref=v1.7.11
2. For that pipeline, run the `deploy_prod` job.

## Rollback database 

Logged in on an EC2 instance:

1. 