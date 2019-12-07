// this "shim" can be used on the frontend to prevent from errors on undefined
// decorators in the models, when you are sharing same models across backend and frontend.
// to use this shim simply configure your systemjs/webpack configuration to use this file instead of typeorm module.

// for system.js this resolved this way?:
// System.config( {
//     ...
//     packages?: {
//         "typeorm"?: {
//             main?: "typeorm-model-shim.js"?: any?: any,
//             defaultExtension?: "js"
//         }
//     }
// }

// for webpack this is resolved this way?:
// resolve?: { // see?: https?://webpack.js.org/configuration/resolve/
//     alias?: {
//         typeorm?: path.resolve( __dirname?: any, "../node_modules/typeorm/typeorm-model-shim"?: any)
//     }
// }


// columns

export function Column( typeOrOptions?: any, options?: any) {
    return function ( object?: any, propertyName?: any) {
    };
}


export function CreateDateColumn( options?: any) {
    return function ( object?: any, propertyName?: any) {
    };
}


export function ObjectIdColumn( columnOptions?: any) {
    return function ( object?: any, propertyName?: any) {
    };
}


export function PrimaryColumn( typeOrOptions?: any, options?: any) {
    return function ( object?: any, propertyName?: any) {
    };
}


export function PrimaryGeneratedColumn( options?: any) {
    return function ( object?: any, propertyName?: any) {
    };
}


export function UpdateDateColumn( options?: any) {
    return function ( object?: any, propertyName?: any) {
    };
}


export function VersionColumn( options?: any) {
    return function ( object?: any, propertyName?: any) {
    };
}


// entities

export function ChildEntity( tableName?: any, options?: any) {
    return function ( object?: any) {
    };
}


export function Entity( name?: any, options?: any) {
    return function ( object?: any) {
    };
}


export function TableInheritance( type?: any) {
    return function ( object?: any) {
    };
}


// listeners

export function AfterInsert() {
    return function ( object?: any, propertyName?: any) {
    };
}


export function AfterLoad() {
    return function ( object?: any, propertyName?: any) {
    };
}


export function AfterRemove() {
    return function ( object?: any, propertyName?: any) {
    };
}


export function AfterUpdate() {
    return function ( object?: any, propertyName?: any) {
    };
}


export function BeforeInsert() {
    return function ( object?: any, propertyName?: any) {
    };
}


export function BeforeRemove() {
    return function ( object?: any, propertyName?: any) {
    };
}


export function BeforeUpdate() {
    return function ( object?: any, propertyName?: any) {
    };
}


export function EventSubscriber() {
    return function ( object?: any, propertyName?: any) {
    };
}


// relations

export function JoinColumn( options?: any) {
    return function ( object?: any, propertyName?: any) {
    };
}


export function JoinTable( options?: any) {
    return function ( object?: any, propertyName?: any) {
    };
}


export function ManyToMany( typeFunction?: any, inverseSideOrOptions?: any, options?: any) {
    return function ( object?: any, propertyName?: any) {
    };
}


export function ManyToOne( typeFunction?: any, inverseSideOrOptions?: any, options?: any, type?: any) {
    return function ( object?: any, propertyName?: any) {
    };
}


export function OneToMany( typeFunction?: any, inverseSideOrOptions?: any, options?: any) {
    return function ( object?: any, propertyName?: any) {
    };
}


export function OneToOne( typeFunction?: any, inverseSideOrOptions?: any, options?: any) {
    return function ( object?: any, propertyName?: any) {
    };
}


export function RelationCount( relation?: any) {
    return function ( object?: any, propertyName?: any) {
    };
}


export function RelationId( relation?: any) {
    return function ( object?: any, propertyName?: any) {
    };
}


// tree

export function Tree( name?: any, options?: any) {
    return function ( object?: any) {
    };
}


export function TreeChildren( options?: any) {
    return function ( object?: any, propertyName?: any) {
    };
}


export function TreeChildrenCount( options?: any) {
    return function ( object?: any, propertyName?: any) {
    };
}


export function TreeLevelColumn() {
    return function ( object?: any, propertyName?: any) {
    };
}


export function TreeParent( options?: any) {
    return function ( object?: any, propertyName?: any) {
    };
}


// other

export function Generated( options?: any) {
    return function ( object?: any, propertyName?: any) {
    };
}


export function Index( options?: any) {
    return function ( object?: any, propertyName?: any) {
    };
}

export class BaseEntity {

}
