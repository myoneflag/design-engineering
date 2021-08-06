# Build server on AWS

## Gitlab Runner setup

Using [Gitlab - Installing GitLab Runner](https://docs.gitlab.com/runner/install/linux-repository.html#installing-gitlab-runner)

```
curl -L "https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh" | sudo bash
sudo apt-get install gitlab-runner

sudo gitlab-runner register
# choose executor type shell

# Install build dependencies
# https://github.com/nodesource/distributions/blob/master/README.md#debinstall
curl -fsSL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install -y nodejs
"