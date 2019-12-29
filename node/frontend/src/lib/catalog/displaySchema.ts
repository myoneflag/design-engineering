import CatalogState, {
    Catalog,
    DwellingSpec,
    FixtureSpec,
    FluidsSpec, LoadingUnit,
    MixingValveSpec,
    PipeMaterial,
    PSDSpec,
    ValveSpec
} from "../../store/catalog/types";

type AllKeysOf<T> = {
    [P in keyof T]: any;
};


export type Page<V> = {
    [K in keyof V]: {
        order: number | null,
        name: string,
        displayField?: keyof V[K],
        table?: Table<V[K][keyof V[K]]>,
    } | null;
};

export interface Table<TV> {
    primaryName: string | null,
    columns: ([keyof TV | null, string])[],
    link?: Page<TV> | null,
}

export type CatalogSchema = Page<Catalog>;

export function getCatalogDisplaySchema(): CatalogSchema {
    return {
        fixtures: {
            order: 1,
            name: 'Fixtures',
            table: {
                primaryName: null,
                columns: [
                    ['name', 'Name'],
                    ['abbreviation', 'Abbreaviation'],

                    ['maxInletPressureKPA', 'Max. Inlet Pressure (kPa)'],
                    ['minInletPressureKPA', 'Min. Inlet Pressure (kPa)'],
                    ['outletAboveFloorM', 'Outlet Height (M)'],
                ],
                link: {
                    name: {order: 1, name: 'Fixture Name'},
                    abbreviation: {order: 2, name: 'Abbreaviation'},
                    uid: null,
                    fixtureUnits: {order: 3, name: 'Fixture Units'},
                    loadingUnits: {
                        order: 4,
                        name: 'Loading Units By PSD Method',
                        table: {
                            primaryName: 'PSD Method',
                            columns: [
                                ['hot', 'Hot LUs'],
                                ['cold', 'Cold LUs'],
                            ]
                        }
                    },
                    qLS: {
                        order: 5,
                        name: 'Design Flow Rate (L/s)',
                        table: {
                            primaryName: ' ',
                            columns: [
                                [null, 'Flow Rate'],
                            ]
                        }
                    },
                    continuousFlowLS: {order: 6, name: 'Continuous Flow Rate'},

                    maxInletPressureKPA: {order: 7, name: 'Max. Inlet Pressure (kPa)'},
                    minInletPressureKPA: {order: 8, name: 'Min. Inlet Pressure (kPa)'},
                    probabilityOfUsagePCT: {order: 9, name: 'Probability of Usage (%)'},
                    outletAboveFloorM: {order: 10, name: 'Outlet Above Floor (M)'},
                    warmTempC: {order: 11, name: 'Warm Temperature (C)'},
                }
            }
        },
        psdStandards: {
            order: 2,
            name: "PSD Standards",
            table: {
                primaryName: null,
                columns: [
                    ['name', 'Name'],
                    ['type', 'Type'],
                ],
                link: {
                    name: {order: 1, name: 'Name'},
                    type: {order: 2, name: 'Type'},
                    equation: {order: 3, name: 'Equation'},
                    variables: {
                        order: 4,
                        name: 'Variables',
                        table: {
                            primaryName: 'Variable',
                            columns: [
                                [null, 'Value'],
                            ],
                        }
                    },
                    table: {
                        order: 3,
                        name: 'Loading Unit Table',
                        table: {
                            primaryName: 'Loading Units',
                            columns: [
                                [null, 'Flow Rate (L/S)'],
                            ],
                        },
                    },
                    hotColdTable: {
                        order: 3,
                        name: 'Loading Unit Table',
                        table: {
                            primaryName: 'Loading Units',
                            columns: [
                                ['cold', 'Cold Flow Rate (L/s)'],
                                ['hot', 'Hot Flow Rate (L/s)'],
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
                    ['name', 'Name'],
                    ['type', 'Type'],
                ],
                link: {
                    name: {order: 1, name: "Name"},
                    type: {order: 2, name: "Type"},
                    hotColdTable: {
                        order: 3,
                        name: "Flow Rate Table",
                        table: {
                            primaryName: "Dwellings",
                            columns: [
                                ['hot', 'Hot Flow Rate (L/s)'],
                                ['cold', 'Cold Flow Rate (L/s)'],
                            ],
                        },
                    },
                    equation: {order: 3, name: 'Equation'},
                    variables: {
                        order: 4,
                        name: 'Variables',
                        table: {
                            primaryName: 'Variable',
                            columns: [
                                [null, 'Value'],
                            ],
                        }
                    },
                }
            }
        },
        fluids: {
            order: 4,
            name: "Fluids",
            table: {
                primaryName: null,
                columns: [
                    ['name', 'Name'],
                    ['densityKGM3', 'Density (kg/m^3)'],
                ],
                link: {
                    name: {order: 1, name: 'Name'},
                    densityKGM3: {order: 2, name: 'Density (kg/m^3)'},
                    dynamicViscosityByTemperature: {
                        order: 3,
                        name: 'Dynamic Viscosity By Temperature',
                        table: {
                            primaryName: 'Temperature (C)',
                            columns: [
                                [null, 'Dynamic Viscosity'],
                            ]
                        }
                    }
                }
            }
        },
        pipes: {
            order: 5,
            name: 'Pipes',
            table: {
                primaryName: null,
                columns: [
                    ['name', 'Name'],
                    ['abbreviation', 'Abbreviation'],
                ],
                link: {
                    name: {order: 1, name: 'Material'},
                    abbreviation: {order: 2, name: 'Abbreaviation'},
                    uid: null,
                    pipesBySize: {
                        order: 3,
                        name: 'Pipe Sizes',
                        table: {
                            primaryName: 'Nominal Diameter (mm)',
                            columns: [
                                ['diameterInternalMM', 'Internal Diameter (mm)'],
                                ['colebrookWhiteCoefficient', 'Colebrook White Coefficient'],
                                ['safeWorkingPressureKPA', 'Safe Working Pressure (kPa)'],
                            ]
                        }
                    }

                }
            }
        },
        valves: {
            order: 6,
            name: 'Valves',
            table: {
                primaryName: null,
                columns: [
                    ['name', 'Name'],
                    ['abbreviation', 'Abbreaviation'],
                ],
                link: {
                    name: {order: 1, name: 'Name'},
                    uid: null,
                    abbreviation: {order: 2, name: 'Abbreaviation'},
                    valvesBySize: {
                        order: 3,
                        name: 'K values By Size',
                        table: {
                            primaryName: 'Nominal Diameter (mm)',
                            columns: [
                                ['symbol', 'Symbol'],
                                ['kValue', 'K Value'],
                            ]
                        }
                    }

                }
            }
        },
        mixingValves: {
            order: 7,
            name: 'Mixing Valves',
            table: {
                primaryName: null,
                columns: [
                    ['name', 'Name'],
                    ['minInletPressureKPA', 'Min. Inlet Pressure (kPa)'],
                    ['maxInletPressureKPA', 'Max. Inlet Pressure (kPa)'],
                    ['maxHotColdPressureDifferentialPCT', 'Max Hot/Cold Pressure Differential (%)'],
                    ['minFlowRateLS', 'Min. Flow Rate (L/s)'],
                    ['maxFlowRateLS', 'Max. Flow Rate (L/s)'],
                ],
                link: {
                    name: {order: 1, name: 'Name'},
                    uid: null,
                    minInletPressureKPA: {order: 2, name: 'Min. Inlet Pressure (kPa)'},
                    maxInletPressureKPA: {order: 3, name: 'Max. Inlet Pressure (kPa)'},
                    maxHotColdPressureDifferentialPCT: {order: 4, name: 'Max Hot/Cold Pressure Differential (%)'},
                    minFlowRateLS: {order: 5, name: 'Min. Flow Rate (L/s)'},
                    maxFlowRateLS: {order: 6, name: 'Max. Flow Rate (L/s)'},
                    pressureLossKPAbyFlowRateLS: {
                        order: 7,
                        name: 'Pressure Loss By Flow Rate (KPA x L/s)',
                        table: {
                            primaryName: 'Flow Rate (L/s)',
                            columns: [
                                [null, 'Pressure Loss (kPa)'],
                            ],
                        }
                    }
                }
            }
        },
        backflowValves: {
            order: 8,
            name: 'Backflow Valves',
            table: {
                primaryName: null,
                columns: [
                    ['name', 'Name'],
                ],
                link: {
                    name: {order: 1, name: 'Name'},
                    valvesBySize: {
                        order: 1,
                        name: 'Valves By Size',
                        table: {
                            primaryName: 'Diameter (m)',
                            columns: [
                                ['minInletPressureKPA', 'Min. Inlet Pressure (kPa)'],
                                ['maxInletPressureKPA', 'Max. Inlet Pressure (kPa)'],
                                ['minFlowRateLS', 'Min. Flow Rate (L/s)'],
                                ['maxFlowRateLS', 'Max. Flow Rate (L/s)'],
                            ],
                            link: {
                                minInletPressureKPA: {order: 1, name: 'Min. Inlet Pressure (kPa)'},
                                maxInletPressureKPA: {order: 2, name: 'Max. Inlet Pressure (kPa)'},
                                minFlowRateLS: {order: 3, name: 'Min. Flow Rate (L/s)'},
                                maxFlowRateLS: {order: 4, name: 'Max. Flow Rate (L/s)'},
                                pressureLossKPAByFlowRateLS: {
                                    order: 1,
                                    name: 'Pressure Loss (kPa) by Flow Rate (L/s)',
                                    table: {
                                        primaryName: 'Flow Rate (L/s)',
                                        columns: [
                                            [null, 'Pressure Loss (kPa)'],
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
