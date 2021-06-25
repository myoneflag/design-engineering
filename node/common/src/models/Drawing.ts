import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { User } from './User'
import { Document } from "./Document";

export enum DrawingStatus {
    CURRENT, 
    SNAPSHOT
}

@Entity()
@Index(['documentId'])
export class Drawing extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: DrawingStatus.CURRENT })
    status: DrawingStatus;

    @ManyToOne(() => Document)
    @JoinColumn({name: "documentId"})
    document: Promise<Document>;

    @Column()
    documentId: number;

    @Column({ type: "json" })
    drawing: any;

    @Column({ nullable: true })
    dateTime: Date | null;

    @ManyToOne(() => User, { nullable: true })
    blame: User | null;
}