import { Document } from "../../../common/src/models/Document";

export enum ReportingStatus {
    Included = 1,
    Excluded = 2
}

const REPORTING_LOOKBACK_DAYS = 365;
const REPORTING_LOOKBACK_TIME_MS = REPORTING_LOOKBACK_DAYS * 24 * 3600 * 1000;

export default class ReportingFilter {
    static lookbackTime() {
        const now = new Date();
        return new Date(now.getTime() - REPORTING_LOOKBACK_TIME_MS);
    }

    static includedStatusString(doc: Document) {
        const status = this.includedStatus(doc);
        let label = status === ReportingStatus.Included ? "Included": "Excluded";
        label += this.userIncludedStatus(doc) === undefined ? " (auto)" : " (admin)";
        return label;
    }

    static userIncludedStatus(doc: Document): ReportingStatus | undefined {
        return doc.metadata.reportingStatus;
    }

    static autoIncludedStatus(doc: Document): ReportingStatus {
        const terms = [ "copy", "example", "untitled", "draft", "sample", "test", "backup"]
        const isTempTitle = terms.some( (term) => doc.metadata.title.toLowerCase().includes(term) );
        const isFreeOrg = doc.organization && doc.organization.name === "Free Account";
        const isInternalOrg = doc.organization && ( doc.organization.id === "h2x" || doc.organization.id === "test" );
        return ( !isTempTitle && !isFreeOrg && !isInternalOrg) ? ReportingStatus.Included : ReportingStatus.Excluded;
    }

    static includedStatus(doc: Document): ReportingStatus {
        const userIncludedStatus = this.userIncludedStatus(doc);
        if (userIncludedStatus !== undefined) {
            return userIncludedStatus;
        } else {
            return this.autoIncludedStatus(doc);
        }
    }

}
