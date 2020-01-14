import { AccessLevel, User } from "../../../../common/src/models/User";
import { Organization } from "../../../../common/src/models/Organization";

export default interface ProfileState {
    profile: User | null;
}
