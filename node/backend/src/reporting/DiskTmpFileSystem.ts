import { IFileSystem } from "./IFileSystem";
import fs from "fs";
import fspath from "path";

const DISK_ROOT_PATH = '/tmp/h2xreports/';

export class DiskTmpFileSystem implements IFileSystem {

    async listFileNames(path: string): Promise<string[]> {
        const entries = await fs.readdirSync(DISK_ROOT_PATH + path);
        return entries.filter( async (e) => e && !(await fs.statSync(DISK_ROOT_PATH + path + '/' + e)).isDirectory());
    }
    async listFolderNames(path: string): Promise<string[]> {
        const entries = await fs.readdirSync(DISK_ROOT_PATH + path);
        return entries.filter( async (e) => e && (await fs.statSync(DISK_ROOT_PATH + path + '/' + e)).isDirectory());
    }
    async saveFile(path: string, data: any) {
        console.debug("Disk write " + DISK_ROOT_PATH + path);
        const dirName = fspath.dirname(path);
        await fs.mkdirSync(DISK_ROOT_PATH + dirName, { recursive: true });
        await fs.writeFileSync(DISK_ROOT_PATH + path, data);
    }
    async saveReportArchive(path: string, data: any) {
        await this.saveFile(path, data);
    }
    async readFile(path: string): Promise<string> {
        console.debug("Disk read " + DISK_ROOT_PATH + path);
        return (await fs.readFileSync(DISK_ROOT_PATH + path)).toString();
    }
}
