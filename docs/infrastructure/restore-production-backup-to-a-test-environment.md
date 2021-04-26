# Restore a production DB backup to a test environment

This procedure outlines how to restore a production database backup to an environment in the testing account.

## Manual steps

1. Log into production AWS account, navigate to RDS
2. Identify production DB instance
3. Navigate to `Maintenance and backups` tab, `Snapshots` section
4. Click `Take snapshot`, provide meaningfull name, click OK
5. Wait for snapshot creation to be complete (approx 10-15 mins)
6. Navigate to Snapshots > respective snapshot
7. Click Actions > Share snapshot
8. Edit the snapshot sharing settings to Private, add test account ID `891449579858`
9. Hit save
10. Copy the snapshot ARN for use later

