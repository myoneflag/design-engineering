import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, OneToOne, JoinColumn } from "typeorm";
import { Operation } from "./Operation";
import { Drawing } from "./Drawing";
import { Organization } from "./Organization";
import { AccessLevel, User } from "./User";
import { ShareDocument } from './ShareDocument';
import { GeneralInfo } from "../api/document/drawing";
import { SupportedLocales } from "../api/locale";

export enum DocumentStatus {
    ACTIVE,
    DELETED,
    PENDING
}

@Entity()
export class Document extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: DocumentStatus.ACTIVE })
    state: DocumentStatus;

    @OneToMany(() => Operation, (op: Operation) => op.document, { cascade: true })
    operations: Promise<Operation[]>;

    @OneToMany(() => Drawing, (dr: Drawing) => dr.document, { cascade: true })
    drawings: Promise<Drawing[]>;

    @Column({ default: 0 })
    nextOperationIndex: number;

    @ManyToOne(() => Organization, { eager: true, nullable: true })
    organization: Organization;

    @Column()
    createdOn: Date;

    @ManyToOne(() => User, { eager: true })
    createdBy: User;

    @Column({ type: "json" })
    metadata: GeneralInfo;

    @Column({ default: 0 })
    version: number;

    @Column({ nullable: true })
    lastModifiedOn: Date | null;

    @ManyToOne(() => User, { nullable: true, eager: true })
    lastModifiedBy: User | null;

    @OneToOne(() => ShareDocument, { eager: true })
    @JoinColumn()
    shareDocument: ShareDocument;

    @Column({ type: "enum", enum: SupportedLocales, default: SupportedLocales.AU })
    locale: SupportedLocales;

    @Column({nullable:true})
    tags: string;
}

export function canUserDeleteDocument(doc: Document, user: User) {
    if (doc.state !== DocumentStatus.ACTIVE) {
        return false;
    }

    if (doc.createdBy.username === user.username) {
        return true;
    }

    if (user.accessLevel <= AccessLevel.MANAGER) {
        return true;
    }

    return false;
}

export function canUserRestoreDocument(doc: Document, user: User) {
    if (doc.state !== DocumentStatus.DELETED) {
        return false;
    }

    if (user.accessLevel <= AccessLevel.MANAGER) {
        return true;
    }

    return false;
}
