import { Catalog, PRVSize } from "../../../../common/src/api/catalog/types";
import { Units } from "../../../../common/src/lib/measurements";

export type Page<V> = {
    [K in keyof V]: {
        order: number | null;
        name: string;
        displayField?: keyof V[K];
        units?: Units;
        table?: Table<V[K][keyof V[K]]>;
    } | null;
};

export interface Table<TV> {
    primaryName: string | null;
    primaryUnits?: Units;
    columns: Array<[keyof TV | null, string, Units] | [keyof TV | null, string] | [keyof PRVSize, string, Units]>;
    link?: Page<TV> | null;
    twoDimensional?: boolean;
}

export type CatalogSchema = Page<Catalog>;

export function getCatalogDisplaySchema(): CatalogSchema {
    return {
        fixtures: {
            order: 1,
            name: "Fixtures",
            table: {
                primaryName: null,
                columns: [
                    ["name", "Name"],
                    ["abbreviation", "Abbreviation"],
                    ["maxInletPressureKPA", "Max. Inlet Pressure", Units.KiloPascals],
                    ["minInletPressureKPA", "Min. Inlet Pressure", Units.KiloPascals],
                    ["outletAboveFloorM", "Outlet Height", Units.Meters]
                ],
                link: {
                    name: { order: 1, name: "Fixture Name" },
                    abbreviation: { order: 2, name: "Abbreviation" },
                    uid: null,
                    fixtureUnits: { order: 3, name: "Fixture Units" },
                    loadingUnits: {
                        order: 4,
                        name: "Loading Units By PSD Method",
                        table: {
                            primaryName: "PSD Method",
                            columns: [
                                ["hot-water", "Hot LUs"],
                                ["warm-water", "Hot (Warm) LUs"],
                                ["cold-water", "Cold LUs"]
                            ]
                        }
                    },
                    qLS: {
                        order: 5,
                        name: "Full Flow Rate",
                        table: {
                            primaryName: " ",
                            columns: [[null, "Flow Rate", Units.LitersPerSecond]]
                        }
                    },
                    roughIns: null,
                    continuousFlowLS: {
                        order: 6,
                        name: "Continuous Flow Rate",
                        table: {
                            primaryName: " ",
                            columns: [[null, "Flow Rate", Units.LitersPerSecond]]
                        }
                    },

                    maxInletPressureKPA: { order: 7, name: "Max. Inlet Pressure", units: Units.KiloPascals },
                    minInletPressureKPA: { order: 8, name: "Min. Inlet Pressure", units: Units.KiloPascals },
                    probabilityOfUsagePCT: { order: 9, name: "Probability of Usage (%)" },
                    outletAboveFloorM: { order: 10, name: "Outlet Above Floor", units: Units.Meters },
                    warmTempC: { order: 11, name: "Warm Temperature", units: Units.Celsius }
                }
            }
        },
        psdStandards: {
            order: 2,
            name: "PSD Standards",
            table: {
                primaryName: null,
                columns: [
                    ["name", "Name"],
                    ["type", "Type"]
                ],
                link: {
                    name: { order: 1, name: "Name" },
                    type: { order: 2, name: "Type" },
                    equation: { order: 3, name: "Equation" },
                    variables: {
                        order: 4,
                        name: "Variables",
                        table: {
                            primaryName: "Variable",
                            columns: [[null, "Value"]]
                        }
                    },
                    table: {
                        order: 3,
                        name: "Loading Unit Table",
                        table: {
                            primaryName: "Loading Units",
                            columns: [[null, "Flow Rate", Units.LitersPerSecond]]
                        }
                    },
                    maxLuTable: {
                        order: 3,
                        name: "Loading Unit Table by Highest LU",
                        table: {
                            primaryName: "Highest LU / Total",
                            columns: [],
                            twoDimensional: true,
                        }
                    },
                    hotColdTable: {
                        order: 3,
                        name: "Loading Unit Table",
                        table: {
                            primaryName: "Loading Units",
                            columns: [
                                ["cold", "Cold Flow Rate", Units.LitersPerSecond],
                                ["hot", "Hot Flow Rate", Units.LitersPerSecond]
                            ]
                        }
                    }
                }
            }
        },
        dwellingStandards: {
            order: 3,
            name: "Dwelling Standards",
            table: {
                primaryName: null,
                columns: [
                    ["name", "Name"],
                    ["type", "Type"]
                ],
                link: {
                    name: { order: 1, name: "Name" },
                    type: { order: 2, name: "Type" },
                    hotColdTable: {
                        order: 3,
                        name: "Flow Rate Table",
                        table: {
                            primaryName: "Dwellings",
                            columns: [
                                ["hot", "Hot Flow Rate", Units.LitersPerSecond],
                                ["cold", "Cold Flow Rate", Units.LitersPerSecond]
                            ]
                        }
                    },
                    equation: { order: 3, name: "Equation" },
                    variables: {
                        order: 4,
                        name: "Variables",
                        table: {
                            primaryName: "Variable",
                            columns: [[null, "Value"]]
                        }
                    }
                }
            }
        },
        fluids: {
            order: 4,
            name: "Fluids",
            table: {
                primaryName: null,
                columns: [
                    ["name", "Name"],
                    ["densityKGM3", "Density (kg/m^3)"]
                ],
                link: {
                    name: { order: 1, name: "Name" },
                    densityKGM3: { order: 2, name: "Density (kg/m^3)" },
                    dynamicViscosityByTemperature: {
                        order: 3,
                        name: "Dynamic Viscosity By Temperature",
                        table: {
                            primaryName: "Temperature (°C)",
                            columns: [[null, "Dynamic Viscosity"]]
                        }
                    },
                    specificHeatByTemperatureKJ_KGK: {
                        order: 4,
                        name: "Specific Heat by Temperature (KJ/Kg*K)",
                        table: {
                            primaryName: "Temperature (°C)",
                            columns: [[null, "Specific Heat (KJ/Kg*K)"]]
                        }
                    }
                },
            }
        },
        pipes: {
            order: 5,
            name: "Pipes",
            table: {
                primaryName: null,
                columns: [
                    ["name", "Name"],
                    ["manufacturer", "Manufacturer"],
                    ["abbreviation", "Abbreviation"]
                ],
                link: {
                    name: { order: 1, name: "Material" },
                    manufacturer: { order: 2, name: "Manufacturer"},
                    abbreviation: { order: 3, name: "Abbreaviation" },
                    uid: null,
                    pipesBySize: {
                        order: 4,
                        name: "Pipe Sizes",
                        table: {
                            primaryName: "Nominal Diameter",
                            primaryUnits: Units.PipeDiameterMM,
                            columns: [
                                ["diameterInternalMM", "Internal Diameter", Units.Millimeters],
                                ["diameterOutsideMM", "Outside Diameter", Units.Millimeters],
                                ["colebrookWhiteCoefficient", "Colebrook White Coefficient"],
                                ["safeWorkingPressureKPA", "Safe Working Pressure", Units.KiloPascals]
                            ]
                        }
                    }
                }
            }
        },
        valves: {
            order: 6,
            name: "Valves",
            table: {
                primaryName: null,
                columns: [
                    ["name", "Name"],
                    ["abbreviation", "Abbreaviation"]
                ],
                link: {
                    name: { order: 1, name: "Name" },
                    uid: null,
                    abbreviation: { order: 2, name: "Abbreaviation" },
                    valvesBySize: {
                        order: 3,
                        name: "K values By Size",
                        table: {
                            primaryName: "Nominal Diameter",
                            primaryUnits: Units.PipeDiameterMM,
                            columns: [
                                ["symbol", "Symbol"],
                                ["kValue", "K Value"]
                            ]
                        }
                    }
                }
            }
        },
        mixingValves: {
            order: 7,
            name: "Mixing Valves",
            table: {
                primaryName: null,
                columns: [
                    ["name", "Name"],
                    ["manufacturer", "Manufacturer"],
                    ["minInletPressureKPA", "Min. Inlet Pressure", Units.KiloPascals],
                    ["maxInletPressureKPA", "Max. Inlet Pressure", Units.KiloPascals],
                    ["minFlowRateLS", "Min. Flow Rate", Units.LitersPerSecond],
                    ["maxFlowRateLS", "Max. Flow Rate", Units.LitersPerSecond]
                ],
                link: {
                    name: { order: 1, name: "Name" },
                    manufacturer: {order: 2, name: "Manufacturer"},
                    uid: null,
                    minInletPressureKPA: { order: 4, name: "Min. Inlet Pressure", units: Units.KiloPascals },
                    maxInletPressureKPA: { order: 5, name: "Max. Inlet Pressure", units: Units.KiloPascals },
                    minFlowRateLS: { order: 6, name: "Min. Flow Rate", units: Units.LitersPerSecond },
                    maxFlowRateLS: { order: 7, name: "Max. Flow Rate", units: Units.LitersPerSecond },
                    pressureLossKPAbyFlowRateLS: {
                        order: 8,
                        name: "Pressure Loss By Flow Rate",
                        table: {
                            primaryName: "Flow Rate",
                            primaryUnits: Units.LitersPerSecond,
                            columns: [[null, "Pressure Loss", Units.KiloPascals]]
                        }
                    },
                }
            }
        },
        prv: {
            order: 8,
            name: "Pressure Reducing Valves",
            table: {
                primaryName: "Nominal Diameter",
                primaryUnits: Units.PipeDiameterMM,
                columns: [
                    ["minInletPressureKPA", "Min. Inlet Pressure", Units.KiloPascals],
                    ["maxInletPressureKPA", "Max. Inlet Pressure", Units.KiloPascals],
                    ["minFlowRateLS", "Min. Flow Rate", Units.LitersPerSecond],
                    ["maxFlowRateLS", "Max. Flow Rate", Units.LitersPerSecond]
                ],
                link: {
                    diameterNominalMM: { order: 1, name: "Nominal Diameter", units: Units.PipeDiameterMM },
                    minInletPressureKPA: { order: 2, name: "Min. Inlet Pressure", units: Units.KiloPascals },
                    maxInletPressureKPA: { order: 3, name: "Max. Inlet Pressure", units: Units.KiloPascals },
                    maxPressureDropRatio: { order: 4, name: "Max. Pressure Drop Ratio" },
                    minFlowRateLS: { order: 5, name: "Min. Flow Rate", units: Units.LitersPerSecond },
                    maxFlowRateLS: { order: 6, name: "Max. Flow Rate", units: Units.LitersPerSecond }
                }
            }
        },
        backflowValves: {
            order: 9,
            name: "Backflow Valves",
            table: {
                primaryName: null,
                columns: [
                    ["name", "Name"],
                    ["manufacturer", "Manufacturer"],
                ],
                link: {
                    name: { order: 1, name: "Name" },
                    manufacturer: { order: 2, name: "Manufacturer"},
                    abbreviation: null,
                    uid: null,
                    valvesBySize: {
                        order: 4,
                        name: "Valves By Size",
                        table: {
                            primaryName: "Diameter",
                            primaryUnits: Units.Millimeters,
                            columns: [
                                ["minInletPressureKPA", "Min. Inlet Pressure", Units.KiloPascals],
                                ["maxInletPressureKPA", "Max. Inlet Pressure", Units.KiloPascals],
                                ["minFlowRateLS", "Min. Flow Rate", Units.LitersPerSecond],
                                ["maxFlowRateLS", "Max. Flow Rate", Units.LitersPerSecond]
                            ],
                            link: {
                                sizeMM: { order: 1, name: "Size", units: Units.Millimeters },
                                minInletPressureKPA: { order: 2, name: "Min. Inlet Pressure", units: Units.KiloPascals },
                                maxInletPressureKPA: { order: 3, name: "Max. Inlet Pressure", units: Units.KiloPascals },
                                minFlowRateLS: { order: 4, name: "Min. Flow Rate", units: Units.LitersPerSecond },
                                maxFlowRateLS: { order: 5, name: "Max. Flow Rate", units: Units.LitersPerSecond },
                                pressureLossKPAByFlowRateLS: {
                                    order: 1,
                                    name: "Pressure Loss by Flow Rate",
                                    table: {
                                        primaryName: "Flow Rate",
                                        primaryUnits: Units.LitersPerSecond,
                                        columns: [[null, "Pressure Loss", Units.KiloPascals ]]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        balancingValves: {
            order: 10,
            name: "Balancing Valves",
        },
        hotWaterPlant: {
            order: 11,
            name: "Heated Water Circulating Pumps",
            table: {
                primaryName: "Grundfos Settings",
                columns: [],
                link: {
                    grundfosPressureDrop: {
                        order: 1,
                        name: "Pressure Loss by Flow Rate",
                        table: {
                            primaryName: 'Q (l/s)',
                            columns: [[null, "H (kPa)"]]
                        }
                    }
                }
            }
        }
    };
}
