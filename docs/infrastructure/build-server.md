# Build server on AWS

- [Build server on AWS](#build-server-on-aws)
  - [Gitlab Runner setup](#gitlab-runner-setup)
    - [Install GitLab runner](#install-gitlab-runner)
    - [Register GitLab runner](#register-gitlab-runner)
    - [Install build dependencies](#install-build-dependencies)
    - [Install Docker](#install-docker)
    - [Install Docker Compose](#install-docker-compose)
    - [Allow sudo permissions for gitlab-runner user](#allow-sudo-permissions-for-gitlab-runner-user)
    - [Configure Gitlab write access](#configure-gitlab-write-access)
  - [Configure credentials for AWS deployments](#configure-credentials-for-aws-deployments)
  - [Logging into deploy server](#logging-into-deploy-server)
  - [Troubleshooting](#troubleshooting)
    - [Canceling build might cause permission errors with next build](#canceling-build-might-cause-permission-errors-with-next-build)
  - [Backup](#backup)

## Gitlab Runner setup

Using [Gitlab - Installing GitLab Runner](https://docs.gitlab.com/runner/install/linux-repository.html#installing-gitlab-runner)

### Install GitLab runner
```
curl -L "https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh" | sudo bash
sudo apt-get install gitlab-runner
```

### Register GitLab runner  
Choose executor type shell and provide runner key and URL from gitlab.com repo
```
sudo gitlab-runner register
```

### Install build dependencies
https://github.com/nodesource/distributions/blob/master/README.md#debinstall

```
curl -fsSL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install -y nodejs awscli zip
# for website crawling with chromium
sudo apt-get install -y jq chromium-browser libatk-bridge2.0-0 libxkbcommon-x11-0 libxcomposite-dev libxdamage-dev libxrandr-dev libgbm-dev
```

### Install Docker
```
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
```

### Install Docker Compose
Docker-compose must be version > 1.28.0

```
docker-compose -v
sudo curl -L "https://github.com/docker/compose/releases/download/1.28.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/bin/docker-compose
sudo chmod +x /usr/bin/docker-compose
docker-compose -v
```

### Allow sudo permissions for gitlab-runner user
```
sudo visudo
# edit file and add following line to allow sudo no password privileges for gitlab-runner user
# %gitlab-runner ALL=(ALL) NOPASSWD:SETENV: ALL
```

### Configure Gitlab write access

* generate private key
* add key as deploy key in Gitlab
* log in to build server
* `sudo su gitlab-runner`
* add private key to `.ssh/id_rsa`
* `chmod 400 .ssh/id_rsa`
* test connect to gitlab with `ssh -T git@gitlab.com`

## Configure credentials for AWS deployments

If the gitlab-runner instance performs only build tasks, AWS credentials are not needed.  
For AWS deployments to `app-test` \ `app-stage` or `prod` environment, AWS credentials configures are required.  

1. Create AWS IAM user  
Allow `Administrator` permissions.
Copy user's Access Key and Secret Key.

2. Create AWS CLI profile on build machine  
Log in to build server and use AK, SK of created AWS user to configure AWS profile.
```
aws configure --profile h2x-gitlab-runner-ACCOUNT-profile
```
Copy profile configuration to home folder of `gitlab-runner` user.  
```
sudo mkdir -p /home/gitlab-runner/.aws
sudo cp .aws/*  /home/gitlab-runner/.aws/
sudo chown gitlab-runner /home/gitlab-runner/.aws/*
sudo chgrp gitlab-runner /home/gitlab-runner/.aws/*
```

3.  Allow loggin in to dockerhub
```
sudo chown gitlab-runner /home/gitlab-runner/docker.hub.password
```

4. Set up cleanup jobs
```
sudo crontab -e
# add lines 
@weekly docker rmi -f $(docker images -a -q)
@weekly docker system prune -f
```

5. Use the profile name in `.gitlab-ci.yaml` jobs
Use `sudo -E` to pass all env vars to script execution.
```
variables:
  AWS_PROFILE: h2x-gitlab-runner-ACCOUNT-profile
  env: ENVIRONMENT
...
script:
  sudo -E ./cloudformation/deploy.sh
```

5. Start deploy build

## Logging into deploy server

```
ssh -i "h2x-test-ec2-keypair.pem" ubuntu@ec2-54-219-161-79.us-west-1.compute.amazonaws.com
```

## Troubleshooting

### Canceling build might cause permission errors with next build

When canceling a deploy build after the AWS deployment has started, leftover files are peristsed and they will create permission error for the next build.  

```
Checking out b55ad869 as test...
warning: failed to remove cloudformation/dist/710582a5/template.cfn.json.1: Permission denied
warning: failed to remove cloudformation/dist/710582a5/worker.zip: Permission denied
...
```

*Fix*
Log into build server, then:  
```
cd /home/gitlab-runner/builds/yYyhiUP3/0/info892/H2X/
sudo ./cloudformation/clean.sh
```
Logout.  
Restart build from GitLab.  


## Backup

Build server is backed up nightly with 30 day retention using AWS Backup.  
See [backup plan](https://us-west-1.console.aws.amazon.com/backup/home?region=us-west-1#/backupplan/details/fb7a3b75-b13e-47cf-a105-051d64d2d2fe).  
