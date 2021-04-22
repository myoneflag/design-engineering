import { SupportedPsdStandards, isLUStandard } from './../../../../../common/src/api/config';
import { NodeType } from './../../../../../common/src/api/document/entities/load-node-entity';
import { DocumentState } from "../types";
import { ObjectStore } from "../../../htmlcanvas/lib/object-store";
import { cloneSimple, parseCatalogNumberOrMin, parseCatalogNumberExact } from "../../../../../common/src/lib/utils";
import { determineConnectableSystemUid } from "./lib";
import LoadNodeEntity from "../../../../../common/src/api/document/entities/load-node-entity";
import { NodeProps } from '../../../../../common/src/models/CustomEntity';
import { Catalog } from '../../../../../common/src/api/catalog/types';

export function fillDefaultLoadNodeFields(doc: DocumentState, objectStore: ObjectStore, value: LoadNodeEntity, catalog: Catalog, nodes: NodeProps[]) {
    const result = cloneSimple(value);

    const systemUid = determineConnectableSystemUid(objectStore, value);
    const system = doc.drawing.metadata.flowSystems.find((s) => s.uid === systemUid);
    const selectedMaterialManufacturer = doc.drawing.metadata.catalog.fixtures.find(obj => obj.uid === value.uid);
    const manufacturer = selectedMaterialManufacturer?.manufacturer || 'generic';
    const selectedOption = selectedMaterialManufacturer?.selected || 'default';

    result.systemUidOption = system ? system.uid : null;

    if (system) {
        if (result.color == null) {
            result.color = system.color;
        }
    } else {
        if (result.color == null) {
            result.color = { hex: "#888888" };
        }
    }

    if (result.minPressureKPA === null && typeof result.customNodeId === "undefined") {
        result.minPressureKPA = 200;
    }
    if (result.maxPressureKPA === null && typeof result.customNodeId === "undefined") {
        result.maxPressureKPA = 500;
    }

    if (typeof result.customNodeId !== "undefined") {
        const node = nodes.find((node: NodeProps) => node.id === result.customNodeId || node.uid === result.customNodeId)!;

        result.name = node.name;
        result.minPressureKPA = result.minPressureKPA === null && (node.minPressure ? Number(node.minPressure) : null) || result.minPressureKPA;
        result.maxPressureKPA = result.maxPressureKPA === null && (node.maxPressure ? Number(node.maxPressure) : null) || result.maxPressureKPA;

        const psdStrategy = doc.drawing
            ? doc.drawing.metadata.calculationParams.psdMethod
            : SupportedPsdStandards.as35002018LoadingUnits;


        let loadingUnits = 0;
        let designFlowRateLS = 0;
        let continuousFlow = 0;
        let upcFixtureUnits = 0;
        let asnzFixtureUnits = 0;
        let enDischargeUnits = 0;

        if (!result.node.loadingUnits 
            || !result.node.designFlowRateLS
            || !result.node.continuousFlowLS)
        {
            for (var i = 0; i < node.fixtures.length; i++) {
                const selectedMaterialManufacturer = doc.drawing.metadata.catalog.fixtures.find(obj => obj.uid === node.fixtures[i]);
                const manufacturer = selectedMaterialManufacturer?.manufacturer || 'generic';
                const selectedOption = selectedMaterialManufacturer?.selected || 'default';

                if (result.node.loadingUnits === null
                    && isLUStandard(psdStrategy)
                    && result.systemUidOption)
                {
                    let systemChk = null;
                    if (!!(catalog.fixtures[node.fixtures[i]].loadingUnits[psdStrategy][result.systemUidOption])) {
                        systemChk = result.systemUidOption;
                    } else if (result.systemUidOption === 'hot-water' && !!(catalog.fixtures[node.fixtures[i]].loadingUnits[psdStrategy]['warm-water'])) {
                        systemChk = 'warm-water';
                    }

                    if (systemChk) {
                        if (result.node.type === NodeType.DWELLING) {
                            loadingUnits += (parseCatalogNumberOrMin(catalog.fixtures[node.fixtures[i]].loadingUnits[psdStrategy][systemChk])! * result.node.dwellings);
                        } else {
                            loadingUnits += parseCatalogNumberOrMin(catalog.fixtures[node.fixtures[i]].loadingUnits[psdStrategy][systemChk])!;
                        }
                    }
                }

                if (result.node.designFlowRateLS === null 
                    && result.systemUidOption)
                {   
                    let systemChk = null;
                    if (!!(catalog.fixtures[node.fixtures[i]].qLS[manufacturer][selectedOption][result.systemUidOption])) {
                        systemChk = result.systemUidOption;
                    } else if (result.systemUidOption === 'hot-water' && !!(catalog.fixtures[node.fixtures[i]].qLS[manufacturer][selectedOption]['warm-water'])) {
                        systemChk = 'warm-water';
                    }

                    if (systemChk) {
                        designFlowRateLS += parseCatalogNumberOrMin(catalog.fixtures[node.fixtures[i]].qLS[manufacturer][selectedOption][systemChk])!;
                    }
                }

                const continuousFlowLS = catalog.fixtures[node.fixtures[i]].continuousFlowLS;
                if (continuousFlowLS
                    && result.node.continuousFlowLS === null
                    && result.systemUidOption
                    && !!(continuousFlowLS[result.systemUidOption])) 
                {
                    let systemChk = null;
                    if (!!(continuousFlowLS[result.systemUidOption])) {
                        systemChk = result.systemUidOption;
                    } else if (result.systemUidOption === 'hot-water' && !!(continuousFlowLS['warm-water'])) {
                        systemChk = 'warm-water';
                    }

                    if (systemChk) {
                        continuousFlow += parseCatalogNumberExact(continuousFlowLS[systemChk])!;
                    }
                }

                asnzFixtureUnits += parseCatalogNumberExact(catalog.fixtures[node.fixtures[i]].asnzFixtureUnits) || 0;
                upcFixtureUnits += parseCatalogNumberExact(catalog.fixtures[node.fixtures[i]].upcFixtureUnits) || 0;
                enDischargeUnits += parseCatalogNumberExact(catalog.fixtures[node.fixtures[i]].enDischargeUnits) || 0;
            }
        }

        if (result.node.loadingUnits === null) {
            result.node.loadingUnits = loadingUnits;
        }
        if (result.node.designFlowRateLS === null) {
            result.node.designFlowRateLS = designFlowRateLS;
        }
        if (result.node.continuousFlowLS === null) {
            result.node.continuousFlowLS = continuousFlow;
        }

        if (result.node.upcFixtureUnits === null) {
            result.node.upcFixtureUnits = upcFixtureUnits;
        }
        if (result.node.asnzFixtureUnits === null) {
            result.node.asnzFixtureUnits = asnzFixtureUnits;
        }
        if (result.node.enDischargeUnits === null) {
            result.node.enDischargeUnits = enDischargeUnits;
        }
    }

    return result;
}
