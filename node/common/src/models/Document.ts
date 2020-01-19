import {Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne} from "typeorm";
import {BaseEntity} from "typeorm";
import {Operation} from "./Operation";
import {Organization} from "./Organization";
import { AccessLevel, User } from "./User";
import { GeneralInfo } from "../api/document/drawing";

@Entity()
export class Document extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(() => Operation, (op: Operation) => op.document, {cascade: true})
    operations: Promise<Operation[]>;

    @ManyToOne(() => Organization)
    organization: Promise<Organization>;

    @Column()
    createdOn: Date;

    @ManyToOne(() => User, {eager: true})
    createdBy: User;

    @Column( {type: "json"})
    metadata: GeneralInfo;

    @Column({default: 0})
    version: number;
}

export function canUserDeleteDocument(doc: Document, user: User) {
    if (doc.createdBy.username === user.username) {
        return true;
    }

    if (user.accessLevel <= AccessLevel.MANAGER) {
        return true;
    }

    return false;
}
