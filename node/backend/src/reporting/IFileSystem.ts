export interface IFileSystem {
    listFileNames(path: string): Promise<string[]>;
    listFolderNames(path: string): Promise<string[]>;
    saveFile(path: string, data: string);
    readFile(path: string): Promise<string>;
    saveReportArchive(path: string, data: any );
}
