import { Catalog } from "../../../../common/src/api/catalog/types";
import { EN12056FrequencyFactor } from "../../../../common/src/api/config";

export default interface CatalogState {
    defaultCatalog: Catalog;
    loaded: boolean;
}

export const defaultCatalog: Catalog = {
    valves: {},
    fixtures: {},
    pipes: {},
    mixingValves: {},
    psdStandards: {},
    en12056FrequencyFactor: {
        [EN12056FrequencyFactor.IntermittentUse]: 0.5,
        [EN12056FrequencyFactor.FrequentUse]: 0.7,
        [EN12056FrequencyFactor.CongestedUse]: 1.0,
        [EN12056FrequencyFactor.SpecialUse]: 1.2,
    },
    dwellingStandards: {},
    gasDiversification: {},
    fluids: {},
    backflowValves: {},
    prv: {
        manufacturer: [],
        size: {},
    },
    balancingValves: {
        manufacturer: [],
    },
    hotWaterPlant: {
        manufacturer: [],
        rheemVariants: [],
        grundfosPressureDrop: {},
        size: {},
        storageTanks: {},
    },
    floorWaste: {
        manufacturer: [],
        size: {},
    },
    inspectionOpening: {
        manufacturer: [],
        size: {},
    },
};
