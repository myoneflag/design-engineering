export enum EntityType {
    BACKGROUND_IMAGE = 'BACKGROUND_IMAGE',
    FLOW_SOURCE = 'FLOW_SOURCE',
    FLOW_RETURN = 'FLOW_RETURN',
    PIPE = 'PIPE',
    FITTING = 'FITTING',

    TMV = 'TMV',
    SYSTEM_NODE = 'SYSTEM_NODE',

    // Fixtures
    FIXTURE = 'FIXTURE',

    // Output
    RESULTS_MESSAGE = 'RESULTS_MESSAGE',
    DIRECTED_VALVE = 'DIRECTED_VALVE',
}

export function getEntityName(type: EntityType): string {
    switch (type) {
        case EntityType.BACKGROUND_IMAGE:
            return 'Background';
        case EntityType.FLOW_SOURCE:
            return 'Riser';
        case EntityType.FLOW_RETURN:
            return 'Return';
        case EntityType.PIPE:
            return 'Pipe';
        case EntityType.FITTING:
            return 'Fitting';
        case EntityType.TMV:
            return 'TMV';
        case EntityType.SYSTEM_NODE:
            return 'System Joints';
        case EntityType.FIXTURE:
            return 'Fixture';
        case EntityType.RESULTS_MESSAGE:
            return 'Results Message';
        case EntityType.DIRECTED_VALVE:
            return 'Valve';
    }
}
