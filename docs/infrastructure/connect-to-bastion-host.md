
# Connecting to the test bastion host and operations

## Connecting

```
ssh -i "h2x-test-ec2-keypair.pem" ubuntu@test-bastion.h2xtesting.com
```

## Setup

1. Install AWS Cli
```
sudo apt-get update
sudo apt-get install awscli
```

Instance has administrator role permissions, no AK/SK are required.

Test: `aws s3 ls` should work.

2. Install Postgres client

https://www.postgresql.org/download/linux/ubuntu/

```
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get -y install postgresql-client
```

3. Mount volume on running instance

Create EBS volume
Attach it to instance from AWS console

```
lsblk # check devices attached
sudo mkfs -t xfs /dev/xvdf
sudo mount /dev/xvdf /data
sudo mkdir /data
```
4. Install various
```
sudo apt install zip
```

## Operations

### Backup restore =from RDS instance

#### On bastion host

Dump the database
> It takes a few minutes
```
pg_dump -U postgres -h h2x-db-stage-restore-0510.cazfz3zzhugt.us-west-1.rds.amazonaws.com ebdb > /data/052121-stage-backup.sql
```

Zip the backup
> Show dots for each 100Mb
```
zip data/052121-stage-backup.zip data/052121-stage-backup.sql -dd -ds 100
```

Upload the backup zipped to S3
```
aws s3 cp data/052121-stage-backup.zip s3://h2x-test-devops/dbbackups/052121-stage-backup.zip
```

#### On local

Copy the file locally on your machine
```
aws s3 cp s3://h2x-test-devops/dbbackups/052121-stage-backup.zip dbbackups/ --profile AWS_PROFILE
```

Unzip the archive
```
unzip dbbackups/052121-stage-backup.zip
```

Restore the database
``` 
psql -h localhost -U postgres
# create database h2xstage;
```

Import the data
> Install `pv` for progress
```
pv dbbackups/052121-stage-backup.sql | psql -h localhost -U postgres -d h2xstage
```

