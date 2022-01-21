import { APIResult } from "../../../common/src/api/document/types";
import axios from "axios";
import { ErrorReport, ErrorStatus } from "../../../common/src/models/Error";
import { CreateErrorRequest } from "../../../backend/src/models/Error";
import StackTrace from "stacktrace-js";

export async function getErrorReports(
    statuses?: ErrorStatus[],
    from?: number,
    count?: number
): Promise<APIResult<ErrorReport[]>> {
    try {
        return (await axios.get("/api/errors/", { params: { statuses, from, count } })).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function getErrorReport(id: number): Promise<APIResult<ErrorReport>> {
    try {
        return (await axios.get("/api/errors/" + id)).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function submitErrorReport(
    appVersion: string,
    message: string,
    name: string,
    trace: string,
    url: string
): Promise<APIResult<ErrorReport>> {
    try {
        const request: CreateErrorRequest = {
            appVersion,
            message,
            name,
            threwOn: new Date(),
            trace,
            url
        };
        return (await axios.post("/api/errors/", request)).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

const sentErrors = new Set<string>();

export async function reportWarning(message: string) {
    await reportError("[WARNING] " + message, new Error(message), false);
}

export async function reportError(message: string, error: Error, showDialog: boolean = true) {
    // @ts-ignore
    const vue = document.vue;
    // @ts-ignore
    const store = document.store;

    if (sentErrors.has(message.toString())) {
        return;
    }
    sentErrors.add(message.toString());
    console.log(error.stack);
    submitErrorReport(
        store.getters.appVersion,
        message ? message.toString() : "[No Message]",
        error.name,
        error.stack || "No Stack",
        window.location.href
    ).then(() => {
        if (showDialog) {
            const msgstr =
                "An error occurred: " +
                message.toString() +
                ". Our developers have been notified and " +
                "will find a fix as soon as they can. You should perhaps refresh the page - if you don't, the " +
                "document may become unreliable. If the issue persists and is preventing you from working, " +
                "please contact our team and we will assist immediately. Thank you for your patience.";

            if (vue) {
                vue.$bvToast.toast(
                "Our developers have been notified and will find a fix as soon as they can. \n" +
                "If you experience problems with the page from now on, please refresh.\n" +
                "Thank you for your patience!",
                {
                    title: "An error has occured: " + message.toString(),
                    variant: "danger"
                });
            } else {
                window.alert(msgstr);
            }
        }
    }).catch( () => {
        if (showDialog) {        
            const msgstr =
                "An error occurred, but we couldn't report the error!\n" +
                message.toString();
            if (vue) {
                vue.$bvModal.msgBoxOk(msgstr, {title: "Error"} );
            } else {
                window.alert(msgstr);
            }
        }
    });
}
