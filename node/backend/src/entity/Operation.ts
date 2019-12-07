import {Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne} from "typeorm";
import {BaseEntity} from "typeorm";
import {Document} from "./Document";

@Entity()
export class Operation extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Document)
    document: Promise<Document>;

    @Column()
    orderIndex: number;

    @Column()
    operation: string;
}
