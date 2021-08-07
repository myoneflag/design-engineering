# Build server on AWS

## Gitlab Runner setup

Using [Gitlab - Installing GitLab Runner](https://docs.gitlab.com/runner/install/linux-repository.html#installing-gitlab-runner)

```
curl -L "https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh" | sudo bash
sudo apt-get install gitlab-runner

# reguster GitLab runner, choose executor type shell and provide runner key and URL from gitlab.com repo
sudo gitlab-runner register

# Install build dependencies
# https://github.com/nodesource/distributions/blob/master/README.md#debinstall
curl -fsSL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install -y nodejs awscli

# docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose

# create file for dockerhub credentials
touch docker.hub.password
nano docker.hub.password
# edit file and add password
sudo mv ~/docker.hub.password /home/gitlab-runner/
sudo chown gitlab-runner /home/gitlab-runner/docker.hub.password
sudo chgrp gitlab-runner /home/gitlab-runner/docker.hub.password
"