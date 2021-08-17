# Build server on AWS

## Gitlab Runner setup

Using [Gitlab - Installing GitLab Runner](https://docs.gitlab.com/runner/install/linux-repository.html#installing-gitlab-runner)

```
# Install GitLab runner
curl -L "https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh" | sudo bash
sudo apt-get install gitlab-runner

# Register GitLab runner, choose executor type shell and provide runner key and URL from gitlab.com repo
sudo gitlab-runner register

# Install build dependencies
# https://github.com/nodesource/distributions/blob/master/README.md#debinstall
curl -fsSL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install -y nodejs awscli zip

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose - must be version > 1.28.0
docker-compose -v
sudo curl -L "https://github.com/docker/compose/releases/download/1.28.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/bin/docker-compose
sudo chmod +x /usr/bin/docker-compose
docker-compose -v

# Allow sudo permissions for gitlab-runner user
sudo visudo
# edit file and add following line to allow sudo no password privileges for gitlab-runner user
# %gitlab-runner ALL=(ALL) NOPASSWD:SETENV: ALL
```

## Configure credentials for AWS deployments

If the gitlab-runner instance performs only build tasks, AWS credentials are not needed.  
For AWS deployments to `test` \ `stage` or `prod` environment, AWS credentials configures are required.  

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

4. Use the profile name in `.gitlab-ci.yaml` jobs
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

