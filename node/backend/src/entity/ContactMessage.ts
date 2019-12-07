import {Entity, PrimaryGeneratedColumn, Column, OneToOne} from "typeorm";
import {BaseEntity} from "typeorm";
import {Document} from "./Document";

@Entity()
export class ContactMessage extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    message: string;

    @Column()
    email: string;

}
