import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, Index } from "typeorm";
import { BaseEntity } from "typeorm";
import { Document } from "./Document";
import { OperationTransformConcrete } from "../api/document/operation-transforms";
import { User } from "./User";
import {JoinColumn} from "typeorm";

@Entity()
@Index(['document', 'orderIndex'])
export class Operation extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Document)
    @JoinColumn({name: "documentId"})
    document: Promise<Document>;

    @Column()
    documentId: number;

    @Column()
    orderIndex: number;

    @Column({ type: "json" })
    operation: OperationTransformConcrete;

    @Column({ nullable: true })
    dateTime: Date | null;

    @ManyToOne(() => User, { nullable: true, eager: true })
    blame: User | null;
}
