import AWS, { Credentials } from "aws-sdk";
import { ACCESS_KEY, SECRET_ACCESS_KEY } from "./aws_creds";

AWS.config.update({
    region: 'ap-southeast-2',
    credentials: new Credentials(
        process.env.AWS_KEY,
        process.env.AWS_SECRET,
    ),
});

export const s3 = new AWS.S3();

