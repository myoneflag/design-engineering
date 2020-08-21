import { 
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryGeneratedColumn,
    BaseEntity
} from "typeorm";

@Entity()
export class Onboarding extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "int", default: 0 })
    home: number;
    
    @Column({ type: "int", default: 0 })
    document: number;
    
    @Column({ type: "int", default: 0 })
    document_plumbing: number;
    
    @Column({ type: "int", default: 0 })
    document_setting: number;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
    
    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}