import { ObjectStore } from "../../../htmlcanvas/lib/object-store";
import { assertUnreachable, StandardFlowSystemUids } from "../../../../../common/src/api/config";
import { DrawingState } from "../../../../../common/src/api/document/drawing";
import { cloneSimple } from "../../../../../common/src/lib/utils";
import { ValveType } from '../../../../../common/src/api/document/entities/directed-valves/valve-types';
import DirectedValveEntity from "../../../../../common/src/api/document/entities/directed-valves/directed-valve-entity";
import { determineConnectableSystemUid } from "./lib";

export function fillDirectedValveFields(drawing: DrawingState, objectStore: ObjectStore, entity: DirectedValveEntity) {
    const result = cloneSimple(entity);
    const systemUid = determineConnectableSystemUid(objectStore, entity);
    const system = drawing.metadata.flowSystems.find((s) => s.uid === systemUid);

    result.systemUidOption = system ? system.uid : null;

    if (!!system) {
        if (result.color == null) {
            result.color = system.color;
        }

        let manufacturer = 'generic';
        switch (entity.valve.type) {
            case ValveType.FLOOR_WASTE:
                manufacturer = drawing.metadata.catalog.floorWaste[0]?.manufacturer || manufacturer;

                if (manufacturer === 'blucher') {
                    if (!entity.valve.variant) {
                        entity.valve.variant = 'normal';

                        if ([StandardFlowSystemUids.GreaseWaste, StandardFlowSystemUids.TradeWaste].includes(systemUid!)) {
                            entity.valve.variant = 'bucketTrap';
                        }
                    }

                    if (!entity.valve.bucketTrapSize) {
                        entity.valve.bucketTrapSize = entity.valve.variant === 'normal'
                            ? 'large'
                            : 'regular';
                    }
                }

                break;
            case ValveType.GAS_REGULATOR:
            case ValveType.INSPECTION_OPENING:
            case ValveType.ISOLATION_VALVE:
            case ValveType.PRV_DOUBLE:
            case ValveType.PRV_SINGLE:
            case ValveType.PRV_TRIPLE:
            case ValveType.REFLUX_VALVE:
            case ValveType.RPZD_DOUBLE_ISOLATED:
            case ValveType.RPZD_DOUBLE_SHARED:
            case ValveType.RPZD_SINGLE:
            case ValveType.STRAINER:
            case ValveType.WATER_METER:
            case ValveType.BALANCING:
            case ValveType.CHECK_VALVE:
            case ValveType.FILTER:
                break;
            default:
                assertUnreachable(entity.valve);
        }
    } else {
        if (result.color == null) {
            result.color = { hex: "#888888" };
        }
    }

    return result;
}
