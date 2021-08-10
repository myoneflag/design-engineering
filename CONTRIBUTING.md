# H2X Development Guidelines

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
  Details in comments in Jira, comments to MRs, details of how it looks and how it works.

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
* Name the branch as `DEV-123-draw-arrow`.  
  No other 'bugfix', or 'feature' words needed.
* Merge with "delete source branch" so we keep repo clean.

## Deployment
* If you want your changes deployed, merge your branch to `test`, and it will be automatically deployed to `app-test`.
* DO NOT merge from **test** into your branch.  
  Changes in `test` might not make it in `master`. If other MRs have been merged, update from `master`.

## Jira updates
* All updates about the feature or task should be added to the Jira ticket.  
  Adding updates in #slack will make those updates get lost. This includes comments, videos or screenshots about progress reports.
  And not added to the MR comments. Feature updates go in Jira, so that non-devs can follow.

## Merge Request comments
* Always address merge request comments seriously, and make sure all threads have been answered before being ready to merge.  
  And not added to the Jira comments. Code comments go in MRs, so that devs can follow.
