import { Entity, Column, PrimaryColumn } from "typeorm";
import { BaseEntity } from "typeorm";

@Entity()
export class Organization extends BaseEntity {
    @PrimaryColumn()
    id: string;

    @Column()
    name: string;
}
