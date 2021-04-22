import { AccessLevel, User } from "../../../../common/src/models/User";
import { Organization } from "../../../../common/src/models/Organization";
import { SupportedLocales } from "../../../../common/src/api/locale";

export default interface ProfileState {
    profile: User | null;
    viewedVideoIds: string[];
    numDrawingsCreated: number;
    numFeedbackSubmitted: number;
    locale: SupportedLocales | null;
}
