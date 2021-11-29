import AWS, { S3 } from "aws-sdk";
import { GetObjectOutput, ManagedUpload } from "aws-sdk/clients/s3";

export const s3 = new AWS.S3();

export class S3Client {
    static async upload(bucketName: string, objectName: string, body: S3.Body ): Promise<ManagedUpload.SendData> {
        const params = {
            Bucket: bucketName,
            Body: body,
            Key: objectName,
        };

        return new Promise((resolve, reject) => {
            s3.upload(params, (err, data: ManagedUpload.SendData) => {
                if (err) {
                    return reject(err);
                }
                return resolve(data);
            });
        });
    }

    static async download(bucketName: string, objectName: string): Promise<string> {
        const params = {
            Bucket: bucketName,
            Key: objectName,
        };
        return new Promise((resolve, reject) => {
            s3.getObject(params, (err, data: GetObjectOutput) => {
                if (err) {
                    return reject(err);
                }
                return resolve(data.Body as string);
            });
        });
    }

    static async listSubKeys(bucketName: string, prefix: string): Promise<string[]> {
        const params: S3.ListObjectsV2Request = {
            Bucket: bucketName,
            Prefix: prefix + "/",
            Delimiter: "/",
        };

        const keepName = (s3Key) => s3Key.replace(params.Prefix, '').replace(params.Delimiter, '');

        return new Promise((resolve, reject) => {
            s3.listObjectsV2(params, (err, data: S3.ListObjectsV2Output) => {
                if (err) {
                    return reject(err);
                }
                let results;
                if (data.CommonPrefixes.length > 0) {
                    results = data.CommonPrefixes.map((cp) => keepName(cp.Prefix));
                } else {
                    results = data.Contents.map((s3Obj) => keepName(s3Obj.Key));
                }
                return resolve(results);
            });
        });

        return null;
    }

}
