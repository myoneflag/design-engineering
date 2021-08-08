# Build server on AWS

## Gitlab Runner setup

Using [Gitlab - Installing GitLab Runner](https://docs.gitlab.com/runner/install/linux-repository.html#installing-gitlab-runner)

```
# Install GitLab runner
curl -L "https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh" | sudo bash
sudo apt-get install gitlab-runner

# Register GitLab runner, choose executor type shell and provide runner key and URL from gitlab.com repo
# copy gitlab runner ID to use below in sudo pesmissions file
sudo gitlab-runner register

# Install build dependencies
# https://github.com/nodesource/distributions/blob/master/README.md#debinstall
curl -fsSL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install -y nodejs awscli

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
# path contains gitlab runner ID from above register command
# gitlab-runner ALL=(ALL) NOPASSWD:SETENV: /home/gitlab-runner/builds/yYyhiUP3/0/info892/H2X/deploy.sh

# Fix permissions for cleanup for gitlab-runner
sudo nano /etc/gitlab-runner
# edit file and add following line in the [[runners]] section
# pre_clone_script = "sudo chown -R gitlab-runner:gitlab-runner ."
sudo gitlab-runner restart
"