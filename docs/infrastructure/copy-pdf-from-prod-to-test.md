# Copy PDF and renders from Production account to Test account

This procedure details how to copy files from S3 buckets in Production account to testing account S3 buckets.

Production account Source buckets:
* h2x-pdf
* h2x-pdr-renders  

Production account Destination buckets:
* h2x-s3-pdf-stage
* h2x-s3-pdfrenders-stage

### Attach Bucket Policy
For each destination bucket attach bucket policy allowing all entities in Production account to manage s3 buckets in Testing account.

```
{
    "Version": "2012-10-17",
    "Id": "PolicyPdfBucket",
    "Statement": [
        {
            "Sid": "AllowProductionS3AccesInTestingAccount",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::285736176239:root"
            },
            "Action": "s3:*",
            "Resource": [
                "arn:aws:s3:::h2x-s3-pdf-stage",
                "arn:aws:s3:::h2x-s3-pdf-stage/*"
            ]
        }
    ]
}
```

```
{
    "Version": "2012-10-17",
    "Id": "PolicyPdfRendersBucket",
    "Statement": [
        {
            "Sid": "AllowProductionS3AccesInTestingAccount",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::285736176239:root"
            },
            "Action": "s3:*",
            "Resource": [
                "arn:aws:s3:::h2x-s3-pdfrenders-stage",
                "arn:aws:s3:::h2x-s3-pdfrenders-stage/*"
            ]
        }
    ]
}
```

### Perform file sync of buckets

* Log into Production account
* Open CloudShell
* Run following AWS commands, first in dryrun, then for effect

```
aws s3 sync s3://h2x-pdf s3://h2x-s3-pdf-stage --acl bucket-owner-full-control --dryrun
aws s3 sync s3://h2x-pdf-renders s3://h2x-s3-pdfrenders-stage --acl bucket-owner-full-control --dryrun
```
