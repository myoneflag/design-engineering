export interface CreateErrorRequest {
    name: string;

    message: string;

    trace: string;

    threwOn: Date;

    appVersion: string;

    url: string;
}
