import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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

    @Column({ select: false })
    ip: string;
}

export function allContactMessageColumns(except?: Array<keyof ContactMessage>): Array<keyof ContactMessage> {
    const res: Array<keyof ContactMessage> = ["id", "name", "message", "email", "sentOn", "ip"];
    if (except) {
        return res.filter((c) => !except.includes(c));
    } else {
        return res;
    }
}
