# H2X Development Guidelines

## Commit workflow

When a task is assigned to you, all details are in the Jira card. Use the Jira task code for creating branches and commit messages.

1. Create branch based on `master`, and name it using Jira task code (e.g. `DEV-123` or `DEV-123-a-short-name`)
2. Commit to branch, and add `DEV-123` to commit messages (e.g. `DEV-123 did this and that`)
3. Open a Merge Request from your branch to `master`, and add `DEV-123` to the name.
   
* All these things will make the Jira task, commits and MR nicely linked and tied together with links.
* When you push to your branch, with MR open, build will be run and you can see failures in slack `#build-notifications`. If build fails, fix it.
  
4. Merge your branch changes into branch `app-test` and push the changes.

#### Option 1
In the Gitlab MR page, you can manually start the optional `merge-to-app-test` deploy step.  

If this fails:

#### Option 2

In case the are merge conflicts in `app-test`, you will have to resolve the conflict anf push from local.  
Always resolve the conflict by committing to `app-test`!  

**Use Git UI locally**
  * Switch to branch `app-test`
  * Use `Branch > Merge into current branch ...` command on MacOS Git UI or similar
  * Commit merge conflicts
  * Push `app-test`
  
**or git commands **

   ```bash
   git pull
   git checkout app-test
   git merge DEV-123
   # fix conflicts
   git push
   ```
* Pushed changes will get automatically deployed to `app-test.h2xtesting.com`

* DO NOT merge back from **app-test** into your branch.  
  Changes in branch `app-test` might not make it in `master`. If other MRs have been merged, update from `master`.

* If you have conflicts when merging from your `DEV-` branch to `app-test`, fix the conflicts in `app-test`, not in your branch.
> * check out `app-test`
> * merge your branch in in
> * fix conflicts
> * commit and push to `app-test`
! DO NOT merge `app-test` in your `DEV-` branch and commits the conflict fix there.

* If the feature is big, risky or takes long, and might endanger the testing on `app-test`, you can create a new branch called `app-feature` and that will create a new environment automatically `app-feature.h2xtesting.com`.  
Same commands as above, just use `app-feature` instead of `app-test`. E.g. `app-heating`, `app-revit`, `app-manufacturers`, etc.

1. When all feedback and testing is done, Calin or Jonny will merge the MR into `master`.

## Branch workflow

### Overview

![H2X Branching Workflow](./docs/assets/H2X%20Branch%20Workflow.png)  
[Source](https://lucid.app/lucidchart/0e0a3f01-3e66-4437-9544-23ba83f2e2d6/edit?invitationId=inv_981a9ecf-57f9-423f-9545-fadf0a4a57b9)

* We develop features in `DEV-` branches
* We open MR from `DEV-` branch to `master`
* We merge the changes in `app-test` (or `app-`) branch for deployment to testing environment
> ! DO NOT merge `app-test` back into your `DEV-` branch
* When done, MR gets merged in `master`
* When ready to release, a new `release-` branch gets created based on `master`
* `release-` branch gets deploed automatically to `app-stage.hextesting.com`
* When stage has been tested and ready to go to prod, we create a tag from the `release-` branch
* Tag gets queued up for manual deployment to `prod`

## Merge requests
* Make small, specific code changes in MRs.  
  It makes development cleaner as we merge in one change at a time.
* Do not base your MRs form another MR in progress. Always base from `master`.
  When we'll have more features that take a long time to develop, we will make a `develop` branch.
* Commit parts progressively, and give the commits a good description of the change in the commit.  
  Don't have one non-descriptive commit for all your work.  
  **Good:**
  ```
  DEV-123 Added draw function to Arrow class
  DEV-123 Call draw function and handle special cases
  DEV-123 Fix error when called with null
  DEV-123 Renamed all calls to similar function
  ```
  *Bad:*
  ```
  DEV-123 Draw arrow
  ```
* Add the task ID to all commits - it will appear in the JIRA card as a link automatically if you do so.  
  It allows others looking at the Jira card to see the code progress being made.
* Name the branch as `DEV-123` or `DEV-123-short-name`.  
  No other 'bugfix', or 'feature' words needed.
* Merge with "delete source branch" so we keep repo clean.  

## Principles
* Product work first, project work second.  
  All the improvements we need to make to the project/code/automation/doc are important, but they need to come SECOND to completing the feature work, bugfixes and development.  
* Test things well.  
  When you say you're done, that should include testing. After coding is completed, put on your User hat and use it.
* Leave code always better than you found it.  
  Never make it messier, or change more than you really need to.
* Think like a customer.  
  If you did completed the feature as requested, but it doesn't make sense, say so, and make the change to make it better.  
* Work smart.  
  Most problems that we work on optimizing, can be avoided.
* Pay attention to details.  
  Details in comments in Jira, comments to MRs, details of how it looks and how it works. Read the Jira card, address all comments adfded to the card and MRs.

## Deployment
* If you want your changes deployed, merge your branchmanually  to `app-test`, and it will be automatically deployed to environment `app-test`.

* If your work has to be on a different environment because it's risky or it will take long, create a new branch called `app-NAME`, merge your `DEV-NNN` branch to `APP-NAME`, and it will be automatically deployed to `app-NAME.h2xtesting.com`. e.g. `app-revit`, `app-infra`, `app-super`, etc. NAME has to be single word no special chars all lowercase.

## Jira updates
* All updates about the feature or task should be added to the Jira ticket.  
  Adding updates in #slack will make those updates get lost. This includes comments, videos or screenshots about progress reports.
  And not added to the MR comments. Feature updates go in Jira, so that non-devs can follow.

## Merge Request comments
* Always address merge request comments seriously, and make sure all threads have been answered before being ready to merge.  
  And not added to the Jira comments. Code comments go in MRs, so that devs can follow.
