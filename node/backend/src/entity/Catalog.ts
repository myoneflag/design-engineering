import {Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn} from "typeorm";
import {BaseEntity} from "typeorm";
import {Document} from "./Document";
import {Catalog as ICatalog} from "../../../frontend/src/store/catalog/types";

@Entity()
export class Catalog extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => Document)
    @JoinColumn()
    document: Promise<Document>;

    @Column('json')
    content: ICatalog;

    @Column()
    savedOn: Date;
}
