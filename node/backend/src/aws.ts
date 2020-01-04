import AWS, { Credentials } from "aws-sdk";
import { ACCESS_KEY, SECRET_ACCESS_KEY } from "./aws_creds";

AWS.config.update({
    region: 'ap-southeast-2',
    credentials: new Credentials(
        ACCESS_KEY,
        SECRET_ACCESS_KEY,
    ),
});

export const s3 = new AWS.S3();

