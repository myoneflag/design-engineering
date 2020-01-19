import {Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne} from "typeorm";
import {BaseEntity} from "typeorm";
import {Document} from "./Document";
import { OperationTransformConcrete } from "../api/document/operation-transforms";
import { User } from "./User";

@Entity()
export class Operation extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Document)
    document: Promise<Document>;

    @Column()
    orderIndex: number;

    @Column({type: 'json'})
    operation: OperationTransformConcrete;

    @Column({nullable: true})
    dateTime: Date | null;

    @ManyToOne(() => User, { nullable: true, eager: true })
    blame: User | null;
}
