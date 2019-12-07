import {AccessLevel, User} from "../../../../backend/src/entity/User";
import {Organization} from "../../../../backend/src/entity/Organization";

export interface Profile {
    username: string;
    organization: {
        id: string,
        name: string,
    } | null;
    name: string,
    accessLevel: AccessLevel;
}

export default interface ProfileState {
    profile: Profile | null;
}
