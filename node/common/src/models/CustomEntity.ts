import { 
    BaseEntity,
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
} from "typeorm";
import { Document } from './Document';
import { EntityType } from './../api/document/entities/types';

export interface Entities {
    Nodes: Array<NodeProps>
}

export interface NodeProps {
    name: string;
    maxPressure: number | null;
    minPressure: number | null;
    fixtures: Array<string>;
    dwelling: boolean | "";
    uid?: string;
    id?: number;
    type: string;
}

@Entity()
export class CustomEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "json", select: false })
    entity: NodeProps

    @Column({ select: false })
    type: EntityType.LOAD_NODE

    @Column({ select: false })
    document_id: number;

    @Column({ select: false })
    created_by: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
    
    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    deletedAt: Date;
}
