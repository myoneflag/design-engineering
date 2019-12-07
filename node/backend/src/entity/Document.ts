import {Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne} from "typeorm";
import {BaseEntity} from "typeorm";
import {Operation} from "./Operation";
import {Organization} from "./Organization";
import {User} from "./User";
import {GeneralInfo} from "../../../frontend/src/store/document/types";

@Entity()
export class Document extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(() => Operation, (op: Operation) => op.document)
    operations: Promise<Operation[]>;

    @ManyToOne(() => Organization)
    organization: Promise<Organization>;

    @Column()
    createdOn: Date;

    @ManyToOne(() => User, {eager: true})
    createdBy: User;

    @Column( {type: "json"})
    metadata: GeneralInfo;

}
