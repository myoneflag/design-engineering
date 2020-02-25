import { DwellingStandardType, PSDStandardType } from "../psd-standard/types";
import { Catalog } from "../types";

export const initialCatalog = {
    fixtures: {
        ablutionTrough: {
            abbreviation: "AT",
            fixtureUnits: "3",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "3",
                    "warm-water": "3"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "3",
                    "warm-water": "3"
                },
                barriesBookDwellings: {
                    "cold-water": "3",
                    "warm-water": "3"
                }
            },
            roughIns: ["warm-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Ablution Trough",
            outletAboveFloorM: "1",
            probabilityOfUsagePCT: "2",
            qLS: {
                "cold-water": "0.15",
                "warm-water": "0.15"
            },
            uid: "ablutionTrough",
            warmTempC: "42"
        },
        basin: {
            abbreviation: "B",
            fixtureUnits: "1",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "1",
                    "warm-water": "1"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "1",
                    "warm-water": "1"
                },
                barriesBookDwellings: {
                    "cold-water": "1",
                    "warm-water": "1"
                }
            },
            roughIns: ["warm-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Basin",
            outletAboveFloorM: "1",
            probabilityOfUsagePCT: "2",
            qLS: {
                "cold-water": "0.1",
                "warm-water": "0.1"
            },
            uid: "basin",
            warmTempC: "42"
        },
        bath: {
            abbreviation: "BT",
            fixtureUnits: "4",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "8",
                    "warm-water": "4"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "8",
                    "warm-water": "8"
                },
                barriesBookDwellings: {
                    "cold-water": "8",
                    "warm-water": "8"
                }
            },
            roughIns: ["warm-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Bath",
            outletAboveFloorM: "0.75",
            probabilityOfUsagePCT: "1",
            qLS: {
                "cold-water": "0.3",
                "warm-water": "0.3"
            },
            uid: "bath",
            warmTempC: "42"
        },
        bedpanSanitiser: {
            abbreviation: "BPST",
            fixtureUnits: "6",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "2",
                    "hot-water": "2"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "2",
                    "hot-water": "2"
                },
                barriesBookDwellings: {
                    "cold-water": "2",
                    "hot-water": "2"
                }
            },
            roughIns: ["hot-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Bedpan Sanitiser",
            outletAboveFloorM: "1",
            probabilityOfUsagePCT: "2",
            qLS: {
                "cold-water": "0.15",
                "hot-water": "0.15"
            },
            uid: "bedpanSanitiser",
            warmTempC: null
        },
        beverageBay: {
            abbreviation: "BB",
            fixtureUnits: "1",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "2",
                    "warm-water": "2"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "2",
                    "warm-water": "2"
                },
                barriesBookDwellings: {
                    "cold-water": "2",
                    "warm-water": "2"
                }
            },
            roughIns: ["warm-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Beverage Bay",
            outletAboveFloorM: "1",
            probabilityOfUsagePCT: "2",
            qLS: {
                "cold-water": "0.1",
                "warm-water": "0.1"
            },
            uid: "beverageBay",
            warmTempC: "42"
        },
        birthingPool: {
            abbreviation: "BP",
            fixtureUnits: "8",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "16",
                    "warm-water": "8"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "16",
                    "warm-water": "8"
                },
                barriesBookDwellings: {
                    "cold-water": "16",
                    "warm-water": "8"
                }
            },
            roughIns: ["warm-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Birthing Pool",
            outletAboveFloorM: "0.75",
            probabilityOfUsagePCT: "1",
            qLS: {
                "cold-water": "1",
                "warm-water": "1"
            },
            uid: "birthingPool",
            warmTempC: "38"
        },
        cleanersSink: {
            abbreviation: "CS",
            fixtureUnits: "1",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "2",
                    "hot-water": "2"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "2",
                    "hot-water": "3"
                },
                barriesBookDwellings: {
                    "cold-water": "2",
                    "hot-water": "3"
                }
            },
            roughIns: ["hot-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Cleaners sink",
            outletAboveFloorM: "1",
            probabilityOfUsagePCT: "2",
            qLS: {
                "cold-water": "0.15",
                "hot-water": "0.15"
            },
            uid: "cleanersSink",
            warmTempC: null
        },
        dishwasher: {
            abbreviation: "D",
            fixtureUnits: "3",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "3",
                    "hot-water": "2"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "3",
                    "hot-water": "3"
                },
                barriesBookDwellings: {
                    "cold-water": "3",
                    "hot-water": "3"
                }
            },
            roughIns: ["hot-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Dishwasher",
            outletAboveFloorM: "0.8",
            probabilityOfUsagePCT: "0.5",
            qLS: {
                "cold-water": "0.2",
                "hot-water": "0.2"
            },
            uid: "dishwasher",
            warmTempC: null
        },
        drinkingFountain: {
            abbreviation: "DF",
            fixtureUnits: "1",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "1"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "1"
                },
                barriesBookDwellings: {
                    "cold-water": "1"
                }
            },
            roughIns: ["cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Drinking Fountain",
            outletAboveFloorM: "0.8",
            probabilityOfUsagePCT: "0.5",
            qLS: {
                "cold-water": "0.1"
            },
            uid: "drinkingFountain",
            warmTempC: null
        },
        flushingRimSink: {
            abbreviation: "FRS",
            fixtureUnits: "6",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "2",
                    "hot-water": "2"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "2",
                    "hot-water": "2"
                },
                barriesBookDwellings: {
                    "cold-water": "2",
                    "hot-water": "2"
                }
            },
            roughIns: ["hot-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Flushing Rim Sink",
            outletAboveFloorM: "1",
            probabilityOfUsagePCT: "2",
            qLS: {
                "cold-water": "0.1",
                "hot-water": "0.1"
            },
            uid: "flushingRimSink",
            warmTempC: null
        },
        hoseTap: {
            abbreviation: "H",
            fixtureUnits: "0",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "8"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "8"
                },
                barriesBookDwellings: {
                    "cold-water": "8"
                }
            },
            roughIns: ["cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Hose tap",
            outletAboveFloorM: "0.5",
            probabilityOfUsagePCT: "0",
            qLS: {
                "cold-water": "0.3"
            },
            uid: "hoseTap",
            warmTempC: null
        },
        kitchenSink: {
            abbreviation: "KS",
            fixtureUnits: "3",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "2",
                    "warm-water": "2"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "3",
                    "warm-water": "3"
                },
                barriesBookDwellings: {
                    "cold-water": "3",
                    "warm-water": "3"
                }
            },
            roughIns: ["warm-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Kitchen Sink (Warm)",
            outletAboveFloorM: "1",
            probabilityOfUsagePCT: "2",
            qLS: {
                "cold-water": "0.1",
                "warm-water": "0.1"
            },
            uid: "kitchenSink",
            warmTempC: null
        },
        kitchenSinkHot: {
            abbreviation: "KS",
            fixtureUnits: "3",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "2",
                    "hot-water": "2"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "3",
                    "hot-water": "3"
                },
                barriesBookDwellings: {
                    "cold-water": "3",
                    "hot-water": "3"
                }
            },
            roughIns: ["hot-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Kitchen Sink (Hot)",
            outletAboveFloorM: "1",
            probabilityOfUsagePCT: "2",
            qLS: {
                "cold-water": "0.1",
                "hot-water": "0.1"
            },
            uid: "kitchenSinkHot",
            warmTempC: null
        },
        laundryTrough: {
            abbreviation: "T",
            fixtureUnits: "5",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "3",
                    "warm-water": "3"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "3",
                    "warm-water": "3"
                },
                barriesBookDwellings: {
                    "cold-water": "3",
                    "warm-water": "3"
                }
            },
            roughIns: ["warm-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Laundry Trough (Warm)",
            outletAboveFloorM: "1",
            probabilityOfUsagePCT: "2",
            qLS: {
                "cold-water": "0.12",
                "warm-water": "0.12"
            },
            uid: "laundryTrough",
            warmTempC: null
        },
        laundryTroughHot: {
            abbreviation: "T",
            fixtureUnits: "5",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "3",
                    "hot-water": "3"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "3",
                    "hot-water": "3"
                },
                barriesBookDwellings: {
                    "cold-water": "3",
                    "hot-water": "3"
                }
            },
            roughIns: ["hot-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Laundry Trough (Hot)",
            outletAboveFloorM: "1",
            probabilityOfUsagePCT: "2",
            qLS: {
                "cold-water": "0.12",
                "hot-water": "0.12"
            },
            uid: "laundryTroughHot",
            warmTempC: null
        },
        shower: {
            abbreviation: "SHR",
            fixtureUnits: "2",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "2",
                    "warm-water": "2"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "3",
                    "warm-water": "2"
                },
                barriesBookDwellings: {
                    "cold-water": "3",
                    "warm-water": "2"
                }
            },
            roughIns: ["warm-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Shower",
            outletAboveFloorM: "1.5",
            probabilityOfUsagePCT: "4.5",
            qLS: {
                "cold-water": "0.15",
                "warm-water": "0.15"
            },
            uid: "shower",
            warmTempC: "42"
        },
        urinal: {
            abbreviation: "U",
            fixtureUnits: "1",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "2"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "2"
                },
                barriesBookDwellings: {
                    "cold-water": "2"
                }
            },
            roughIns: ["cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Urinal",
            outletAboveFloorM: null,
            probabilityOfUsagePCT: "4.5",
            qLS: {
                "cold-water": "0.1"
            },
            uid: "urinal",
            warmTempC: null
        },
        washingMachine: {
            abbreviation: "WM",
            fixtureUnits: "5",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "3",
                    "hot-water": "2"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "3",
                    "hot-water": "3"
                },
                barriesBookDwellings: {
                    "cold-water": "3",
                    "hot-water": "3"
                }
            },
            roughIns: ["hot-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Washing Machine",
            outletAboveFloorM: "0.8",
            probabilityOfUsagePCT: "5.5",
            qLS: {
                "cold-water": "0.2",
                "hot-water": "0.2"
            },
            uid: "washingMachine",
            warmTempC: null
        },
        wc: {
            abbreviation: "WC",
            fixtureUnits: "4",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "2"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "2"
                },
                barriesBookDwellings: {
                    "cold-water": "2"
                }
            },
            roughIns: ["cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "WC",
            outletAboveFloorM: "0.75",
            probabilityOfUsagePCT: "1",
            qLS: {
                "cold-water": "0.1"
            },
            uid: "wc",
            warmTempC: null
        }
    },
    mixingValves: {
        temperingValve: {
            maxFlowRateLS: "0.6",
            maxInletPressureKPA: "500",
            minFlowRateLS: "0.066",
            minInletPressureKPA: "20",
            name: "Tempering Valve",
            uid: "temperingValve",
            pressureLossKPAbyFlowRateLS: {
                0: "0",
                0.08: "3",
                0.16: "12",
                0.32: "50",
                0.6: "150"
            }
        },
        tmv: {
            maxFlowRateLS: "0.65",
            maxInletPressureKPA: "500",
            minFlowRateLS: "0.066",
            minInletPressureKPA: "20",
            name: "TMV",
            uid: "tmv",
            pressureLossKPAbyFlowRateLS: {
                0: "0",
                0.16: "30",
                0.32: "80",
                0.48: "160",
                0.65: "300"
            }
        }
    },
    prv: {
        15: {
            minInletPressureKPA: "200",
            maxInletPressureKPA: "2000",
            minFlowRateLS: "0.25",
            maxFlowRateLS: "0.50",
            maxPressureDropRatio: "2",
            diameterNominalMM: 15
        },
        20: {
            minInletPressureKPA: "200",
            maxInletPressureKPA: "2000",
            minFlowRateLS: "0.50",
            maxFlowRateLS: "0.83",
            maxPressureDropRatio: "2",
            diameterNominalMM: 20
        },
        25: {
            minInletPressureKPA: "200",
            maxInletPressureKPA: "2000",
            minFlowRateLS: "0.83",
            maxFlowRateLS: "1.33",
            maxPressureDropRatio: "2",
            diameterNominalMM: 25
        },
        32: {
            minInletPressureKPA: "200",
            maxInletPressureKPA: "2000",
            minFlowRateLS: "1.33",
            maxFlowRateLS: "2.33",
            maxPressureDropRatio: "2",
            diameterNominalMM: 32
        },
        40: {
            minInletPressureKPA: "200",
            maxInletPressureKPA: "2000",
            minFlowRateLS: "2.33",
            maxFlowRateLS: "3",
            maxPressureDropRatio: "2",
            diameterNominalMM: 40
        },
        50: {
            minInletPressureKPA: "200",
            maxInletPressureKPA: "2000",
            minFlowRateLS: "3",
            maxFlowRateLS: "4",
            maxPressureDropRatio: "2",
            diameterNominalMM: 50
        },
        65: {
            minInletPressureKPA: "200",
            maxInletPressureKPA: "2000",
            minFlowRateLS: "4",
            maxFlowRateLS: "5.7",
            maxPressureDropRatio: "2",
            diameterNominalMM: 65
        },
        80: {
            minInletPressureKPA: "200",
            maxInletPressureKPA: "2000",
            minFlowRateLS: "5.7",
            maxFlowRateLS: "8.5",
            maxPressureDropRatio: "2",
            diameterNominalMM: 80
        },
        100: {
            minInletPressureKPA: "200",
            maxInletPressureKPA: "2000",
            minFlowRateLS: "8.5",
            maxFlowRateLS: "15",
            maxPressureDropRatio: "2",
            diameterNominalMM: 100
        },
        150: {
            minInletPressureKPA: "200",
            maxInletPressureKPA: null,
            minFlowRateLS: "15",
            maxFlowRateLS: "34",
            maxPressureDropRatio: "2",
            diameterNominalMM: 150
        }
    },
    pipes: {
        castIronCoated: {
            name: "Cast Iron (Coated)",
            abbreviation: "CICL",
            pipesBySize: {
                100: {
                    colebrookWhiteCoefficient: "0.3",
                    diameterInternalMM: "102",
                    diameterNominalMM: "100",
                    pipeUid: "castIronCoated",
                    safeWorkingPressureKPA: "3500"
                },
                150: {
                    colebrookWhiteCoefficient: "0.3",
                    diameterInternalMM: "157",
                    diameterNominalMM: "150",
                    pipeUid: "castIronCoated",
                    safeWorkingPressureKPA: "3500"
                },
                200: {
                    colebrookWhiteCoefficient: "0.3",
                    diameterInternalMM: "212",
                    diameterNominalMM: "200",
                    pipeUid: "castIronCoated",
                    safeWorkingPressureKPA: "3500"
                },
                225: {
                    colebrookWhiteCoefficient: "0.3",
                    diameterInternalMM: "238.6",
                    diameterNominalMM: "225",
                    pipeUid: "castIronCoated",
                    safeWorkingPressureKPA: "3500"
                },
                250: {
                    colebrookWhiteCoefficient: "0.3",
                    diameterInternalMM: "264.8",
                    diameterNominalMM: "250",
                    pipeUid: "castIronCoated",
                    safeWorkingPressureKPA: "3500"
                },
                300: {
                    colebrookWhiteCoefficient: "0.3",
                    diameterInternalMM: "322.4",
                    diameterNominalMM: "300",
                    pipeUid: "castIronCoated",
                    safeWorkingPressureKPA: "3500"
                }
            },
            uid: "castIronCoated"
        },
        copperTypeB: {
            name: "Copper (Type B)",
            abbreviation: "CU",
            pipesBySize: {
                100: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "98.2",
                    diameterNominalMM: "100",
                    pipeUid: "copperTypeB",
                    safeWorkingPressureKPA: "1200"
                },
                15: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "10.81",
                    diameterNominalMM: "15",
                    pipeUid: "copperTypeB",
                    safeWorkingPressureKPA: "5290"
                },
                150: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "148.2",
                    diameterNominalMM: "150",
                    pipeUid: "copperTypeB",
                    safeWorkingPressureKPA: "1000"
                },
                20: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "16.9",
                    diameterNominalMM: "20",
                    pipeUid: "copperTypeB",
                    safeWorkingPressureKPA: "3970"
                },
                200: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "198.9",
                    diameterNominalMM: "200",
                    pipeUid: "copperTypeB",
                    safeWorkingPressureKPA: "720"
                },
                25: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "22.8",
                    diameterNominalMM: "25",
                    pipeUid: "copperTypeB",
                    safeWorkingPressureKPA: "3500"
                },
                32: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "29.1",
                    diameterNominalMM: "32",
                    pipeUid: "copperTypeB",
                    safeWorkingPressureKPA: "2780"
                },
                40: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "35.4",
                    diameterNominalMM: "40",
                    pipeUid: "copperTypeB",
                    safeWorkingPressureKPA: "2300"
                },
                50: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "48.3",
                    diameterNominalMM: "50",
                    pipeUid: "copperTypeB",
                    safeWorkingPressureKPA: "1710"
                },
                65: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "61",
                    diameterNominalMM: "65",
                    pipeUid: "copperTypeB",
                    safeWorkingPressureKPA: "1370"
                },
                80: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "72.9",
                    diameterNominalMM: "80",
                    pipeUid: "copperTypeB",
                    safeWorkingPressureKPA: "1520"
                }
            },
            uid: "copperTypeB"
        },
        gmsMedium: {
            name: "GMS (Medium)",
            abbreviation: "GMS",
            pipesBySize: {
                100: {
                    colebrookWhiteCoefficient: "0.15",
                    diameterInternalMM: "105",
                    diameterNominalMM: "100",
                    pipeUid: "gmsMedium",
                    safeWorkingPressureKPA: "5680"
                },
                150: {
                    colebrookWhiteCoefficient: "0.15",
                    diameterInternalMM: "155",
                    diameterNominalMM: "150",
                    pipeUid: "gmsMedium",
                    safeWorkingPressureKPA: "4330"
                },
                80: {
                    colebrookWhiteCoefficient: "0.15",
                    diameterInternalMM: "80.7",
                    diameterNominalMM: "80",
                    pipeUid: "gmsMedium",
                    safeWorkingPressureKPA: "6530"
                }
            },
            uid: "gmsMedium"
        },
        hdpeSdr11: {
            name: "HDPE (SDR11)",
            abbreviation: "HDPE",
            pipesBySize: {
                110: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "89.4",
                    diameterNominalMM: "110",
                    pipeUid: "hdpeSdr11",
                    safeWorkingPressureKPA: "1600"
                },
                16: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "12.65",
                    diameterNominalMM: "16",
                    pipeUid: "hdpeSdr11",
                    safeWorkingPressureKPA: "1600"
                },
                160: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "130",
                    diameterNominalMM: "160",
                    pipeUid: "hdpeSdr11",
                    safeWorkingPressureKPA: "1600"
                },
                20: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "16.05",
                    diameterNominalMM: "20",
                    pipeUid: "hdpeSdr11",
                    safeWorkingPressureKPA: "1600"
                },
                200: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "162.5",
                    diameterNominalMM: "200",
                    pipeUid: "hdpeSdr11",
                    safeWorkingPressureKPA: "1600"
                },
                225: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "182.9",
                    diameterNominalMM: "225",
                    pipeUid: "hdpeSdr11",
                    safeWorkingPressureKPA: "1600"
                },
                25: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "20.15",
                    diameterNominalMM: "25",
                    pipeUid: "hdpeSdr11",
                    safeWorkingPressureKPA: "1600"
                },
                315: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "256.3",
                    diameterNominalMM: "315",
                    pipeUid: "hdpeSdr11",
                    safeWorkingPressureKPA: "1600"
                },
                32: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "25.95",
                    diameterNominalMM: "32",
                    pipeUid: "hdpeSdr11",
                    safeWorkingPressureKPA: "1600"
                },
                40: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "32.3",
                    diameterNominalMM: "40",
                    pipeUid: "hdpeSdr11",
                    safeWorkingPressureKPA: "1600"
                },
                50: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "40.4",
                    diameterNominalMM: "50",
                    pipeUid: "hdpeSdr11",
                    safeWorkingPressureKPA: "1600"
                },
                63: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "51",
                    diameterNominalMM: "63",
                    pipeUid: "hdpeSdr11",
                    safeWorkingPressureKPA: "1600"
                },
                75: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "61",
                    diameterNominalMM: "75",
                    pipeUid: "hdpeSdr11",
                    safeWorkingPressureKPA: "1600"
                }
            },
            uid: "hdpeSdr11"
        },
        pexSdr74: {
            name: "PEX (SDR 7.4)",
            abbreviation: "PEX",
            pipesBySize: {
                110: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "78.6",
                    diameterNominalMM: "110",
                    pipeUid: "pexSdr74",
                    safeWorkingPressureKPA: "2500"
                },
                16: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "11.35",
                    diameterNominalMM: "16",
                    pipeUid: "pexSdr74",
                    safeWorkingPressureKPA: "2500"
                },
                160: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "114.7",
                    diameterNominalMM: "160",
                    pipeUid: "pexSdr74",
                    safeWorkingPressureKPA: "2500"
                },
                20: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "14.15",
                    diameterNominalMM: "20",
                    pipeUid: "pexSdr74",
                    safeWorkingPressureKPA: "2500"
                },
                25: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "17.65",
                    diameterNominalMM: "25",
                    pipeUid: "pexSdr74",
                    safeWorkingPressureKPA: "2500"
                },
                32: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "22.75",
                    diameterNominalMM: "32",
                    pipeUid: "pexSdr74",
                    safeWorkingPressureKPA: "2500"
                },
                40: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "28.5",
                    diameterNominalMM: "40",
                    pipeUid: "pexSdr74",
                    safeWorkingPressureKPA: "2500"
                },
                50: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "35.7",
                    diameterNominalMM: "50",
                    pipeUid: "pexSdr74",
                    safeWorkingPressureKPA: "2500"
                },
                63: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "45.1",
                    diameterNominalMM: "63",
                    pipeUid: "pexSdr74",
                    safeWorkingPressureKPA: "2500"
                },
                75: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "53.6",
                    diameterNominalMM: "75",
                    pipeUid: "pexSdr74",
                    safeWorkingPressureKPA: "2500"
                }
            },
            uid: "pexSdr74"
        },
        stainlessSteel: {
            name: "Stainless Steel",
            abbreviation: "S/S",
            pipesBySize: {
                100: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "104",
                    diameterNominalMM: "100",
                    pipeUid: "stainlessSteel",
                    safeWorkingPressureKPA: "4500"
                },
                15: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "13",
                    diameterNominalMM: "15",
                    pipeUid: "stainlessSteel",
                    safeWorkingPressureKPA: "20000"
                },
                150: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "158",
                    diameterNominalMM: "150",
                    pipeUid: "stainlessSteel",
                    safeWorkingPressureKPA: "4000"
                },
                20: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "19.6",
                    diameterNominalMM: "20",
                    pipeUid: "stainlessSteel",
                    safeWorkingPressureKPA: "15800"
                },
                25: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "25.6",
                    diameterNominalMM: "25",
                    pipeUid: "stainlessSteel",
                    safeWorkingPressureKPA: "12500"
                },
                32: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "32",
                    diameterNominalMM: "32",
                    pipeUid: "stainlessSteel",
                    safeWorkingPressureKPA: "9800"
                },
                40: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "39",
                    diameterNominalMM: "40",
                    pipeUid: "stainlessSteel",
                    safeWorkingPressureKPA: "8500"
                },
                50: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "51",
                    diameterNominalMM: "50",
                    pipeUid: "stainlessSteel",
                    safeWorkingPressureKPA: "6800"
                },
                65: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "72.1",
                    diameterNominalMM: "65",
                    pipeUid: "stainlessSteel",
                    safeWorkingPressureKPA: "7200"
                },
                80: {
                    colebrookWhiteCoefficient: "0.0015",
                    diameterInternalMM: "87.6",
                    diameterNominalMM: "80",
                    pipeUid: "stainlessSteel",
                    safeWorkingPressureKPA: "5900"
                }
            },
            uid: "stainlessSteel"
        }
    },
    valves: {
        "45Elbow": {
            abbreviation: "NA",
            name: "45 Elbow",
            uid: "45Elbow",
            valvesBySize: {
                "100": {
                    diameterNominalMM: "100",
                    kValue: "0.27",
                    symbol: null,
                    valveUid: "45Elbow"
                },
                "15": {
                    diameterNominalMM: "15",
                    kValue: "0.43",
                    symbol: null,
                    valveUid: "45Elbow"
                },
                "150": {
                    diameterNominalMM: "150",
                    kValue: "0.24",
                    symbol: null,
                    valveUid: "45Elbow"
                },
                "20": {
                    diameterNominalMM: "20",
                    kValue: "0.4",
                    symbol: null,
                    valveUid: "45Elbow"
                },
                "200-250": {
                    diameterNominalMM: "200-250",
                    kValue: "0.22",
                    symbol: null,
                    valveUid: "45Elbow"
                },
                "25": {
                    diameterNominalMM: "25",
                    kValue: "0.37",
                    symbol: null,
                    valveUid: "45Elbow"
                },
                "315": {
                    diameterNominalMM: "315",
                    kValue: "0.21",
                    symbol: null,
                    valveUid: "45Elbow"
                },
                "32": {
                    diameterNominalMM: "32",
                    kValue: "0.35",
                    symbol: null,
                    valveUid: "45Elbow"
                },
                "40": {
                    diameterNominalMM: "40",
                    kValue: "0.34",
                    symbol: null,
                    valveUid: "45Elbow"
                },
                "50": {
                    diameterNominalMM: "50",
                    kValue: "0.3",
                    symbol: null,
                    valveUid: "45Elbow"
                },
                "65-80": {
                    diameterNominalMM: "65-80",
                    kValue: "0.29",
                    symbol: null,
                    valveUid: "45Elbow"
                }
            }
        },
        "90Elbow": {
            abbreviation: "NA",
            name: "90 Elbow",
            uid: "90Elbow",
            valvesBySize: {
                "100": {
                    diameterNominalMM: "100",
                    kValue: "0.51",
                    symbol: null,
                    valveUid: "90Elbow"
                },
                "15": {
                    diameterNominalMM: "15",
                    kValue: "0.81",
                    symbol: null,
                    valveUid: "90Elbow"
                },
                "150": {
                    diameterNominalMM: "150",
                    kValue: "0.45",
                    symbol: null,
                    valveUid: "90Elbow"
                },
                "20": {
                    diameterNominalMM: "20",
                    kValue: "0.75",
                    symbol: null,
                    valveUid: "90Elbow"
                },
                "200-250": {
                    diameterNominalMM: "200-250",
                    kValue: "0.42",
                    symbol: null,
                    valveUid: "90Elbow"
                },
                "25": {
                    diameterNominalMM: "25",
                    kValue: "0.69",
                    symbol: null,
                    valveUid: "90Elbow"
                },
                "315": {
                    diameterNominalMM: "315",
                    kValue: "0.39",
                    symbol: null,
                    valveUid: "90Elbow"
                },
                "32": {
                    diameterNominalMM: "32",
                    kValue: "0.66",
                    symbol: null,
                    valveUid: "90Elbow"
                },
                "40": {
                    diameterNominalMM: "40",
                    kValue: "0.63",
                    symbol: null,
                    valveUid: "90Elbow"
                },
                "50": {
                    diameterNominalMM: "50",
                    kValue: "0.57",
                    symbol: null,
                    valveUid: "90Elbow"
                },
                "65-80": {
                    diameterNominalMM: "65-80",
                    kValue: "0.54",
                    symbol: null,
                    valveUid: "90Elbow"
                }
            }
        },
        ballValve: {
            abbreviation: "BV",
            name: "Ball Valve",
            uid: "ballValve",
            valvesBySize: {
                "100": {
                    diameterNominalMM: "100",
                    kValue: "0.05",
                    symbol: null,
                    valveUid: "ballValve"
                },
                "15": {
                    diameterNominalMM: "15",
                    kValue: "0.08",
                    symbol: null,
                    valveUid: "ballValve"
                },
                "150": {
                    diameterNominalMM: "150",
                    kValue: "0.05",
                    symbol: null,
                    valveUid: "ballValve"
                },
                "20": {
                    diameterNominalMM: "20",
                    kValue: "0.08",
                    symbol: null,
                    valveUid: "ballValve"
                },
                "200-250": {
                    diameterNominalMM: "200-250",
                    kValue: "0.04",
                    symbol: null,
                    valveUid: "ballValve"
                },
                "25": {
                    diameterNominalMM: "25",
                    kValue: "0.07",
                    symbol: null,
                    valveUid: "ballValve"
                },
                "315": {
                    diameterNominalMM: "315",
                    kValue: "0.04",
                    symbol: null,
                    valveUid: "ballValve"
                },
                "32": {
                    diameterNominalMM: "32",
                    kValue: "0.07",
                    symbol: null,
                    valveUid: "ballValve"
                },
                "40": {
                    diameterNominalMM: "40",
                    kValue: "0.06",
                    symbol: null,
                    valveUid: "ballValve"
                },
                "50": {
                    diameterNominalMM: "50",
                    kValue: "0.06",
                    symbol: null,
                    valveUid: "ballValve"
                },
                "65-80": {
                    diameterNominalMM: "65-80",
                    kValue: "0.05",
                    symbol: null,
                    valveUid: "ballValve"
                }
            }
        },
        butterflyValve: {
            abbreviation: "BFV",
            name: "Butterfly Valve",
            uid: "butterflyValve",
            valvesBySize: {
                "100": {
                    diameterNominalMM: "100",
                    kValue: "0.77",
                    symbol: null,
                    valveUid: "butterflyValve"
                },
                "150": {
                    diameterNominalMM: "150",
                    kValue: "0.68",
                    symbol: null,
                    valveUid: "butterflyValve"
                },
                "200-250": {
                    diameterNominalMM: "200-250",
                    kValue: "0.56",
                    symbol: null,
                    valveUid: "butterflyValve"
                },
                "315": {
                    diameterNominalMM: "315",
                    kValue: "0.39",
                    symbol: null,
                    valveUid: "butterflyValve"
                },
                "50": {
                    diameterNominalMM: "50",
                    kValue: "0.86",
                    symbol: null,
                    valveUid: "butterflyValve"
                },
                "65-80": {
                    diameterNominalMM: "65-80",
                    kValue: "0.81",
                    symbol: null,
                    valveUid: "butterflyValve"
                }
            }
        },
        checkValve: {
            abbreviation: "CV",
            name: "Check Valve",
            uid: "checkValve",
            valvesBySize: {
                "100": {
                    diameterNominalMM: "100",
                    kValue: "1.7",
                    symbol: null,
                    valveUid: "checkValve"
                },
                "15": {
                    diameterNominalMM: "15",
                    kValue: "2.7",
                    symbol: null,
                    valveUid: "checkValve"
                },
                "150": {
                    diameterNominalMM: "150",
                    kValue: "1.5",
                    symbol: null,
                    valveUid: "checkValve"
                },
                "20": {
                    diameterNominalMM: "20",
                    kValue: "2.5",
                    symbol: null,
                    valveUid: "checkValve"
                },
                "200-250": {
                    diameterNominalMM: "200-250",
                    kValue: "1.4",
                    symbol: null,
                    valveUid: "checkValve"
                },
                "25": {
                    diameterNominalMM: "25",
                    kValue: "2.3",
                    symbol: null,
                    valveUid: "checkValve"
                },
                "315": {
                    diameterNominalMM: "315",
                    kValue: "1.3",
                    symbol: null,
                    valveUid: "checkValve"
                },
                "32": {
                    diameterNominalMM: "32",
                    kValue: "2.2",
                    symbol: null,
                    valveUid: "checkValve"
                },
                "40": {
                    diameterNominalMM: "40",
                    kValue: "2.1",
                    symbol: null,
                    valveUid: "checkValve"
                },
                "50": {
                    diameterNominalMM: "50",
                    kValue: "1.9",
                    symbol: null,
                    valveUid: "checkValve"
                },
                "65-80": {
                    diameterNominalMM: "65-80",
                    kValue: "1.8",
                    symbol: null,
                    valveUid: "checkValve"
                }
            }
        },
        gateValve: {
            abbreviation: "GV",
            name: "Gate Valve",
            uid: "gateValve",
            valvesBySize: {
                "100": {
                    diameterNominalMM: "100",
                    kValue: "0.14",
                    symbol: null,
                    valveUid: "gateValve"
                },
                "15": {
                    diameterNominalMM: "15",
                    kValue: "0.22",
                    symbol: null,
                    valveUid: "gateValve"
                },
                "150": {
                    diameterNominalMM: "150",
                    kValue: "0.12",
                    symbol: null,
                    valveUid: "gateValve"
                },
                "20": {
                    diameterNominalMM: "20",
                    kValue: "0.2",
                    symbol: null,
                    valveUid: "gateValve"
                },
                "200-250": {
                    diameterNominalMM: "200-250",
                    kValue: "0.11",
                    symbol: null,
                    valveUid: "gateValve"
                },
                "25": {
                    diameterNominalMM: "25",
                    kValue: "0.18",
                    symbol: null,
                    valveUid: "gateValve"
                },
                "315": {
                    diameterNominalMM: "315",
                    kValue: "0.1",
                    symbol: null,
                    valveUid: "gateValve"
                },
                "32": {
                    diameterNominalMM: "32",
                    kValue: "0.18",
                    symbol: null,
                    valveUid: "gateValve"
                },
                "40": {
                    diameterNominalMM: "40",
                    kValue: "0.17",
                    symbol: null,
                    valveUid: "gateValve"
                },
                "50": {
                    diameterNominalMM: "50",
                    kValue: "0.15",
                    symbol: null,
                    valveUid: "gateValve"
                },
                "65-80": {
                    diameterNominalMM: "65-80",
                    kValue: "0.14",
                    symbol: null,
                    valveUid: "gateValve"
                }
            }
        },
        strainer: {
            abbreviation: "ST",
            name: "Strainer",
            uid: "strainer",
            valvesBySize: {
                "0-1000000000": {
                    diameterNominalMM: "0-1000000000",
                    kValue: "2",
                    symbol: null,
                    valveUid: "strainer"
                }
            }
        },
        tThruBranch: {
            abbreviation: "NA",
            name: "T - Thru Branch",
            uid: "tThruBranch",
            valvesBySize: {
                "100": {
                    diameterNominalMM: "100",
                    kValue: "1.02",
                    symbol: null,
                    valveUid: "tThruBranch"
                },
                "15": {
                    diameterNominalMM: "15",
                    kValue: "1.62",
                    symbol: null,
                    valveUid: "tThruBranch"
                },
                "150": {
                    diameterNominalMM: "150",
                    kValue: "0.9",
                    symbol: null,
                    valveUid: "tThruBranch"
                },
                "20": {
                    diameterNominalMM: "20",
                    kValue: "1.5",
                    symbol: null,
                    valveUid: "tThruBranch"
                },
                "200-250": {
                    diameterNominalMM: "200-250",
                    kValue: "0.84",
                    symbol: null,
                    valveUid: "tThruBranch"
                },
                "25": {
                    diameterNominalMM: "25",
                    kValue: "1.38",
                    symbol: null,
                    valveUid: "tThruBranch"
                },
                "315": {
                    diameterNominalMM: "315",
                    kValue: "0.78",
                    symbol: null,
                    valveUid: "tThruBranch"
                },
                "32": {
                    diameterNominalMM: "32",
                    kValue: "1.32",
                    symbol: null,
                    valveUid: "tThruBranch"
                },
                "40": {
                    diameterNominalMM: "40",
                    kValue: "1.26",
                    symbol: null,
                    valveUid: "tThruBranch"
                },
                "50": {
                    diameterNominalMM: "50",
                    kValue: "1.14",
                    symbol: null,
                    valveUid: "tThruBranch"
                },
                "65-80": {
                    diameterNominalMM: "65-80",
                    kValue: "1.08",
                    symbol: null,
                    valveUid: "tThruBranch"
                }
            }
        },
        tThruFlow: {
            abbreviation: "NA",
            name: "T - Thru Flow",
            uid: "tThruFlow",
            valvesBySize: {
                "100": {
                    diameterNominalMM: "100",
                    kValue: "0.34",
                    symbol: null,
                    valveUid: "tThruFlow"
                },
                "15": {
                    diameterNominalMM: "15",
                    kValue: "0.54",
                    symbol: null,
                    valveUid: "tThruFlow"
                },
                "150": {
                    diameterNominalMM: "150",
                    kValue: "0.3",
                    symbol: null,
                    valveUid: "tThruFlow"
                },
                "20": {
                    diameterNominalMM: "20",
                    kValue: "0.5",
                    symbol: null,
                    valveUid: "tThruFlow"
                },
                "200-250": {
                    diameterNominalMM: "200-250",
                    kValue: "0.28",
                    symbol: null,
                    valveUid: "tThruFlow"
                },
                "25": {
                    diameterNominalMM: "25",
                    kValue: "0.46",
                    symbol: null,
                    valveUid: "tThruFlow"
                },
                "315": {
                    diameterNominalMM: "315",
                    kValue: "0.26",
                    symbol: null,
                    valveUid: "tThruFlow"
                },
                "32": {
                    diameterNominalMM: "32",
                    kValue: "0.44",
                    symbol: null,
                    valveUid: "tThruFlow"
                },
                "40": {
                    diameterNominalMM: "40",
                    kValue: "0.42",
                    symbol: null,
                    valveUid: "tThruFlow"
                },
                "50": {
                    diameterNominalMM: "50",
                    kValue: "0.38",
                    symbol: null,
                    valveUid: "tThruFlow"
                },
                "65-80": {
                    diameterNominalMM: "65-80",
                    kValue: "0.36",
                    symbol: null,
                    valveUid: "tThruFlow"
                }
            }
        },
        waterMeter: {
            abbreviation: "WM",
            name: "Water Meter",
            uid: "waterMeter",
            valvesBySize: {
                "0-1000000000": {
                    diameterNominalMM: "0-1000000000",
                    kValue: "7",
                    symbol: null,
                    valveUid: "waterMeter"
                }
            }
        }
    },
    dwellingStandards: {
        as35002018Dwellings: {
            type: DwellingStandardType.EQUATION,
            name: "AS3500.1 Dwellings",
            equation: "a*D+b*sqrt(D)",
            variables: {
                a: "0.03",
                b: "0.4554"
            }
        },
        barriesBookDwellings: {
            type: DwellingStandardType.DWELLING_HOT_COLD_LOOKUP_TABLE,
            name: "Barrie's Book Dwellings",
            hotColdTable: {
                1: { cold: "0.48", hot: " 0.4" },
                2: { cold: "0.62", hot: " 0.56" },
                3: { cold: "0.78", hot: " 0.67" },
                4: { cold: "0.92", hot: " 0.75" },
                5: { cold: "1.04", hot: " 0.78" },
                6: { cold: "1.16", hot: " 0.8" },
                7: { cold: "1.26", hot: " 0.82" },
                8: { cold: "1.36", hot: " 0.83" },
                9: { cold: "1.46", hot: " 0.85" },
                10: { cold: "1.56", hot: " 0.87" },
                11: { cold: "1.64", hot: " 0.89" },
                12: { cold: "1.73", hot: " 0.9" },
                13: { cold: "1.82", hot: " 0.97" },
                14: { cold: "1.9", hot: " 1.05" },
                15: { cold: "1.98", hot: " 1.13" },
                16: { cold: "2.06", hot: " 1.2" },
                17: { cold: "2.14", hot: " 1.28" },
                18: { cold: "2.21", hot: " 1.35" },
                19: { cold: "2.29", hot: " 1.43" },
                20: { cold: "2.36", hot: " 1.5" },
                21: { cold: "2.44", hot: " 1.58" },
                22: { cold: "2.51", hot: " 1.65" },
                23: { cold: "2.58", hot: " 1.73" },
                24: { cold: "2.66", hot: " 1.8" },
                25: { cold: "2.72", hot: " 1.88" },
                26: { cold: "2.79", hot: " 1.95" },
                27: { cold: "2.86", hot: " 2.03" },
                28: { cold: "2.93", hot: " 2.1" },
                29: { cold: "3.00", hot: " 2.18" },
                30: { cold: "3.05", hot: " 2.25" },
                31: { cold: "3.11", hot: " 2.33" },
                32: { cold: "3.17", hot: " 2.4" },
                33: { cold: "3.23", hot: " 2.48" },
                34: { cold: "3.29", hot: " 2.55" },
                35: { cold: "3.35", hot: " 2.63" },
                36: { cold: "3.41", hot: " 2.7" },
                37: { cold: "3.47", hot: " 2.78" },
                38: { cold: "3.53", hot: " 2.85" },
                39: { cold: "3.59", hot: " 2.93" },
                40: { cold: "3.67", hot: " 3" },
                41: { cold: "3.73", hot: " 3.08" },
                42: { cold: "3.79", hot: " 3.15" },
                43: { cold: "3.95", hot: " 3.23" },
                44: { cold: "4", hot: " 3.3" },
                45: { cold: "4.04", hot: " 3.38" },
                46: { cold: "4.08", hot: " 3.45" },
                47: { cold: "4.12", hot: " 3.53" },
                48: { cold: "4.16", hot: " 3.6" },
                49: { cold: "4.2", hot: " 3.68" },
                50: { cold: "4.24", hot: " 3.75" },
                51: { cold: "4.3", hot: " 3.83" },
                52: { cold: "4.36", hot: " 3.9" },
                53: { cold: "4.42", hot: " 3.98" },
                54: { cold: "4.48", hot: " 4.05" },
                55: { cold: "4.53", hot: " 4.13" },
                56: { cold: "4.58", hot: " 4.2" },
                57: { cold: "4.64", hot: " 4.28" },
                58: { cold: "4.69", hot: " 4.35" },
                59: { cold: "4.75", hot: " 4.43" },
                60: { cold: "4.8", hot: " 4.5" },
                61: { cold: "4.86", hot: " 4.58" },
                62: { cold: "4.92", hot: " 4.65" },
                63: { cold: "4.97", hot: " 4.73" },
                64: { cold: "5.03", hot: " 4.8" },
                65: { cold: "5.08", hot: " 4.88" },
                66: { cold: "5.13", hot: " 4.95" },
                67: { cold: "5.18", hot: " 5.03" },
                68: { cold: "5.25", hot: " 5.1" },
                69: { cold: "5.3", hot: " 5.18" },
                70: { cold: "5.35", hot: " 5.25" },
                71: { cold: "5.4", hot: " 5.33" },
                72: { cold: "5.45", hot: " 5.4" },
                73: { cold: "5.5", hot: " 5.48" },
                74: { cold: "5.55", hot: " 5.55" },
                75: { cold: "5.6", hot: " 5.63" },
                76: { cold: "5.65", hot: " 5.7" },
                77: { cold: "5.7", hot: " 5.78" },
                78: { cold: "5.75", hot: " 5.85" },
                79: { cold: "5.8", hot: " 5.93" },
                80: { cold: "5.85", hot: " 6" },
                81: { cold: "5.91", hot: " 6.08" },
                82: { cold: "5.95", hot: " 6.15" },
                83: { cold: "6", hot: " 6.25" },
                84: { cold: "6.05", hot: " 6.3" },
                85: { cold: "6.1", hot: " 6.38" },
                86: { cold: "6.15", hot: " 6.45" },
                87: { cold: "6.2", hot: " 6.53" },
                88: { cold: "6.25", hot: " 6.6" },
                89: { cold: "6.3", hot: " 6.68" },
                90: { cold: "6.35", hot: " 6.75" },
                91: { cold: "6.4", hot: " 6.83" },
                92: { cold: "6.45", hot: " 6.9" },
                93: { cold: "6.5", hot: " 6.98" },
                94: { cold: "6.55", hot: " 7.05" },
                95: { cold: "6.6", hot: " 7.13" },
                96: { cold: "6.65", hot: " 7.2" },
                97: { cold: "6.7", hot: " 7.28" },
                98: { cold: "6.75", hot: " 7.35" },
                99: { cold: "6.8", hot: " 7.43" },
                100: { cold: "6.85", hot: " 7.5" }
            }
        }
    },
    psdStandards: {
        as35002018LoadingUnits: {
            type: PSDStandardType.LU_LOOKUP_TABLE,
            name: "AS 3500 2018 Loading Units",
            table: {
                1: "0.09",
                2: "0.12",
                3: "0.14",
                4: "0.16",
                5: "0.18",
                6: "0.2",
                7: "0.22",
                8: "0.24",
                9: "0.25",
                10: "0.26",
                11: "0.28",
                12: "0.29",
                13: "0.3",
                14: "0.31",
                15: "0.33",
                16: "0.34",
                17: "0.35",
                18: "0.36",
                19: "0.37",
                20: "0.38",
                21: "0.39",
                22: "0.4",
                23: "0.41",
                24: "0.42",
                25: "0.43",
                26: "0.43",
                27: "0.44",
                28: "0.45",
                29: "0.46",
                30: "0.47",
                31: "0.48",
                32: "0.49",
                33: "0.49",
                34: "0.5",
                35: "0.51",
                36: "0.52",
                37: "0.52",
                38: "0.53",
                39: "0.54",
                40: "0.55",
                41: "0.55",
                42: "0.56",
                43: "0.57",
                44: "0.58",
                45: "0.58",
                46: "0.59",
                47: "0.6",
                48: "0.6",
                49: "0.61",
                50: "0.62",
                51: "0.62",
                52: "0.63",
                53: "0.64",
                54: "0.64",
                55: "0.65",
                56: "0.65",
                57: "0.66",
                58: "0.67",
                59: "0.67",
                60: "0.68"
            }
        },
        barriesBookLoadingUnits: {
            type: PSDStandardType.LU_LOOKUP_TABLE,
            name: "Barrie's Book Loading Units",
            table: {
                1: "0.1",
                2: "0.12",
                3: "0.15",
                4: "0.18",
                5: "0.21",
                6: "0.23",
                7: "0.24",
                8: "0.25",
                9: "0.26",
                10: "0.27",
                11: "0.28",
                12: "0.29",
                13: "0.3",
                14: "0.31",
                15: "0.32",
                16: "0.33",
                17: "0.34",
                18: "0.35",
                19: "0.36",
                20: "0.38",
                30: "0.42",
                40: "0.45",
                50: "0.52",
                60: "0.64",
                70: "0.73",
                80: "0.83",
                90: "0.92",
                100: "1",
                110: "1.1",
                120: "1.2",
                130: "1.27",
                140: "1.35",
                150: "1.42",
                160: "1.5",
                170: "1.57",
                180: "1.65",
                190: "1.72",
                200: "1.8",
                240: "1.97",
                280: "2.2",
                320: "2.42",
                360: "2.57",
                400: "2.73",
                440: "2.95",
                480: "3.1",
                520: "3.26",
                560: "3.41",
                600: "3.48",
                640: "3.64",
                680: "3.79",
                720: "3.86",
                760: "4.01",
                800: "4.09",
                840: "4.17",
                880: "4.32",
                920: "4.39",
                960: "4.47",
                1000: "4.54",
                1040: "4.7",
                1080: "4.77",
                1120: "4.85",
                1160: "5",
                1200: "5.07",
                1240: "5.15",
                1280: "5.23",
                1320: "5.38",
                1360: "5.45",
                1400: "5.53",
                1440: "5.6",
                1480: "5.68",
                1520: "5.76",
                1560: "5.91",
                1600: "5.98",
                1640: "6.06",
                1680: "6.13",
                1720: "6.29",
                1760: "6.36",
                1800: "6.44",
                1840: "6.51",
                1880: "6.66",
                1920: "6.74",
                1960: "6.82",
                2000: "6.89",
                2040: "7.04",
                2080: "7.12",
                2120: "7.19",
                2160: "7.27",
                2200: "7.42",
                2240: "7.5",
                2280: "7.57",
                2320: "7.65",
                2360: "7.8",
                2400: "7.88",
                2440: "7.95",
                2480: "8.03",
                2520: "8.18",
                2560: "8.25",
                2600: "8.33",
                2640: "8.48",
                2680: "8.56",
                2720: "8.63",
                2760: "8.71",
                2800: "8.78",
                2840: "8.94",
                2880: "9.01",
                2920: "9.09",
                2960: "9.24",
                3000: "9.31",
                3040: "9.39",
                3080: "9.47",
                3120: "9.54",
                3160: "9.69",
                3200: "9.77",
                3240: "9.84",
                3280: "9.92",
                3320: "10",
                3360: "10.15",
                3400: "10.22",
                3440: "10.3",
                3480: "10.45",
                3520: "10.53",
                3560: "10.6",
                3600: "10.68",
                3640: "10.83",
                3680: "10.91",
                3720: "10.98",
                3760: "11.06",
                3800: "11.13",
                3840: "11.28",
                3880: "11.36",
                3920: "11.44",
                3960: "11.51",
                4000: "11.66"
            }
        },
        din1988300Residential: {
            type: PSDStandardType.EQUATION,
            equation: "a*(sum(Q,q))^b-c",
            name: "DIN 1988-300 - Residential",
            variables: { a: "1.48", b: "0.19", c: "0.94" }
        },
        din1988300Hospital: {
            type: PSDStandardType.EQUATION,
            equation: "a*(sum(Q,q))^b-c",
            name: "DIN 1988-300 - Hospital",
            variables: { a: "0.75", b: "0.44", c: "0.18" }
        },
        din1988300Hotel: {
            type: PSDStandardType.EQUATION,
            equation: "a*(sum(Q,q))^b-c",
            name: "DIN 1988-300 - Hotel",
            variables: { a: "0.70", b: "0.48", c: "0.13" }
        },
        din1988300School: {
            type: PSDStandardType.EQUATION,
            equation: "a*(sum(Q,q))^b-c",
            name: "DIN 1988-300 - School",
            variables: { a: "0.91", b: "0.31", c: "0.38" }
        },
        din1988300Office: {
            type: PSDStandardType.EQUATION,
            equation: "a*(sum(Q,q))^b-c",
            name: "DIN 1988-300 - Office",
            variables: { a: "0.91", b: "0.31", c: "0.38" }
        },
        din1988300AssistedLiving: {
            type: PSDStandardType.EQUATION,
            equation: "a*(sum(Q,q))^b-c",
            name: "DIN 1988-300 - Assisted Living",
            variables: { a: "1.48", b: "0.19", c: "0.94" }
        },
        din1988300NursingHome: {
            type: PSDStandardType.EQUATION,
            equation: "a*(sum(Q,q))^b-c",
            name: "DIN 1988-300 - Nursing Home",
            variables: { a: "1.40", b: "0.14", c: "0.92" }
        }
    },
    fluids: {
        water: {
            name: "Water",
            densityKGM3: "997",
            dynamicViscosityByTemperature: {
                10: "0.0013076",
                15: "0.0011373",
                18: "0.0010518",
                20: ".00100005",
                25: "0.0008891",
                38: "0.0006791",
                40: "0.0006539",
                43: "0.0006188",
                45: "0.000597",
                50: "0.0005474",
                60: "0.0004656",
                65: "0.000432",
                70: "0.0004024"
            }
        }
    },
    backflowValves: {
        RPZD: {
            name: "RPZD",
            valvesBySize: {
                15: {
                    sizeMM: "15",
                    minInletPressureKPA: "200",
                    maxInletPressureKPA: "2000",
                    minFlowRateLS: "0",
                    maxFlowRateLS: "0.48",
                    pressureLossKPAByFlowRateLS: {
                        0.05: "60",
                        0.17: "90",
                        0.37: "85",
                        0.48: "80"
                    }
                },

                20: {
                    sizeMM: "20",
                    minInletPressureKPA: "200",
                    maxInletPressureKPA: "2000",
                    minFlowRateLS: "0.48",
                    maxFlowRateLS: "0.83",
                    pressureLossKPAByFlowRateLS: {
                        0.49: "75",
                        0.6: "70",
                        0.7: "73",
                        0.83: "74"
                    }
                },

                25: {
                    sizeMM: "25",
                    minInletPressureKPA: "200",
                    maxInletPressureKPA: "2000",
                    minFlowRateLS: "0.83",
                    maxFlowRateLS: "1.36",
                    pressureLossKPAByFlowRateLS: {
                        0.84: "67",
                        1: "65",
                        1.2: "64",
                        1.36: "65"
                    }
                },

                32: {
                    sizeMM: "32",
                    minInletPressureKPA: "200",
                    maxInletPressureKPA: "2000",
                    minFlowRateLS: "1.36",
                    maxFlowRateLS: "2.3",
                    pressureLossKPAByFlowRateLS: {
                        1.37: "82",
                        1.7: "75",
                        2: "70",
                        2.3: "68"
                    }
                },
                40: {
                    sizeMM: "40",
                    minInletPressureKPA: "200",
                    maxInletPressureKPA: "2000",
                    minFlowRateLS: "2.3",
                    maxFlowRateLS: "3.25",
                    pressureLossKPAByFlowRateLS: {
                        2.31: "87",
                        2.6: "85",
                        2.9: "85",
                        3.25: "85"
                    }
                },
                50: {
                    sizeMM: "50",
                    minInletPressureKPA: "200",
                    maxInletPressureKPA: "2000",
                    minFlowRateLS: "3.25",
                    maxFlowRateLS: "5.15",
                    pressureLossKPAByFlowRateLS: {
                        3.26: "87",
                        4: "85",
                        4.5: "85",
                        5.15: "85"
                    }
                },
                65: {
                    sizeMM: "65",
                    minInletPressureKPA: "200",
                    maxInletPressureKPA: "2000",
                    minFlowRateLS: "5.15",
                    maxFlowRateLS: "7.5",
                    pressureLossKPAByFlowRateLS: {
                        5.16: "97",
                        6: "97",
                        7: "98",
                        7.5: "97"
                    }
                },
                80: {
                    sizeMM: "80",
                    minInletPressureKPA: "200",
                    maxInletPressureKPA: "2000",
                    minFlowRateLS: "7.5",
                    maxFlowRateLS: "12",
                    pressureLossKPAByFlowRateLS: {
                        7.51: "85",
                        9: "85",
                        11: "87",
                        12: "88"
                    }
                },
                100: {
                    sizeMM: "100",
                    minInletPressureKPA: "200",
                    maxInletPressureKPA: "2000",
                    minFlowRateLS: "12",
                    maxFlowRateLS: "20",
                    pressureLossKPAByFlowRateLS: {
                        12.01: "67",
                        15: "65",
                        18: "65",
                        20: "65"
                    }
                },
                150: {
                    sizeMM: "150",
                    minInletPressureKPA: "200",
                    maxInletPressureKPA: "2000",
                    minFlowRateLS: "20",
                    maxFlowRateLS: "45",
                    pressureLossKPAByFlowRateLS: {
                        20.01: "74",
                        28: "74",
                        36: "74",
                        45: "75"
                    }
                }
            }
        }
    }
};
