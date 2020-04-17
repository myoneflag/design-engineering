import AWS, { Credentials } from "aws-sdk";
import Config from './config/config';

AWS.config.update({
    region: 'ap-southeast-2',
    credentials: new Credentials(
        Config.AWS_ACCESS_KEY,
        Config.AWS_SECRET,
    ),
});

export const s3 = new AWS.S3();

