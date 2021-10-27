import Fitting from "../../../htmlcanvas/objects/fitting";
import Pipe from "../../../htmlcanvas/objects/pipe";
import Riser from "../../../htmlcanvas/objects/riser";
import { fillDirectedValveFields } from "../../../store/document/entities/fillDirectedValveFields";
import { DocumentState } from "../../../store/document/types";
import DirectedValveEntity from "../../../../../common/src/api/document/entities/directed-valves/directed-valve-entity";
import { ValveType } from "../../../../../common/src/api/document/entities/directed-valves/valve-types";
import { fillPipeDefaultFields } from "../../../../../common/src/api/document/entities/pipe-entity";
import RiserEntity, { fillRiserDefaults } from "../../../../../common/src/api/document/entities/riser-entity";
import { EntityType } from "../../../../../common/src/api/document/entities/types";
import { BaseBackedConnectable } from "../BackedConnectable";
import { GlobalStore } from "../global-store";
import { Coord } from "../../../../../common/src/api/document/drawing";
import { EPS } from "../../../../../common/src/lib/utils";


export function jsonExport(document: DocumentState, globalStore: GlobalStore) {
    const result: {
        [key: string]: {
            [key: string]: {
                [key: string]: {
                    [key: string]: Array<{
                        networkType: string | null;
                        fittingName: string | null;
                        pipeSystem: string | null;
                        pipeMaterial: string | null;
                        pipeSizeMM: number | null;
                        pipeStart: null | Coord;
                        pipeEnd: null | Coord;
                        z: null | number;
                        valveType: string | null;
                        valveSystem: string[] | null;
                        valveSizeMM: number | null;
                        center: Coord | null;
                        bottomHeightM: number | null;
                        topHeightM: number | null;
                    }>;
                };
            };
        };
    } = {};

    console.log("Revit Export");

    for (const [luid, lprops] of Object.entries(document.drawing.levels)) {
        const entities = Array.from(globalStore.entitiesInLevel.get(luid) || new Set<string>()).map(
            (uid) => globalStore.get(uid)!.entity
        );

        entities.forEach((entity) => {
            if (entity.type === EntityType.PIPE) {
                const o = globalStore.get(entity.uid) as Pipe;
                const filled = fillPipeDefaultFields(document.drawing, o.computedLengthM, o.entity);
                const system = document.drawing.metadata.flowSystems.find((s) => s.uid === filled.systemUid);
                const calc = globalStore.getOrCreateCalculation(o.entity);

                const pipeStart= globalStore.get(filled.endpointUid[0]) as BaseBackedConnectable;
                const pipeEnd = globalStore.get(filled.endpointUid[1]) as BaseBackedConnectable;
                
                const pipeStartPoint = pipeStart.toWorldCoord({ x: 0, y: 0 });
                const pipeEndPoint = pipeEnd.toWorldCoord({ x: 0, y: 0 });

                // skip pipes of 0 length
                if (Math.abs(pipeStartPoint.x - pipeEndPoint.x) < EPS && Math.abs(pipeStartPoint.y - pipeEndPoint.y) < EPS) {
                    console.log(`Skipped 0 length pipe l=${lprops.abbreviation} uid=${entity.uid}`)
                    return;
                }

                // skip pipes of null size
                if (!calc.realNominalPipeDiameterMM) {
                    console.log(`Skipped null size pipe l=${lprops.abbreviation} uid=${entity.uid}`)
                    return;
                }                

                let data: Array<any> = [];
                if (
                    typeof result[lprops.abbreviation] !== "undefined" &&
                    typeof result[lprops.abbreviation][filled!.network] !== "undefined" &&
                    typeof result[lprops.abbreviation][filled!.network][system!.name] !== "undefined" &&
                    typeof result[lprops.abbreviation][filled!.network][system!.name]["pipes"] !== "undefined"
                ) 
                {
                    data = result[lprops.abbreviation][filled!.network][system!.name]["pipes"];
                }

                result[lprops.abbreviation] = {
                    ...result[lprops.abbreviation],
                        [filled!.network]: 
                    {
                        ...(result[lprops.abbreviation] && 
                            result[lprops.abbreviation][filled!.network]),
                            [system!.name]: 
                        {
                            ...(result[lprops.abbreviation] && 
                                result[lprops.abbreviation][filled!.network] && 
                                result[lprops.abbreviation][filled!.network][system!.name]),
                                pipes: 
                            [
                                ...data,
                                {
                                    // fittingName: null,
                                    networkType: filled!.network,
                                    pipeSystem: system!.name,
                                    pipeMaterial: filled.material,
                                    pipeSizeMM: calc.realNominalPipeDiameterMM,
                                    pipeStart:  pipeStartPoint,
                                    pipeEnd: pipeEndPoint,
                                    z: lprops.floorHeightM + filled.heightAboveFloorM,
                                    // valveType: null,
                                    // valveSystem: null,
                                    // valveSizeMM: null,
                                    // center: null
                                }
                            ]
                        }
                    }
                };
            } else if (entity.type === EntityType.FITTING) {
                const o = globalStore.get(entity.uid) as Fitting;
                const connections = globalStore.getConnections(entity.uid);
                const zArray: Array<number> = [];
                const sizeMMArray: Array<number> = [];
                connections.forEach((uid) => {
                    const conObj = globalStore.get(uid);

                    if (conObj instanceof Pipe) {
                        const calc = globalStore.getOrCreateCalculation(conObj.entity);

                        zArray.push(conObj.entity.heightAboveFloorM);
                        sizeMMArray.push(calc.realNominalPipeDiameterMM || 0);
                    }
                });
                const minPipeSizeMM = Math.min(...sizeMMArray)
                // skip fittings of size 0
                if (!minPipeSizeMM) {
                    console.log(`Skipped null size fitting l=${lprops.abbreviation} uid=${entity.uid}`)
                    return;                        
                }                

                const system = document.drawing.metadata.flowSystems.find((s) => s.uid === entity.systemUid);
        
                const center = o.toWorldCoord({ x: 0, y: 0 });
            
                let data: Array<any> = [];
                if (
                    typeof result[lprops.abbreviation] !== "undefined" &&
                    typeof result[lprops.abbreviation]["RETICULATIONS"] !== "undefined" &&
                    typeof result[lprops.abbreviation]["RETICULATIONS"][system!.name] !== "undefined" &&
                    typeof result[lprops.abbreviation]["RETICULATIONS"][system!.name]["fittings"] !== "undefined"
                ) {
                    data = result[lprops.abbreviation]["RETICULATIONS"][system!.name]["fittings"];
                }

                result[lprops.abbreviation] = {
                    ...result[lprops.abbreviation],
                        ["RETICULATIONS"]:
                    {
                        ...(result[lprops.abbreviation] && 
                            result[lprops.abbreviation]["RETICULATIONS"]),
                            [system!.name]: 
                        {
                            ...(result[lprops.abbreviation] && 
                                result[lprops.abbreviation]["RETICULATIONS"] && 
                                result[lprops.abbreviation]["RETICULATIONS"] [system!.name]),
                                fittings: 
                            [
                                ...data,
                                {
                                    networkType: "RETICULATIONS",
                                    fittingName: o.friendlyTypeName,
                                    pipeSystem: system!.name,
                                    // pipeMaterial: null,
                                    pipeSizeMM: minPipeSizeMM,
                                    // pipeStart: null,
                                    // pipeEnd: null,
                                    // valveType: null,
                                    // valveSystem: null,
                                    // valveSizeMM: null,
                                    center: center,
                                    z: lprops.floorHeightM + Math.min(...zArray)
                                }
                            ]
                        }
                    }
                };
            } else if (entity.type === EntityType.DIRECTED_VALVE) {
                const o = globalStore.get(entity.uid) as Pipe;
                const center = o.toWorldCoord({ x: 0, y: 0 });

                const connections = globalStore.getConnections(entity.uid);
                const zArray: Array<number> = [];
                const sizeMMArray: Array<number> = [];
                connections.forEach((uid) => {
                    const conObj = globalStore.get(uid);

                    if (conObj instanceof Pipe) {
                        const calc = globalStore.getOrCreateCalculation(conObj.entity);

                        zArray.push(conObj.entity.heightAboveFloorM);
                        sizeMMArray.push(calc.realNominalPipeDiameterMM || 0);
                    }
                });

                const minPipeSizeMM = Math.min(...sizeMMArray)

                const filled = fillDirectedValveFields(document.drawing, globalStore, entity);
                const system = document.drawing.metadata.flowSystems.find(
                    (s) => s.uid === filled.systemUidOption
                );
                const valveWithSize = [
                    ValveType.RPZD_SINGLE,
                    ValveType.RPZD_DOUBLE_SHARED,
                    ValveType.RPZD_DOUBLE_ISOLATED,
                    ValveType.PRV_SINGLE,
                    ValveType.PRV_DOUBLE,
                    ValveType.PRV_TRIPLE
                ];

                let valveSizeMM = null;
                if (valveWithSize.includes(entity.valve.type)) {
                    const valveEntity = entity as DirectedValveEntity
                    const calc = globalStore.getOrCreateCalculation(valveEntity);
                    valveSizeMM = calc.sizeMM;
                }

                if (!valveSizeMM && !minPipeSizeMM) {
                    console.log(`Skipped 0 size valve l=${lprops.abbreviation} uid=${entity.uid}`)
                    return;
                }

                if (system) {
                    let data: Array<any> = [];
                    if (
                        typeof result[lprops.abbreviation] !== "undefined" &&
                        typeof result[lprops.abbreviation]["RETICULATIONS"] !== "undefined" &&
                        typeof result[lprops.abbreviation]["RETICULATIONS"][system.name] !== "undefined" &&
                        typeof result[lprops.abbreviation]["RETICULATIONS"][system.name]["valves"] !== "undefined"
                    ) {
                        data = result[lprops.abbreviation]["RETICULATIONS"][system.name]["valves"];
                    }

                    result[lprops.abbreviation] = {
                        ...result[lprops.abbreviation],
                            ["RETICULATIONS"]: 
                        {
                            ...(result[lprops.abbreviation] && 
                                result[lprops.abbreviation]["RETICULATIONS"]),
                                [system!.name]: 
                            {
                                ...(result[lprops.abbreviation] && 
                                    result[lprops.abbreviation]["RETICULATIONS"] && 
                                    result[lprops.abbreviation]["RETICULATIONS"][system.name]),
                                valves: [
                                    ...data,
                                    {
                                        // fittingName: null,
                                        // networkType: null,
                                        // pipeSystem: null,
                                        // pipeMaterial: null,
                                        // pipeSizeMM: null,
                                        // pipeStart: null,
                                        // pipeEnd: null,
                                        networkType: "RETICULATIONS",
                                        valveType: filled.valve.catalogId,
                                        valveSystem: [system.name],
                                        valveSizeMM: valveSizeMM || minPipeSizeMM,
                                        center: center,
                                        z: lprops.floorHeightM + Math.min(...zArray)
                                    }
                                ]
                            }
                        }
                    };
                }
            } else if (entity.type === EntityType.BIG_VALVE) {
                const o = globalStore.get(entity.uid) as Pipe;
                const center = o.toWorldCoord();
                let data: Array<any> = [];
                if (
                    typeof result[lprops.abbreviation] !== "undefined" &&
                    typeof result[lprops.abbreviation]["RETICULATIONS"] !== "undefined" &&
                    typeof result[lprops.abbreviation]["RETICULATIONS"]["HOT_COLD"] !== "undefined" &&
                    typeof result[lprops.abbreviation]["RETICULATIONS"]["HOT_COLD"]["valves"] !== "undefined"
                ) {
                    data = result[lprops.abbreviation]["RETICULATIONS"]["HOT_COLD"]["valves"];
                }

                result[lprops.abbreviation] = {
                    ...result[lprops.abbreviation],
                        ["RETICULATIONS"]: 
                    {
                        ...(result[lprops.abbreviation] && 
                            result[lprops.abbreviation]["RETICULATIONS"]),
                            ["HOT_COLD"]: 
                        {
                            ...(result[lprops.abbreviation] && 
                                result[lprops.abbreviation]["RETICULATIONS"] && 
                                result[lprops.abbreviation]["RETICULATIONS"]["HOT_COLD"]),
                                valves: 
                            [
                                ...data,
                                {
                                    // fittingName: null,
                                    // networkType: null,
                                    // pipeSystem: null,
                                    // pipeMaterial: null,
                                    // pipeSizeMM: null,
                                    // pipeStart: null,
                                    // pipeEnd: null,
                                    networkType: "RETICULATIONS",
                                    valveType: entity.valve.type,
                                    valveSystem: ["HOT_COLD"],
                                    // valveSizeMM: null,
                                    center: center,
                                    z: lprops.floorHeightM + entity.heightAboveFloorM,
                                }
                            ]
                        }
                    }
                };
            }
        });

        globalStore.forEach((obj) => {
            if (obj instanceof Riser) {
                const system = document.drawing.metadata.flowSystems.find(
                    (s) => s.uid === obj.entity.systemUid
                );

                const re = obj.entity as RiserEntity;
                const filled = fillRiserDefaults(document.drawing, re);
                if (system) {
                    const calculation = globalStore.getOrCreateCalculation(obj.entity);
                    const currentLevelCalc = Object.entries(calculation.heights).find(
                        ([uid, props]) => uid === lprops.uid
                    );
                    const riserSize = currentLevelCalc ? currentLevelCalc![1]?.sizeMM : null;
                    let riserSizeInMM
                    if (riserSize === null) {
                        // riser is set to minimum size when null.
                        riserSizeInMM = system.networks.RISERS.minimumPipeSize;
                    } else if (riserSize !== null) {
                        riserSizeInMM = currentLevelCalc![1]?.sizeMM
                    };
                    // riser that has the highest pipe size will on be shown.
                    const riserEntries = [].concat.apply([], Object.entries(calculation.heights) as any[]);
                    const sizeList = riserEntries.map(function(row: { sizeMM: any; }){ return row.sizeMM });

                    const data = sizeList.filter(function( element: any ) {
                        return element !== undefined;
                    });
                    const maxRiserSize = Math.max.apply(null, data);
          
                    if (maxRiserSize === riserSizeInMM) {
             
                        const filteredSizeMM =  riserEntries.filter(function(row: { sizeMM: any;}) {
                            if (row.sizeMM === maxRiserSize) { return row }
                        });

                        const filteredHeightAbove = filteredSizeMM.map(function(row: { heightAboveGround: any; }){ return row.heightAboveGround });
                        const maxHeight = Math.max.apply(null, filteredHeightAbove);
                        if (currentLevelCalc![1]?.heightAboveGround === maxHeight) {
                            let data: Array<any> = [];
                            if (
                                typeof result[lprops.abbreviation] !== "undefined" &&
                                typeof result[lprops.abbreviation]["RISERS"] !== "undefined" &&
                                typeof result[lprops.abbreviation]["RISERS"][system.name] !== "undefined" &&
                                typeof result[lprops.abbreviation]["RISERS"][system.name]["risers"] !== "undefined"
                            ) {
                                data = result[lprops.abbreviation]["RISERS"][system.name]["risers"];
                            }

                            result[lprops.abbreviation] = {
                                ...result[lprops.abbreviation],
                                    ["RISERS"]: 
                                {
                                    ...(result[lprops.abbreviation] && 
                                        result[lprops.abbreviation]["RISERS"]),
                                        [system.name]: 
                                    {
                                        ...(result[lprops.abbreviation] && 
                                            result[lprops.abbreviation]["RISERS"] && 
                                            result[lprops.abbreviation]["RISERS"][system.name]),
                                            risers: 
                                        [
                                            ...data,
                                            {
                                                // fittingName: null,
                                                networkType: "RISERS",
                                                // pipeSystem: null,
                                                // pipeMaterial: null,
                                                pipeSizeMM: riserSizeInMM,
                                                material: filled.material,
                                                // pipeStart: null,
                                                // pipeEnd: null,
                                                // z: Infinity,
                                                // valveType: null,
                                                // valveSystem: null,
                                                // valveSizeMM: null,
                                                center: filled.center,
                                                bottomHeightM:  filled.bottomHeightM,
                                                topHeightM:  filled.topHeightM,
                                            }
                                        ]
                                    }
                                }
                            };
                        }
                    }
                }
            }
        });
    }
    return result
}
