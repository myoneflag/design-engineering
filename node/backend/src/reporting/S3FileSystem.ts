import { S3Client } from "../aws";
import { IFileSystem } from "./IFileSystem";
import Config from "../config/config";

export class S3FileSystem implements IFileSystem {
    async listFileNames(path: string): Promise<string[]> {
        console.debug("S3 list files", `s3://${Config.DATA_BUCKET}/${path}`);
        return await S3Client.listSubKeys(Config.DATA_BUCKET, path);
    }
    async listFolderNames(path: string): Promise<string[]> {
        console.debug("S3 list folders", `s3://${Config.DATA_BUCKET}/${path}`);
        return await S3Client.listSubKeys(Config.DATA_BUCKET, path);
    }
    async saveFile(path: string, data: string) {
        console.debug("S3 write", `s3://${Config.DATA_BUCKET}/${path}`);
        await S3Client.upload(Config.DATA_BUCKET, path, data);
    }

    async saveReportArchive(path: string, data: string) {
        console.debug("S3 write", `s3://${Config.REPORTS_BUCKET}/${path}`);
        await S3Client.upload(Config.REPORTS_BUCKET, path, data);
    }

    async readFile(path: string): Promise<string> {
        console.debug("S3 read", `s3://${Config.DATA_BUCKET}/${path}`);
        return await S3Client.download(Config.DATA_BUCKET, path);
    }
}
