export enum EntityType {
    BACKGROUND_IMAGE = 'BACKGROUND_IMAGE',
    RISER = 'RISER',
    FLOW_RETURN = 'FLOW_RETURN',
    PIPE = 'PIPE',
    FITTING = 'FITTING',

    BIG_VALVE = 'BIG_VALVE',
    SYSTEM_NODE = 'SYSTEM_NODE',

    // Fixtures
    FIXTURE = 'FIXTURE',

    DIRECTED_VALVE = 'DIRECTED_VALVE',
    LOAD_NODE = 'LOAD_NODE',
}

export function getEntityName(type: EntityType): string {
    switch (type) {
        case EntityType.BACKGROUND_IMAGE:
            return 'Background';
        case EntityType.RISER:
            return 'Riser';
        case EntityType.FLOW_RETURN:
            return 'Return';
        case EntityType.PIPE:
            return 'Pipe';
        case EntityType.FITTING:
            return 'Fitting';
        case EntityType.BIG_VALVE:
            return 'Big Valve';
        case EntityType.SYSTEM_NODE:
            return 'Inlet/Outlet';
        case EntityType.FIXTURE:
            return 'Fixture';
        case EntityType.DIRECTED_VALVE:
            return 'Valve';
        case EntityType.LOAD_NODE:
            return 'Load Node';
    }
}
