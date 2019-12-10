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

    @Column()
    sentOn: Date;

    @Column({select: false})
    ip: string;
}

export function allContactMessageColumns(except?: (keyof ContactMessage)[]): (keyof ContactMessage)[] {
    const res: (keyof ContactMessage)[] = ['id', 'name', 'message', 'email', 'sentOn', 'ip'];
    if (except) {
        return res.filter((c) => !except.includes(c));
    } else {
        return res;
    }
}
