import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, PrimaryColumn } from "typeorm";
import {BaseEntity} from "typeorm";
import {Document} from "./Document";
import { OperationTransformConcrete } from "../api/document/operation-transforms";
import { User } from "./User";
import { FloorPlanRenders } from "../api/document/types";

@Entity()
export class FloorPlan extends BaseEntity {

    @PrimaryColumn()
    id: string;

    // Don't add a reference to document - we want to decouple this one.

    @Column({type: 'json'})
    renders: FloorPlanRenders;
}
