import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class HotKey extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "json", select: false })
    setting: { [key: string]: string }

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
    
    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}
