import {AccessLevel, User} from "../../../../backend/src/entity/User";
import {Organization} from "../../../../backend/src/entity/Organization";

export default interface ProfileState {
    profile: User | null;
}
