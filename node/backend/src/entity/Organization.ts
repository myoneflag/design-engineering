import {Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, PrimaryColumn, OneToMany} from "typeorm";
import {BaseEntity} from "typeorm";
import {Document} from "./Document";
import {ManyToMany} from "typeorm";
import {User} from "./User";

@Entity()
export class Organization extends BaseEntity {

    @PrimaryColumn()
    id: string;

    @Column()
    name: string;


}
