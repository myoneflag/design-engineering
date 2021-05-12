
# Connecting to the test bastion host and operations

## Connecting

```
ssh -i "h2x-test-ec2-keypair.pem" ubuntu@ec2-54-177-205-217.us-west-1.compute.amazonaws.com
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
