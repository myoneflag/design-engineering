# Deployments

## Overview

H2X uses three major environments:   
`test` `stage` and `production`

| Environment | URL                              | Deployed when                             | Notes                                                                                                 |
| ----------- | -------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| test        | https://app-test.h2xtesting.com  | on every `test` branch update             | create users with `test+something@h2xtesting.com`                                                     |
| stage       | https://app-stage.h2xtesting.com | on every `release-*` branch update or tag | create users with `test+something@h2xtesting.com`.   Database backup restored from prod occasionally. |
| prod        | https://app.h2xengineering.com   | manually triggered on tag `release-*`     | Live system!                                                                                          |

## Builds
On every branch push/merge request push, we have a `backend` and `frontend` build that are executing.  
If that build fails we get a notification on #build-notifications.  
The build basically executes `npm install`, `npm build` for both apps (see `./gitlab-ci.yaml` file)
* this should catch compilation errors
* _(we will add tests execution later, after we get the test fixed)_

## Deployments
Deployment plan:
* pushes to branch `test` > automatically deployed to app-test
* pushes to branches `release-*` > automatically deployed to app-stage
* **tags** of branches `release-*` > automatically deployed to app-stage
* **tags** of master or release-* branches > will be manually pushed to production

Useful links:
* what builds are executed (aka pipelines in GitLab) https://gitlab.com/info892/H2X/-/pipelines
* what environments we have running and what’s the last deployed change on them https://gitlab.com/info892/H2X/-/environments

## Release preparation

A production release is represented in Jira as a Release for tracking purposes in and in GitLab as a git tag for the actual deployment. 

### Jira
* Move all cards in that are Done in the Done column [Jira Board](https://h2xengineering.atlassian.net/secure/RapidBoard.jspa?projectKey=DEV&rapidView=1) 
* Ensure all Done cards have Fix version as version that will be released (e.g. `v1.7.4`)
* Create a new version (e.g. `v1.7.4+1` = `v1.7.5`) so cards not done yet will be moved to next version automatically
* Create the Jira Release in the [Releases page](https://h2xengineering.atlassian.net/projects/DEV?selectedItem=com.atlassian.jira.jira-projects-plugin:release-page): add the release date and a description
* Copy the link to the Release Issues report (e.g. [report](https://h2xengineering.atlassian.net/projects/DEV/versions/10011/tab/release-report-all-issues))

### Gitlab
* Ensure all merge requests that are Done in Jira are merged in `master`
* Create new `release-*` branch from `master` (e.g. `release-1.7.4`)
* Create new commit in release branch to increment version number: 
  ```shell
  cd node/frontend/
  ./bump_patch.sh
  ```
This automatically increments the version build number (semantic format `MAJOR.Minor.build`) and updates several relevant files with it.
* Commit to new release branch
* Push new release branch to GitLab
* _The new release branch will automatically be deployed to `stage`_  

### Production deployment
_After testing and other fixing is done_:
* Create a new Tag based on the new `release-*` branch
  * Title as version (e.g. `v.1.7.4`)
  * Description add link to Jira release report
* Tag creation will trigger a new build pipeline:
  * tag will be deployed automatically to `stage`: job step `deploy_stage` will execute
  * Production deployment step `deploy_prod` is on standby and awaits manual triggering
  * Trigger production deployment using the :play: button on the tag pipeline that is named `deploy_prod`

### Monitor deployment
Watch `#deployments` and `#incidents` channel for alerts or deplyment errors.

### Post deployment
* send a message on #development
* add a link to the Jira report with all issues fixed
* let @Jonny know so he can write the new version popup message

**Good luck!**