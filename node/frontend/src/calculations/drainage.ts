import PipeEntity from "../../../common/src/api/document/entities/pipe-entity";
import {GlobalStore} from "../htmlcanvas/lib/global-store";
import {CalculationContext} from "./types";
import {lowerBoundTable} from "../../../common/src/lib/utils";
import {NetworkType} from "../../../common/src/api/document/drawing";

export function sizeDrainagePipe(entity: PipeEntity, context: CalculationContext) {
    const calc = context.globalStore.getOrCreateCalculation(entity);
    const system = context.doc.drawing.metadata.flowSystems.find((s) => s.uid === entity.systemUid);

    if (!system) {
        return;
    }

    switch (entity.network) {
        case NetworkType.RISERS:
            if (calc.psdUnits !== null && calc.psdUnits.drainageUnits !== null) {
                for (const size of system.drainageProperties.stackPipeSizing) {
                    if (size.minUnits <= calc.psdUnits.drainageUnits && size.maxUnits >= calc.psdUnits.drainageUnits) {
                        calc.realNominalPipeDiameterMM = calc.optimalInnerPipeDiameterMM = size.sizeMM;
                        break;
                    }
                }
            }
            break;
        case NetworkType.RETICULATIONS:
            if (calc.psdUnits !== null && calc.psdUnits.drainageUnits !== null) {
                for (const size of system.drainageProperties.horizontalPipeSizing) {
                    if (size.minUnits <= calc.psdUnits.drainageUnits && size.maxUnits >= calc.psdUnits.drainageUnits) {
                        calc.realNominalPipeDiameterMM = calc.optimalInnerPipeDiameterMM = size.sizeMM;
                        calc.gradePCT = size.gradePCT;
                        break;
                    }
                }
            }
            break;
        case NetworkType.CONNECTIONS:
            // AKA vents.

            break;

    }

}