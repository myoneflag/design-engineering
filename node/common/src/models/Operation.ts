import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, Index, JoinColumn} from "typeorm";
import { Document } from "./Document";
import { User } from "./User";
import { OperationTransformConcrete } from "../api/document/operation-transforms";

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
