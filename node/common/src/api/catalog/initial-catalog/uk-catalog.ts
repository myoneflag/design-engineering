import { DwellingStandardType, PSDStandardType } from "../psd-standard/types";
import { Catalog, State } from "../types";
import { EN12056FrequencyFactor } from "../../config";
import { RheemVariant, RheemVariantValues } from "../../document/entities/plants/plant-types";

export const ukCatalog: Catalog = {
    fixtures: {
        ablutionTrough: {
            priceTableName: "Ablution Trough",
            abbreviation: "AT",
            asnzFixtureUnits: "3",
            enDischargeUnits: "1",
            enDrainageSystem: {
                drainageSystem1: 0.8,
                drainageSystem2: 0.6,
                drainageSystem3: 1.3,
                drainageSystem4: 0.5,
            },
            upcFixtureUnits: "2",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "3",
                    "warm-water": "3"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "3",
                    "warm-water": "3"
                },
                bs806: {
                    "cold-water": "2",
                    "warm-water": "2",
                },
                bs8558: {
                    "cold-water": "3",
                    "warm-water": "3",
                },
                cibseGuideG: {
                    "low": "2",
                    "medium": "5",
                    "high": "10",
                    "cold-water": "3",
                    "warm-water": "3",
                },
                ipc2018Flushometer: {
                    "cold-water": "2.25",
                    "warm-water": "2.25",
                },
                ipc2018FlushTanks: {
                    "cold-water": "2.25",
                    "warm-water": "2.25",
                },
                upc2018Flushometer: {
                    "cold-water": "3",
                    "warm-water": "3",
                },
                upc2018FlushTanks: {
                    "cold-water": "3",
                    "warm-water": "3",
                },
            },
            roughIns: ["sewer-drainage", "warm-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Ablution Trough",
            outletAboveFloorM: "1",
            probabilityOfUsagePCT: "2",
            qLS: {
                generic: {
                    default: {
                        "cold-water": "0.12",
                        "warm-water": "0.12"
                    }
                },
                enware: {
                    "5*": {
                        "cold-water": "0.09",
                        "warm-water": "0.09"
                    },
                },
                galvin: {
                    "5*": {
                        "cold-water": "0.11",
                        "warm-water": "0.11"
                    },
                },
            },
            uid: "ablutionTrough",
            warmTempC: "42",
            manufacturer: [
                {
                    name: "Generic",
                    abbreviation: "Generic",
                    priceTableName: "Ablution Trough",
                    uid: "generic",
                },
                {
                    name: "Enware",
                    abbreviation: "Enware",
                    priceTableName: "Ablution Trough",
                    uid: "enware",
                    option: ["5*"],
                },
                {
                    name: "Galvin",
                    abbreviation: "Galvin",
                    priceTableName: "Ablution Trough",
                    uid: "galvin",
                    option: ["5*"],
                }
            ],
        },
        basin: {
            priceTableName: "Basin",
            abbreviation: "B",
            asnzFixtureUnits: "1",
            enDischargeUnits: "0.5",
            enDrainageSystem: {
                drainageSystem1: 0.5,
                drainageSystem2: 0.3,
                drainageSystem3: 0.3,
                drainageSystem4: 0.3,
            },
            upcFixtureUnits: "1",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "1",
                    "warm-water": "1"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "1",
                    "warm-water": "1"
                },
                bs806: {
                    "cold-water": "1",
                    "warm-water": "1",
                },
                bs8558: {
                    "cold-water": "1.5",
                    "warm-water": "1.5",
                },
                cibseGuideG: {
                    "low": "1",
                    "medium": "2",
                    "high": "4",
                    "cold-water": "2",
                    "warm-water": "2",
                },
                ipc2018Flushometer: {
                    "cold-water": "1.5",
                    "warm-water": "1.5",
                },
                ipc2018FlushTanks: {
                    "cold-water": "1.5",
                    "warm-water": "1.5",
                },
                upc2018Flushometer: {
                    "cold-water": "1",
                    "warm-water": "1",
                },
                upc2018FlushTanks: {
                    "cold-water": "1",
                    "warm-water": "1",
                },
            },
            roughIns: ["sewer-drainage", "warm-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Basin",
            outletAboveFloorM: "1",
            probabilityOfUsagePCT: "2",
            qLS: {
                generic: {
                    default: {
                        "cold-water": "0.1",
                        "warm-water": "0.1"
                    }
                },
                enware: {
                    "3*": {
                        "cold-water": "0.13",
                        "warm-water": "0.13"
                    },
                    "5*": {
                        "cold-water": "0.09",
                        "warm-water": "0.09"
                    },
                },
                galvin: {
                    "4*": {
                        "cold-water": "0.11",
                        "warm-water": "0.11"
                    },
                    "5*": {
                        "cold-water": "0.083",
                        "warm-water": "0.083"
                    },
                    "6*": {
                        "cold-water": "0.083",
                        "warm-water": "0.083"
                    },
                },
            },
            uid: "basin",
            warmTempC: "42",
            manufacturer: [
                {
                    name: "Generic",
                    abbreviation: "Generic",
                    priceTableName: "Basin",
                    uid: "generic",
                },
                {
                    name: "Enware",
                    abbreviation: "Enware",
                    priceTableName: "Basin",
                    uid: "enware",
                    option: ["3*", "5*"],
                },
                {
                    name: "Galvin",
                    abbreviation: "Galvin",
                    priceTableName: "Basin",
                    uid: "galvin",
                    option: ["4*", "5*", "6*"],
                }
            ]
        },
        bath: {
            priceTableName: "Bath",
            abbreviation: "BT",
            asnzFixtureUnits: "4",
            enDischargeUnits: "0.8",
            enDrainageSystem: {
                drainageSystem1: 0.8,
                drainageSystem2: 0.6,
                drainageSystem3: 1.3,
                drainageSystem4: 0.5,
            },
            upcFixtureUnits: "2",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "8",
                    "warm-water": "4"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "8",
                    "warm-water": "8"
                },
                bs806: {
                    "cold-water": "4",
                    "warm-water": "4",
                },
                bs8558: {
                    "cold-water": "10",
                    "warm-water": "10",
                },
                cibseGuideG: {
                    "low": "4",
                    "medium": "8",
                    "high": "16",
                    "cold-water": "10",
                    "warm-water": "10",
                },
                ipc2018Flushometer: {
                    "cold-water": "3",
                    "warm-water": "3",
                },
                ipc2018FlushTanks: {
                    "cold-water": "3",
                    "warm-water": "3",
                },
                upc2018Flushometer: {
                    "cold-water": "4",
                    "warm-water": "4",
                },
                upc2018FlushTanks: {
                    "cold-water": "4",
                    "warm-water": "4",
                },
            },
            roughIns: ["sewer-drainage", "warm-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Bath",
            outletAboveFloorM: "0.75",
            probabilityOfUsagePCT: "1",
            qLS: {
                generic: {
                    default: {
                        "cold-water": "0.3",
                        "warm-water": "0.15"
                    }
                },
                galvin: {
                    "4*": {
                        "cold-water": "0.11",
                        "warm-water": "0.11"
                    }
                },
            },
            uid: "bath",
            warmTempC: "42",
            manufacturer: [
                {
                    name: "Generic",
                    abbreviation: "Generic",
                    priceTableName: "Bath",
                    uid: "generic",
                },
                {
                    name: "Galvin",
                    abbreviation: "Galvin",
                    priceTableName: "Bath",
                    uid: "galvin",
                    option: ["4*"],
                }
            ]
        },
        bedpanSanitiser: {
            priceTableName: "Bedpan Sanitiser",
            abbreviation: "BPST",
            asnzFixtureUnits: "6",
            enDischargeUnits: "2",
            enDrainageSystem: {
                drainageSystem1: 0.8,
                drainageSystem2: 0.6,
                drainageSystem3: 1.3,
                drainageSystem4: 0.5,
            },
            upcFixtureUnits: "4",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "3",
                    "hot-water": "3"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "3",
                    "hot-water": "3"
                },
                bs806: {
                    "cold-water": "2",
                    "hot-water": "2",
                },
                bs8558: {
                    "cold-water": "5",
                    "hot-water": "5",
                },
                cibseGuideG: {
                    "low": "5",
                    "medium": "5",
                    "high": "5",
                    "cold-water": "3",
                    "hot-water": "3",
                },
                ipc2018Flushometer: {
                    "cold-water": "2.25",
                    "hot-water": "2.25",
                },
                ipc2018FlushTanks: {
                    "cold-water": "2.25",
                    "hot-water": "2.25",
                },
                upc2018Flushometer: {
                    "cold-water": "3",
                    "hot-water": "3",
                },
                upc2018FlushTanks: {
                    "cold-water": "3",
                    "hot-water": "3",
                },
            },
            roughIns: ["sewer-drainage", "hot-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Bedpan Sanitiser",
            outletAboveFloorM: "1",
            probabilityOfUsagePCT: "2",
            qLS: {
                generic: {
                    default: {
                        "cold-water": "0.12",
                        "hot-water": "0.12"
                    }
                },
            },
            uid: "bedpanSanitiser",
            warmTempC: null,
            manufacturer: [
                {
                    name: "Generic",
                    abbreviation: "Generic",
                    priceTableName: "Bedpan Sanitiser",
                    uid: "generic",
                },
            ]
        },
        beverageBay: {
            priceTableName: "Beverage Bay",
            abbreviation: "BB",
            asnzFixtureUnits: "1",
            enDischargeUnits: "0.5",
            enDrainageSystem: {
                drainageSystem1: 0.8,
                drainageSystem2: 0.6,
                drainageSystem3: 1.3,
                drainageSystem4: 0.5,
            },
            upcFixtureUnits: "2",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "2",
                    "warm-water": "2"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "3",
                    "warm-water": "3"
                },
                bs806: {
                    "cold-water": "2",
                    "warm-water": "2",
                },
                bs8558: {
                    "cold-water": "3",
                    "warm-water": "3",
                },
                cibseGuideG: {
                    "low": "2",
                    "medium": "5",
                    "high": "10",
                    "cold-water": "3",
                    "warm-water": "3",
                },
                ipc2018Flushometer: {
                    "cold-water": "3",
                    "warm-water": "3",
                },
                ipc2018FlushTanks: {
                    "cold-water": "3",
                    "warm-water": "3",
                },
                upc2018Flushometer: {
                    "cold-water": "1.5",
                    "warm-water": "1.5",
                },
                upc2018FlushTanks: {
                    "cold-water": "1.5",
                    "warm-water": "1.5",
                },
            },
            roughIns: ["sewer-drainage", "warm-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Beverage Bay",
            outletAboveFloorM: "1",
            probabilityOfUsagePCT: "2",
            qLS: {
                generic: {
                    default: {
                        "cold-water": "0.1",
                        "warm-water": "0.1"
                    }
                },
                enware: {
                    "5*": {
                        "cold-water": "0.09",
                        "warm-water": "0.09"
                    }
                },
                galvin: {
                    "5*": {
                        "cold-water": "0.11",
                        "warm-water": "0.11"
                    }
                },
            },
            uid: "beverageBay",
            warmTempC: "42",
            manufacturer: [
                {
                    name: "Generic",
                    abbreviation: "Generic",
                    priceTableName: "Beverage Bay",
                    uid: "generic",
                },
                {
                    name: "Enware",
                    abbreviation: "Enware",
                    priceTableName: "Beverage Bay",
                    uid: "enware",
                    option: ["5*"],
                },
                {
                    name: "Galvin",
                    abbreviation: "Galvin",
                    priceTableName: "Beverage Bay",
                    uid: "galvin",
                    option: ["5*"],
                }
            ]
        },
        birthingPool: {
            priceTableName: "Birthing Pool",
            abbreviation: "BP",
            asnzFixtureUnits: "8",
            enDischargeUnits: "4",
            enDrainageSystem: {
                drainageSystem1: 1.3,
                drainageSystem2: 1.3,
                drainageSystem3: 1.3,
                drainageSystem4: 1.3,
            },
            upcFixtureUnits: "8",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "16",
                    "warm-water": "8"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "16",
                    "warm-water": "16"
                },
                bs806: {
                    "cold-water": "8",
                    "warm-water": "8",
                },
                bs8558: {
                    "cold-water": "22",
                    "warm-water": "22",
                },
                cibseGuideG: {
                    "low": "16",
                    "medium": "16",
                    "high": "16",
                    "cold-water": "22",
                    "warm-water": "22",
                },
                ipc2018Flushometer: {
                    "cold-water": "16",
                    "warm-water": "8",
                },
                ipc2018FlushTanks: {
                    "cold-water": "16",
                    "warm-water": "8",
                },
                upc2018Flushometer: {
                    "cold-water": "16",
                    "warm-water": "8",
                },
                upc2018FlushTanks: {
                    "cold-water": "16",
                    "warm-water": "8",
                },
            },
            roughIns: ["sewer-drainage", "warm-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Birthing Pool",
            outletAboveFloorM: "0.75",
            probabilityOfUsagePCT: "1",
            qLS: {
                generic: {
                    default: {
                        "cold-water": "1",
                        "warm-water": "1"
                    }
                },
                galvin: {
                    default: {
                        "cold-water": "1.25",
                        "warm-water": "1.25"
                    }
                },
            },
            uid: "birthingPool",
            warmTempC: "38",
            manufacturer: [
                {
                    name: "Generic",
                    abbreviation: "Generic",
                    priceTableName: "Birthing Pool",
                    uid: "generic",
                },
                {
                    name: "Galvin",
                    abbreviation: "Galvin",
                    priceTableName: "Birthing Pool",
                    uid: "galvin",
                }
            ]
        },
        cleanersSink: {
            priceTableName: "Cleaners Sink",
            abbreviation: "CS",
            asnzFixtureUnits: "1",
            enDischargeUnits: "1",
            enDrainageSystem: {
                drainageSystem1: 0.8,
                drainageSystem2: 0.6,
                drainageSystem3: 1.3,
                drainageSystem4: 0.5,
            },
            upcFixtureUnits: "3",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "3",
                    "hot-water": "3"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "3",
                    "hot-water": "3"
                },
                bs806: {
                    "cold-water": "2",
                    "hot-water": "2",
                },
                bs8558: {
                    "cold-water": "3",
                    "hot-water": "3",
                },
                cibseGuideG: {
                    "low": "2",
                    "medium": "5",
                    "high": "10",
                    "cold-water": "3",
                    "hot-water": "3",
                },
                ipc2018Flushometer: {
                    "cold-water": "2.25",
                    "hot-water": "2.25",
                },
                ipc2018FlushTanks: {
                    "cold-water": "2.25",
                    "hot-water": "2.25",
                },
                upc2018Flushometer: {
                    "cold-water": "3",
                    "hot-water": "3",
                },
                upc2018FlushTanks: {
                    "cold-water": "3",
                    "hot-water": "3",
                },
            },
            roughIns: ["sewer-drainage", "hot-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Cleaners sink",
            outletAboveFloorM: "1",
            probabilityOfUsagePCT: "2",
            qLS: {
                generic: {
                    default: {
                        "cold-water": "0.12",
                        "hot-water": "0.12"
                    }
                }
            },
            uid: "cleanersSink",
            warmTempC: null,
            manufacturer: [
                {
                    name: "Generic",
                    abbreviation: "Generic",
                    priceTableName: "Cleaners Sink",
                    uid: "generic",
                },
            ]
        },
        dishwasher: {
            priceTableName: "Dishwasher",
            abbreviation: "D",
            asnzFixtureUnits: "3",
            enDischargeUnits: "1.5",
            enDrainageSystem: {
                drainageSystem1: 0.8,
                drainageSystem2: 0.6,
                drainageSystem3: 0.2,
                drainageSystem4: 0.5,
            },
            upcFixtureUnits: "2",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "3",
                    "hot-water": "2"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "3",
                    "hot-water": "3"
                },
                bs806: {
                    "cold-water": "2",
                    "hot-water": "2",
                },
                bs8558: {
                    "cold-water": "3",
                    "hot-water": "3",
                },
                cibseGuideG: {
                    "low": "2",
                    "medium": "2",
                    "high": "2",
                    "cold-water": "3",
                    "hot-water": "3",
                },
                ipc2018Flushometer: {
                    "cold-water": "1.4",
                    "hot-water": "1.4",
                },
                ipc2018FlushTanks: {
                    "cold-water": "1.4",
                    "hot-water": "1.4",
                },
                upc2018Flushometer: {
                    "cold-water": "1.5",
                    "hot-water": "1.5",
                },
                upc2018FlushTanks: {
                    "cold-water": "1.5",
                    "hot-water": "1.5",
                },
            },
            roughIns: ["sewer-drainage", "hot-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Dishwasher",
            outletAboveFloorM: "0.8",
            probabilityOfUsagePCT: "0.5",
            qLS: {
                generic: {
                    default: {
                        "cold-water": "0.2",
                        "hot-water": "0.1"
                    }
                }
            },
            uid: "dishwasher",
            warmTempC: null,
            manufacturer: [
                {
                    name: "Generic",
                    abbreviation: "Generic",
                    priceTableName: "Dishwasher",
                    uid: "generic",
                },
            ]
        },
        drinkingFountain: {
            priceTableName: "Drinking Fountain",
            abbreviation: "DF",
            asnzFixtureUnits: "1",
            enDischargeUnits: "0.5",
            upcFixtureUnits: "0.5",
            enDrainageSystem: {
                drainageSystem1: 0.5,
                drainageSystem2: 0.3,
                drainageSystem3: 0.3,
                drainageSystem4: 0.3,
            },
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "1"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "1"
                },
                bs806: {
                    "cold-water": "1",
                },
                bs8558: {
                    "cold-water": "2",
                },
                cibseGuideG: {
                    "low": "1",
                    "medium": "1",
                    "high": "1",
                    "cold-water": "1",
                },
                ipc2018Flushometer: {
                    "cold-water": "0.25",
                },
                ipc2018FlushTanks: {
                    "cold-water": "0.25",
                },
                upc2018Flushometer: {
                    "cold-water": "0.5",
                },
                upc2018FlushTanks: {
                    "cold-water": "0.5",
                },
            },
            roughIns: ["sewer-drainage", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Drinking Fountain",
            outletAboveFloorM: "0.8",
            probabilityOfUsagePCT: "0.5",
            qLS: {
                generic: {
                    default: { "cold-water": "0.1" }
                }
            },
            uid: "drinkingFountain",
            warmTempC: null,
            manufacturer: [
                {
                    name: "Generic",
                    abbreviation: "Generic",
                    priceTableName: "Drinking Fountain",
                    uid: "generic",
                },
            ]
        },
        flushingRimSink: {
            priceTableName: "Flushing Rim Sink",
            abbreviation: "FRS",
            asnzFixtureUnits: "6",
            enDischargeUnits: "2",
            enDrainageSystem: {
                drainageSystem1: 0.8,
                drainageSystem2: 0.6,
                drainageSystem3: 1.3,
                drainageSystem4: 0.5,
            },
            upcFixtureUnits: "6",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "3",
                    "hot-water": "3"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "3",
                    "hot-water": "3"
                },
                bs806: {
                    "cold-water": "2",
                    "hot-water": "2",
                },
                bs8558: {
                    "cold-water": "5",
                    "hot-water": "5",
                },
                cibseGuideG: {
                    "low": "5",
                    "medium": "5",
                    "high": "5",
                    "cold-water": "3",
                    "hot-water": "3",
                },
                ipc2018Flushometer: {
                    "cold-water": "2.25",
                    "hot-water": "2.25",
                },
                ipc2018FlushTanks: {
                    "cold-water": "2.25",
                    "hot-water": "2.25",
                },
                upc2018Flushometer: {
                    "cold-water": "3",
                    "hot-water": "3",
                },
                upc2018FlushTanks: {
                    "cold-water": "3",
                    "hot-water": "3",
                },
            },
            roughIns: ["sewer-drainage", "hot-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Flushing Rim Sink",
            outletAboveFloorM: "1",
            probabilityOfUsagePCT: "2",
            qLS: {
                generic: {
                    default: {
                        "cold-water": "0.12",
                        "hot-water": "0.12"
                    }
                },
                galvin: {
                    default: {
                        "cold-water": "1.5",
                        "hot-water": "1.5"
                    }
                }
            },
            uid: "flushingRimSink",
            warmTempC: null,
            manufacturer: [
                {
                    name: "Generic",
                    abbreviation: "Generic",
                    priceTableName: "Flushing Rim Sink",
                    uid: "generic",
                },
                {
                    name: "Galvin",
                    abbreviation: "Galvin",
                    priceTableName: "Flushing Rim Sink",
                    uid: "galvin",
                }
            ]
        },
        hoseTap: {
            priceTableName: "Hose Tap",
            abbreviation: "H",
            asnzFixtureUnits: "0",
            enDischargeUnits: "0.0",
            enDrainageSystem: {
                drainageSystem1: 0.5,
                drainageSystem2: 0.3,
                drainageSystem3: 0.3,
                drainageSystem4: 0.3,
            },
            upcFixtureUnits: "0",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "8"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "8"
                },
                bs806: {
                    "cold-water": "5",
                },
                bs8558: {
                    "cold-water": "3",
                },
                cibseGuideG: {
                    "low": "1",
                    "medium": "2",
                    "high": "3",
                    "cold-water": "5",
                },
                ipc2018Flushometer: {
                    "cold-water": "2.5",
                },
                ipc2018FlushTanks: {
                    "cold-water": "2.5",
                },
                upc2018Flushometer: {
                    "cold-water": "2.5",
                },
                upc2018FlushTanks: {
                    "cold-water": "2.5",
                },
            },
            roughIns: ["sewer-drainage", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Hose tap",
            outletAboveFloorM: "0.5",
            probabilityOfUsagePCT: "0",
            qLS: {
                generic: { default: { "cold-water": "0.3" } }
            },
            uid: "hoseTap",
            warmTempC: null,
            manufacturer: [
                {
                    name: "Generic",
                    abbreviation: "Generic",
                    priceTableName: "Hose Tap",
                    uid: "generic",
                },
            ]
        },
        kitchenSink: {
            priceTableName: "Kitchen Sink",
            abbreviation: "KS",
            asnzFixtureUnits: "3",
            enDischargeUnits: "0.8",
            enDrainageSystem: {
                drainageSystem1: 0.8,
                drainageSystem2: 0.6,
                drainageSystem3: 1.3,
                drainageSystem4: 0.5,
            },
            upcFixtureUnits: "2",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "2",
                    "warm-water": "2"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "3",
                    "warm-water": "3"
                },
                bs806: {
                    "cold-water": "2",
                    "warm-water": "2",
                },
                bs8558: {
                    "cold-water": "3",
                    "warm-water": "3",
                },
                cibseGuideG: {
                    "low": "2",
                    "medium": "5",
                    "high": "10",
                    "cold-water": "3",
                    "warm-water": "3",
                },
                ipc2018Flushometer: {
                    "cold-water": "3",
                    "warm-water": "3",
                },
                ipc2018FlushTanks: {
                    "cold-water": "3",
                    "warm-water": "3",
                },
                upc2018Flushometer: {
                    "cold-water": "1.5",
                    "warm-water": "1.5",
                },
                upc2018FlushTanks: {
                    "cold-water": "1.5",
                    "warm-water": "1.5",
                },
            },
            roughIns: ["sewer-drainage", "warm-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Kitchen Sink (Warm)",
            outletAboveFloorM: "1",
            probabilityOfUsagePCT: "2",
            qLS: {
                generic: {
                    default: {
                        "cold-water": "0.1",
                        "warm-water": "0.1"
                    }
                },
                enware: {
                    "5*": {
                        "cold-water": "0.09",
                        "warm-water": "0.09"
                    }
                },
                galvin: {
                    "5*": {
                        "cold-water": "0.083",
                        "warm-water": "0.083"
                    }
                }
            },
            uid: "kitchenSink",
            warmTempC: null,
            manufacturer: [
                {
                    name: "Generic",
                    abbreviation: "Generic",
                    priceTableName: "Kitchen Sink",
                    uid: "generic",
                },
                {
                    name: "Enware",
                    abbreviation: "Enware",
                    priceTableName: "Kitchen Sink",
                    uid: "enware",
                    option: ["5*"],
                },
                {
                    name: "Galvin",
                    abbreviation: "Galvin",
                    priceTableName: "Kitchen Sink",
                    uid: "galvin",
                    option: ["5*"],
                }
            ]
        },
        kitchenSinkHot: {
            priceTableName: "Kitchen Sink",
            abbreviation: "KS",
            asnzFixtureUnits: "3",
            enDischargeUnits: "0.8",
            enDrainageSystem: {
                drainageSystem1: 0.8,
                drainageSystem2: 0.6,
                drainageSystem3: 1.3,
                drainageSystem4: 0.5,
            },
            upcFixtureUnits: "2",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "2",
                    "hot-water": "2"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "3",
                    "hot-water": "3"
                },
                bs806: {
                    "cold-water": "2",
                    "hot-water": "2",
                },
                bs8558: {
                    "cold-water": "3",
                    "hot-water": "3",
                },
                cibseGuideG: {
                    "low": "2",
                    "medium": "5",
                    "high": "10",
                    "cold-water": "3",
                    "hot-water": "3",
                },
                ipc2018Flushometer: {
                    "cold-water": "3",
                    "hot-water": "3",
                },
                ipc2018FlushTanks: {
                    "cold-water": "3",
                    "hot-water": "3",
                },
                upc2018Flushometer: {
                    "cold-water": "1.5",
                    "hot-water": "1.5",
                },
                upc2018FlushTanks: {
                    "cold-water": "1.5",
                    "hot-water": "1.5",
                },
            },
            roughIns: ["sewer-drainage", "hot-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Kitchen Sink (Hot)",
            outletAboveFloorM: "1",
            probabilityOfUsagePCT: "2",
            qLS: {
                generic: {
                    default: {
                        "cold-water": "0.1",
                        "hot-water": "0.1"
                    }
                },
                enware: {
                    "5*": {
                        "cold-water": "0.09",
                        "hot-water": "0.09"
                    }
                },
                galvin: {
                    "5*": {
                        "cold-water": "0.083",
                        "hot-water": "0.083"
                    }
                }
            },
            uid: "kitchenSinkHot",
            warmTempC: null,
            manufacturer: [
                {
                    name: "Generic",
                    abbreviation: "Generic",
                    priceTableName: "Kitchen Sink",
                    uid: "generic",
                },
                {
                    name: "Enware",
                    abbreviation: "Enware",
                    priceTableName: "Kitchen Sink",
                    uid: "enware",
                    option: ["5*"],
                },
                {
                    name: "Galvin",
                    abbreviation: "Galvin",
                    priceTableName: "Kitchen Sink",
                    uid: "galvin",
                    option: ["5*"],
                }
            ]
        },
        laundryTrough: {
            priceTableName: "Laundry Trough",
            abbreviation: "T",
            asnzFixtureUnits: "5",
            enDischargeUnits: "2",
            enDrainageSystem: {
                drainageSystem1: 0.8,
                drainageSystem2: 0.6,
                drainageSystem3: 1.3,
                drainageSystem4: 0.5,
            },
            upcFixtureUnits: "2",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "3",
                    "warm-water": "3"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "3",
                    "warm-water": "3"
                },
                bs806: {
                    "cold-water": "2",
                    "warm-water": "2",
                },
                bs8558: {
                    "cold-water": "3",
                    "warm-water": "3",
                },
                cibseGuideG: {
                    "low": "2",
                    "medium": "5",
                    "high": "10",
                    "cold-water": "3",
                    "warm-water": "3",
                },
                ipc2018Flushometer: {
                    "cold-water": "2.25",
                    "warm-water": "2.25",
                },
                ipc2018FlushTanks: {
                    "cold-water": "2.25",
                    "warm-water": "2.25",
                },
                upc2018Flushometer: {
                    "cold-water": "1.5",
                    "warm-water": "1.5",
                },
                upc2018FlushTanks: {
                    "cold-water": "1.5",
                    "warm-water": "1.5",
                },
            },
            roughIns: ["sewer-drainage", "warm-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Laundry Trough (Warm)",
            outletAboveFloorM: "1",
            probabilityOfUsagePCT: "2",
            qLS: {
                generic: {
                    default: {
                        "cold-water": "0.12",
                        "warm-water": "0.12"
                    }
                },
                enware: {
                    "5*": {
                        "cold-water": "0.09",
                        "warm-water": "0.09"
                    }
                },
                galvin: {
                    "5*": {
                        "cold-water": "0.11",
                        "warm-water": "0.11"
                    }
                }
            },
            uid: "laundryTrough",
            warmTempC: null,
            manufacturer: [
                {
                    name: "Generic",
                    abbreviation: "Generic",
                    priceTableName: "Laundry Trough",
                    uid: "generic",
                },
                {
                    name: "Enware",
                    abbreviation: "Enware",
                    priceTableName: "Laundry Trough",
                    uid: "enware",
                    option: ["5*"],
                },
                {
                    name: "Galvin",
                    abbreviation: "Galvin",
                    priceTableName: "Laundry Trough",
                    uid: "galvin",
                    option: ["5*"],
                }
            ]
        },
        laundryTroughHot: {
            priceTableName: "Laundry Trough",
            abbreviation: "T",
            asnzFixtureUnits: "5",
            enDischargeUnits: "2",
            enDrainageSystem: {
                drainageSystem1: 0.8,
                drainageSystem2: 0.6,
                drainageSystem3: 1.3,
                drainageSystem4: 0.5,
            },
            upcFixtureUnits: "2",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "3",
                    "hot-water": "3"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "3",
                    "hot-water": "3"
                },
                bs806: {
                    "cold-water": "2",
                    "hot-water": "2",
                },
                bs8558: {
                    "cold-water": "3",
                    "hot-water": "3",
                },
                cibseGuideG: {
                    "low": "2",
                    "medium": "5",
                    "high": "10",
                    "cold-water": "3",
                    "hot-water": "3",
                },
                ipc2018Flushometer: {
                    "cold-water": "2.25",
                    "hot-water": "2.25",
                },
                ipc2018FlushTanks: {
                    "cold-water": "2.25",
                    "hot-water": "2.25",
                },
                upc2018Flushometer: {
                    "cold-water": "1.5",
                    "hot-water": "1.5",
                },
                upc2018FlushTanks: {
                    "cold-water": "1.5",
                    "hot-water": "1.5",
                },
            },
            roughIns: ["sewer-drainage", "hot-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Laundry Trough (Hot)",
            outletAboveFloorM: "1",
            probabilityOfUsagePCT: "2",
            qLS: {
                generic: {
                    default: {
                        "cold-water": "0.12",
                        "hot-water": "0.12"
                    }
                },
                enware: {
                    "5*": {
                        "cold-water": "0.09",
                        "hot-water": "0.09"
                    }
                },
                galvin: {
                    "5*": {
                        "cold-water": "0.11",
                        "hot-water": "0.11"
                    }
                }
            },
            uid: "laundryTroughHot",
            warmTempC: null,
            manufacturer: [
                {
                    name: "Generic",
                    abbreviation: "Generic",
                    priceTableName: "Laundry Trough",
                    uid: "generic",
                },
                {
                    name: "Enware",
                    abbreviation: "Enware",
                    priceTableName: "Laundry Trough",
                    uid: "enware",
                    option: ["5*"],
                },
                {
                    name: "Galvin",
                    abbreviation: "Galvin",
                    priceTableName: "Laundry Trough",
                    uid: "galvin",
                    option: ["5*"],
                }
            ]
        },
        shower: {
            priceTableName: "Shower",
            abbreviation: "SHR",
            asnzFixtureUnits: "2",
            enDischargeUnits: "0.6",
            enDrainageSystem: {
                drainageSystem1: 0.8,
                drainageSystem2: 0.5,
                drainageSystem3: 1.3,
                drainageSystem4: 0.5,
            },
            upcFixtureUnits: "2",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "2",
                    "warm-water": "2"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "3",
                    "warm-water": "2"
                },
                bs806: {
                    "cold-water": "2",
                    "warm-water": "2",
                },
                bs8558: {
                    "cold-water": "3",
                    "warm-water": "3",
                },
                cibseGuideG: {
                    "low": "2",
                    "medium": "3",
                    "high": "6",
                    "cold-water": "3",
                    "warm-water": "3",
                },
                ipc2018Flushometer: {
                    "cold-water": "3",
                    "warm-water": "3",
                },
                ipc2018FlushTanks: {
                    "cold-water": "3",
                    "warm-water": "3",
                },
                upc2018Flushometer: {
                    "cold-water": "2",
                    "warm-water": "2",
                },
                upc2018FlushTanks: {
                    "cold-water": "2",
                    "warm-water": "2",
                },
            },
            roughIns: ["sewer-drainage", "warm-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Shower",
            outletAboveFloorM: "1.5",
            probabilityOfUsagePCT: "4.5",
            qLS: {
                generic: {
                    default: {
                        "cold-water": "0.1",
                        "warm-water": "0.1"
                    }
                },
                enware: {
                    "3*": {
                        "cold-water": "0.13",
                        "warm-water": "0.13"
                    },
                    "4*": {
                        "cold-water": "0.1",
                        "warm-water": "0.1"
                    }
                },
                galvin: {
                    "3*": {
                        "cold-water": "0.15",
                        "warm-water": "0.15"
                    }
                }
            },
            uid: "shower",
            warmTempC: "42",
            manufacturer: [
                {
                    name: "Generic",
                    abbreviation: "Generic",
                    priceTableName: "Shower",
                    uid: "generic",
                },
                {
                    name: "Enware",
                    abbreviation: "Enware",
                    priceTableName: "Shower",
                    uid: "enware",
                    option: ["3*", "4*"],
                },
                {
                    name: "Galvin",
                    abbreviation: "Galvin",
                    priceTableName: "Shower",
                    uid: "galvin",
                    option: ["3*"],
                }
            ]
        },
        urinal: {
            priceTableName: "Urinal",
            abbreviation: "U",
            asnzFixtureUnits: "1",
            enDischargeUnits: "0.5",
            enDrainageSystem: {
                drainageSystem1: 0.5,
                drainageSystem2: 0.3,
                drainageSystem3: 0.3,
                drainageSystem4: 0.3,
            },
            upcFixtureUnits: "2",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "2"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "2"
                },
                bs806: {
                    "cold-water": "3",
                },
                bs8558: {
                    "cold-water": "2",
                },
                cibseGuideG: {
                    "low": "1",
                    "medium": "1",
                    "high": "1",
                    "cold-water": "1",
                },
                ipc2018Flushometer: {
                    "cold-water": "3",
                },
                ipc2018FlushTanks: {
                    "cold-water": "3",
                },
                upc2018Flushometer: {
                    "cold-water": "2",
                },
                upc2018FlushTanks: {
                    "cold-water": "2",
                },
            },
            roughIns: ["sewer-drainage", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Urinal",
            outletAboveFloorM: null,
            probabilityOfUsagePCT: "4.5",
            qLS: {
                generic: { default: { "cold-water": "0.1" } }
            },
            uid: "urinal",
            warmTempC: null,
            manufacturer: [
                {
                    name: "Generic",
                    abbreviation: "Generic",
                    priceTableName: "Urinal",
                    uid: "generic",
                },
            ]
        },
        washingMachine: {
            priceTableName: "Washing Machine",
            abbreviation: "WM",
            asnzFixtureUnits: "5",
            enDischargeUnits: "1.5",
            enDrainageSystem: {
                drainageSystem1: 1.5,
                drainageSystem2: 1.2,
                drainageSystem3: 1.2,
                drainageSystem4: 1,
            },
            upcFixtureUnits: "3",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "3",
                    "hot-water": "2"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "3",
                    "hot-water": "3"
                },
                bs806: {
                    "cold-water": "2",
                    "hot-water": "2",
                },
                bs8558: {
                    "cold-water": "3",
                    "hot-water": "3",
                },
                cibseGuideG: {
                    "low": "2",
                    "medium": "2",
                    "high": "2",
                    "cold-water": "3",
                    "hot-water": "3",
                },
                ipc2018Flushometer: {
                    "cold-water": "3",
                    "hot-water": "3",
                },
                ipc2018FlushTanks: {
                    "cold-water": "3",
                    "hot-water": "3",
                },
                upc2018Flushometer: {
                    "cold-water": "4",
                    "hot-water": "4",
                },
                upc2018FlushTanks: {
                    "cold-water": "4",
                    "hot-water": "4",
                },
            },
            roughIns: ["sewer-drainage", "hot-water", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "Washing Machine",
            outletAboveFloorM: "0.8",
            probabilityOfUsagePCT: "5.5",
            qLS: {
                generic: {
                    default: {
                        "cold-water": "0.2",
                        "hot-water": "0.1"
                    }
                }
            },
            uid: "washingMachine",
            warmTempC: null,
            manufacturer: [
                {
                    name: "Generic",
                    abbreviation: "Generic",
                    priceTableName: "Washing Machine",
                    uid: "generic",
                },
            ]
        },
        wc: {
            priceTableName: "WC",
            abbreviation: "WC",
            asnzFixtureUnits: "4",
            enDischargeUnits: "2",
            enDrainageSystem: {
                drainageSystem1: 2,
                drainageSystem2: 1.8,
                drainageSystem3: 1.2,
                drainageSystem4: 2,
            },
            upcFixtureUnits: "4",
            loadingUnits: {
                as35002018LoadingUnits: {
                    "cold-water": "2"
                },
                barriesBookLoadingUnits: {
                    "cold-water": "2"
                },
                bs806: {
                    "cold-water": "1",
                },
                bs8558: {
                    "cold-water": "2",
                },
                cibseGuideG: {
                    "low": "1",
                    "medium": "2",
                    "high": "5",
                    "cold-water": "2",
                },
                ipc2018Flushometer: {
                    "cold-water": "5",
                },
                ipc2018FlushTanks: {
                    "cold-water": "5",
                },
                upc2018Flushometer: {
                    "cold-water": "2.5",
                },
                upc2018FlushTanks: {
                    "cold-water": "2.5",
                },
            },
            roughIns: ["sewer-drainage", "cold-water"],
            maxInletPressureKPA: "500",
            minInletPressureKPA: "200",
            name: "WC",
            outletAboveFloorM: "0.75",
            probabilityOfUsagePCT: "1",
            qLS: {
                generic: { default: { "cold-water": "0.1" } }
            },
            uid: "wc",
            warmTempC: null,
            manufacturer: [
                {
                    name: "Generic",
                    abbreviation: "Generic",
                    priceTableName: "WC",
                    uid: "generic",
                },
            ]
        }
    },
    mixingValves: {
        temperingValve: {
            maxFlowRateLS: {
                generic: "0.6",
                caleffi: "1.41",
            },
            maxInletPressureKPA: {
                generic: "500",
                caleffi: "1400",
            },
            minFlowRateLS: {
                generic: "0.066",
                caleffi: "0.066",
            },
            minInletPressureKPA: {
                generic: "20",
                caleffi: "20",
            },
            name: "Tempering Valve",
            uid: "temperingValve",
            pressureLossKPAbyFlowRateLS: {
                generic: {
                    0: "0",
                    0.08: "3",
                    0.16: "12",
                    0.32: "50",
                    0.6: "150"
                },
                caleffi: {
                    0: "0",
                    0.08: "3.6",
                    0.16: "14",
                    0.32: "55",
                    0.5: "140",
                    0.51: "19",
                    0.7: "33",
                    0.9: "57",
                    1.2: "102",
                    1.4: "140",
                }
            },
            manufacturer: [
                {
                    name: 'Generic',
                    abbreviation: "Generic",
                    uid: "generic",
                    priceTableName: "Tempering Valve",
                },
                {
                    name: 'Caleffi',
                    abbreviation: "Caleffi",
                    uid: "caleffi",
                    priceTableName: "Tempering Valve",
                }
            ],
        },
        tmv: {
            maxFlowRateLS: {
                generic: "0.65",
                caleffi: "1",
                galvin: "0.7",
                enware: "1.21",
            },
            maxInletPressureKPA: {
                generic: "500",
                caleffi: "1400",
                galvin: "500",
                enware: "500",
            },
            minFlowRateLS: {
                generic: "0.066",
                caleffi: "0.033",
                galvin: "0.1",
                enware: "0.07",
            },
            minInletPressureKPA: {
                generic: "20",
                caleffi: "20",
                galvin: "20",
                enware: "20",
            },
            name: "TMV",
            uid: "tmv",
            pressureLossKPAbyFlowRateLS: {
                generic: {
                    0: "0",
                    0.16: "30",
                    0.32: "80",
                    0.48: "160",
                    0.65: "300"
                },
                caleffi: {
                    0: "0",
                    0.16: "14",
                    0.32: "55",
                    0.48: "130",
                    0.49: "37",
                    0.6: "52",
                    0.75: "82",
                    0.83: "100",
                    1: "150",
                },
                galvin: {
                    0: "0",
                    0.1: "30",
                    0.3: "50",
                    0.43: "100",
                    0.51: "150",
                    0.62: "200",
                    0.7: "250",
                    0.75: "300",
                },
                enware: {
                    0: "0",
                    0.07: "15",
                    0.26: "50",
                    0.36: "100",
                    0.45: "150",
                    0.53: "200",
                    0.60: "250",
                    0.65: "300",
                    0.7: "100",
                    0.8: "130",
                    0.9: "167",
                    1: "210",
                    1.1: "250",
                    1.21: "300",
                }
            },
            manufacturer: [
                {
                    name: 'Generic',
                    abbreviation: "Generic",
                    uid: "generic",
                    priceTableName: "TMV",
                },
                {
                    name: 'Caleffi',
                    abbreviation: "Caleffi",
                    uid: "caleffi",
                    priceTableName: "TMV",
                },
                {
                    name: 'Galvin',
                    abbreviation: "Galvin",
                    uid: "galvin",
                    priceTableName: "Tempering Valve",
                },
                {
                    name: 'Enware',
                    abbreviation: "Enware",
                    uid: "enware",
                    priceTableName: "Tempering Valve",
                }
            ],
        }
    },
    prv: {
        manufacturer: [
            {
                name: 'Generic',
                abbreviation: 'Generic',
                uid: 'generic',
                priceTableName: "PRV",
            },
            {
                name: 'Caleffi',
                abbreviation: 'Caleffi',
                uid: 'caleffi',
                priceTableName: "PRV",
            }
        ],
        size: {
            generic: {
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
            caleffi: {
                15: {
                    minInletPressureKPA: "200",
                    maxInletPressureKPA: "2000",
                    minFlowRateLS: "0.25",
                    maxFlowRateLS: "0.40",
                    maxPressureDropRatio: "2",
                    diameterNominalMM: 15
                },
                20: {
                    minInletPressureKPA: "200",
                    maxInletPressureKPA: "2000",
                    minFlowRateLS: "0.41",
                    maxFlowRateLS: "0.70",
                    maxPressureDropRatio: "2",
                    diameterNominalMM: 20
                },
                25: {
                    minInletPressureKPA: "200",
                    maxInletPressureKPA: "2000",
                    minFlowRateLS: "0.71",
                    maxFlowRateLS: "1.20",
                    maxPressureDropRatio: "2",
                    diameterNominalMM: 25
                },
                "32+15": {
                    minInletPressureKPA: "200",
                    maxInletPressureKPA: "2000",
                    minFlowRateLS: "1.21",
                    maxFlowRateLS: "1.80",
                    maxPressureDropRatio: "2",
                    diameterNominalMM: 47,
                },
                "40+20": {
                    minInletPressureKPA: "200",
                    maxInletPressureKPA: "2000",
                    minFlowRateLS: "1.81",
                    maxFlowRateLS: "2.60",
                    maxPressureDropRatio: "2",
                    diameterNominalMM: 60,
                },
                "50+25": {
                    minInletPressureKPA: "200",
                    maxInletPressureKPA: "2000",
                    minFlowRateLS: "2.61",
                    maxFlowRateLS: "3.80",
                    maxPressureDropRatio: "2",
                    diameterNominalMM: 75,
                },
                "2x40+25": {
                    minInletPressureKPA: "200",
                    maxInletPressureKPA: "2000",
                    minFlowRateLS: "3.81",
                    maxFlowRateLS: "6.4",
                    maxPressureDropRatio: "2",
                    diameterNominalMM: 105,
                },
                "2x50+25": {
                    minInletPressureKPA: "200",
                    maxInletPressureKPA: "2000",
                    minFlowRateLS: "6.41",
                    maxFlowRateLS: "8.8",
                    maxPressureDropRatio: "2",
                    diameterNominalMM: 125,
                },
            },
        },
    },
    pipes: {
        castIronCoated: {
            name: "Cast Iron (Coated)",
            manufacturer: [
                {
                    name: 'Generic',
                    abbreviation: 'Generic',
                    priceTableName: "Cast Iron",
                    uid: 'generic',
                }
            ],
            abbreviation: "CICL",
            pipesBySize: {
                generic: {
                    100: {
                        colebrookWhiteCoefficient: "0.3",
                        diameterInternalMM: "102",
                        diameterNominalMM: "100",
                        diameterOutsideMM: "142",
                        pipeUid: "castIronCoated",
                        safeWorkingPressureKPA: "3500"
                    },
                    150: {
                        colebrookWhiteCoefficient: "0.3",
                        diameterInternalMM: "157",
                        diameterNominalMM: "150",
                        diameterOutsideMM: "197",
                        pipeUid: "castIronCoated",
                        safeWorkingPressureKPA: "3500"
                    },
                    200: {
                        colebrookWhiteCoefficient: "0.3",
                        diameterInternalMM: "212",
                        diameterNominalMM: "200",
                        diameterOutsideMM: "252",
                        pipeUid: "castIronCoated",
                        safeWorkingPressureKPA: "3500"
                    },
                    225: {
                        colebrookWhiteCoefficient: "0.3",
                        diameterInternalMM: "238.6",
                        diameterNominalMM: "225",
                        diameterOutsideMM: "278.6",
                        pipeUid: "castIronCoated",
                        safeWorkingPressureKPA: "3500"
                    },
                    250: {
                        colebrookWhiteCoefficient: "0.3",
                        diameterInternalMM: "264.8",
                        diameterNominalMM: "250",
                        diameterOutsideMM: "304.8",
                        pipeUid: "castIronCoated",
                        safeWorkingPressureKPA: "3500"
                    },
                    300: {
                        colebrookWhiteCoefficient: "0.3",
                        diameterInternalMM: "322.4",
                        diameterNominalMM: "300",
                        diameterOutsideMM: "362.4",
                        pipeUid: "castIronCoated",
                        safeWorkingPressureKPA: "3500"
                    }
                }
            },
            uid: "castIronCoated"
        },
        copperTypeB: {
            name: "Copper",
            manufacturer: [
                {
                    name: 'Generic',
                    abbreviation: 'Generic',
                    priceTableName: "Copper",
                    uid: 'generic',
                },
                {
                    name: 'Kembla',
                    abbreviation: 'KEMBLA CU',
                    priceTableName: "Copper",
                    uid: 'kemblaCu',
                },
                {
                    name: 'BSEN 1057 TYPE X',
                    abbreviation: '1057 CU',
                    priceTableName: "Copper",
                    uid: 'bsen1057Cu',
                },
                {
                    name: 'ASTM B88 TYPE K',
                    abbreviation: 'B88 CU',
                    priceTableName: "Copper",
                    uid: 'atsmB88Cu',
                },
                {
                    name: 'Ke Kelit Type X',
                    abbreviation: 'Ke Kelit CU',
                    priceTableName: "Copper",
                    uid: 'keKelitCu',
                },
            ],
            abbreviation: "CU",
            pipesBySize: {
                generic: {
                    100: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "98.2",
                        diameterNominalMM: "100",
                        diameterOutsideMM: "101.6",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "1200"
                    },
                    15: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "10.81",
                        diameterNominalMM: "15",
                        diameterOutsideMM: "12.7",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "5290"
                    },
                    150: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "148.2",
                        diameterNominalMM: "150",
                        diameterOutsideMM: "152.4",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "1000"
                    },
                    20: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "16.9",
                        diameterNominalMM: "20",
                        diameterOutsideMM: "19.05",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "3970"
                    },
                    200: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "198.9",
                        diameterNominalMM: "200",
                        diameterOutsideMM: "203.2",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "720"
                    },
                    25: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "22.8",
                        diameterNominalMM: "25",
                        diameterOutsideMM: "25.4",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "3500"
                    },
                    32: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "29.1",
                        diameterNominalMM: "32",
                        diameterOutsideMM: "31.75",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "2780"
                    },
                    40: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "35.4",
                        diameterNominalMM: "40",
                        diameterOutsideMM: "38.1",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "2300"
                    },
                    50: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "48.3",
                        diameterNominalMM: "50",
                        diameterOutsideMM: "50.8",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "1710"
                    },
                    65: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "61",
                        diameterNominalMM: "65",
                        diameterOutsideMM: "63.5",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "1370"
                    },
                    80: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "72.9",
                        diameterNominalMM: "80",
                        diameterOutsideMM: "76.2",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "1520"
                    }
                },
                kemblaCu: {
                    100: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "98.34",
                        diameterNominalMM: "100",
                        diameterOutsideMM: "101.6",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "1200"
                    },
                    15: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "10.88",
                        diameterNominalMM: "15",
                        diameterOutsideMM: "12.7",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "5290"
                    },
                    150: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "148.34",
                        diameterNominalMM: "150",
                        diameterOutsideMM: "152.4",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "1000"
                    },
                    20: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "17.01",
                        diameterNominalMM: "20",
                        diameterOutsideMM: "19.05",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "3970"
                    },
                    200: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "199.14",
                        diameterNominalMM: "200",
                        diameterOutsideMM: "203.2",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "720"
                    },
                    25: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "22.96",
                        diameterNominalMM: "25",
                        diameterOutsideMM: "25.4",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "3500"
                    },
                    32: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "29.31",
                        diameterNominalMM: "32",
                        diameterOutsideMM: "31.75",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "2780"
                    },
                    40: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "35.66",
                        diameterNominalMM: "40",
                        diameterOutsideMM: "38.1",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "2300"
                    },
                    50: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "48.36",
                        diameterNominalMM: "50",
                        diameterOutsideMM: "50.8",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "1710"
                    },
                    65: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "61.06",
                        diameterNominalMM: "65",
                        diameterOutsideMM: "63.5",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "1370"
                    },
                    80: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "72.94",
                        diameterNominalMM: "80",
                        diameterOutsideMM: "76.2",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "1520"
                    }
                },
                bsen1057Cu: {
                    15: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "13.6",
                        diameterNominalMM: "15",
                        diameterOutsideMM: "15",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "5870"
                    },
                    22: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "20.2",
                        diameterNominalMM: "22",
                        diameterOutsideMM: "22",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "5120"
                    },
                    28: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "26.2",
                        diameterNominalMM: "28",
                        diameterOutsideMM: "28",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "3990"
                    },
                    35: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "32.6",
                        diameterNominalMM: "35",
                        diameterOutsideMM: "35",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "5150"
                    },
                    42: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "39.6",
                        diameterNominalMM: "42",
                        diameterOutsideMM: "42",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "4260"
                    },
                    54: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "51.6",
                        diameterNominalMM: "54",
                        diameterOutsideMM: "54",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "3300"
                    },
                    67: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "64.3",
                        diameterNominalMM: "67",
                        diameterOutsideMM: "67",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "2660"
                    },
                    76: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "73",
                        diameterNominalMM: "76",
                        diameterOutsideMM: "76",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "2920"
                    },
                    108: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "105",
                        diameterNominalMM: "108",
                        diameterOutsideMM: "108",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "2040"
                    },
                    133: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "130",
                        diameterNominalMM: "133",
                        diameterOutsideMM: "133",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "1650"
                    },
                    159: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "154",
                        diameterNominalMM: "159",
                        diameterOutsideMM: "159",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "1850"
                    }
                },
                atsmB88Cu: {
                    15: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "13.42",
                        diameterNominalMM: "15",
                        diameterOutsideMM: "15.9",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "5290"
                    },
                    20: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "18.9",
                        diameterNominalMM: "20",
                        diameterOutsideMM: "22.2",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "3970"
                    },
                    25: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "25.3",
                        diameterNominalMM: "25",
                        diameterOutsideMM: "28.6",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "3500"
                    },
                    32: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "31.3",
                        diameterNominalMM: "32",
                        diameterOutsideMM: "34.9",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "2780"
                    },
                    40: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "37.64",
                        diameterNominalMM: "40",
                        diameterOutsideMM: "41.3",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "2300"
                    },
                    50: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "49.78",
                        diameterNominalMM: "50",
                        diameterOutsideMM: "54",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "1710"
                    },
                    65: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "61.88",
                        diameterNominalMM: "65",
                        diameterOutsideMM: "66.7",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "1370"
                    },
                    80: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "73.86",
                        diameterNominalMM: "80",
                        diameterOutsideMM: "79.4",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "1520"
                    },
                    100: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "98.2",
                        diameterNominalMM: "100",
                        diameterOutsideMM: "105",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "1200"
                    },
                    150: {
                        colebrookWhiteCoefficient: "0.003",
                        diameterInternalMM: "146.24",
                        diameterNominalMM: "150",
                        diameterOutsideMM: "156",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "1000"
                    }
                },
                keKelitCu: {
                    15: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "13.6",
                        diameterNominalMM: "15",
                        diameterOutsideMM: "15",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "4500"
                    },
                    18: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "16.4",
                        diameterNominalMM: "18",
                        diameterOutsideMM: "18",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "4300"
                    },
                    22: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "20.2",
                        diameterNominalMM: "22",
                        diameterOutsideMM: "22",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "3900"
                    },
                    28: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "26.2",
                        diameterNominalMM: "28",
                        diameterOutsideMM: "28",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "3100"
                    },
                    35: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "32.6",
                        diameterNominalMM: "35",
                        diameterOutsideMM: "35",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "3300"
                    },
                    42: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "39.6",
                        diameterNominalMM: "42",
                        diameterOutsideMM: "42",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "2700"
                    },
                    54: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "51.6",
                        diameterNominalMM: "54",
                        diameterOutsideMM: "54",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "2100"
                    },
                    67: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "64.3",
                        diameterNominalMM: "67",
                        diameterOutsideMM: "67",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "1700"
                    },
                    76: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "73.1",
                        diameterNominalMM: "76",
                        diameterOutsideMM: "76",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "1800"
                    },
                    108: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "105",
                        diameterNominalMM: "108",
                        diameterOutsideMM: "108",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "1300"
                    },
                    133: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "130",
                        diameterNominalMM: "133",
                        diameterOutsideMM: "133",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "1000"
                    },
                    159: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "154",
                        diameterNominalMM: "159",
                        diameterOutsideMM: "159",
                        pipeUid: "copperTypeB",
                        safeWorkingPressureKPA: "1200"
                    }
                },
            },
            uid: "copperTypeB"
        },
        gmsMedium: {
            name: "GMS (Medium)",
            manufacturer: [
                {
                    name: 'Generic',
                    abbreviation: 'Generic',
                    priceTableName: "GMS",
                    uid: 'generic',
                }
            ],
            abbreviation: "GMS",
            pipesBySize: {
                generic: {
                    100: {
                        colebrookWhiteCoefficient: "0.15",
                        diameterInternalMM: "105",
                        diameterNominalMM: "100",
                        diameterOutsideMM: "114",
                        pipeUid: "gmsMedium",
                        safeWorkingPressureKPA: "5680"
                    },
                    150: {
                        colebrookWhiteCoefficient: "0.15",
                        diameterInternalMM: "155",
                        diameterNominalMM: "150",
                        diameterOutsideMM: "165",
                        pipeUid: "gmsMedium",
                        safeWorkingPressureKPA: "4330"
                    },
                }
            },
            uid: "gmsMedium"
        },
        hdpeSdr11: {
            name: "HDPE (SDR11)",
            manufacturer: [
                {
                    name: 'Generic',
                    abbreviation: 'Generic',
                    priceTableName: "HDPE",
                    uid: 'generic',
                }
            ],
            abbreviation: "HDPE",
            pipesBySize: {
                generic: {
                    110: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "89.4",
                        diameterNominalMM: "110",
                        diameterOutsideMM: "110",
                        pipeUid: "hdpeSdr11",
                        safeWorkingPressureKPA: "1600"
                    },
                    16: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "12.65",
                        diameterNominalMM: "16",
                        diameterOutsideMM: "16",
                        pipeUid: "hdpeSdr11",
                        safeWorkingPressureKPA: "1600"
                    },
                    160: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "130",
                        diameterNominalMM: "160",
                        diameterOutsideMM: "160",
                        pipeUid: "hdpeSdr11",
                        safeWorkingPressureKPA: "1600"
                    },
                    20: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "16.05",
                        diameterNominalMM: "20",
                        diameterOutsideMM: "20",
                        pipeUid: "hdpeSdr11",
                        safeWorkingPressureKPA: "1600"
                    },
                    200: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "162.5",
                        diameterNominalMM: "200",
                        diameterOutsideMM: "200",
                        pipeUid: "hdpeSdr11",
                        safeWorkingPressureKPA: "1600"
                    },
                    225: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "182.9",
                        diameterNominalMM: "225",
                        diameterOutsideMM: "225",
                        pipeUid: "hdpeSdr11",
                        safeWorkingPressureKPA: "1600"
                    },
                    25: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "20.15",
                        diameterNominalMM: "25",
                        diameterOutsideMM: "25",
                        pipeUid: "hdpeSdr11",
                        safeWorkingPressureKPA: "1600"
                    },
                    315: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "256.3",
                        diameterNominalMM: "315",
                        diameterOutsideMM: "315",
                        pipeUid: "hdpeSdr11",
                        safeWorkingPressureKPA: "1600"
                    },
                    32: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "25.95",
                        diameterNominalMM: "32",
                        diameterOutsideMM: "32",
                        pipeUid: "hdpeSdr11",
                        safeWorkingPressureKPA: "1600"
                    },
                    40: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "32.3",
                        diameterNominalMM: "40",
                        diameterOutsideMM: "40",
                        pipeUid: "hdpeSdr11",
                        safeWorkingPressureKPA: "1600"
                    },
                    50: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "40.4",
                        diameterNominalMM: "50",
                        diameterOutsideMM: "50",
                        pipeUid: "hdpeSdr11",
                        safeWorkingPressureKPA: "1600"
                    },
                    63: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "51",
                        diameterNominalMM: "63",
                        diameterOutsideMM: "63",
                        pipeUid: "hdpeSdr11",
                        safeWorkingPressureKPA: "1600"
                    },
                    75: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "61",
                        diameterNominalMM: "75",
                        diameterOutsideMM: "75",
                        pipeUid: "hdpeSdr11",
                        safeWorkingPressureKPA: "1600"
                    },
                    125: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "101",
                        diameterNominalMM: "125",
                        diameterOutsideMM: "125",
                        pipeUid: "hdpeSdr11",
                        safeWorkingPressureKPA: "1600"
                    },
                    180: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "145",
                        diameterNominalMM: "180",
                        diameterOutsideMM: "180",
                        pipeUid: "hdpeSdr11",
                        safeWorkingPressureKPA: "1600"
                    },
                }
            },
            uid: "hdpeSdr11"
        },
        pexSdr74: {
            name: "PEX",
            manufacturer: [
                {
                    name: 'Generic',
                    abbreviation: 'Generic',
                    priceTableName: "PEX",
                    uid: 'generic',
                },
                {
                    name: 'Rehau',
                    abbreviation: 'REHAU PEX',
                    priceTableName: "PEX",
                    uid: 'rehauPex',
                },
                {
                    name: 'ASTM F877',
                    abbreviation: 'ASTM F877 PEX',
                    priceTableName: "PEX",
                    uid: 'atsmF877pex',
                },
                {
                    name: 'EN ISO 15875',
                    abbreviation: 'EN ISO 15875',
                    priceTableName: "PEX",
                    uid: 'enIso15875pex',
                },
                {
                    name: 'Ke Kelit Kelox',
                    abbreviation: 'Ke Kelit PEX',
                    priceTableName: "PEX",
                    uid: 'keKelitPex',
                },
            ],
            abbreviation: "PEX",
            pipesBySize: {
                generic: {
                    110: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "78.6",
                        diameterNominalMM: "110",
                        diameterOutsideMM: "110",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "2500"
                    },
                    16: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "11.35",
                        diameterNominalMM: "16",
                        diameterOutsideMM: "16",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "2500"
                    },
                    160: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "114.7",
                        diameterNominalMM: "160",
                        diameterOutsideMM: "160",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "2500"
                    },
                    20: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "14.15",
                        diameterNominalMM: "20",
                        diameterOutsideMM: "20",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "2500"
                    },
                    25: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "17.65",
                        diameterNominalMM: "25",
                        diameterOutsideMM: "25",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "2500"
                    },
                    32: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "22.75",
                        diameterNominalMM: "32",
                        diameterOutsideMM: "32",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "2500"
                    },
                    40: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "28.5",
                        diameterNominalMM: "40",
                        diameterOutsideMM: "40",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "2500"
                    },
                    50: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "35.7",
                        diameterNominalMM: "50",
                        diameterOutsideMM: "50",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "2500"
                    },
                    63: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "45.1",
                        diameterNominalMM: "63",
                        diameterOutsideMM: "63",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "2500"
                    },
                    75: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "53.6",
                        diameterNominalMM: "75",
                        diameterOutsideMM: "75",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "2500"
                    }
                },
                rehauPex: {
                    16: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "11.6",
                        diameterNominalMM: "16",
                        diameterOutsideMM: "16",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    20: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "14.4",
                        diameterNominalMM: "20",
                        diameterOutsideMM: "20",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    25: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "18",
                        diameterNominalMM: "25",
                        diameterOutsideMM: "25",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    32: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "23.2",
                        diameterNominalMM: "32",
                        diameterOutsideMM: "32",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    40: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "29",
                        diameterNominalMM: "40",
                        diameterOutsideMM: "40",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    50: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "36.2",
                        diameterNominalMM: "50",
                        diameterOutsideMM: "50",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    63: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "45.8",
                        diameterNominalMM: "63",
                        diameterOutsideMM: "63",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    }
                },
                atsmF877pex: {
                    16: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "12.32",
                        diameterNominalMM: "16",
                        diameterOutsideMM: "15.88",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    20: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "17.28",
                        diameterNominalMM: "20",
                        diameterOutsideMM: "22.22",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    25: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "22.22",
                        diameterNominalMM: "25",
                        diameterOutsideMM: "28.58",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    32: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "27.16",
                        diameterNominalMM: "32",
                        diameterOutsideMM: "34.92",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    40: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "32.10",
                        diameterNominalMM: "40",
                        diameterOutsideMM: "41.28",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    50: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "41.98",
                        diameterNominalMM: "50",
                        diameterOutsideMM: "53.98",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    }
                },
                enIso15875pex: {
                    16: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "12",
                        diameterNominalMM: "16",
                        diameterOutsideMM: "16",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    20: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "15.5",
                        diameterNominalMM: "20",
                        diameterOutsideMM: "20",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    25: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "20",
                        diameterNominalMM: "25",
                        diameterOutsideMM: "25",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    32: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "26",
                        diameterNominalMM: "32",
                        diameterOutsideMM: "32",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    40: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "32",
                        diameterNominalMM: "40",
                        diameterOutsideMM: "40",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    50: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "41",
                        diameterNominalMM: "50",
                        diameterOutsideMM: "50",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    63: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "51",
                        diameterNominalMM: "63",
                        diameterOutsideMM: "63",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    }
                },
                keKelitPex: {
                    16: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "12",
                        diameterNominalMM: "16",
                        diameterOutsideMM: "16",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    20: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "15.5",
                        diameterNominalMM: "20",
                        diameterOutsideMM: "20",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    25: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "20",
                        diameterNominalMM: "25",
                        diameterOutsideMM: "25",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    32: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "26",
                        diameterNominalMM: "32",
                        diameterOutsideMM: "32",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    40: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "32",
                        diameterNominalMM: "40",
                        diameterOutsideMM: "40",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    50: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "41",
                        diameterNominalMM: "50",
                        diameterOutsideMM: "50",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    63: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "51",
                        diameterNominalMM: "63",
                        diameterOutsideMM: "63",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                    75: {
                        colebrookWhiteCoefficient: "0.007",
                        diameterInternalMM: "60",
                        diameterNominalMM: "75",
                        diameterOutsideMM: "75",
                        pipeUid: "pexSdr74",
                        safeWorkingPressureKPA: "1000"
                    },
                },
            },
            uid: "pexSdr74"
        },
        stainlessSteel: {
            name: "Stainless Steel",
            manufacturer: [
                {
                    name: 'Generic',
                    abbreviation: 'Generic',
                    priceTableName: "Stainless Steel",
                    uid: 'generic',
                },
                {
                    name: 'Kembla',
                    abbreviation: 'KEMBLA S/S',
                    priceTableName: "Stainless Steel",
                    uid: 'kemblaS/s',
                },
                {
                    name: 'BS 1387',
                    abbreviation: 'BS 1387 S/S',
                    priceTableName: "Stainless Steel",
                    uid: 'bs1387ss',
                },
                {
                    name: 'Ke Kelit SteelFix',
                    abbreviation: 'Ke Kelit S/S',
                    priceTableName: "Stainless Steel",
                    uid: 'keKelitS/s',
                }
            ],
            abbreviation: "S/S",
            pipesBySize: {
                generic: {
                    15: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "13",
                        diameterNominalMM: "15",
                        diameterOutsideMM: "15",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "20000"
                    },
                    22: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "19.6",
                        diameterNominalMM: "22",
                        diameterOutsideMM: "22",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "15800"
                    },
                    28: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "25.6",
                        diameterNominalMM: "28",
                        diameterOutsideMM: "28",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "12500"
                    },
                    35: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "32",
                        diameterNominalMM: "35",
                        diameterOutsideMM: "35",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "9800"
                    },
                    42: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "39",
                        diameterNominalMM: "42",
                        diameterOutsideMM: "42",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "8500"
                    },
                    54: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "51",
                        diameterNominalMM: "54",
                        diameterOutsideMM: "54",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "6800"
                    },
                    71: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "67",
                        diameterNominalMM: "71",
                        diameterOutsideMM: "71",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "7200"
                    },
                    76: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "72.1",
                        diameterNominalMM: "76",
                        diameterOutsideMM: "76.1",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "5900"
                    },
                    108: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "104",
                        diameterNominalMM: "108",
                        diameterOutsideMM: "108",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "4500"
                    },
                    166: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "162",
                        diameterNominalMM: "166",
                        diameterOutsideMM: "166",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "4000"
                    }
                },
                'kemblaS/s': {
                    15: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "13",
                        diameterNominalMM: "15",
                        diameterOutsideMM: "15",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "4000"
                    },
                    22: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "19.6",
                        diameterNominalMM: "22",
                        diameterOutsideMM: "22",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "4000"
                    },
                    28: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "25.6",
                        diameterNominalMM: "28",
                        diameterOutsideMM: "28",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "2500"
                    },
                    35: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "32",
                        diameterNominalMM: "35",
                        diameterOutsideMM: "35",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "2500"
                    },
                    42: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "39",
                        diameterNominalMM: "42",
                        diameterOutsideMM: "42",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "1600"
                    },
                    54: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "51",
                        diameterNominalMM: "54",
                        diameterOutsideMM: "54",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "1600"
                    },
                    76: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "72.1",
                        diameterNominalMM: "76",
                        diameterOutsideMM: "76.1",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "1600"
                    },
                    108: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "104",
                        diameterNominalMM: "100",
                        diameterOutsideMM: "108",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "1600"
                    }
                },
                bs1387ss: {
                    15: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "16.1",
                        diameterNominalMM: "15",
                        diameterOutsideMM: "21.3",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "20000"
                    },
                    20: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "21.7",
                        diameterNominalMM: "20",
                        diameterOutsideMM: "26.9",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "15800"
                    },
                    25: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "27.3",
                        diameterNominalMM: "25",
                        diameterOutsideMM: "33.7",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "12500"
                    },
                    32: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "36",
                        diameterNominalMM: "32",
                        diameterOutsideMM: "42.4",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "9800"
                    },
                    40: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "41.9",
                        diameterNominalMM: "40",
                        diameterOutsideMM: "48.3",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "8500"
                    },
                    50: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "53.1",
                        diameterNominalMM: "50",
                        diameterOutsideMM: "60.3",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "6800"
                    },
                    65: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "68.9",
                        diameterNominalMM: "65",
                        diameterOutsideMM: "76.1",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "7200"
                    },
                    80: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "80.9",
                        diameterNominalMM: "80",
                        diameterOutsideMM: "88.9",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "5900"
                    },
                    100: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "105.9",
                        diameterNominalMM: "100",
                        diameterOutsideMM: "114.9",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "4500"
                    }
                },
                'keKelitS/s': {
                    15: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "16",
                        diameterNominalMM: "15",
                        diameterOutsideMM: "18",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "1600"
                    },
                    20: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "19.6",
                        diameterNominalMM: "20",
                        diameterOutsideMM: "22",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "1600"
                    },
                    25: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "25.6",
                        diameterNominalMM: "25",
                        diameterOutsideMM: "28",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "1600"
                    },
                    32: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "32",
                        diameterNominalMM: "32",
                        diameterOutsideMM: "35",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "1600"
                    },
                    40: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "39",
                        diameterNominalMM: "40",
                        diameterOutsideMM: "42",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "1600"
                    },
                    50: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "51",
                        diameterNominalMM: "50",
                        diameterOutsideMM: "54",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "1600"
                    },
                    65: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "72.1",
                        diameterNominalMM: "65",
                        diameterOutsideMM: "76.1",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "1600"
                    },
                    80: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "84.9",
                        diameterNominalMM: "80",
                        diameterOutsideMM: "88.9",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "1600"
                    },
                    100: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "104",
                        diameterNominalMM: "100",
                        diameterOutsideMM: "108",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "1600"
                    },
                    125: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "135.7",
                        diameterNominalMM: "125",
                        diameterOutsideMM: "139.7",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "1600"
                    },
                    150: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "162.3",
                        diameterNominalMM: "150",
                        diameterOutsideMM: "168.3",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "1600"
                    }
                },
            },
            uid: "stainlessSteel"
        },
        cpvc: {
            name: "CPVC (SDR 11)",
            manufacturer: [
                {
                    name: 'Generic',
                    abbreviation: 'Generic',
                    priceTableName: "CPVC",
                    uid: 'generic',
                }
            ],
            abbreviation: "CPVC",
            pipesBySize: {
                generic: {
                    15: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "12.86",
                        diameterNominalMM: "15",
                        diameterOutsideMM: "15.9",
                        pipeUid: "cpvc",
                        safeWorkingPressureKPA: "4068"
                    },
                    20: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "18.14",
                        diameterNominalMM: "20",
                        diameterOutsideMM: "22.2",
                        pipeUid: "cpvc",
                        safeWorkingPressureKPA: "3310"
                    },
                    25: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "23.42",
                        diameterNominalMM: "25",
                        diameterOutsideMM: "28.6",
                        pipeUid: "cpvc",
                        safeWorkingPressureKPA: "3103"
                    },
                    32: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "28.54",
                        diameterNominalMM: "32",
                        diameterOutsideMM: "34.9",
                        pipeUid: "cpvc",
                        safeWorkingPressureKPA: "2517"
                    },
                    40: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "33.78",
                        diameterNominalMM: "40",
                        diameterOutsideMM: "41.3",
                        pipeUid: "cpvc",
                        safeWorkingPressureKPA: "2275"
                    },
                    50: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "44.2",
                        diameterNominalMM: "50",
                        diameterOutsideMM: "54",
                        pipeUid: "cpvc",
                        safeWorkingPressureKPA: "1896"
                    }
                }
            },
            uid: "cpvc"
        },
        stainlessSteelSewer: {
            name: "Stainless Steel (Sewer)",
            abbreviation: "S/S",
            manufacturer: [
                {
                    name: 'Generic',
                    abbreviation: 'Generic',
                    priceTableName: "Stainless Steel (Sewer)",
                    uid: 'generic',
                },
                {
                    name: 'Blucher',
                    abbreviation: 'Blucher S/S',
                    priceTableName: "Stainless Steel (Sewer)",
                    uid: 'blucherSS',
                }
            ],
            uid: 'stainlessSteelSewer',
            pipesBySize: {
                generic: {
                    50: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "50",
                        diameterNominalMM: "50",
                        diameterOutsideMM: "50",
                        pipeUid: "stainlessSteelSewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    75: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "75",
                        diameterNominalMM: "75",
                        diameterOutsideMM: "75",
                        pipeUid: "stainlessSteelSewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    110: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "110",
                        diameterNominalMM: "110",
                        diameterOutsideMM: "110",
                        pipeUid: "stainlessSteelSewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    160: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "160",
                        diameterNominalMM: "160",
                        diameterOutsideMM: "160",
                        pipeUid: "stainlessSteelSewer",
                        safeWorkingPressureKPA: "1600"
                    }
                },
                blucherSS: {
                    50: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "50",
                        diameterNominalMM: "50",
                        diameterOutsideMM: "50",
                        pipeUid: "stainlessSteelSewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    75: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "75",
                        diameterNominalMM: "75",
                        diameterOutsideMM: "75",
                        pipeUid: "stainlessSteelSewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    110: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "110",
                        diameterNominalMM: "110",
                        diameterOutsideMM: "110",
                        pipeUid: "stainlessSteelSewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    160: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "160",
                        diameterNominalMM: "160",
                        diameterOutsideMM: "160",
                        pipeUid: "stainlessSteelSewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    200: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "200",
                        diameterNominalMM: "200",
                        diameterOutsideMM: "200",
                        pipeUid: "stainlessSteelSewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    250: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "250",
                        diameterNominalMM: "250",
                        diameterOutsideMM: "250",
                        pipeUid: "stainlessSteelSewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    315: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "315",
                        diameterNominalMM: "315",
                        diameterOutsideMM: "315",
                        pipeUid: "stainlessSteelSewer",
                        safeWorkingPressureKPA: "1600"
                    }
                }
            }
        },
        uPVCSewer: {
            name: "Unplasticised PVC (Sewer)",
            abbreviation: "uPCV",
            manufacturer: [
                {
                    name: 'Generic',
                    abbreviation: 'Generic',
                    priceTableName: "uPVC (Sewer)",
                    uid: 'generic',
                },
            ],
            uid: 'uPVCSewer',
            pipesBySize: {
                generic: {
                    40: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "40",
                        diameterNominalMM: "40",
                        diameterOutsideMM: "40",
                        pipeUid: "uPVCSewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    50: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "50",
                        diameterNominalMM: "50",
                        diameterOutsideMM: "50",
                        pipeUid: "uPVCSewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    65: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "65",
                        diameterNominalMM: "65",
                        diameterOutsideMM: "65",
                        pipeUid: "uPVCSewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    80: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "80",
                        diameterNominalMM: "80",
                        diameterOutsideMM: "80",
                        pipeUid: "uPVCSewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    100: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "100",
                        diameterNominalMM: "100",
                        diameterOutsideMM: "100",
                        pipeUid: "uPVCSewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    150: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "150",
                        diameterNominalMM: "150",
                        diameterOutsideMM: "150",
                        pipeUid: "uPVCSewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    225: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "225",
                        diameterNominalMM: "225",
                        diameterOutsideMM: "225",
                        pipeUid: "uPVCSewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    300: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "300",
                        diameterNominalMM: "300",
                        diameterOutsideMM: "300",
                        pipeUid: "uPVCSewer",
                        safeWorkingPressureKPA: "1600"
                    }
                }
            }
        },
        hdpeSdr11Sewer: {
            name: "HDPE (SDR11) (Sewer)",
            abbreviation: "HDPE",
            manufacturer: [
                {
                    name: 'Generic',
                    abbreviation: 'Generic',
                    priceTableName: "HDPE (Sewer)",
                    uid: 'generic',
                },
            ],
            uid: 'hdpeSdr11Sewer',
            pipesBySize: {
                generic: {
                    50: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "50",
                        diameterNominalMM: "50",
                        diameterOutsideMM: "50",
                        pipeUid: "hdpeSdr11Sewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    75: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "75",
                        diameterNominalMM: "75",
                        diameterOutsideMM: "75",
                        pipeUid: "hdpeSdr11Sewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    90: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "90",
                        diameterNominalMM: "90",
                        diameterOutsideMM: "90",
                        pipeUid: "hdpeSdr11Sewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    110: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "110",
                        diameterNominalMM: "110",
                        diameterOutsideMM: "110",
                        pipeUid: "hdpeSdr11Sewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    160: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "160",
                        diameterNominalMM: "160",
                        diameterOutsideMM: "160",
                        pipeUid: "hdpeSdr11Sewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    250: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "250",
                        diameterNominalMM: "250",
                        diameterOutsideMM: "250",
                        pipeUid: "hdpeSdr11Sewer",
                        safeWorkingPressureKPA: "1600"
                    }
                }
            }
        },
        castIronSewer: {
            name: "Cast Iron (Sewer)",
            abbreviation: "CICL",
            manufacturer: [
                {
                    name: 'Generic',
                    abbreviation: 'Generic',
                    priceTableName: "Cast Iron (Sewer)",
                    uid: 'generic',
                },
            ],
            uid: 'castIronSewer',
            pipesBySize: {
                generic: {
                    50: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "50",
                        diameterNominalMM: "50",
                        diameterOutsideMM: "50",
                        pipeUid: "castIronSewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    70: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "70",
                        diameterNominalMM: "70",
                        diameterOutsideMM: "70",
                        pipeUid: "castIronSewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    100: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "100",
                        diameterNominalMM: "100",
                        diameterOutsideMM: "100",
                        pipeUid: "castIronSewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    150: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "150",
                        diameterNominalMM: "150",
                        diameterOutsideMM: "150",
                        pipeUid: "castIronSewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    200: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "200",
                        diameterNominalMM: "200",
                        diameterOutsideMM: "200",
                        pipeUid: "castIronSewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    250: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "250",
                        diameterNominalMM: "250",
                        diameterOutsideMM: "250",
                        pipeUid: "castIronSewer",
                        safeWorkingPressureKPA: "1600"
                    },
                    300: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "300",
                        diameterNominalMM: "300",
                        diameterOutsideMM: "300",
                        pipeUid: "castIronSewer",
                        safeWorkingPressureKPA: "1600"
                    }
                }
            }
        },
    },
    valves: {
        "45Elbow": {
            abbreviation: "NA",
            name: "45 Elbow",
            uid: "45Elbow",
            valvesBySize: {
                "100-110": {
                    diameterNominalMM: "100-110",
                    kValue: "0.27",
                    symbol: null,
                    valveUid: "45Elbow"
                },
                "15-16": {
                    diameterNominalMM: "15-16",
                    kValue: "0.43",
                    symbol: null,
                    valveUid: "45Elbow"
                },
                "150-160": {
                    diameterNominalMM: "150-160",
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
                "100-110": {
                    diameterNominalMM: "100-110",
                    kValue: "0.51",
                    symbol: null,
                    valveUid: "90Elbow"
                },
                "15-16": {
                    diameterNominalMM: "15-16",
                    kValue: "0.81",
                    symbol: null,
                    valveUid: "90Elbow"
                },
                "150-160": {
                    diameterNominalMM: "150-160",
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
                "100-110": {
                    diameterNominalMM: "100-110",
                    kValue: "0.05",
                    symbol: null,
                    valveUid: "ballValve"
                },
                "15-16": {
                    diameterNominalMM: "15-16",
                    kValue: "0.08",
                    symbol: null,
                    valveUid: "ballValve"
                },
                "150-160": {
                    diameterNominalMM: "150-160",
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
                "100-110": {
                    diameterNominalMM: "100-110",
                    kValue: "0.77",
                    symbol: null,
                    valveUid: "butterflyValve"
                },
                "150-160": {
                    diameterNominalMM: "150-160",
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
                "15-50": {
                    diameterNominalMM: "15-50",
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
                "100-110": {
                    diameterNominalMM: "100-110",
                    kValue: "1.7",
                    symbol: null,
                    valveUid: "checkValve"
                },
                "15-16": {
                    diameterNominalMM: "15-16",
                    kValue: "2.7",
                    symbol: null,
                    valveUid: "checkValve"
                },
                "150-160": {
                    diameterNominalMM: "150-160",
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
                "100-110": {
                    diameterNominalMM: "100-110",
                    kValue: "0.14",
                    symbol: null,
                    valveUid: "gateValve"
                },
                "15-16": {
                    diameterNominalMM: "15-16",
                    kValue: "0.22",
                    symbol: null,
                    valveUid: "gateValve"
                },
                "150-160": {
                    diameterNominalMM: "150-160",
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
                "100-110": {
                    diameterNominalMM: "100-110",
                    kValue: "1.02",
                    symbol: null,
                    valveUid: "tThruBranch"
                },
                "15-16": {
                    diameterNominalMM: "15-16",
                    kValue: "1.62",
                    symbol: null,
                    valveUid: "tThruBranch"
                },
                "150-160": {
                    diameterNominalMM: "150-160",
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
                "100-110": {
                    diameterNominalMM: "100-110",
                    kValue: "0.34",
                    symbol: null,
                    valveUid: "tThruFlow"
                },
                "15-16": {
                    diameterNominalMM: "15-16",
                    kValue: "0.54",
                    symbol: null,
                    valveUid: "tThruFlow"
                },
                "150-160": {
                    diameterNominalMM: "150-160",
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
            name: "Meter",
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
                76: { cold: "5.7", hot: "5.7" },
                77: { cold: "5.78", hot: "5.78" },
                78: { cold: "5.85", hot: "5.85" },
                79: { cold: "5.93", hot: "5.93" },
                80: { cold: "6", hot: "6" },
                81: { cold: "6.08", hot: "6.08" },
                82: { cold: "6.15", hot: "6.15" },
                83: { cold: "6.25", hot: "6.25" },
                84: { cold: "6.3", hot: "6.3" },
                85: { cold: "6.38", hot: "6.38" },
                86: { cold: "6.45", hot: "6.45" },
                87: { cold: "6.53", hot: "6.53" },
                88: { cold: "6.6", hot: "6.6" },
                89: { cold: "6.68", hot: "6.68" },
                90: { cold: "6.75", hot: "6.75" },
                91: { cold: "6.83", hot: "6.83" },
                92: { cold: "6.9", hot: "6.9" },
                93: { cold: "6.98", hot: "6.98" },
                94: { cold: "7.05", hot: "7.05" },
                95: { cold: "7.13", hot: "7.13" },
                96: { cold: "7.2", hot: "7.2" },
                97: { cold: "7.28", hot: "7.28" },
                98: { cold: "7.35", hot: "7.35" },
                99: { cold: "7.43", hot: "7.43" },
                100: { cold: "7.5", hot: "7.5" }
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
        },
        ipc2018FlushTanks: {
            type: PSDStandardType.LU_LOOKUP_TABLE,
            name: "IPC 2018 - Flush Tanks",
            table: {
                1: "0.1892706",
                2: "0.315451",
                3: "0.4100863",
                4: "0.5047216",
                5: "0.59304788",
                6: "0.67506514",
                7: "0.74446436",
                8: "0.80755456",
                9: "0.86433574",
                10: "0.92111692",
                11: "0.97158908",
                12: "1.0094432",
                13: "1.0409883",
                14: "1.0725334",
                15: "1.1040785",
                16: "1.1356236",
                17: "1.16085968",
                18: "1.18609576",
                19: "1.21133184",
                20: "1.23656792",
                25: "1.3564393",
                30: "1.47000166",
                35: "1.57094598",
                40: "1.65927226",
                45: "1.74759854",
                50: "1.83592482",
                60: "2.0188864",
                70: "2.208157",
                80: "2.3974276",
                90: "2.5866982",
                100: "2.7444237",
                120: "3.0283296",
                140: "3.3122355",
                160: "3.5961414",
                180: "3.8485022",
                200: "4.100863",
                225: "4.416314",
                250: "4.731765",
                275: "5.047216",
                300: "5.362667",
                400: "6.624471",
                500: "7.8231848",
                750: "10.725334",
                1000: "13.1227616",
                1250: "15.0785578",
                1500: "16.9712638",
                1750: "18.7377894",
                2000: "20.504315",
                2500: "23.974276",
                3000: "27.3180566",
                4000: "33.122355",
                5000: "37.4124886",
            },
        },
        ipc2018Flushometer: {
            type: PSDStandardType.LU_LOOKUP_TABLE,
            name: "IPC 2018 - Flushometer",
            table: {
                1: "0.5",
                2: "0.6",
                3: "0.75",
                4: "0.85",
                5: "0.946353",
                6: "1.09776948",
                7: "1.24918596",
                8: "1.40060244",
                9: "1.55201892",
                10: "1.7034354",
                11: "1.75390756",
                12: "1.80437972",
                13: "1.85485188",
                14: "1.90532404",
                15: "1.9557962",
                16: "2.00626836",
                17: "2.05674052",
                18: "2.10721268",
                19: "2.15768484",
                20: "2.208157",
                25: "2.3974276",
                30: "2.6497884",
                35: "2.7759688",
                40: "2.9021492",
                45: "3.0283296",
                50: "3.15451",
                60: "3.4068708",
                70: "3.6592316",
                80: "3.86112024",
                90: "4.05669986",
                100: "4.24597046",
                120: "4.6055846",
                140: "4.8579454",
                160: "5.1103062",
                180: "5.3942121",
                200: "5.678118",
                225: "6.0251141",
                250: "6.3721102",
                275: "6.5929259",
                300: "6.8137416",
                400: "8.0124554",
                500: "9.0218986",
                750: "11.1669654",
                1000: "13.1227616",
                1250: "15.0785578",
                1500: "16.9712638",
                1750: "18.7377894",
                2000: "20.504315",
                2500: "23.974276",
                3000: "27.3180566",
                4000: "33.122355",
                5000: "37.4124886",
            }
        },
        bs8558: {
            type: PSDStandardType.LU_LOOKUP_TABLE,
            name: "BS 8558",
            table: {
                0: "0.00",
                1: "0.09",
                3: "0.15",
                5: "0.2",
                10: "0.3",
                15: "0.38",
                20: "0.44",
                30: "0.56",
                40: "0.67",
                50: "0.77",
                80: "1.06",
                100: "1.25",
                150: "1.68",
                200: "2.11",
                250: "2.44",
                300: "2.8",
                400: "3.55",
                500: "4.1",
                700: "5.25",
                1000: "6.76",
                2000: "11.3",
                3000: "15.1",
                4000: "18.5",
                5000: "22.5",
                6000: "25.2",
                7000: "28",
                7750: "30",
            }
        },
        cibseGuideG: {
            type: PSDStandardType.LU_LOOKUP_TABLE,
            name: "CIPHE",
            table: {
                0: "0.00", // added manually to force interpolation
                1: "0.09",
                3: "0.15",
                5: "0.2",
                10: "0.3",
                15: "0.38",
                20: "0.44",
                30: "0.56",
                40: "0.67",
                50: "0.77",
                80: "1.06",
                100: "1.25",
                150: "1.68",
                200: "2.11",
                250: "2.44",
                300: "2.8",
                400: "3.55",
                500: "4.1",
                700: "5.25",
                1000: "6.76",
                2000: "11.3",
                3000: "15.1",
                4000: "18.5",
                5000: "22.5",
                6000: "25.2",
                7000: "28",
                7750: "30",
            }
        },
        upc2018FlushTanks: {
            type: PSDStandardType.LU_LOOKUP_TABLE,
            name: "UPC 2018 Flush Tanks",
            table: {
                0: "0.00", // added manually to force interpolation
                10: "0.5047216",
                20: "0.946353",
                40: "1.577255",
                60: "2.0819766",
                80: "2.3974276",
                100: "2.7128786",
                120: "3.0283296",
                140: "3.3437806",
                160: "3.5961414",
                180: "3.785412",
                200: "4.0377728",
                220: "4.2270434",
                240: "4.4794042",
                250: "4.6055846",
                500: "7.886275",
                750: "10.725334",
                1000: "13.1227616",
                1500: "17.034354",
                2000: "20.504315",
                2500: "23.8480956",
                3000: "27.128786",
            }
        },
        upc2018Flushometer: {
            type: PSDStandardType.LU_LOOKUP_TABLE,
            name: "UPC 2018 Flushometer",
            table: {
                0: "0.00", // added manually to force interpolation
                10: "1.577255",
                20: "2.208157",
                40: "2.9652394",
                60: "3.469961",
                80: "3.785412",
                100: "4.2270434",
                120: "4.6686748",
                140: "4.8579454",
                160: "5.1733964",
                180: "5.362667",
                200: "5.6150278",
                220: "5.8673886",
                240: "6.1197494",
                250: "6.2459298",
                500: "8.9588084",
                750: "11.2300556",
                1000: "13.1227616",
                1500: "17.034354",
                2000: "20.504315",
                2500: "23.8480956",
                3000: "27.128786",
            }
        },
        bs806: {
            name: "BS 806",
            type: PSDStandardType.LU_MAX_LOOKUP_TABLE,
            maxLuTable: {
                2: {
                    0: "0.00", // added manually to force interpolation, though this is likely correct
                    2: "0.2",
                    3: "0.24",
                    4: "0.27",
                    5: "0.29",
                    6: "0.32",
                    7: "0.34",
                    8: "0.36",
                    9: "0.38",
                    10: "0.4",
                    15: "0.46",
                    20: "0.52",
                    30: "0.62",
                    40: "0.7",
                    50: "0.78",
                    60: "0.83",
                    70: "0.9",
                    80: "0.95",
                    90: "1",
                    100: "1.05",
                    150: "1.25",
                    200: "1.4",
                    300: "1.7",
                    400: "2",
                    500: "2.3",
                    600: "2.6",
                    700: "2.8",
                    800: "3",
                    900: "3.2",
                    1000: "3.4",
                    2000: "5.25",
                    3000: "6.75",
                    5000: "9",
                    6000: "9.91",
                    7000: "10.87",
                    8000: "11.79",
                    9000: "12.66",
                    10000: "13.49",
                },
                3: {
                    0: "0.00", // added manually to force interpolation, though this is likely correct
                    3: "0.3",
                    4: "0.34",
                    5: "0.36",
                    6: "0.39",
                    7: "0.41",
                    8: "0.43",
                    9: "0.45",
                    10: "0.48",
                    15: "0.54",
                    20: "0.6",
                    30: "0.7",
                    40: "0.77",
                    50: "0.85",
                    60: "0.92",
                    70: "0.97",
                    80: "1.05",
                    90: "1.09",
                    100: "1.12",
                    150: "1.3",
                    200: "1.45",
                    300: "1.7",
                    400: "2",
                    500: "2.3",
                    600: "2.6",
                    700: "2.8",
                    800: "3",
                    900: "3.2",
                    1000: "3.4",
                    2000: "5.25",
                    3000: "6.75",
                    5000: "9",
                    6000: "9.91",
                    7000: "10.87",
                    8000: "11.79",
                    9000: "12.66",
                    10000: "13.49",
                },
                4: {
                    0: "0.00", // added manually to force interpolation, though this is likely correct
                    4: "0.4",
                    5: "0.43",
                    6: "0.46",
                    7: "0.48",
                    8: "0.5",
                    9: "0.52",
                    10: "0.54",
                    15: "0.6",
                    20: "0.68",
                    30: "0.78",
                    40: "0.85",
                    50: "0.93",
                    60: "0.99",
                    70: "1.03",
                    80: "1.1",
                    90: "1.15",
                    100: "1.2",
                    150: "1.35",
                    200: "1.46",
                    300: "1.7",
                    400: "2",
                    500: "2.3",
                    600: "2.6",
                    700: "2.8",
                    800: "3",
                    900: "3.2",
                    1000: "3.4",
                    2000: "5.25",
                    3000: "6.75",
                    5000: "9",
                    6000: "9.91",
                    7000: "10.87",
                    8000: "11.79",
                    9000: "12.66",
                    10000: "13.49",
                },
                5: {
                    0: "0.00", // added manually to force interpolation, though this is likely correct
                    5: "0.5",
                    6: "0.53",
                    7: "0.55",
                    8: "0.57",
                    9: "0.59",
                    10: "0.6",
                    15: "0.7",
                    20: "0.75",
                    30: "0.85",
                    40: "0.94",
                    50: "1",
                    60: "1.05",
                    70: "1.1",
                    80: "1.15",
                    90: "1.2",
                    100: "1.26",
                    150: "1.43",
                    200: "1.47",
                    300: "1.7",
                    400: "2",
                    500: "2.3",
                    600: "2.6",
                    700: "2.8",
                    800: "3",
                    900: "3.2",
                    1000: "3.4",
                    2000: "5.25",
                    3000: "6.75",
                    5000: "9",
                    6000: "9.91",
                    7000: "10.87",
                    8000: "11.79",
                    9000: "12.66",
                    10000: "13.49",
                },
                8: {
                    0: "0.00", // added manually to force interpolation, though this is likely correct
                    8: "0.8",
                    9: "0.83",
                    10: "0.85",
                    15: "0.9",
                    20: "0.97",
                    30: "1.05",
                    40: "1.12",
                    50: "1.2",
                    60: "1.22",
                    70: "1.28",
                    80: "1.3",
                    90: "1.32",
                    100: "1.36",
                    150: "1.45",
                    200: "1.5",
                    300: "1.7",
                    400: "2",
                    500: "2.3",
                    600: "2.6",
                    700: "2.8",
                    800: "3",
                    900: "3.2",
                    1000: "3.4",
                    2000: "5.25",
                    3000: "6.75",
                    5000: "9",
                    6000: "9.91",
                    7000: "10.87",
                    8000: "11.79",
                    9000: "12.66",
                    10000: "13.49",
                },
                15: {
                    0: "0.00", // added manually to force interpolation, though this is likely correct
                    15: "1.5",
                    20: "1.52",
                    30: "1.54",
                    40: "1.56",
                    50: "1.58",
                    60: "1.6",
                    70: "1.6",
                    80: "1.61",
                    90: "1.61",
                    100: "1.62",
                    150: "1.65",
                    200: "1.68",
                    300: "1.7",
                    400: "2",
                    500: "2.3",
                    600: "2.6",
                    700: "2.8",
                    800: "3",
                    900: "3.2",
                    1000: "3.4",
                    2000: "5.25",
                    3000: "6.75",
                    5000: "9",
                    6000: "9.91",
                    7000: "10.87",
                    8000: "11.79",
                    9000: "12.66",
                    10000: "13.49",
                },
            }
        }
    },
    en12056FrequencyFactor: {
        [EN12056FrequencyFactor.IntermittentUse]: 0.5,
        [EN12056FrequencyFactor.FrequentUse]: 0.7,
        [EN12056FrequencyFactor.CongestedUse]: 1.0,
        [EN12056FrequencyFactor.SpecialUse]: 1.2,
    },
    gasDiversification: {
        1: 1,
        2: 0.73,
        3: 0.702,
        4: 0.674,
        5: 0.65,
        6: 0.624,
        7: 0.602,
        8: 0.59,
        9: 0.559,
        10: 0.54,
        11: 0.522,
        12: 0.506,
        13: 0.482,
        14: 0.475,
        15: 0.46,
        16: 0.447,
        17: 0.434,
        18: 0.421,
        19: 0.409,
        20: 0.398,
        21: 0.387,
        22: 0.377,
        23: 0.367,
        24: 0.357,
        25: 0.348,
        26: 0.341,
        27: 0.332,
        28: 0.326,
        29: 0.317,
        30: 0.310,
        31: 0.303,
        32: 0.298,
        33: 0.292,
        34: 0.286,
        35: 0.281,
        36: 0.276,
        37: 0.272,
        38: 0.268,
        39: 0.264,
        40: 0.26,
        41: 0.256,
        42: 0.252,
        43: 0.248,
        44: 0.245,
        45: 0.242,
        46: 0.239,
        47: 0.236,
        48: 0.233,
        49: 0.231,
        50: 0.229,
        51: 0.227,
        52: 0.225,
        53: 0.223,
        54: 0.221,
        55: 0.219,
        56: 0.217,
        57: 0.216,
        58: 0.214,
        59: 0.212,
        60: 0.211,
        61: 0.209,
        62: 0.207,
        63: 0.206,
        64: 0.205,
        65: 0.204,
        66: 0.203,
        67: 0.203,
        68: 0.202,
        69: 0.201,
        70: 0.2,
        71: 0.199,
        72: 0.199,
        73: 0.198,
        74: 0.198,
        75: 0.197,
        76: 0.197,
        77: 0.196,
        78: 0.196,
        79: 0.196,
        80: 0.195,
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
                70: "0.0004024",
            },
            state: State.LIQUID,
            specificHeatByTemperatureKJ_KGK: {
                0.01: "4.2174",
                10: "4.191",
                20: "4.157",
                25: "4.1379",
                30: "4.1175",
                40: "4.0737",
                50: "4.0264",
                60: "3.9767",
                70: "3.9252",
                80: "3.8729",
                90: "3.8204",
                100: "3.7682",
                110: "3.7167",
                120: "3.6662",
                140: "3.5694",
                160: "3.4788",
                180: "3.3949",
                200: "3.3179",
                220: "3.2479",
                240: "3.185",
                260: "3.1301",
                280: "3.0849",
                300: "3.053",
                320: "3.0428",
                340: "3.0781",
                360: "3.2972",
            }
        },
        LPG: {
            name: "LPG Gas",
            densityKGM3: "1.898",
            dynamicViscosityByTemperature: {
                0: "0",
            },
            specificHeatByTemperatureKJ_KGK: {
                0: "0",
            },
            state: State.GAS,
        },
        naturalGas: {
            name: "Natural Gas",
            densityKGM3: "0.8",
            dynamicViscosityByTemperature: {
                0: "0",
            },
            specificHeatByTemperatureKJ_KGK: {
                0: "0",
            },
            state: State.GAS,
        },
        sewage: {
            name: "Sewage",
            densityKGM3: "1000",
            dynamicViscosityByTemperature: {
                0: "0",
            },
            specificHeatByTemperatureKJ_KGK: {
                0: "0",
            },
            state: State.LIQUID,
        }
    },
    backflowValves: {
        RPZD: {
            name: "RPZD",
            manufacturer: [
                {
                    priceTableName: 'RPZD',
                    name: 'Generic',
                    abbreviation: 'Generic',
                    uid: 'generic',
                },
                {
                    name: 'Apollo',
                    abbreviation: 'Apollo',
                    uid: 'apolloRpzd',
                    priceTableName: "RPZD",
                }
            ],
            valvesBySize: {
                generic: {
                    15: {
                        sizeMM: "15",
                        minInletPressureKPA: "200",
                        maxInletPressureKPA: "2000",
                        minFlowRateLS: "0",
                        maxFlowRateLS: "0.48",
                        pressureLossKPAByFlowRateLS: {
                            0.00: "0",
                            0.01: "60",
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
                            0.48: "75",
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
                            0.83: "67",
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
                            1.36: "82",
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
                            2.30: "87",
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
                            3.25: "87",
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
                            5.15: "97",
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
                            7.55: "85",
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
                            12: "67",
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
                },
                apolloRpzd: {
                    15: {
                        sizeMM: "15",
                        minInletPressureKPA: "150",
                        maxInletPressureKPA: "2000",
                        minFlowRateLS: "0",
                        maxFlowRateLS: "0.48",
                        pressureLossKPAByFlowRateLS: {
                            0.00: "0",
                            0.01: "60",
                            0.17: "90",
                            0.37: "85",
                            0.48: "80"
                        }
                    },
                    20: {
                        sizeMM: "20",
                        minInletPressureKPA: "150",
                        maxInletPressureKPA: "2000",
                        minFlowRateLS: "0.48",
                        maxFlowRateLS: "0.83",
                        pressureLossKPAByFlowRateLS: {
                            0.48: "75",
                            0.6: "70",
                            0.7: "73",
                            0.83: "74"
                        }
                    },
                    25: {
                        sizeMM: "25",
                        minInletPressureKPA: "150",
                        maxInletPressureKPA: "2000",
                        minFlowRateLS: "0.83",
                        maxFlowRateLS: "1.36",
                        pressureLossKPAByFlowRateLS: {
                            0.83: "67",
                            1: "65",
                            1.2: "64",
                            1.36: "65"
                        }
                    },
                    32: {
                        sizeMM: "32",
                        minInletPressureKPA: "150",
                        maxInletPressureKPA: "2000",
                        minFlowRateLS: "1.36",
                        maxFlowRateLS: "2.3",
                        pressureLossKPAByFlowRateLS: {
                            1.36: "82",
                            1.7: "75",
                            2: "70",
                            2.3: "68"
                        }
                    },
                    40: {
                        sizeMM: "40",
                        minInletPressureKPA: "150",
                        maxInletPressureKPA: "2000",
                        minFlowRateLS: "2.3",
                        maxFlowRateLS: "3.25",
                        pressureLossKPAByFlowRateLS: {
                            2.30: "87",
                            2.6: "85",
                            2.9: "85",
                            3.25: "85"
                        }
                    },
                    50: {
                        sizeMM: "50",
                        minInletPressureKPA: "150",
                        maxInletPressureKPA: "2000",
                        minFlowRateLS: "3.25",
                        maxFlowRateLS: "5.15",
                        pressureLossKPAByFlowRateLS: {
                            3.25: "87",
                            4: "85",
                            4.5: "85",
                            5.15: "85"
                        }
                    },
                    65: {
                        sizeMM: "65",
                        minInletPressureKPA: "150",
                        maxInletPressureKPA: "2000",
                        minFlowRateLS: "5.15",
                        maxFlowRateLS: "7.5",
                        pressureLossKPAByFlowRateLS: {
                            5.15: "97",
                            6: "97",
                            7: "98",
                            7.5: "97"
                        }
                    },
                    80: {
                        sizeMM: "80",
                        minInletPressureKPA: "150",
                        maxInletPressureKPA: "2000",
                        minFlowRateLS: "7.5",
                        maxFlowRateLS: "12",
                        pressureLossKPAByFlowRateLS: {
                            7.55: "85",
                            9: "85",
                            11: "87",
                            12: "88"
                        }
                    },
                    100: {
                        sizeMM: "100",
                        minInletPressureKPA: "150",
                        maxInletPressureKPA: "2000",
                        minFlowRateLS: "12",
                        maxFlowRateLS: "20",
                        pressureLossKPAByFlowRateLS: {
                            12: "67",
                            15: "65",
                            18: "65",
                            20: "65"
                        }
                    },
                    150: {
                        sizeMM: "150",
                        minInletPressureKPA: "150",
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
            },
            abbreviation: "RPZD",
            uid: "RPZD",
        }
    },
    balancingValves: {
        manufacturer: [
            { name: "Generic", abbreviation: "Generic", uid: "generic", priceTableName: 'Balancing Valve' },
            { name: "Cimberio", abbreviation: "Cimberio", uid: "cimberio", priceTableName: 'Balancing Valve' }
        ],
    },
    hotWaterPlant: {
        manufacturer: [
            {
                name: "Generic",
                abbreviation: "Generic",
                uid: "generic",
                priceTableName: "Hot Water Plant",
                returns: true
            },
            {
                name: "Grundfos",
                abbreviation: "Grundfos",
                uid: "grundfos",
                priceTableName: "Hot Water Plant",
                returns: true,
            },
            {
                name: "Generic",
                abbreviation: "Generic",
                uid: "generic",
                priceTableName: "Hot Water Plant",
            },
            {
                name: "Rheem",
                abbreviation: "Rheem",
                uid: "rheem",
                priceTableName: "Hot Water Plant"
            },

        ],
        rheemVariants: [
            {
                name: RheemVariant.continuousFlow,
                uid: RheemVariantValues.continuousFlow,
            },
            {
                name: RheemVariant.tankpak,
                uid: RheemVariantValues.tankpak,
            },
            {
                name: RheemVariant.electric,
                uid: RheemVariantValues.electric,
            },
            {
                name: RheemVariant.heatPump,
                uid: RheemVariantValues.heatPump,
            },
        ],
        grundfosPressureDrop: {
            "20-60-1": {
                "0.000": "26.471",
                "0.026": "23.147",
                "0.052": "20.294",
                "0.078": "17.804",
                "0.104": "15.549",
                "0.131": "13.412",
                "0.139": "12.745",
                "0.157": "11.382",
                "0.183": "9.696",
                "0.209": "8.294",
                "0.235": "7.088",
                "0.261": "6.020",
                "0.288": "5.029",
                "0.314": "4.098",
                "0.340": "3.186",
                "0.366": "2.314",
                "0.392": "1.471",
                "0.418": "0.686",
                "0.444": "0.000",
            },
            "20-60-2": {
                "0.000": "47.549",
                "0.041": "44.236",
                "0.082": "40.618",
                "0.123": "36.834",
                "0.163": "32.990",
                "0.204": "29.226",
                "0.245": "25.667",
                "0.278": "23.039",
                "0.286": "22.422",
                "0.327": "19.471",
                "0.368": "16.735",
                "0.409": "14.206",
                "0.449": "11.853",
                "0.490": "9.647",
                "0.531": "7.569",
                "0.572": "5.588",
                "0.613": "3.686",
                "0.654": "1.833",
                "0.694": "0.000",
            },
            "20-60-3": {
                "0.000": "58.785",
                "0.067": "56.295",
                "0.134": "53.677",
                "0.201": "50.951",
                "0.268": "48.108",
                "0.335": "45.138",
                "0.402": "42.040",
                "0.469": "38.824",
                "0.536": "35.481",
                "0.603": "32.010",
                "0.670": "28.412",
                "0.694": "27.059",
                "0.737": "24.667",
                "0.804": "20.735",
                "0.871": "16.667",
                "0.938": "12.510",
                "1.005": "8.314",
                "1.072": "4.127",
                "1.139": "0.000",
            },
            "32-80-1": {
                "0.000": "53.775",
                "0.073": "51.736",
                "0.145": "46.422",
                "0.217": "39.471",
                "0.290": "32.108",
                "0.362": "25.196",
                "0.435": "19.245",
                "0.507": "14.530",
                "0.579": "11.079",
                "0.652": "8.775",
                "0.724": "7.363",
                "0.797": "6.559",
                "0.869": "6.020",
                "0.942": "5.471",
                "1.014": "4.726",
                "1.087": "3.735",
                "1.159": "2.647",
                "1.231": "1.833",
                "1.304": "1.980",
            },
            "32-80-2": {
                "0.000": "68.481",
                "0.112": "66.295",
                "0.224": "63.726",
                "0.336": "60.432",
                "0.448": "56.304",
                "0.559": "51.344",
                "0.671": "45.696",
                "0.783": "39.618",
                "0.895": "33.392",
                "1.007": "27.343",
                "1.119": "21.775",
                "1.231": "16.971",
                "1.343": "13.118",
                "1.455": "10.314",
                "1.567": "8.500",
                "1.679": "7.461",
                "1.790": "6.775",
                "1.902": "5.775",
                "2.014": "3.520",
            },
            "32-80-3": {
                "0.000": "73.157",
                "0.170": "71.373",
                "0.339": "69.608",
                "0.509": "67.687",
                "0.679": "65.461",
                "0.849": "62.853",
                "1.019": "59.834",
                "1.188": "56.373",
                "1.358": "52.530",
                "1.528": "48.334",
                "1.698": "43.873",
                "1.867": "39.236",
                "2.037": "34.510",
                "2.207": "29.814",
                "2.377": "25.245",
                "2.546": "20.883",
                "2.716": "16.824",
                "2.886": "13.118",
                "3.056": "9.814",
            }
        },
        size: {
            rheem: {
                continuousFlow: {
                    1: {
                        heaters: 1,
                        widthMM: 1000,
                        depthMM: 1000,
                        flowRate: {
                            25: 0.45,
                            30: 0.381,
                            35: 0.3,
                            40: 0.286,
                            45: 0.254,
                            50: 0.229,
                            55: 0.208,
                            60: 0.1,
                            65: 0.176,
                            70: 0.163,
                        },
                        gas: {
                            requirement: 205,
                            pressure: 2.75,
                        }
                    },
                    2: {
                        heaters: 2,
                        widthMM: 1350,
                        depthMM: 1000,
                        flowRate: {
                            25: 0.9,
                            30: 0.762,
                            35: 0.6,
                            40: 0.571,
                            45: 0.508,
                            50: 0.457,
                            55: 0.416,
                            60: 0.2,
                            65: 0.352,
                            70: 0.326,
                        },
                        gas: {
                            requirement: 410,
                            pressure: 2.75,
                        }
                    },
                    3: {
                        heaters: 3,
                        widthMM: 1700,
                        depthMM: 1000,
                        flowRate: {
                            25: 1.35,
                            30: 1.143,
                            35: 0.9,
                            40: 0.857,
                            45: 0.762,
                            50: 0.686,
                            55: 0.623,
                            60: 0.3,
                            65: 0.527,
                            70: 0.490,
                        },
                        gas: {
                            requirement: 615,
                            pressure: 2.75,
                        }
                    },
                    4: {
                        heaters: 4,
                        widthMM: 2050,
                        depthMM: 1000,
                        flowRate: {
                            25: 1.8,
                            30: 1.524,
                            35: 1.2,
                            40: 1.143,
                            45: 1.016,
                            50: 0.914,
                            55: 0.831,
                            60: 0.4,
                            65: 0.703,
                            70: 0.653,
                        },
                        gas: {
                            requirement: 820,
                            pressure: 2.75,
                        }
                    },
                    5: {
                        heaters: 5,
                        widthMM: 2400,
                        depthMM: 1000,
                        flowRate: {
                            25: 2.25,
                            30: 1.904,
                            35: 1.5,
                            40: 1.428,
                            45: 1.270,
                            50: 1.143,
                            55: 1.039,
                            60: 0.5,
                            65: 0.879,
                            70: 0.816,
                        },
                        gas: {
                            requirement: 1025,
                            pressure: 2.75,
                        }
                    },
                    6: {
                        heaters: 6,
                        widthMM: 2750,
                        depthMM: 1000,
                        flowRate: {
                            25: 2.7,
                            30: 2.285,
                            35: 1.8,
                            40: 1.714,
                            45: 1.524,
                            50: 1.371,
                            55: 1.247,
                            60: 0.6,
                            65: 1.055,
                            70: 0.979,
                        },
                        gas: {
                            requirement: 1230,
                            pressure: 2.75,
                        }
                    },
                    7: {
                        heaters: 7,
                        widthMM: 3100,
                        depthMM: 1000,
                        flowRate: {
                            25: 3.15,
                            30: 2.666,
                            35: 2.1,
                            40: 2.000,
                            45: 1.778,
                            50: 1.600,
                            55: 1.454,
                            60: 0.7,
                            65: 1.231,
                            70: 1.143,
                        },
                        gas: {
                            requirement: 1435,
                            pressure: 2.75,
                        }
                    },
                    8: {
                        heaters: 8,
                        widthMM: 3450,
                        depthMM: 1000,
                        flowRate: {
                            25: 3.6,
                            30: 3.047,
                            35: 2.4,
                            40: 2.285,
                            45: 2.031,
                            50: 1.828,
                            55: 1.662,
                            60: 0.8,
                            65: 1.406,
                            70: 1.306,
                        },
                        gas: {
                            requirement: 1640,
                            pressure: 2.75,
                        }
                    },
                    9: {
                        heaters: 9,
                        widthMM: 3800,
                        depthMM: 1000,
                        flowRate: {
                            25: 4.05,
                            30: 3.428,
                            35: 2.7,
                            40: 2.571,
                            45: 2.285,
                            50: 2.057,
                            55: 1.870,
                            60: 0.9,
                            65: 1.582,
                            70: 1.469,
                        },
                        gas: {
                            requirement: 1845,
                            pressure: 2.75,
                        }
                    },
                    10: {
                        heaters: 10,
                        widthMM: 4150,
                        depthMM: 1000,
                        flowRate: {
                            25: 4.5,
                            30: 3.809,
                            35: 3,
                            40: 2.857,
                            45: 2.539,
                            50: 2.285,
                            55: 2.078,
                            60: 1,
                            65: 1.758,
                            70: 1.632,
                        },
                        gas: {
                            requirement: 2050,
                            pressure: 2.75,
                        }
                    },
                    11: {
                        heaters: 11,
                        widthMM: 4500,
                        depthMM: 1000,
                        flowRate: {
                            25: 4.95,
                            30: 4.190,
                            35: 3.3,
                            40: 3.142,
                            45: 2.793,
                            50: 2.514,
                            55: 2.285,
                            60: 1.1,
                            65: 1.934,
                            70: 1.796,
                        },
                        gas: {
                            requirement: 2255,
                            pressure: 2.75,
                        }
                    },
                    12: {
                        heaters: 12,
                        widthMM: 4850,
                        depthMM: 1000,
                        flowRate: {
                            25: 5.4,
                            30: 4.571,
                            35: 3.6,
                            40: 3.428,
                            45: 3.047,
                            50: 2.742,
                            55: 2.493,
                            60: 1.2,
                            65: 2.110,
                            70: 1.959,
                        },
                        gas: {
                            requirement: 2460,
                            pressure: 2.75,
                        }
                    },
                    13: {
                        heaters: 13,
                        widthMM: 5200,
                        depthMM: 1000,
                        flowRate: {
                            25: 5.85,
                            30: 4.952,
                            35: 3.9,
                            40: 3.714,
                            45: 3.301,
                            50: 2.971,
                            55: 2.701,
                            60: 1.3,
                            65: 2.285,
                            70: 2.122,
                        },
                        gas: {
                            requirement: 2665,
                            pressure: 2.75,
                        }
                    },
                    14: {
                        heaters: 14,
                        widthMM: 5550,
                        depthMM: 1000,
                        flowRate: {
                            25: 6.3,
                            30: 5.333,
                            35: 4.2,
                            40: 3.999,
                            45: 3.555,
                            50: 3.200,
                            55: 2.909,
                            60: 1.4,
                            65: 2.461,
                            70: 2.285,
                        },
                        gas: {
                            requirement: 2870,
                            pressure: 2.75,
                        }
                    },
                    15: {
                        heaters: 15,
                        widthMM: 5900,
                        depthMM: 1000,
                        flowRate: {
                            25: 6.75,
                            30: 5.713,
                            35: 4.5,
                            40: 4.285,
                            45: 3.809,
                            50: 3.428,
                            55: 3.116,
                            60: 1.5,
                            65: 2.637,
                            70: 2.449,
                        },
                        gas: {
                            requirement: 3075,
                            pressure: 2.75,
                        }
                    },
                    16: {
                        heaters: 16,
                        widthMM: 6250,
                        depthMM: 1000,
                        flowRate: {
                            25: 7.2,
                            30: 6.094,
                            35: 4.8,
                            40: 4.571,
                            45: 4.063,
                            50: 3.657,
                            55: 3.324,
                            60: 1.6,
                            65: 2.813,
                            70: 2.612,
                        },
                        gas: {
                            requirement: 3280,
                            pressure: 2.75,
                        }
                    },
                    17: {
                        heaters: 17,
                        widthMM: 6600,
                        depthMM: 1000,
                        flowRate: {
                            25: 7.65,
                            30: 6.475,
                            35: 5.1,
                            40: 4.856,
                            45: 4.317,
                            50: 3.885,
                            55: 3.532,
                            60: 1.7,
                            65: 2.989,
                            70: 2.775,
                        },
                        gas: {
                            requirement: 3485,
                            pressure: 2.75,
                        }
                    },
                    18: {
                        heaters: 18,
                        widthMM: 6950,
                        depthMM: 1000,
                        flowRate: {
                            25: 8.1,
                            30: 6.856,
                            35: 5.4,
                            40: 5.142,
                            45: 4.571,
                            50: 4.114,
                            55: 3.740,
                            60: 1.8,
                            65: 3.164,
                            70: 2.938,
                        },
                        gas: {
                            requirement: 3690,
                            pressure: 2.75,
                        }
                    },
                    19: {
                        heaters: 19,
                        widthMM: 7300,
                        depthMM: 1000,
                        flowRate: {
                            25: 8.55,
                            30: 7.237,
                            35: 5.7,
                            40: 5.428,
                            45: 4.825,
                            50: 4.342,
                            55: 3.948,
                            60: 1.9,
                            65: 3.340,
                            70: 3.102,
                        },
                        gas: {
                            requirement: 3895,
                            pressure: 2.75,
                        }
                    },
                    20: {
                        heaters: 20,
                        widthMM: 7650,
                        depthMM: 1000,
                        flowRate: {
                            25: 9,
                            30: 7.618,
                            35: 6,
                            40: 5.713,
                            45: 5.079,
                            50: 4.571,
                            55: 4.155,
                            60: 2,
                            65: 3.516,
                            70: 3.265,
                        },
                        gas: {
                            requirement: 4100,
                            pressure: 2.75,
                        }
                    },
                    21: {
                        heaters: 21,
                        widthMM: 8000,
                        depthMM: 1000,
                        flowRate: {
                            25: 9.45,
                            30: 7.999,
                            35: 6.3,
                            40: 5.999,
                            45: 5.333,
                            50: 4.799,
                            55: 4.363,
                            60: 2.1,
                            65: 3.692,
                            70: 3.428,
                        },
                        gas: {
                            requirement: 4305,
                            pressure: 2.75,
                        }
                    },
                    22: {
                        heaters: 22,
                        widthMM: 8350,
                        depthMM: 1000,
                        flowRate: {
                            25: 9.9,
                            30: 8.380,
                            35: 6.6,
                            40: 6.285,
                            45: 5.587,
                            50: 5.028,
                            55: 4.571,
                            60: 2.2,
                            65: 3.868,
                            70: 3.591,
                        },
                        gas: {
                            requirement: 4510,
                            pressure: 2.75,
                        }
                    },
                    23: {
                        heaters: 23,
                        widthMM: 8700,
                        depthMM: 1000,
                        flowRate: {
                            25: 10.35,
                            30: 8.761,
                            35: 6.9,
                            40: 6.571,
                            45: 5.840,
                            50: 5.256,
                            55: 4.779,
                            60: 2.3,
                            65: 4.043,
                            70: 3.755,
                        },
                        gas: {
                            requirement: 4715,
                            pressure: 2.75,
                        }
                    },
                    24: {
                        heaters: 24,
                        widthMM: 9050,
                        depthMM: 1000,
                        flowRate: {
                            25: 10.8,
                            30: 9.142,
                            35: 7.2,
                            40: 6.856,
                            45: 6.094,
                            50: 5.485,
                            55: 4.986,
                            60: 2.4,
                            65: 4.219,
                            70: 3.918,
                        },
                        gas: {
                            requirement: 4920,
                            pressure: 2.75,
                        }
                    },
                    25: {
                        heaters: 25,
                        widthMM: 9400,
                        depthMM: 1000,
                        flowRate: {
                            25: 11.25,
                            30: 9.522,
                            35: 7.5,
                            40: 7.142,
                            45: 6.348,
                            50: 5.713,
                            55: 5.194,
                            60: 2.5,
                            65: 4.395,
                            70: 4.081,
                        },
                        gas: {
                            requirement: 5125,
                            pressure: 2.75,
                        }
                    },
                    26: {
                        heaters: 26,
                        widthMM: 9750,
                        depthMM: 1000,
                        flowRate: {
                            25: 11.7,
                            30: 9.903,
                            35: 7.8,
                            40: 7.428,
                            45: 6.602,
                            50: 5.942,
                            55: 5.402,
                            60: 2.6,
                            65: 4.571,
                            70: 4.244,
                        },
                        gas: {
                            requirement: 5330,
                            pressure: 2.75,
                        }
                    },
                    27: {
                        heaters: 27,
                        widthMM: 10100,
                        depthMM: 1000,
                        flowRate: {
                            25: 12.15,
                            30: 10.284,
                            35: 8.1,
                            40: 7.713,
                            45: 6.856,
                            50: 6.171,
                            55: 5.610,
                            60: 2.7,
                            65: 4.747,
                            70: 4.408,
                        },
                        gas: {
                            requirement: 5535,
                            pressure: 2.75,
                        }
                    },
                    28: {
                        heaters: 28,
                        widthMM: 10450,
                        depthMM: 1000,
                        flowRate: {
                            25: 12.6,
                            30: 10.665,
                            35: 8.4,
                            40: 7.999,
                            45: 7.110,
                            50: 6.399,
                            55: 5.817,
                            60: 2.8,
                            65: 4.922,
                            70: 4.571,
                        },
                        gas: {
                            requirement: 5740,
                            pressure: 2.75,
                        }
                    },
                    29: {
                        heaters: 29,
                        widthMM: 10800,
                        depthMM: 1000,
                        flowRate: {
                            25: 13.05,
                            30: 11.046,
                            35: 8.7,
                            40: 8.285,
                            45: 7.364,
                            50: 6.628,
                            55: 6.025,
                            60: 2.9,
                            65: 5.098,
                            70: 4.734,
                        },
                        gas: {
                            requirement: 5945,
                            pressure: 2.75,
                        }
                    },
                    30: {
                        heaters: 30,
                        widthMM: 11150,
                        depthMM: 1000,
                        flowRate: {
                            25: 13.5,
                            30: 11.427,
                            35: 9,
                            40: 8.570,
                            45: 7.618,
                            50: 6.856,
                            55: 6.233,
                            60: 3,
                            65: 5.274,
                            70: 4.897,
                        },
                        gas: {
                            requirement: 6150,
                            pressure: 2.75,
                        }
                    },
                    31: {
                        heaters: 31,
                        widthMM: 11500,
                        depthMM: 1000,
                        flowRate: {
                            25: 13.95,
                            30: 11.808,
                            35: 9.3,
                            40: 8.856,
                            45: 7.872,
                            50: 7.085,
                            55: 6.441,
                            60: 3.1,
                            65: 5.450,
                            70: 5.061,
                        },
                        gas: {
                            requirement: 6355,
                            pressure: 2.75,
                        }
                    },
                    32: {
                        heaters: 32,
                        widthMM: 11850,
                        depthMM: 1000,
                        flowRate: {
                            25: 14.4,
                            30: 12.189,
                            35: 9.6,
                            40: 9.142,
                            45: 8.126,
                            50: 7.313,
                            55: 6.648,
                            60: 3.2,
                            65: 5.626,
                            70: 5.224,
                        },
                        gas: {
                            requirement: 6560,
                            pressure: 2.75,
                        }
                    },
                    33: {
                        heaters: 33,
                        widthMM: 12200,
                        depthMM: 1000,
                        flowRate: {
                            25: 14.85,
                            30: 12.570,
                            35: 9.9,
                            40: 9.427,
                            45: 8.380,
                            50: 7.542,
                            55: 6.856,
                            60: 3.3,
                            65: 5.801,
                            70: 5.387,
                        },
                        gas: {
                            requirement: 6765,
                            pressure: 2.75,
                        }
                    },
                    34: {
                        heaters: 34,
                        widthMM: 12550,
                        depthMM: 1000,
                        flowRate: {
                            25: 15.3,
                            30: 12.951,
                            35: 10.2,
                            40: 9.713,
                            45: 8.634,
                            50: 7.770,
                            55: 7.064,
                            60: 3.4,
                            65: 5.977,
                            70: 5.550,
                        },
                        gas: {
                            requirement: 6970,
                            pressure: 2.75,
                        }
                    },
                    35: {
                        heaters: 35,
                        widthMM: 12900,
                        depthMM: 1000,
                        flowRate: {
                            25: 15.75,
                            30: 13.331,
                            35: 10.5,
                            40: 9.999,
                            45: 8.888,
                            50: 7.999,
                            55: 7.272,
                            60: 3.5,
                            65: 6.153,
                            70: 5.713,
                        },
                        gas: {
                            requirement: 7175,
                            pressure: 2.75,
                        }
                    },
                    36: {
                        heaters: 36,
                        widthMM: 13250,
                        depthMM: 1000,
                        flowRate: {
                            25: 16.2,
                            30: 13.712,
                            35: 10.8,
                            40: 10.284,
                            45: 9.142,
                            50: 8.227,
                            55: 7.479,
                            60: 3.6,
                            65: 6.329,
                            70: 5.877,
                        },
                        gas: {
                            requirement: 7380,
                            pressure: 2.75,
                        }
                    },
                    37: {
                        heaters: 37,
                        widthMM: 13600,
                        depthMM: 1000,
                        flowRate: {
                            25: 16.65,
                            30: 14.093,
                            35: 11.1,
                            40: 10.570,
                            45: 9.396,
                            50: 8.456,
                            55: 7.687,
                            60: 3.7,
                            65: 6.505,
                            70: 6.040,
                        },
                        gas: {
                            requirement: 7585,
                            pressure: 2.75,
                        }
                    },
                    38: {
                        heaters: 38,
                        widthMM: 13950,
                        depthMM: 1000,
                        flowRate: {
                            25: 17.1,
                            30: 14.474,
                            35: 11.4,
                            40: 10.856,
                            45: 9.649,
                            50: 8.685,
                            55: 7.895,
                            60: 3.8,
                            65: 6.680,
                            70: 6.203,
                        },
                        gas: {
                            requirement: 7790,
                            pressure: 2.75,
                        }
                    },
                    39: {
                        heaters: 39,
                        widthMM: 14300,
                        depthMM: 1000,
                        flowRate: {
                            25: 17.55,
                            30: 14.855,
                            35: 11.7,
                            40: 11.141,
                            45: 9.903,
                            50: 8.913,
                            55: 8.103,
                            60: 3.9,
                            65: 6.856,
                            70: 6.366,
                        },
                        gas: {
                            requirement: 7995,
                            pressure: 2.75,
                        }
                    },
                    40: {
                        heaters: 40,
                        widthMM: 14650,
                        depthMM: 1000,
                        flowRate: {
                            25: 18,
                            30: 15.236,
                            35: 12,
                            40: 11.427,
                            45: 10.157,
                            50: 9.142,
                            55: 8.311,
                            60: 4,
                            65: 7.032,
                            70: 6.530,
                        },
                        gas: {
                            requirement: 8200,
                            pressure: 2.75,
                        }
                    },
                    41: {
                        heaters: 41,
                        widthMM: 15000,
                        depthMM: 1000,
                        flowRate: {
                            25: 18.45,
                            30: 15.617,
                            35: 12.3,
                            40: 11.713,
                            45: 10.411,
                            50: 9.370,
                            55: 8.518,
                            60: 4.1,
                            65: 7.208,
                            70: 6.693,
                        },
                        gas: {
                            requirement: 8405,
                            pressure: 2.75,
                        }
                    },
                    42: {
                        heaters: 42,
                        widthMM: 15350,
                        depthMM: 1000,
                        flowRate: {
                            25: 18.9,
                            30: 15.998,
                            35: 12.6,
                            40: 11.998,
                            45: 10.665,
                            50: 9.599,
                            55: 8.726,
                            60: 4.2,
                            65: 7.384,
                            70: 6.856,
                        },
                        gas: {
                            requirement: 8610,
                            pressure: 2.75,
                        }
                    },
                    43: {
                        heaters: 43,
                        widthMM: 15700,
                        depthMM: 1000,
                        flowRate: {
                            25: 19.35,
                            30: 16.379,
                            35: 12.9,
                            40: 12.284,
                            45: 10.919,
                            50: 9.827,
                            55: 8.934,
                            60: 4.3,
                            65: 7.559,
                            70: 7.019,
                        },
                        gas: {
                            requirement: 8815,
                            pressure: 2.75,
                        }
                    },
                    44: {
                        heaters: 44,
                        widthMM: 16050,
                        depthMM: 1000,
                        flowRate: {
                            25: 19.8,
                            30: 16.760,
                            35: 13.2,
                            40: 12.570,
                            45: 11.173,
                            50: 10.056,
                            55: 9.142,
                            60: 4.4,
                            65: 7.735,
                            70: 7.183,
                        },
                        gas: {
                            requirement: 9020,
                            pressure: 2.75,
                        }
                    },
                    45: {
                        heaters: 45,
                        widthMM: 16400,
                        depthMM: 1000,
                        flowRate: {
                            25: 20.25,
                            30: 17.140,
                            35: 13.5,
                            40: 12.855,
                            45: 11.427,
                            50: 10.284,
                            55: 9.349,
                            60: 4.5,
                            65: 7.911,
                            70: 7.346,
                        },
                        gas: {
                            requirement: 9225,
                            pressure: 2.75,
                        }
                    },
                    46: {
                        heaters: 46,
                        widthMM: 16750,
                        depthMM: 1000,
                        flowRate: {
                            25: 20.7,
                            30: 17.521,
                            35: 13.8,
                            40: 13.141,
                            45: 11.681,
                            50: 10.513,
                            55: 9.557,
                            60: 4.6,
                            65: 8.087,
                            70: 7.509,
                        },
                        gas: {
                            requirement: 9430,
                            pressure: 2.75,
                        }
                    },
                    47: {
                        heaters: 47,
                        widthMM: 17100,
                        depthMM: 1000,
                        flowRate: {
                            25: 21.15,
                            30: 17.902,
                            35: 14.1,
                            40: 13.427,
                            45: 11.935,
                            50: 10.741,
                            55: 9.765,
                            60: 4.7,
                            65: 8.263,
                            70: 7.672,
                        },
                        gas: {
                            requirement: 9635,
                            pressure: 2.75,
                        }
                    },
                    48: {
                        heaters: 48,
                        widthMM: 17450,
                        depthMM: 1000,
                        flowRate: {
                            25: 21.6,
                            30: 18.283,
                            35: 14.4,
                            40: 13.712,
                            45: 12.189,
                            50: 10.970,
                            55: 9.973,
                            60: 4.8,
                            65: 8.438,
                            70: 7.836,
                        },
                        gas: {
                            requirement: 9840,
                            pressure: 2.75,
                        }
                    },
                    49: {
                        heaters: 49,
                        widthMM: 17800,
                        depthMM: 1000,
                        flowRate: {
                            25: 22.05,
                            30: 18.664,
                            35: 14.7,
                            40: 13.998,
                            45: 12.443,
                            50: 11.198,
                            55: 10.180,
                            60: 4.9,
                            65: 8.614,
                            70: 7.999,
                        },
                        gas: {
                            requirement: 10045,
                            pressure: 2.75,
                        }
                    },
                    50: {
                        heaters: 50,
                        widthMM: 18150,
                        depthMM: 1000,
                        flowRate: {
                            25: 22.5,
                            30: 19.045,
                            35: 15,
                            40: 14.284,
                            45: 12.697,
                            50: 11.427,
                            55: 10.388,
                            60: 5,
                            65: 8.790,
                            70: 8.162,
                        },
                        gas: {
                            requirement: 10250,
                            pressure: 2.75,
                        }
                    },
                },
                tankpak: {
                    1: {
                        heaters: 1,
                        tanks: 1,
                        tanksCategoryL: '410',
                        widthMM: 1682,
                        depthMM: 1500,
                        flowRate: {
                            25: 2055,
                            30: 1781,
                            35: 1585,
                            40: 1438,
                            45: 1324,
                            50: 1233,
                            55: 1158,
                            60: 1096,
                            65: 1043,
                            70: 998,
                        },
                        gas: {
                            requirement: 205,
                            pressure: 2.75,
                        }
                    },
                    2: {
                        heaters: 2,
                        tanks: 1,
                        tanksCategoryL: '410',
                        widthMM: 2049,
                        depthMM: 1500,
                        flowRate: {
                            25: 3701,
                            30: 3152,
                            35: 2761,
                            40: 2467,
                            45: 2238,
                            50: 2055,
                            55: 1906,
                            60: 1781,
                            65: 1676,
                            70: 1585,
                        },
                        gas: {
                            requirement: 410,
                            pressure: 2.75,
                        }
                    },
                    3: {
                        heaters: 3,
                        tanks: 1,
                        tanksCategoryL: '410',
                        widthMM: 2416,
                        depthMM: 1500,
                        flowRate: {
                            25: 5346,
                            30: 4524,
                            35: 3936,
                            40: 3495,
                            45: 3152,
                            50: 2878,
                            55: 2654,
                            60: 2467,
                            65: 2309,
                            70: 2173,
                        },
                        gas: {
                            requirement: 615,
                            pressure: 2.75,
                        }
                    },
                    4: {
                        heaters: 4,
                        tanks: 1,
                        tanksCategoryL: '410',
                        widthMM: 2783,
                        depthMM: 1500,
                        flowRate: {
                            25: 6992,
                            30: 5895,
                            35: 5111,
                            40: 4524,
                            45: 4067,
                            50: 3701,
                            55: 3402,
                            60: 3152,
                            65: 2942,
                            70: 2761,
                        },
                        gas: {
                            requirement: 820,
                            pressure: 2.75,
                        }
                    },
                    5: {
                        heaters: 5,
                        tanks: 1,
                        tanksCategoryL: '410',
                        widthMM: 3150,
                        depthMM: 1500,
                        flowRate: {
                            25: 8637,
                            30: 7266,
                            35: 6287,
                            40: 5552,
                            45: 4981,
                            50: 4524,
                            55: 4150,
                            60: 3838,
                            65: 3574,
                            70: 3348,
                        },
                        gas: {
                            requirement: 1025,
                            pressure: 2.75,
                        }
                    },
                    6: {
                        heaters: 6,
                        tanks: 1,
                        tanksCategoryL: '410',
                        widthMM: 3517,
                        depthMM: 1500,
                        flowRate: {
                            25: 10283,
                            30: 8637,
                            35: 7462,
                            40: 6581,
                            45: 5895,
                            50: 5346,
                            55: 4898,
                            60: 4524,
                            65: 4207,
                            70: 3936,
                        },
                        gas: {
                            requirement: 1230,
                            pressure: 2.75,
                        }
                    },
                    7: {
                        heaters: 7,
                        tanks: 1,
                        tanksCategoryL: '410',
                        widthMM: 3884,
                        depthMM: 1500,
                        flowRate: {
                            25: 11928,
                            30: 10009,
                            35: 8637,
                            40: 7609,
                            45: 6809,
                            50: 6169,
                            55: 5646,
                            60: 5209,
                            65: 4840,
                            70: 4524,
                        },
                        gas: {
                            requirement: 1435,
                            pressure: 2.75,
                        }
                    },
                    8: {
                        heaters: 8,
                        tanks: 2,
                        tanksCategoryL: '410',
                        widthMM: 5301,
                        depthMM: 1500,
                        flowRate: {
                            25: 13984,
                            30: 11790,
                            35: 10223,
                            40: 9047,
                            45: 8133,
                            50: 7402,
                            55: 6804,
                            60: 6305,
                            65: 5883,
                            70: 5521,
                        },
                        gas: {
                            requirement: 1640,
                            pressure: 2.75,
                        }
                    },
                    9: {
                        heaters: 9,
                        tanks: 2,
                        tanksCategoryL: '410',
                        widthMM: 5668,
                        depthMM: 1500,
                        flowRate: {
                            25: 15629,
                            30: 13161,
                            35: 11398,
                            40: 10076,
                            45: 9047,
                            50: 8225,
                            55: 7552,
                            60: 6991,
                            65: 6516,
                            70: 6109,
                        },
                        gas: {
                            requirement: 1845,
                            pressure: 2.75,
                        }
                    },
                    10: {
                        heaters: 10,
                        tanks: 2,
                        tanksCategoryL: '410',
                        widthMM: 4200,
                        depthMM: 2200,
                        flowRate: {
                            25: 17275,
                            30: 14532,
                            35: 12573,
                            40: 11104,
                            45: 9962,
                            50: 9047,
                            55: 8299,
                            60: 7676,
                            65: 7149,
                            70: 6697,
                        },
                        gas: {
                            requirement: 2050,
                            pressure: 2.75,
                        }
                    },
                    11: {
                        heaters: 12,
                        tanks: 2,
                        tanksCategoryL: '410',
                        widthMM: 4567,
                        depthMM: 2200,
                        flowRate: {
                            25: 20566,
                            30: 17275,
                            35: 14924,
                            40: 13161,
                            45: 11790,
                            50: 10693,
                            55: 9795,
                            60: 9047,
                            65: 8415,
                            70: 7872,
                        },
                        gas: {
                            requirement: 2460,
                            pressure: 2.75,
                        }
                    },
                    12: {
                        heaters: 14,
                        tanks: 3,
                        tanksCategoryL: '410',
                        widthMM: 5984,
                        depthMM: 2200,
                        flowRate: {
                            25: 24267,
                            30: 20427,
                            35: 17685,
                            40: 15628,
                            45: 14028,
                            50: 12748,
                            55: 11701,
                            60: 10829,
                            65: 10090,
                            70: 9457,
                        },
                        gas: {
                            requirement: 2870,
                            pressure: 2.75,
                        }
                    },
                    13: {
                        heaters: 16,
                        tanks: 3,
                        tanksCategoryL: '410',
                        widthMM: 6351,
                        depthMM: 2200,
                        flowRate: {
                            25: 27558,
                            30: 23170,
                            35: 20036,
                            40: 17685,
                            45: 15857,
                            50: 14394,
                            55: 13197,
                            60: 12200,
                            65: 11356,
                            70: 10633
                        },
                        gas: {
                            requirement: 3280,
                            pressure: 2.75,
                        }
                    },
                    14: {
                        heaters: 18,
                        tanks: 3,
                        tanksCategoryL: '410',
                        widthMM: 6718,
                        depthMM: 2200,
                        flowRate: {
                            25: 30849,
                            30: 25912,
                            35: 22386,
                            40: 19742,
                            45: 17685,
                            50: 16039,
                            55: 14693,
                            60: 13571,
                            65: 12622,
                            70: 11808
                        },
                        gas: {
                            requirement: 3690,
                            pressure: 2.75,
                        }
                    },
                    15: {
                        heaters: 1,
                        tanks: 1,
                        tanksCategoryL: '325',
                        widthMM: 1632,
                        depthMM: 1500,
                        flowRate: {
                            25: 1970,
                            30: 1696,
                            35: 1500,
                            40: 1353,
                            45: 1239,
                            50: 1148,
                            55: 1073,
                            60: 1011,
                            65: 958,
                            70: 913
                        },
                        gas: {
                            requirement: 205,
                            pressure: 2.75,
                        }
                    },
                    16: {
                        heaters: 2,
                        tanks: 1,
                        tanksCategoryL: '325',
                        widthMM: 1999,
                        depthMM: 1500,
                        flowRate: {
                            25: 3616,
                            30: 3067,
                            35: 2676,
                            40: 2382,
                            45: 2153,
                            50: 1970,
                            55: 1821,
                            60: 1696,
                            65: 1591,
                            70: 1500
                        },
                        gas: {
                            requirement: 410,
                            pressure: 2.75,
                        }
                    },
                    17: {
                        heaters: 3,
                        tanks: 1,
                        tanksCategoryL: '325',
                        widthMM: 2366,
                        depthMM: 1500,
                        flowRate: {
                            25: 5261,
                            30: 4439,
                            35: 3851,
                            40: 3410,
                            45: 3067,
                            50: 2793,
                            55: 2569,
                            60: 2382,
                            65: 2224,
                            70: 2088
                        },
                        gas: {
                            requirement: 615,
                            pressure: 2.75,
                        }
                    },
                    18: {
                        heaters: 4,
                        tanks: 1,
                        tanksCategoryL: '325',
                        widthMM: 2733,
                        depthMM: 1500,
                        flowRate: {
                            25: 6907,
                            30: 5810,
                            35: 5026,
                            40: 4439,
                            45: 3982,
                            50: 3616,
                            55: 3317,
                            60: 3067,
                            65: 2857,
                            70: 2676
                        },
                        gas: {
                            requirement: 820,
                            pressure: 2.75,
                        }
                    },
                },
                electric: {
                    1: {
                        model: '1 x 613 050 (10.8kW)',
                        minimumInitialDelivery: 50,
                        widthMM: 800,
                        depthMM: 1465,
                        flowRate: {
                            20: 510,
                            30: 360,
                            40: 280,
                            50: 240,
                            60: 200,
                            70: 180,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    2: {
                        model: '1 x 613 050 (14.4kW)',
                        minimumInitialDelivery: 50,
                        widthMM: 800,
                        depthMM: 1465,
                        flowRate: {
                            20: 670,
                            30: 460,
                            40: 360,
                            50: 300,
                            60: 260,
                            70: 230,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    3: {
                        model: '1 x 613 315 (10.8kW)',
                        minimumInitialDelivery: 315,
                        widthMM: 1000,
                        depthMM: 1680,
                        flowRate: {
                            20: 775,
                            30: 625,
                            40: 545,
                            50: 505,
                            60: 465,
                            70: 445,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    4: {
                        model: '1 x 613 315 (14.4kW)',
                        minimumInitialDelivery: 315,
                        widthMM: 1000,
                        depthMM: 1680,
                        flowRate: {
                            20: 935,
                            30: 725,
                            40: 625,
                            50: 565,
                            60: 525,
                            70: 495,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    5: {
                        model: '1 x 613 315 (18.0kW)',
                        minimumInitialDelivery: 315,
                        widthMM: 1000,
                        depthMM: 1680,
                        flowRate: {
                            20: 1085,
                            30: 835,
                            40: 705,
                            50: 625,
                            60: 575,
                            70: 535,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    6: {
                        model: '2 x 613 315 (21.6kW)',
                        minimumInitialDelivery: 630,
                        widthMM: 1900,
                        depthMM: 1680,
                        flowRate: {
                            20: 1550,
                            30: 1250,
                            40: 1090,
                            50: 1010,
                            60: 930,
                            70: 890,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    7: {
                        model: '2 x 613 315 (28.8kW)',
                        minimumInitialDelivery: 630,
                        widthMM: 1900,
                        depthMM: 1680,
                        flowRate: {
                            20: 1870,
                            30: 1450,
                            40: 1250,
                            50: 1130,
                            60: 1050,
                            70: 990,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    8: {
                        model: '2 x 613 315 (36.0kW)',
                        minimumInitialDelivery: 630,
                        widthMM: 1900,
                        depthMM: 1680,
                        flowRate: {
                            20: 2170,
                            30: 1670,
                            40: 1410,
                            50: 1250,
                            60: 1150,
                            70: 1070,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    9: {
                        model: '3 x 613 315 (32.4kW)',
                        minimumInitialDelivery: 945,
                        widthMM: 2800,
                        depthMM: 1680,
                        flowRate: {
                            20: 2325,
                            30: 1875,
                            40: 1635,
                            50: 1515,
                            60: 1395,
                            70: 1335,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    10: {
                        model: '3 x 613 315 (43.2kW)',
                        minimumInitialDelivery: 945,
                        widthMM: 2800,
                        depthMM: 1680,
                        flowRate: {
                            20: 2805,
                            30: 2175,
                            40: 1875,
                            50: 1695,
                            60: 1575,
                            70: 1485,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    11: {
                        model: '3 x 613 315 (54.0kW)',
                        minimumInitialDelivery: 945,
                        widthMM: 2800,
                        depthMM: 1680,
                        flowRate: {
                            20: 3255,
                            30: 2505,
                            40: 2115,
                            50: 1875,
                            60: 1725,
                            70: 1605,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    12: {
                        model: '1 x 616 315 (21.6kW)',
                        minimumInitialDelivery: 315,
                        widthMM: 1000,
                        depthMM: 1680,
                        flowRate: {
                            20: 1235,
                            30: 935,
                            40: 775,
                            50: 695,
                            60: 615,
                            70: 575,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    13: {
                        model: '1 x 616 315 (28.8kW)',
                        minimumInitialDelivery: 315,
                        widthMM: 1000,
                        depthMM: 1680,
                        flowRate: {
                            20: 1555,
                            30: 1135,
                            40: 935,
                            50: 815,
                            60: 735,
                            70: 675,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    14: {
                        model: '1 x 616 315 (36.0kW)',
                        minimumInitialDelivery: 315,
                        widthMM: 1000,
                        depthMM: 1680,
                        flowRate: {
                            20: 1855,
                            30: 1355,
                            40: 1095,
                            50: 935,
                            60: 835,
                            70: 755,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    15: {
                        model: '2 x 616 315 (43.2kW)',
                        minimumInitialDelivery: 630,
                        widthMM: 1900,
                        depthMM: 1680,
                        flowRate: {
                            20: 2470,
                            30: 1870,
                            40: 1550,
                            50: 1390,
                            60: 1230,
                            70: 1150,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    16: {
                        model: '2 x 616 315 (57.6kW)',
                        minimumInitialDelivery: 630,
                        widthMM: 1900,
                        depthMM: 1680,
                        flowRate: {
                            20: 3110,
                            30: 2270,
                            40: 1870,
                            50: 1630,
                            60: 1470,
                            70: 1350,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    17: {
                        model: '2 x 616 315 (72.0kW)',
                        minimumInitialDelivery: 630,
                        widthMM: 1900,
                        depthMM: 1680,
                        flowRate: {
                            20: 3710,
                            30: 2710,
                            40: 2190,
                            50: 1870,
                            60: 1670,
                            70: 1510,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    18: {
                        model: '3 x 616 315 (64.8kW)',
                        minimumInitialDelivery: 945,
                        widthMM: 2800,
                        depthMM: 1680,
                        flowRate: {
                            20: 3705,
                            30: 2805,
                            40: 2325,
                            50: 2085,
                            60: 1845,
                            70: 1725,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    19: {
                        model: '3 x 616 315 (86.4kW)',
                        minimumInitialDelivery: 945,
                        widthMM: 2800,
                        depthMM: 1680,
                        flowRate: {
                            20: 4665,
                            30: 3405,
                            40: 2805,
                            50: 2445,
                            60: 2205,
                            70: 2025,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    20: {
                        model: '3 x 616 315 (108.0kW)',
                        minimumInitialDelivery: 945,
                        widthMM: 2800,
                        depthMM: 1680,
                        flowRate: {
                            20: 5565,
                            30: 4065,
                            40: 3285,
                            50: 2805,
                            60: 2505,
                            70: 2265,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    21: {
                        model: '4 x 616 315 (86.4kW)',
                        minimumInitialDelivery: 1260,
                        widthMM: 3700,
                        depthMM: 1680,
                        flowRate: {
                            20: 4980,
                            30: 3720,
                            40: 3120,
                            50: 2760,
                            60: 2520,
                            70: 2340,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    22: {
                        model: '4 x 616 315 (115.2kW)',
                        minimumInitialDelivery: 1260,
                        widthMM: 3700,
                        depthMM: 1680,
                        flowRate: {
                            20: 6220,
                            30: 4540,
                            40: 3740,
                            50: 3260,
                            60: 2940,
                            70: 2700,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    23: {
                        model: '4 x 616 315 (144.0kW)',
                        minimumInitialDelivery: 1260,
                        widthMM: 3700,
                        depthMM: 1680,
                        flowRate: {
                            20: 7420,
                            30: 5420,
                            40: 4380,
                            50: 3740,
                            60: 3340,
                            70: 3020,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    24: {
                        model: '5 x 616 315 (108.0kW)',
                        minimumInitialDelivery: 1575,
                        widthMM: 4600,
                        depthMM: 1680,
                        flowRate: {
                            20: 6195,
                            30: 4695,
                            40: 3915,
                            50: 3435,
                            60: 3135,
                            70: 2895,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    25: {
                        model: '5 x 616 315 (144.0kW)',
                        minimumInitialDelivery: 1575,
                        widthMM: 4600,
                        depthMM: 1680,
                        flowRate: {
                            20: 7735,
                            30: 5735,
                            40: 4695,
                            50: 4055,
                            60: 3655,
                            70: 3335,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    26: {
                        model: '5 x 616 315 (180.0kW)',
                        minimumInitialDelivery: 1575,
                        widthMM: 4600,
                        depthMM: 1680,
                        flowRate: {
                            20: 9275,
                            30: 6775,
                            40: 5475,
                            50: 4675,
                            60: 4175,
                            70: 3775,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    27: {
                        model: '6 x 616 315 (129.6kW)',
                        minimumInitialDelivery: 1890,
                        widthMM: 5500,
                        depthMM: 1680,
                        flowRate: {
                            20: 7410,
                            30: 5610,
                            40: 4650,
                            50: 4170,
                            60: 3690,
                            70: 3450,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    28: {
                        model: '6 x 616 315 (172.8kW)',
                        minimumInitialDelivery: 1890,
                        widthMM: 5500,
                        depthMM: 1680,
                        flowRate: {
                            20: 9330,
                            30: 6810,
                            40: 5610,
                            50: 4890,
                            60: 4410,
                            70: 4050,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    29: {
                        model: '6 x 616 315 (216.0kW)',
                        minimumInitialDelivery: 1890,
                        widthMM: 5500,
                        depthMM: 1680,
                        flowRate: {
                            20: 11130,
                            30: 8130,
                            40: 6570,
                            50: 5610,
                            60: 5010,
                            70: 4530,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                },
                heatPump: {
                    1: {
                        kW: 16,
                        model: 'A2W 16kW',
                        roomTemperature: 5,
                        widthMM: 2550,
                        depthMM: 1100,
                        flowRate: {
                            20: 516,
                            25: 413,
                            30: 344,
                            35: 295,
                            40: 258,
                            45: 229,
                            50: 206,
                            55: 188,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    2: {
                        kW: 16,
                        model: 'A2W 16kW',
                        roomTemperature: 10,
                        widthMM: 2550,
                        depthMM: 1100,
                        flowRate: {
                            20: 624,
                            25: 499,
                            30: 416,
                            35: 356,
                            40: 312,
                            45: 277,
                            50: 249,
                            55: 227,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    3: {
                        kW: 16,
                        model: 'A2W 16kW',
                        roomTemperature: 15,
                        widthMM: 2550,
                        depthMM: 1100,
                        flowRate: {
                            20: 705,
                            25: 564,
                            30: 470,
                            35: 403,
                            40: 353,
                            45: 313,
                            50: 282,
                            55: 256,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    4: {
                        kW: 16,
                        model: 'A2W 16kW',
                        roomTemperature: 20,
                        widthMM: 2550,
                        depthMM: 1100,
                        flowRate: {
                            20: 751,
                            25: 601,
                            30: 501,
                            35: 429,
                            40: 375,
                            45: 334,
                            50: 300,
                            55: 273,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    5: {
                        kW: 16,
                        model: 'A2W 16kW',
                        roomTemperature: 25,
                        widthMM: 2550,
                        depthMM: 1100,
                        flowRate: {
                            20: 839,
                            25: 671,
                            30: 559,
                            35: 479,
                            40: 419,
                            45: 373,
                            50: 335,
                            55: 305,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    6: {
                        kW: 16,
                        model: 'A2W 16kW',
                        roomTemperature: 30,
                        widthMM: 2550,
                        depthMM: 1100,
                        flowRate: {
                            20: 933,
                            25: 746,
                            30: 622,
                            35: 533,
                            40: 467,
                            45: 415,
                            50: 373,
                            55: 339,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    7: {
                        kW: 16,
                        model: 'A2W 16kW',
                        roomTemperature: 35,
                        widthMM: 2550,
                        depthMM: 1100,
                        flowRate: {
                            20: 968,
                            25: 774,
                            30: 645,
                            35: 553,
                            40: 484,
                            45: 430,
                            50: 387,
                            55: 352,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    8: {
                        kW: 16,
                        model: 'A2W 16kW',
                        roomTemperature: 40,
                        widthMM: 2550,
                        depthMM: 1100,
                        flowRate: {
                            20: 989,
                            25: 791,
                            30: 659,
                            35: 565,
                            40: 495,
                            45: 440,
                            50: 396,
                            55: 360,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    9: {
                        kW: 35,
                        model: 'A2W 35kW',
                        roomTemperature: 5,
                        widthMM: 3800,
                        depthMM: 1800,
                        flowRate: {
                            20: 1097,
                            25: 877,
                            30: 731,
                            35: 627,
                            40: 548,
                            45: 487,
                            50: 439,
                            55: 399,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    10: {
                        kW: 35,
                        model: 'A2W 35kW',
                        roomTemperature: 10,
                        widthMM: 3800,
                        depthMM: 1800,
                        flowRate: {
                            20: 1247,
                            25: 998,
                            30: 831,
                            35: 713,
                            40: 624,
                            45: 554,
                            50: 499,
                            55: 453,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    11: {
                        kW: 35,
                        model: 'A2W 35kW',
                        roomTemperature: 15,
                        widthMM: 3800,
                        depthMM: 1800,
                        flowRate: {
                            20: 1488,
                            25: 1190,
                            30: 992,
                            35: 850,
                            40: 744,
                            45: 661,
                            50: 595,
                            55: 541,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    12: {
                        kW: 35,
                        model: 'A2W 35kW',
                        roomTemperature: 20,
                        widthMM: 3800,
                        depthMM: 1800,
                        flowRate: {
                            20: 1701,
                            25: 1361,
                            30: 1134,
                            35: 972,
                            40: 850,
                            45: 756,
                            50: 680,
                            55: 618,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    13: {
                        kW: 35,
                        model: 'A2W 35kW',
                        roomTemperature: 25,
                        widthMM: 3800,
                        depthMM: 1800,
                        flowRate: {
                            20: 2004,
                            25: 1603,
                            30: 1336,
                            35: 1145,
                            40: 1002,
                            45: 891,
                            50: 802,
                            55: 729,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    14: {
                        kW: 35,
                        model: 'A2W 35kW',
                        roomTemperature: 30,
                        widthMM: 3800,
                        depthMM: 1800,
                        flowRate: {
                            20: 2146,
                            25: 1717,
                            30: 1430,
                            35: 1226,
                            40: 1073,
                            45: 954,
                            50: 858,
                            55: 780,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    15: {
                        kW: 35,
                        model: 'A2W 35kW',
                        roomTemperature: 35,
                        widthMM: 3800,
                        depthMM: 1800,
                        flowRate: {
                            20: 2279,
                            25: 1823,
                            30: 1519,
                            35: 1302,
                            40: 1140,
                            45: 1013,
                            50: 912,
                            55: 829,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                    16: {
                        kW: 35,
                        model: 'A2W 35kW',
                        roomTemperature: 40,
                        widthMM: 3800,
                        depthMM: 1800,
                        flowRate: {
                            20: 2326,
                            25: 1861,
                            30: 1551,
                            35: 1329,
                            40: 1163,
                            45: 1034,
                            50: 931,
                            55: 846,
                        },
                        gas: {
                            requirement: 0,
                            pressure: 0,
                        }
                    },
                }
            },
        },
        storageTanks: {
            325: {
                model: '610340',
                capacity: 325,
                widthMM: 1000,
                depthMM: 1640,
            },
            410: {
                model: '610430',
                capacity: 410,
                widthMM: 1100,
                depthMM: 1685,
            },
            920: {
                model: 'RT1000',
                capacity: 920,
                widthMM: 1350,
                depthMM: 2100,
            },
            2055: {
                model: 'RT2000',
                capacity: 2055,
                widthMM: 1650,
                depthMM: 2700,
            },
            2960: {
                model: 'RT3000',
                capacity: 2960,
                widthMM: 1800,
                depthMM: 3000,
            },
        },
    },
    greaseInterceptorTrap: {
        manufacturer: [
            {
                name: 'Generic',
                abbreviation: 'Generic',
                priceTableName: 'Generic',
                uid: 'generic',
            },
            {
                name: 'Viking',
                abbreviation: 'Viking',
                priceTableName: 'Viking',
                uid: 'viking',
            },
        ],
        location: [
            {
                name: 'NEW SOUTH WALES',
                uid: 'nsw',
            },
            {
                name: 'ACT',
                uid: 'act',
            },
            {
                name: 'VICTORIA',
                uid: 'vic',
            },
            {
                name: 'QUEENSLAND',
                uid: 'qld',
            },
            {
                name: 'SOUTH AUSTRALIA',
                uid: 'sa',
            },
            {
                name: 'WESTERN AUSTRALIA',
                uid: 'wa',
            },
            {
                name: 'TASMANIA',
                uid: 'tas',
            },
            {
                name: 'NORTHERN TERRITORY',
                uid: 'nt',
            },
        ],
        size: {
            generic: {
                nsw: {
                    belowGround: {
                        '100L': {
                            capacity: 100,
                            lengthMM: 900,
                            widthMM: 600,
                            heightMM: 700,
                        },
                        '150L': {
                            capacity: 150,
                            lengthMM: 1000,
                            widthMM: 650,
                            heightMM: 800,
                        },
                        '200L': {
                            capacity: 200,
                            lengthMM: 1100,
                            widthMM: 700,
                            heightMM: 800,
                        },
                        '250L': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 830,
                        },
                        '300L': {
                            capacity: 300,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 930,
                        },
                        '350L': {
                            capacity: 350,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '400L': {
                            capacity: 400,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 890,
                        },
                        '450L': {
                            capacity: 450,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 950,
                        },
                        '500L': {
                            capacity: 500,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '600L': {
                            capacity: 600,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '750L': {
                            capacity: 750,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '900L': {
                            capacity: 900,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1210,
                        },
                        '1000L': {
                            capacity: 1000,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1410,
                        },
                        '1500L': {
                            capacity: 1500,
                            lengthMM: 2400,
                            widthMM: 1000,
                            heightMM: 1510,
                        },
                        '2000L': {
                            capacity: 2000,
                            lengthMM: 3000,
                            widthMM: 1000,
                            heightMM: 1570,
                        },
                        '2500L': {
                            capacity: 2500,
                            lengthMM: 3000,
                            widthMM: 1300,
                            heightMM: 1610,
                        },
                        '3000L': {
                            capacity: 3000,
                            lengthMM: 3600,
                            widthMM: 1300,
                            heightMM: 1600,
                        },
                        '4000L': {
                            capacity: 4000,
                            lengthMM: 3600,
                            widthMM: 1400,
                            heightMM: 1980,
                        },
                        '5000L': {
                            capacity: 5000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 1850,
                        },
                        '6000L': {
                            capacity: 6000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 2150,
                        },
                        '7500L': {
                            capacity: 7500,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 1850,
                        },
                        '10000L': {
                            capacity: 10000,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 2300,
                        },
                    },
                    aboveGround: {
                        '600L': {
                            capacity: 600,
                            lengthMM: 1360,
                            widthMM: 850,
                            heightMM: 1000,
                        },
                        '750L': {
                            capacity: 750,
                            lengthMM: 1660,
                            widthMM: 850,
                            heightMM: 1000,
                        },
                        '1000L': {
                            capacity: 1000,
                            lengthMM: 1810,
                            widthMM: 1130,
                            heightMM: 1000,
                        },
                        '1500L': {
                            capacity: 1500,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1000,
                        },
                        '2000L': {
                            capacity: 2000,
                            lengthMM: 3160,
                            widthMM: 1230,
                            heightMM: 1000,
                        },
                        '2500L': {
                            capacity: 2500,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1420,
                        },
                        '3000L': {
                            capacity: 3000,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1620,
                        },
                        '4000L': {
                            capacity: 4000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1420,
                        },
                        '5000L': {
                            capacity: 5000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1700,
                        },
                        '6000L': {
                            capacity: 6000,
                            lengthMM: 3160,
                            widthMM: 1930,
                            heightMM: 1420,
                        },
                        '7500L': {
                            capacity: 7500,
                            lengthMM: 3760,
                            widthMM: 1930,
                            heightMM: 1500,
                        },
                        '10000L': {
                            capacity: 10000,
                            lengthMM: 4160,
                            widthMM: 2130,
                            heightMM: 1550,
                        },
                    },
                },
                act: {
                    belowGround: {
                        '100L': {
                            capacity: 100,
                            lengthMM: 900,
                            widthMM: 600,
                            heightMM: 700,
                        },
                        '150L': {
                            capacity: 150,
                            lengthMM: 1000,
                            widthMM: 650,
                            heightMM: 800,
                        },
                        '200L': {
                            capacity: 200,
                            lengthMM: 1100,
                            widthMM: 700,
                            heightMM: 800,
                        },
                        '250L': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 830,
                        },
                        '300L': {
                            capacity: 300,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 930,
                        },
                        '350L': {
                            capacity: 350,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '400L': {
                            capacity: 400,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 890,
                        },
                        '450L': {
                            capacity: 450,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 950,
                        },
                        '500L': {
                            capacity: 500,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '600L': {
                            capacity: 600,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '750L': {
                            capacity: 750,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '900L': {
                            capacity: 900,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1210,
                        },
                        '1000L': {
                            capacity: 1000,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1410,
                        },
                        '1500L': {
                            capacity: 1500,
                            lengthMM: 2400,
                            widthMM: 1000,
                            heightMM: 1510,
                        },
                        '2000L': {
                            capacity: 2000,
                            lengthMM: 3000,
                            widthMM: 1000,
                            heightMM: 1570,
                        },
                        '2500L': {
                            capacity: 2500,
                            lengthMM: 3000,
                            widthMM: 1300,
                            heightMM: 1610,
                        },
                        '3000L': {
                            capacity: 3000,
                            lengthMM: 3600,
                            widthMM: 1300,
                            heightMM: 1600,
                        },
                        '4000L': {
                            capacity: 4000,
                            lengthMM: 3600,
                            widthMM: 1400,
                            heightMM: 1980,
                        },
                        '5000L': {
                            capacity: 5000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 1850,
                        },
                        '6000L': {
                            capacity: 6000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 2150,
                        },
                        '7500L': {
                            capacity: 7500,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 1850,
                        },
                        '10000L': {
                            capacity: 10000,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 2300,
                        },
                    },
                    aboveGround: {
                        '600L': {
                            capacity: 600,
                            lengthMM: 1360,
                            widthMM: 850,
                            heightMM: 1000,
                        },
                        '750L': {
                            capacity: 750,
                            lengthMM: 1660,
                            widthMM: 850,
                            heightMM: 1000,
                        },
                        '1000L': {
                            capacity: 1000,
                            lengthMM: 1810,
                            widthMM: 1130,
                            heightMM: 1000,
                        },
                        '1500L': {
                            capacity: 1500,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1000,
                        },
                        '2000L': {
                            capacity: 2000,
                            lengthMM: 3160,
                            widthMM: 1230,
                            heightMM: 1000,
                        },
                        '2500L': {
                            capacity: 2500,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1420,
                        },
                        '3000L': {
                            capacity: 3000,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1620,
                        },
                        '4000L': {
                            capacity: 4000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1420,
                        },
                        '5000L': {
                            capacity: 5000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1700,
                        },
                        '6000L': {
                            capacity: 6000,
                            lengthMM: 3160,
                            widthMM: 1930,
                            heightMM: 1420,
                        },
                        '7500L': {
                            capacity: 7500,
                            lengthMM: 3760,
                            widthMM: 1930,
                            heightMM: 1500,
                        },
                        '10000L': {
                            capacity: 10000,
                            lengthMM: 4160,
                            widthMM: 2130,
                            heightMM: 1550,
                        },
                    },
                },
                vic: {
                    belowGround: {
                        '100L': {
                            capacity: 100,
                            lengthMM: 900,
                            widthMM: 600,
                            heightMM: 700,
                        },
                        '150L': {
                            capacity: 150,
                            lengthMM: 1000,
                            widthMM: 650,
                            heightMM: 800,
                        },
                        '200L': {
                            capacity: 200,
                            lengthMM: 1100,
                            widthMM: 700,
                            heightMM: 800,
                        },
                        '250L': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 830,
                        },
                        '300L': {
                            capacity: 300,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 930,
                        },
                        '350L': {
                            capacity: 350,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '400L': {
                            capacity: 400,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 890,
                        },
                        '450L': {
                            capacity: 450,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 950,
                        },
                        '500L': {
                            capacity: 500,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '600L': {
                            capacity: 600,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '750L': {
                            capacity: 750,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '900L': {
                            capacity: 900,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1210,
                        },
                        '1000L': {
                            capacity: 1000,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1310,
                        },
                        '1100L': {
                            capacity: 1100,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1410,
                        },
                        '1500L': {
                            capacity: 1500,
                            lengthMM: 2400,
                            widthMM: 1000,
                            heightMM: 1410,
                        },
                        '2000L': {
                            capacity: 2000,
                            lengthMM: 3000,
                            widthMM: 1000,
                            heightMM: 1470,
                        },
                        '2500L': {
                            capacity: 2500,
                            lengthMM: 3000,
                            widthMM: 1400,
                            heightMM: 1510,
                        },
                        '3000L': {
                            capacity: 3000,
                            lengthMM: 3600,
                            widthMM: 1300,
                            heightMM: 1500,
                        },
                        '4000L': {
                            capacity: 4000,
                            lengthMM: 3600,
                            widthMM: 1400,
                            heightMM: 1880,
                        },
                        '5000L': {
                            capacity: 5000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 1750,
                        },
                        '6000L': {
                            capacity: 6000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 2050,
                        },
                        '7500L': {
                            capacity: 7500,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 1750,
                        },
                        '10000L': {
                            capacity: 10000,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 2200,
                        },
                    },
                    aboveGround: {
                        '600L': {
                            capacity: 600,
                            lengthMM: 1360,
                            widthMM: 850,
                            heightMM: 1000,
                        },
                        '750L': {
                            capacity: 750,
                            lengthMM: 1660,
                            widthMM: 850,
                            heightMM: 1000,
                        },
                        '1000L': {
                            capacity: 1000,
                            lengthMM: 1810,
                            widthMM: 1030,
                            heightMM: 1000,
                        },
                        '1100L': {
                            capacity: 1100,
                            lengthMM: 1910,
                            widthMM: 1030,
                            heightMM: 1000,
                        },
                        '1500L': {
                            capacity: 1500,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1000,
                        },
                        '2000L': {
                            capacity: 2000,
                            lengthMM: 2630,
                            widthMM: 1250,
                            heightMM: 1000,
                        },
                        '2500L': {
                            capacity: 2500,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1320,
                        },
                        '3000L': {
                            capacity: 3000,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1520,
                        },
                        '4000L': {
                            capacity: 4000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1320,
                        },
                        '5000L': {
                            capacity: 5000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1600,
                        },
                        '6000L': {
                            capacity: 6000,
                            lengthMM: 3160,
                            widthMM: 1930,
                            heightMM: 1420,
                        },
                        '7500L': {
                            capacity: 7500,
                            lengthMM: 3760,
                            widthMM: 1930,
                            heightMM: 1500,
                        },
                        '10000L': {
                            capacity: 10000,
                            lengthMM: 4160,
                            widthMM: 2130,
                            heightMM: 1550,
                        },
                    },
                },
                qld: {
                    belowGround: {
                        '100L': {
                            capacity: 100,
                            lengthMM: 900,
                            widthMM: 600,
                            heightMM: 700,
                        },
                        '150L': {
                            capacity: 150,
                            lengthMM: 1000,
                            widthMM: 650,
                            heightMM: 800,
                        },
                        '200L': {
                            capacity: 200,
                            lengthMM: 1100,
                            widthMM: 700,
                            heightMM: 800,
                        },
                        '250L': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 830,
                        },
                        '300L': {
                            capacity: 300,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 930,
                        },
                        '350L': {
                            capacity: 350,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '400L': {
                            capacity: 400,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 890,
                        },
                        '450L': {
                            capacity: 450,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 950,
                        },
                        '500L': {
                            capacity: 500,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '600L': {
                            capacity: 600,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '750L': {
                            capacity: 750,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '900L': {
                            capacity: 900,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1210,
                        },
                        '1000L': {
                            capacity: 1000,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1310,
                        },
                        '1100L': {
                            capacity: 1100,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1410,
                        },
                        '1500L': {
                            capacity: 1500,
                            lengthMM: 2400,
                            widthMM: 1000,
                            heightMM: 1410,
                        },
                        '2000L': {
                            capacity: 2000,
                            lengthMM: 3000,
                            widthMM: 1000,
                            heightMM: 1470,
                        },
                        '2500L': {
                            capacity: 2500,
                            lengthMM: 3000,
                            widthMM: 1400,
                            heightMM: 1510,
                        },
                        '3000L': {
                            capacity: 3000,
                            lengthMM: 3600,
                            widthMM: 1300,
                            heightMM: 1500,
                        },
                        '4000L': {
                            capacity: 4000,
                            lengthMM: 3600,
                            widthMM: 1400,
                            heightMM: 1880,
                        },
                        '5000L': {
                            capacity: 5000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 1750,
                        },
                        '6000L': {
                            capacity: 6000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 2050,
                        },
                        '7500L': {
                            capacity: 7500,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 1750,
                        },
                        '10000L': {
                            capacity: 10000,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 2200,
                        },
                    },
                    aboveGround: {
                        '600L': {
                            capacity: 600,
                            lengthMM: 1360,
                            widthMM: 850,
                            heightMM: 1000,
                        },
                        '750L': {
                            capacity: 750,
                            lengthMM: 1660,
                            widthMM: 850,
                            heightMM: 1000,
                        },
                        '1000L': {
                            capacity: 1000,
                            lengthMM: 1810,
                            widthMM: 1030,
                            heightMM: 1000,
                        },
                        '1100L': {
                            capacity: 1100,
                            lengthMM: 1910,
                            widthMM: 1030,
                            heightMM: 1000,
                        },
                        '1500L': {
                            capacity: 1500,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1000,
                        },
                        '2000L': {
                            capacity: 2000,
                            lengthMM: 2630,
                            widthMM: 1250,
                            heightMM: 1000,
                        },
                        '2500L': {
                            capacity: 2500,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1320,
                        },
                        '3000L': {
                            capacity: 3000,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1520,
                        },
                        '4000L': {
                            capacity: 4000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1320,
                        },
                        '5000L': {
                            capacity: 5000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1600,
                        },
                        '6000L': {
                            capacity: 6000,
                            lengthMM: 3160,
                            widthMM: 1930,
                            heightMM: 1420,
                        },
                        '7500L': {
                            capacity: 7500,
                            lengthMM: 3760,
                            widthMM: 1930,
                            heightMM: 1500,
                        },
                        '10000L': {
                            capacity: 10000,
                            lengthMM: 4160,
                            widthMM: 2130,
                            heightMM: 1550,
                        },
                    },
                },
                sa: {
                    belowGround: {
                        '100L': {
                            capacity: 100,
                            lengthMM: 900,
                            widthMM: 600,
                            heightMM: 700,
                        },
                        '150L': {
                            capacity: 150,
                            lengthMM: 1000,
                            widthMM: 650,
                            heightMM: 800,
                        },
                        '200L': {
                            capacity: 200,
                            lengthMM: 1100,
                            widthMM: 700,
                            heightMM: 800,
                        },
                        '250L': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 830,
                        },
                        '300L': {
                            capacity: 300,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 930,
                        },
                        '400L': {
                            capacity: 400,
                            lengthMM: 1620,
                            widthMM: 910,
                            heightMM: 890,
                        },
                        '450L': {
                            capacity: 450,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 950,
                        },
                        '500L': {
                            capacity: 500,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '600L': {
                            capacity: 600,
                            lengthMM: 1620,
                            widthMM: 1020,
                            heightMM: 990,
                        },
                        '750L': {
                            capacity: 750,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '900L': {
                            capacity: 900,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1210,
                        },
                        '1000L': {
                            capacity: 1000,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1310,
                        },
                        '1100L': {
                            capacity: 1100,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1410,
                        },
                        '1500L': {
                            capacity: 1500,
                            lengthMM: 2400,
                            widthMM: 1000,
                            heightMM: 1410,
                        },
                        '1800L': {
                            capacity: 1800,
                            lengthMM: 2400,
                            widthMM: 1000,
                            heightMM: 1620,
                        },
                        '2000L': {
                            capacity: 2000,
                            lengthMM: 3000,
                            widthMM: 1000,
                            heightMM: 1470,
                        },
                        '2500L': {
                            capacity: 2500,
                            lengthMM: 3000,
                            widthMM: 1400,
                            heightMM: 1510,
                        },
                        '3000L': {
                            capacity: 3000,
                            lengthMM: 3600,
                            widthMM: 1300,
                            heightMM: 1500,
                        },
                        '4000L': {
                            capacity: 4000,
                            lengthMM: 3600,
                            widthMM: 1400,
                            heightMM: 1880,
                        },
                        '5000L': {
                            capacity: 5000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 1750,
                        },
                        '6000L': {
                            capacity: 6000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 2050,
                        },
                        '7500L': {
                            capacity: 7500,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 1750,
                        },
                        '10000L': {
                            capacity: 10000,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 2200,
                        },
                    },
                    aboveGround: {
                        '600L': {
                            capacity: 600,
                            lengthMM: 1360,
                            widthMM: 850,
                            heightMM: 1000,
                        },
                        '750L': {
                            capacity: 750,
                            lengthMM: 1660,
                            widthMM: 850,
                            heightMM: 1000,
                        },
                        '1000L': {
                            capacity: 1000,
                            lengthMM: 1810,
                            widthMM: 1030,
                            heightMM: 1000,
                        },
                        '1100L': {
                            capacity: 1100,
                            lengthMM: 1910,
                            widthMM: 1030,
                            heightMM: 1000,
                        },
                        '1500L': {
                            capacity: 1500,
                            lengthMM: 2360,
                            widthMM: 1130,
                            heightMM: 1000,
                        },
                        '1800L': {
                            capacity: 1800,
                            lengthMM: 2160,
                            widthMM: 1030,
                            heightMM: 1300,
                        },
                        '2000L': {
                            capacity: 2000,
                            lengthMM: 2630,
                            widthMM: 1030,
                            heightMM: 1300,
                        },
                        '2500L': {
                            capacity: 2500,
                            lengthMM: 2960,
                            widthMM: 1030,
                            heightMM: 1300,
                        },
                        '3000L': {
                            capacity: 3000,
                            lengthMM: 3160,
                            widthMM: 1130,
                            heightMM: 1300,
                        },
                        '4000L': {
                            capacity: 4000,
                            lengthMM: 3160,
                            widthMM: 1480,
                            heightMM: 1300,
                        },
                        '5000L': {
                            capacity: 5000,
                            lengthMM: 3160,
                            widthMM: 1630,
                            heightMM: 1400,
                        },
                        '6000L': {
                            capacity: 6000,
                            lengthMM: 3160,
                            widthMM: 1930,
                            heightMM: 1420,
                        },
                        '7500L': {
                            capacity: 7500,
                            lengthMM: 3760,
                            widthMM: 1930,
                            heightMM: 1500,
                        },
                        '10000L': {
                            capacity: 10000,
                            lengthMM: 4160,
                            widthMM: 2130,
                            heightMM: 1550,
                        },
                    },
                },
                wa: {
                    belowGround: {
                        '100L': {
                            capacity: 100,
                            lengthMM: 900,
                            widthMM: 600,
                            heightMM: 700,
                        },
                        '150L': {
                            capacity: 150,
                            lengthMM: 1000,
                            widthMM: 650,
                            heightMM: 800,
                        },
                        '200L': {
                            capacity: 200,
                            lengthMM: 1100,
                            widthMM: 700,
                            heightMM: 800,
                        },
                        '250L': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 830,
                        },
                        '300L': {
                            capacity: 300,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 930,
                        },
                        '350L': {
                            capacity: 350,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '400L': {
                            capacity: 400,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 890,
                        },
                        '450L': {
                            capacity: 450,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 950,
                        },
                        '500L': {
                            capacity: 500,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '540L': {
                            capacity: 540,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 950,
                        },
                        '600L': {
                            capacity: 600,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '730L': {
                            capacity: 730,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '750L': {
                            capacity: 750,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '900L': {
                            capacity: 900,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1210,
                        },
                        '1000L': {
                            capacity: 1000,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1310,
                        },
                        '1100L': {
                            capacity: 1100,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1410,
                        },
                        '1250L': {
                            capacity: 1250,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1550,
                        },
                        '1500L': {
                            capacity: 1500,
                            lengthMM: 2400,
                            widthMM: 1000,
                            heightMM: 1450,
                        },
                        '2000L': {
                            capacity: 2000,
                            lengthMM: 3000,
                            widthMM: 1000,
                            heightMM: 1470,
                        },
                        '2500L': {
                            capacity: 2500,
                            lengthMM: 3000,
                            widthMM: 1300,
                            heightMM: 1510,
                        },
                        '3000L': {
                            capacity: 3000,
                            lengthMM: 3600,
                            widthMM: 1300,
                            heightMM: 1500,
                        },
                        '4000L': {
                            capacity: 4000,
                            lengthMM: 3600,
                            widthMM: 1400,
                            heightMM: 1880,
                        },
                        '5000L': {
                            capacity: 5000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 1750,
                        },
                        '6000L': {
                            capacity: 6000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 2050,
                        },
                        '7500L': {
                            capacity: 7500,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 1750,
                        },
                        '10000L': {
                            capacity: 10000,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 2200,
                        },
                    },
                    aboveGround: {
                        '540L': {
                            capacity: 540,
                            lengthMM: 1400,
                            widthMM: 880,
                            heightMM: 960,
                        },
                        '600L': {
                            capacity: 600,
                            lengthMM: 1360,
                            widthMM: 850,
                            heightMM: 1000,
                        },
                        '730L': {
                            capacity: 730,
                            lengthMM: 1550,
                            widthMM: 880,
                            heightMM: 1060,
                        },
                        '750L': {
                            capacity: 750,
                            lengthMM: 1660,
                            widthMM: 850,
                            heightMM: 1000,
                        },
                        '1000L': {
                            capacity: 1000,
                            lengthMM: 1800,
                            widthMM: 1030,
                            heightMM: 1060,
                        },
                        '1100L': {
                            capacity: 1100,
                            lengthMM: 1910,
                            widthMM: 1030,
                            heightMM: 1000,
                        },
                        '1250L': {
                            capacity: 1250,
                            lengthMM: 2150,
                            widthMM: 1030,
                            heightMM: 1060,
                        },
                        '1500L': {
                            capacity: 1500,
                            lengthMM: 2150,
                            widthMM: 1030,
                            heightMM: 1190,
                        },
                        '2000L': {
                            capacity: 2000,
                            lengthMM: 2350,
                            widthMM: 1030,
                            heightMM: 1360,
                        },
                        '2500L': {
                            capacity: 2500,
                            lengthMM: 2630,
                            widthMM: 1030,
                            heightMM: 1320,
                        },
                        '3000L': {
                            capacity: 3000,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1520,
                        },
                        '4000L': {
                            capacity: 4000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1320,
                        },
                        '5000L': {
                            capacity: 5000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1600,
                        },
                        '6000L': {
                            capacity: 6000,
                            lengthMM: 3160,
                            widthMM: 1930,
                            heightMM: 1420,
                        },
                        '7500L': {
                            capacity: 7500,
                            lengthMM: 3760,
                            widthMM: 1930,
                            heightMM: 1500,
                        },
                        '10000L': {
                            capacity: 10000,
                            lengthMM: 4160,
                            widthMM: 2130,
                            heightMM: 1550,
                        },
                    },
                },
                tas: {
                    belowGround: {
                        '100L': {
                            capacity: 100,
                            lengthMM: 900,
                            widthMM: 600,
                            heightMM: 700,
                        },
                        '150L': {
                            capacity: 150,
                            lengthMM: 1000,
                            widthMM: 650,
                            heightMM: 800,
                        },
                        '200L': {
                            capacity: 200,
                            lengthMM: 1100,
                            widthMM: 700,
                            heightMM: 800,
                        },
                        '250L': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 830,
                        },
                        '300L': {
                            capacity: 300,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 930,
                        },
                        '350L': {
                            capacity: 350,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '400L': {
                            capacity: 400,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 890,
                        },
                        '450L': {
                            capacity: 450,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 950,
                        },
                        '500L': {
                            capacity: 500,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '600L': {
                            capacity: 600,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '750L': {
                            capacity: 750,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '900L': {
                            capacity: 900,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1210,
                        },
                        '1000L': {
                            capacity: 1000,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1310,
                        },
                        '1100L': {
                            capacity: 1100,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1410,
                        },
                        '1500L': {
                            capacity: 1500,
                            lengthMM: 2400,
                            widthMM: 1000,
                            heightMM: 1410,
                        },
                        '2000L': {
                            capacity: 2000,
                            lengthMM: 3000,
                            widthMM: 1000,
                            heightMM: 1470,
                        },
                        '2500L': {
                            capacity: 2500,
                            lengthMM: 3000,
                            widthMM: 1400,
                            heightMM: 1510,
                        },
                        '3000L': {
                            capacity: 3000,
                            lengthMM: 3600,
                            widthMM: 1300,
                            heightMM: 1500,
                        },
                        '4000L': {
                            capacity: 4000,
                            lengthMM: 3600,
                            widthMM: 1400,
                            heightMM: 1880,
                        },
                        '5000L': {
                            capacity: 5000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 1750,
                        },
                        '6000L': {
                            capacity: 6000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 2050,
                        },
                        '7500L': {
                            capacity: 7500,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 1750,
                        },
                        '10000L': {
                            capacity: 10000,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 2200,
                        },
                    },
                    aboveGround: {
                        '600L': {
                            capacity: 600,
                            lengthMM: 1360,
                            widthMM: 850,
                            heightMM: 1000,
                        },
                        '750L': {
                            capacity: 750,
                            lengthMM: 1660,
                            widthMM: 850,
                            heightMM: 1000,
                        },
                        '1000L': {
                            capacity: 1000,
                            lengthMM: 1810,
                            widthMM: 1030,
                            heightMM: 1000,
                        },
                        '1100L': {
                            capacity: 1100,
                            lengthMM: 1910,
                            widthMM: 1030,
                            heightMM: 1000,
                        },
                        '1500L': {
                            capacity: 1500,
                            lengthMM: 2360,
                            widthMM: 1130,
                            heightMM: 1000,
                        },
                        '2000L': {
                            capacity: 2000,
                            lengthMM: 2630,
                            widthMM: 1250,
                            heightMM: 1000,
                        },
                        '2500L': {
                            capacity: 2500,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1320,
                        },
                        '3000L': {
                            capacity: 3000,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1520,
                        },
                        '4000L': {
                            capacity: 4000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1320,
                        },
                        '5000L': {
                            capacity: 5000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1600,
                        },
                        '6000L': {
                            capacity: 6000,
                            lengthMM: 3160,
                            widthMM: 1930,
                            heightMM: 1420,
                        },
                        '7500L': {
                            capacity: 7500,
                            lengthMM: 3760,
                            widthMM: 1930,
                            heightMM: 1500,
                        },
                        '10000L': {
                            capacity: 10000,
                            lengthMM: 4160,
                            widthMM: 2130,
                            heightMM: 1550,
                        },
                    },
                },
                nt: {
                    belowGround: {
                        '100L': {
                            capacity: 100,
                            lengthMM: 900,
                            widthMM: 600,
                            heightMM: 700,
                        },
                        '150L': {
                            capacity: 150,
                            lengthMM: 1000,
                            widthMM: 650,
                            heightMM: 800,
                        },
                        '200L': {
                            capacity: 200,
                            lengthMM: 1100,
                            widthMM: 700,
                            heightMM: 800,
                        },
                        '250L': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 830,
                        },
                        '300L': {
                            capacity: 300,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 930,
                        },
                        '350L': {
                            capacity: 350,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '400L': {
                            capacity: 400,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 890,
                        },
                        '450L': {
                            capacity: 450,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 950,
                        },
                        '500L': {
                            capacity: 500,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '600L': {
                            capacity: 600,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '750L': {
                            capacity: 750,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1050,
                        },
                        '900L': {
                            capacity: 900,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1210,
                        },
                        '1000L': {
                            capacity: 1000,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1310,
                        },
                        '1100L': {
                            capacity: 1100,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1410,
                        },
                        '1500L': {
                            capacity: 1500,
                            lengthMM: 2400,
                            widthMM: 1000,
                            heightMM: 1410,
                        },
                        '2000L': {
                            capacity: 2000,
                            lengthMM: 3000,
                            widthMM: 1000,
                            heightMM: 1470,
                        },
                        '2500L': {
                            capacity: 2500,
                            lengthMM: 3000,
                            widthMM: 1400,
                            heightMM: 1510,
                        },
                        '3000L': {
                            capacity: 3000,
                            lengthMM: 3600,
                            widthMM: 1400,
                            heightMM: 1500,
                        },
                        '4000L': {
                            capacity: 4000,
                            lengthMM: 3600,
                            widthMM: 1400,
                            heightMM: 1880,
                        },
                        '5000L': {
                            capacity: 5000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 1750,
                        },
                        '6000L': {
                            capacity: 6000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 2050,
                        },
                        '7500L': {
                            capacity: 7500,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 1750,
                        },
                        '10000L': {
                            capacity: 10000,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 2200,
                        },
                    },
                    aboveGround: {
                        '600L': {
                            capacity: 600,
                            lengthMM: 1360,
                            widthMM: 850,
                            heightMM: 1000,
                        },
                        '750L': {
                            capacity: 750,
                            lengthMM: 1660,
                            widthMM: 850,
                            heightMM: 1000,
                        },
                        '1000L': {
                            capacity: 1000,
                            lengthMM: 1810,
                            widthMM: 1030,
                            heightMM: 1000,
                        },
                        '1100L': {
                            capacity: 1100,
                            lengthMM: 1910,
                            widthMM: 1030,
                            heightMM: 1000,
                        },
                        '1500L': {
                            capacity: 1500,
                            lengthMM: 2360,
                            widthMM: 1130,
                            heightMM: 1000,
                        },
                        '2000L': {
                            capacity: 2000,
                            lengthMM: 2630,
                            widthMM: 1250,
                            heightMM: 1000,
                        },
                        '2500L': {
                            capacity: 2500,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1320,
                        },
                        '3000L': {
                            capacity: 3000,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1520,
                        },
                        '4000L': {
                            capacity: 4000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1320,
                        },
                        '5000L': {
                            capacity: 5000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1600,
                        },
                        '6000L': {
                            capacity: 6000,
                            lengthMM: 3160,
                            widthMM: 1930,
                            heightMM: 1420,
                        },
                        '7500L': {
                            capacity: 7500,
                            lengthMM: 3760,
                            widthMM: 1930,
                            heightMM: 1500,
                        },
                        '10000L': {
                            capacity: 10000,
                            lengthMM: 4160,
                            widthMM: 2130,
                            heightMM: 1550,
                        },
                    },
                },
            },
            viking: {
                nsw: {
                    belowGround: {
                        '250': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 830,
                            product: 'NPT9BG-250',
                        },
                        '300': {
                            capacity: 300,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 930,
                            product: 'NPT9BG-300',
                        },
                        '350': {
                            capacity: 350,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'NPT9BG-350',
                        },
                        '400': {
                            capacity: 400,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 890,
                            product: 'NPT9BG-400',
                        },
                        '450': {
                            capacity: 450,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 950,
                            product: 'NPT9BG-450',
                        },
                        '500': {
                            capacity: 500,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'NPT9BG-500',
                        },
                        '600': {
                            capacity: 600,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'NPT9BG-600',
                        },
                        '750': {
                            capacity: 750,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'NPT9BG-750',
                        },
                        '900': {
                            capacity: 900,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1210,
                            product: 'NPT9BG-900',
                        },
                        '1000': {
                            capacity: 1000,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1410,
                            product: 'NPT9BG-1000',
                        },
                        '1500': {
                            capacity: 1500,
                            lengthMM: 2400,
                            widthMM: 1000,
                            heightMM: 1410,
                            product: 'NPT9BG-1500',
                        },
                        '2000': {
                            capacity: 2000,
                            lengthMM: 3000,
                            widthMM: 1000,
                            heightMM: 1470,
                            product: 'NPT9BG-2000',
                        },
                        '2500': {
                            capacity: 2500,
                            lengthMM: 3000,
                            widthMM: 1400,
                            heightMM: 1510,
                            product: 'NPT9BG-2500',
                        },
                        '3000': {
                            capacity: 3000,
                            lengthMM: 3600,
                            widthMM: 1300,
                            heightMM: 1500,
                            product: 'NPT9BG-3000',
                        },
                        '4000': {
                            capacity: 4000,
                            lengthMM: 3600,
                            widthMM: 1400,
                            heightMM: 1880,
                            product: 'NPT9BG-4000',
                        },
                        '5000': {
                            capacity: 5000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 1750,
                            product: 'NPT9BG-5000',
                        },
                        '6000': {
                            capacity: 6000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 2050,
                            product: 'NPT9BG-6000',
                        },
                        '7500': {
                            capacity: 7500,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 1750,
                            product: 'NPT9BG-7500',
                        },
                        '10000': {
                            capacity: 10000,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 2200,
                            product: 'NPT9BG-10000',
                        },
                    },
                    aboveGround: {
                        '250': {
                            capacity: 250,
                            lengthMM: 900,
                            widthMM: 530,
                            heightMM: 730,
                            product: 'NP9AG-250',
                        },
                        '250a': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 530,
                            heightMM: 600,
                            product: 'NP9AG-250a',
                        },
                        '300': {
                            capacity: 300,
                            lengthMM: 1250,
                            widthMM: 600,
                            heightMM: 750,
                            product: 'NP9AG-300',
                        },
                        '400': {
                            capacity: 400,
                            lengthMM: 1250,
                            widthMM: 600,
                            heightMM: 850,
                            product: 'NP9AG-400',
                        },
                        '500': {
                            capacity: 500,
                            lengthMM: 1250,
                            widthMM: 750,
                            heightMM: 850,
                            product: 'NP9AG-500',
                        },
                        '600': {
                            capacity: 600,
                            lengthMM: 1360,
                            widthMM: 850,
                            heightMM: 1000,
                            product: 'NPT9AG-600',
                        },
                        '750': {
                            capacity: 750,
                            lengthMM: 1660,
                            widthMM: 850,
                            heightMM: 1000,
                            product: 'NPT9AG-750',
                        },
                        '1000': {
                            capacity: 1000,
                            lengthMM: 1810,
                            widthMM: 1130,
                            heightMM: 1000,
                            product: 'NPT9AG-1000',
                        },
                        '1500': {
                            capacity: 1500,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1000,
                            product: 'NPT9AG-1500',
                        },
                        '2000': {
                            capacity: 2000,
                            lengthMM: 3160,
                            widthMM: 1230,
                            heightMM: 1000,
                            product: 'NPT9AG-2000',
                        },
                        '2500': {
                            capacity: 2500,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1420,
                            product: 'NPT9AG-2500',
                        },
                        '3000': {
                            capacity: 3000,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1620,
                            product: 'NPT9AG-3000',
                        },
                        '4000': {
                            capacity: 4000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1420,
                            product: 'NPT9AG-4000',
                        },
                        '5000': {
                            capacity: 5000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1700,
                            product: 'NPT9AG-5000',
                        },
                        '6000': {
                            capacity: 6000,
                            lengthMM: 3160,
                            widthMM: 1930,
                            heightMM: 1520,
                            product: 'NPT9AG-6000',
                        },
                        '7500': {
                            capacity: 7500,
                            lengthMM: 3760,
                            widthMM: 1930,
                            heightMM: 1600,
                            product: 'NPT9AG-7500',
                        },
                        '10000': {
                            capacity: 10000,
                            lengthMM: 4160,
                            widthMM: 2130,
                            heightMM: 1650,
                            product: 'NPT9AG-10000',
                        },
                    },
                },
                act: {
                    belowGround: {
                        '250': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 830,
                            product: 'NPT9BG-250',
                        },
                        '300': {
                            capacity: 300,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 930,
                            product: 'NPT9BG-300',
                        },
                        '350': {
                            capacity: 350,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'NPT9BG-350',
                        },
                        '400': {
                            capacity: 400,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 890,
                            product: 'NPT9BG-400',
                        },
                        '450': {
                            capacity: 450,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 950,
                            product: 'NPT9BG-450',
                        },
                        '500': {
                            capacity: 500,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'NPT9BG-500',
                        },
                        '600': {
                            capacity: 600,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'NPT9BG-600',
                        },
                        '750': {
                            capacity: 750,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'NPT9BG-750',
                        },
                        '900': {
                            capacity: 900,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1210,
                            product: 'NPT9BG-900',
                        },
                        '1000': {
                            capacity: 1000,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1410,
                            product: 'NPT9BG-1000',
                        },
                        '1500': {
                            capacity: 1500,
                            lengthMM: 2400,
                            widthMM: 1000,
                            heightMM: 1410,
                            product: 'NPT9BG-1500',
                        },
                        '2000': {
                            capacity: 2000,
                            lengthMM: 3000,
                            widthMM: 1000,
                            heightMM: 1470,
                            product: 'NPT9BG-2000',
                        },
                        '2500': {
                            capacity: 2500,
                            lengthMM: 3000,
                            widthMM: 1400,
                            heightMM: 1510,
                            product: 'NPT9BG-2500',
                        },
                        '3000': {
                            capacity: 3000,
                            lengthMM: 3600,
                            widthMM: 1300,
                            heightMM: 1500,
                            product: 'NPT9BG-3000',
                        },
                        '4000': {
                            capacity: 4000,
                            lengthMM: 3600,
                            widthMM: 1400,
                            heightMM: 1880,
                            product: 'NPT9BG-4000',
                        },
                        '5000': {
                            capacity: 5000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 1750,
                            product: 'NPT9BG-5000',
                        },
                        '6000': {
                            capacity: 6000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 2050,
                            product: 'NPT9BG-6000',
                        },
                        '7500': {
                            capacity: 7500,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 1750,
                            product: 'NPT9BG-7500',
                        },
                        '10000': {
                            capacity: 10000,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 2200,
                            product: 'NPT9BG-10000',
                        },
                    },
                    aboveGround: {
                        '250': {
                            capacity: 250,
                            lengthMM: 900,
                            widthMM: 530,
                            heightMM: 730,
                            product: 'NP9AG-250',
                        },
                        '250a': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 530,
                            heightMM: 600,
                            product: 'NP9AG-250a',
                        },
                        '300': {
                            capacity: 300,
                            lengthMM: 1250,
                            widthMM: 600,
                            heightMM: 750,
                            product: 'NP9AG-300',
                        },
                        '400': {
                            capacity: 400,
                            lengthMM: 1250,
                            widthMM: 600,
                            heightMM: 850,
                            product: 'NP9AG-400',
                        },
                        '500': {
                            capacity: 500,
                            lengthMM: 1250,
                            widthMM: 750,
                            heightMM: 850,
                            product: 'NP9AG-500',
                        },
                        '600': {
                            capacity: 600,
                            lengthMM: 1360,
                            widthMM: 850,
                            heightMM: 1000,
                            product: 'NPT9AG-600',
                        },
                        '750': {
                            capacity: 750,
                            lengthMM: 1660,
                            widthMM: 850,
                            heightMM: 1000,
                            product: 'NPT9AG-750',
                        },
                        '1000*': {
                            capacity: 1000,
                            lengthMM: 1810,
                            widthMM: 1130,
                            heightMM: 1000,
                            product: 'NPT9AG-1000',
                        },
                        '1500*': {
                            capacity: 1500,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1000,
                            product: 'NPT9AG-1500',
                        },
                        '2000*': {
                            capacity: 2000,
                            lengthMM: 3160,
                            widthMM: 1230,
                            heightMM: 1000,
                            product: 'NPT9AG-2000',
                        },
                        '2500*': {
                            capacity: 2500,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1420,
                            product: 'NPT9AG-2500',
                        },
                        '3000*': {
                            capacity: 3000,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1620,
                            product: 'NPT9AG-3000',
                        },
                        '4000*': {
                            capacity: 4000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1420,
                            product: 'NPT9AG-4000',
                        },
                        '5000*': {
                            capacity: 5000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1700,
                            product: 'NPT9AG-5000',
                        },
                        '6000': {
                            capacity: 6000,
                            lengthMM: 3160,
                            widthMM: 1930,
                            heightMM: 1520,
                            product: 'NPT9AG-6000',
                        },
                        '7500': {
                            capacity: 7500,
                            lengthMM: 3760,
                            widthMM: 1930,
                            heightMM: 1600,
                            product: 'NPT9AG-7500',
                        },
                        '10000': {
                            capacity: 10000,
                            lengthMM: 4160,
                            widthMM: 2130,
                            heightMM: 1650,
                            product: 'NPT9AG-10000',
                        },
                    },
                },
                vic: {
                    belowGround: {
                        '250': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 830,
                            product: 'VPT9BG-250',
                        },
                        '300': {
                            capacity: 300,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 930,
                            product: 'VPT9BG-300',
                        },
                        '350': {
                            capacity: 350,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'VPT9BG-350',
                        },
                        '400': {
                            capacity: 400,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 890,
                            product: 'VPT9BG-400',
                        },
                        '450': {
                            capacity: 450,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 950,
                            product: 'VPT9BG-450',
                        },
                        '500': {
                            capacity: 500,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'VPT9BG-500',
                        },
                        '600': {
                            capacity: 600,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'VPT9BG-600',
                        },
                        '750': {
                            capacity: 750,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'VPT9BG-750',
                        },
                        '900': {
                            capacity: 900,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1210,
                            product: 'VPT9BG-900',
                        },
                        '1000': {
                            capacity: 1000,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1310,
                            product: 'VPT9BG-1000',
                        },
                        '1100': {
                            capacity: 1100,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1410,
                            product: 'VPT9BG-1100',
                        },
                        '1500': {
                            capacity: 1500,
                            lengthMM: 2400,
                            widthMM: 1000,
                            heightMM: 1410,
                            product: 'VPT9BG-1500',
                        },
                        '2000': {
                            capacity: 2000,
                            lengthMM: 3000,
                            widthMM: 1000,
                            heightMM: 1470,
                            product: 'VPT9BG-2000',
                        },
                        '2500': {
                            capacity: 2500,
                            lengthMM: 3000,
                            widthMM: 1400,
                            heightMM: 1510,
                            product: 'VPT9BG-2500',
                        },
                        '3000': {
                            capacity: 3000,
                            lengthMM: 3600,
                            widthMM: 1300,
                            heightMM: 1500,
                            product: 'VPT9BG-3000',
                        },
                        '4000': {
                            capacity: 4000,
                            lengthMM: 3600,
                            widthMM: 1400,
                            heightMM: 1880,
                            product: 'VPT9BG-4000',
                        },
                        '5000': {
                            capacity: 5000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 1750,
                            product: 'VPT9BG-5000',
                        },
                        '6000': {
                            capacity: 6000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 2050,
                            product: 'VPT9BG-6000',
                        },
                        '7500': {
                            capacity: 7500,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 1750,
                            product: 'VPT9BG-7500',
                        },
                        '10000': {
                            capacity: 10000,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 2200,
                            product: 'VPT9BG-10000',
                        },
                    },
                    aboveGround: {
                        '250': {
                            capacity: 250,
                            lengthMM: 900,
                            widthMM: 530,
                            heightMM: 730,
                            product: 'VP9AG-250',
                        },
                        '250a': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 530,
                            heightMM: 600,
                            product: 'VP9AG-250a',
                        },
                        '300': {
                            capacity: 300,
                            lengthMM: 1250,
                            widthMM: 600,
                            heightMM: 750,
                            product: 'VP9AG-300',
                        },
                        '400': {
                            capacity: 400,
                            lengthMM: 1250,
                            widthMM: 600,
                            heightMM: 850,
                            product: 'VP9AG-400',
                        },
                        '500': {
                            capacity: 500,
                            lengthMM: 1250,
                            widthMM: 750,
                            heightMM: 850,
                            product: 'VP9AG-500',
                        },
                        '600': {
                            capacity: 600,
                            lengthMM: 1360,
                            widthMM: 850,
                            heightMM: 1000,
                            product: 'VPT9AG-600',
                        },
                        '750': {
                            capacity: 750,
                            lengthMM: 1660,
                            widthMM: 850,
                            heightMM: 1000,
                            product: 'VPT9AG-750',
                        },
                        '1000': {
                            capacity: 1000,
                            lengthMM: 1810,
                            widthMM: 1030,
                            heightMM: 1000,
                            product: 'VPT9AG-1000',
                        },
                        '1100': {
                            capacity: 1100,
                            lengthMM: 1910,
                            widthMM: 1030,
                            heightMM: 1000,
                            product: 'VPT9AG-1100',
                        },
                        '1500': {
                            capacity: 1500,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1000,
                            product: 'VPT9AG-1500',
                        },
                        '2000': {
                            capacity: 2000,
                            lengthMM: 2630,
                            widthMM: 1250,
                            heightMM: 1420,
                            product: 'VPT9AG-2000',
                        },
                        '2500': {
                            capacity: 2500,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1620,
                            product: 'VPT9AG-2500',
                        },
                        '3000': {
                            capacity: 3000,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1420,
                            product: 'VPT9AG-3000',
                        },
                        '4000': {
                            capacity: 4000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1700,
                            product: 'VPT9AG-4000',
                        },
                        '5000': {
                            capacity: 5000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1420,
                            product: 'VPT9AG-5000',
                        },
                        '6000': {
                            capacity: 6000,
                            lengthMM: 3160,
                            widthMM: 1930,
                            heightMM: 1500,
                            product: 'VPT9AG-6000',
                        },
                        '7500': {
                            capacity: 7500,
                            lengthMM: 3760,
                            widthMM: 1930,
                            heightMM: 1550,
                            product: 'VPT9AG-7500',
                        },
                        '10000': {
                            capacity: 10000,
                            lengthMM: 4160,
                            widthMM: 2130,
                            heightMM: 1000,
                            product: 'VPT9AG-10000',
                        },
                    },
                },
                qld: {
                    belowGround: {
                        '250': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 830,
                            product: 'QPT9BG-250',
                        },
                        '300': {
                            capacity: 300,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 930,
                            product: 'QPT9BG-300',
                        },
                        '350': {
                            capacity: 350,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'QPT9BG-350',
                        },
                        '400': {
                            capacity: 400,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 890,
                            product: 'QPT9BG-400',
                        },
                        '450': {
                            capacity: 450,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 950,
                            product: 'QPT9BG-450',
                        },
                        '500': {
                            capacity: 500,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'QPT9BG-500',
                        },
                        '600': {
                            capacity: 600,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'QPT9BG-600',
                        },
                        '750': {
                            capacity: 750,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'QPT9BG-750',
                        },
                        '900': {
                            capacity: 900,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1210,
                            product: 'QPT9BG-900',
                        },
                        '1000': {
                            capacity: 1000,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1310,
                            product: 'QPT9BG-1000',
                        },
                        '1100': {
                            capacity: 1100,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1410,
                            product: 'QPT9BG-1100',
                        },
                        '1500': {
                            capacity: 1500,
                            lengthMM: 2400,
                            widthMM: 1000,
                            heightMM: 1410,
                            product: 'QPT9BG-1500',
                        },
                        '2000': {
                            capacity: 2000,
                            lengthMM: 3000,
                            widthMM: 1000,
                            heightMM: 1470,
                            product: 'QPT9BG-2000',
                        },
                        '2500': {
                            capacity: 2500,
                            lengthMM: 3000,
                            widthMM: 1400,
                            heightMM: 1510,
                            product: 'QPT9BG-2500',
                        },
                        '3000': {
                            capacity: 3000,
                            lengthMM: 3600,
                            widthMM: 1300,
                            heightMM: 1500,
                            product: 'QPT9BG-3000',
                        },
                        '4000': {
                            capacity: 4000,
                            lengthMM: 3600,
                            widthMM: 1400,
                            heightMM: 1880,
                            product: 'QPT9BG-4000',
                        },
                        '5000': {
                            capacity: 5000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 1750,
                            product: 'QPT9BG-5000',
                        },
                        '6000': {
                            capacity: 6000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 2050,
                            product: 'QPT9BG-6000',
                        },
                        '7500': {
                            capacity: 7500,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 1750,
                            product: 'QPT9BG-7500',
                        },
                        '10000': {
                            capacity: 10000,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 2200,
                            product: 'QPT9BG-10000',
                        },
                    },
                    aboveGround: {
                        '250': {
                            capacity: 250,
                            lengthMM: 900,
                            widthMM: 530,
                            heightMM: 730,
                            product: 'QP9AG-250',
                        },
                        '250a': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 530,
                            heightMM: 600,
                            product: 'QP9AG-250a',
                        },
                        '300': {
                            capacity: 300,
                            lengthMM: 1250,
                            widthMM: 600,
                            heightMM: 750,
                            product: 'QP9AG-300',
                        },
                        '400': {
                            capacity: 400,
                            lengthMM: 1250,
                            widthMM: 600,
                            heightMM: 850,
                            product: 'QP9AG-400',
                        },
                        '500': {
                            capacity: 500,
                            lengthMM: 1250,
                            widthMM: 750,
                            heightMM: 850,
                            product: 'QP9AG-500',
                        },
                        '600': {
                            capacity: 600,
                            lengthMM: 1360,
                            widthMM: 850,
                            heightMM: 1000,
                            product: 'QPT9AG-600',
                        },
                        '750': {
                            capacity: 750,
                            lengthMM: 1660,
                            widthMM: 850,
                            heightMM: 1000,
                            product: 'QPT9AG-750',
                        },
                        '1000': {
                            capacity: 1000,
                            lengthMM: 1810,
                            widthMM: 1030,
                            heightMM: 1000,
                            product: 'QPT9AG-1000',
                        },
                        '1100': {
                            capacity: 1100,
                            lengthMM: 1910,
                            widthMM: 1030,
                            heightMM: 1000,
                            product: 'QPT9AG-1100',
                        },
                        '1500': {
                            capacity: 1500,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1000,
                            product: 'QPT9AG-1500',
                        },
                        '2000': {
                            capacity: 2000,
                            lengthMM: 2630,
                            widthMM: 1250,
                            heightMM: 1420,
                            product: 'QPT9AG-2000',
                        },
                        '2500': {
                            capacity: 2500,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1620,
                            product: 'QPT9AG-2500',
                        },
                        '3000': {
                            capacity: 3000,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1420,
                            product: 'QPT9AG-3000',
                        },
                        '4000': {
                            capacity: 4000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1700,
                            product: 'QPT9AG-4000',
                        },
                        '5000': {
                            capacity: 5000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1420,
                            product: 'QPT9AG-5000',
                        },
                        '6000': {
                            capacity: 6000,
                            lengthMM: 3160,
                            widthMM: 1930,
                            heightMM: 1500,
                            product: 'QPT9AG-6000',
                        },
                        '7500': {
                            capacity: 7500,
                            lengthMM: 3760,
                            widthMM: 1930,
                            heightMM: 1550,
                            product: 'QPT9AG-7500',
                        },
                        '10000': {
                            capacity: 10000,
                            lengthMM: 4160,
                            widthMM: 2130,
                            heightMM: 1000,
                            product: 'QPT9AG-10000',
                        },
                    },
                },
                sa: {
                    belowGround: {
                        '250': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 830,
                            product: 'SPT9BG-250',
                        },
                        '300': {
                            capacity: 300,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 930,
                            product: 'SPT9BG-300',
                        },
                        '400': {
                            capacity: 400,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 890,
                            product: 'SPT9BG-400',
                        },
                        '450': {
                            capacity: 450,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 950,
                            product: 'SPT9BG-450',
                        },
                        '500': {
                            capacity: 500,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'SPT9BG-500',
                        },
                        '600': {
                            capacity: 600,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'SPT9BG-600',
                        },
                        '750': {
                            capacity: 750,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'SPT9BG-750',
                        },
                        '900': {
                            capacity: 900,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1210,
                            product: 'SPT9BG-900',
                        },
                        '1000': {
                            capacity: 1000,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1310,
                            product: 'SPT9BG-1000',
                        },
                        '1100': {
                            capacity: 1100,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1410,
                            product: 'SPT9BG-1100',
                        },
                        '1500': {
                            capacity: 1500,
                            lengthMM: 2400,
                            widthMM: 1000,
                            heightMM: 1410,
                            product: 'SPT9BG-1500',
                        },
                        '1800': {
                            capacity: 1800,
                            lengthMM: 2400,
                            widthMM: 1000,
                            heightMM: 1620,
                            product: 'SPT9BG-1800',
                        },
                        '2000': {
                            capacity: 2000,
                            lengthMM: 3000,
                            widthMM: 1000,
                            heightMM: 1470,
                            product: 'SPT9BG-2000',
                        },
                        '2500': {
                            capacity: 2500,
                            lengthMM: 3000,
                            widthMM: 1400,
                            heightMM: 1510,
                            product: 'SPT9BG-2500',
                        },
                        '3000': {
                            capacity: 3000,
                            lengthMM: 3600,
                            widthMM: 1400,
                            heightMM: 1500,
                            product: 'SPT9BG-3000',
                        },
                        '4000': {
                            capacity: 4000,
                            lengthMM: 3600,
                            widthMM: 1400,
                            heightMM: 1880,
                            product: 'SPT9BG-4000',
                        },
                        '5000': {
                            capacity: 5000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 1750,
                            product: 'SPT9BG-5000',
                        },
                        '6000': {
                            capacity: 6000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 2050,
                            product: 'SPT9BG-6000',
                        },
                        '7500': {
                            capacity: 7500,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 1750,
                            product: 'SPT9BG-7500',
                        },
                        '10000': {
                            capacity: 10000,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 2200,
                            product: 'SPT9BG-10000',
                        },
                    },
                    aboveGround: {
                        '250': {
                            capacity: 250,
                            lengthMM: 900,
                            widthMM: 530,
                            heightMM: 730,
                            product: 'SP9AG-250',
                        },
                        '250a': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 530,
                            heightMM: 600,
                            product: 'SP9AG-250a',
                        },
                        '300': {
                            capacity: 300,
                            lengthMM: 1250,
                            widthMM: 600,
                            heightMM: 750,
                            product: 'SP9AG-300',
                        },
                        '400*': {
                            capacity: 400,
                            lengthMM: 1250,
                            widthMM: 600,
                            heightMM: 850,
                            product: 'SP9AG-400',
                        },
                        '500': {
                            capacity: 500,
                            lengthMM: 1250,
                            widthMM: 750,
                            heightMM: 850,
                            product: 'SP9AG-500',
                        },
                        '600': {
                            capacity: 600,
                            lengthMM: 1360,
                            widthMM: 850,
                            heightMM: 1000,
                            product: 'SPT9AG-600',
                        },
                        '750': {
                            capacity: 750,
                            lengthMM: 1660,
                            widthMM: 850,
                            heightMM: 1000,
                            product: 'SPT9AG-750',
                        },
                        '1000*': {
                            capacity: 1000,
                            lengthMM: 1810,
                            widthMM: 1030,
                            heightMM: 1000,
                            product: 'SPT9AG-1000',
                        },
                        '1100': {
                            capacity: 1100,
                            lengthMM: 1910,
                            widthMM: 1030,
                            heightMM: 1000,
                            product: 'SPT9AG-1100',
                        },
                        '1500*': {
                            capacity: 1500,
                            lengthMM: 2360,
                            widthMM: 1130,
                            heightMM: 1000,
                            product: 'SPT9AG-1500',
                        },
                        '1800*': {
                            capacity: 1800,
                            lengthMM: 2160,
                            widthMM: 1030,
                            heightMM: 1300,
                            product: 'SPT9AG-1800',
                        },
                        '2000*': {
                            capacity: 2000,
                            lengthMM: 2630,
                            widthMM: 1030,
                            heightMM: 1300,
                            product: 'SPT9AG-2000',
                        },
                        '2500*': {
                            capacity: 2500,
                            lengthMM: 2960,
                            widthMM: 1030,
                            heightMM: 1300,
                            product: 'SPT9AG-2500',
                        },
                        '3000*': {
                            capacity: 3000,
                            lengthMM: 3160,
                            widthMM: 1130,
                            heightMM: 1300,
                            product: 'SPT9AG-3000',
                        },
                        '4000*': {
                            capacity: 4000,
                            lengthMM: 3160,
                            widthMM: 1480,
                            heightMM: 1300,
                            product: 'SPT9AG-4000',
                        },
                        '5000*': {
                            capacity: 5000,
                            lengthMM: 3160,
                            widthMM: 1630,
                            heightMM: 1400,
                            product: 'SPT9AG-5000',
                        },
                        '6000': {
                            capacity: 6000,
                            lengthMM: 3160,
                            widthMM: 1930,
                            heightMM: 1420,
                            product: 'SPT9AG-6000',
                        },
                        '7500': {
                            capacity: 7500,
                            lengthMM: 3760,
                            widthMM: 1930,
                            heightMM: 1500,
                            product: 'SPT9AG-7500',
                        },
                        '10000': {
                            capacity: 10000,
                            lengthMM: 4160,
                            widthMM: 2130,
                            heightMM: 1550,
                            product: 'SPT9AG-10000',
                        },
                    },
                },
                wa: {
                    belowGround: {
                        '250': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 830,
                            product: 'WPT9BG-250',
                        },
                        '300': {
                            capacity: 300,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 930,
                            product: 'WPT9BG-300',
                        },
                        '350': {
                            capacity: 350,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'WPT9BG-350',
                        },
                        '400': {
                            capacity: 400,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 890,
                            product: 'WPT9BG-400',
                        },
                        '450': {
                            capacity: 450,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 950,
                            product: 'WPT9BG-450',
                        },
                        '500': {
                            capacity: 500,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'WPT9BG-500',
                        },
                        '540': {
                            capacity: 540,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 950,
                            product: 'WPT9BG-540',
                        },
                        '600': {
                            capacity: 600,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'WPT9BG-600',
                        },
                        '730': {
                            capacity: 730,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'WPT9BG-730',
                        },
                        '750': {
                            capacity: 750,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'WPT9BG-750',
                        },
                        '900': {
                            capacity: 900,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1210,
                            product: 'WPT9BG-900',
                        },
                        '1000': {
                            capacity: 1000,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1310,
                            product: 'WPT9BG-1000',
                        },
                        '1100': {
                            capacity: 1100,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1410,
                            product: 'WPT9BG-1100',
                        },
                        '1250': {
                            capacity: 1250,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1550,
                            product: 'WPT9BG-1250',
                        },
                        '1500': {
                            capacity: 1500,
                            lengthMM: 2400,
                            widthMM: 1000,
                            heightMM: 1450,
                            product: 'WPT9BG-1500',
                        },
                        '2000': {
                            capacity: 2000,
                            lengthMM: 3000,
                            widthMM: 1000,
                            heightMM: 1470,
                            product: 'WPT9BG-2000',
                        },
                        '2500': {
                            capacity: 2500,
                            lengthMM: 3000,
                            widthMM: 1400,
                            heightMM: 1510,
                            product: 'WPT9BG-2500',
                        },
                        '3000': {
                            capacity: 3000,
                            lengthMM: 3600,
                            widthMM: 1300,
                            heightMM: 1500,
                            product: 'WPT9BG-3000',
                        },
                        '4000': {
                            capacity: 4000,
                            lengthMM: 3600,
                            widthMM: 1400,
                            heightMM: 1880,
                            product: 'WPT9BG-4000',
                        },
                        '5000': {
                            capacity: 5000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 1750,
                            product: 'WPT9BG-5000',
                        },
                        '6000': {
                            capacity: 6000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 2050,
                            product: 'WPT9BG-6000',
                        },
                        '7500': {
                            capacity: 7500,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 1750,
                            product: 'WPT9BG-7500',
                        },
                        '10000': {
                            capacity: 10000,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 2200,
                            product: 'WPT9BG-10000',
                        },
                    },
                    aboveGround: {
                        '250': {
                            capacity: 250,
                            lengthMM: 900,
                            widthMM: 530,
                            heightMM: 730,
                            product: 'WP9AG-250',
                        },
                        '250a': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 530,
                            heightMM: 600,
                            product: 'WP9AG-250a',
                        },
                        '300': {
                            capacity: 300,
                            lengthMM: 1250,
                            widthMM: 600,
                            heightMM: 750,
                            product: 'WP9AG-300',
                        },
                        '400': {
                            capacity: 400,
                            lengthMM: 1250,
                            widthMM: 600,
                            heightMM: 850,
                            product: 'WP9AG-400',
                        },
                        '500': {
                            capacity: 500,
                            lengthMM: 1250,
                            widthMM: 750,
                            heightMM: 850,
                            product: 'WP9AG-500',
                        },
                        '540*': {
                            capacity: 540,
                            lengthMM: 1400,
                            widthMM: 880,
                            heightMM: 960,
                            product: 'WPT9AG-540',
                        },
                        '600': {
                            capacity: 600,
                            lengthMM: 1360,
                            widthMM: 850,
                            heightMM: 1000,
                            product: 'WPT9AG-600',
                        },
                        '730': {
                            capacity: 730,
                            lengthMM: 1550,
                            widthMM: 880,
                            heightMM: 1060,
                            product: 'WPT9AG-730',
                        },
                        '750': {
                            capacity: 750,
                            lengthMM: 1660,
                            widthMM: 850,
                            heightMM: 1000,
                            product: 'WPT9AG-750',
                        },
                        '1000*': {
                            capacity: 1000,
                            lengthMM: 1800,
                            widthMM: 1030,
                            heightMM: 1060,
                            product: 'WPT9AG-1000',
                        },
                        '1100': {
                            capacity: 1100,
                            lengthMM: 1910,
                            widthMM: 1030,
                            heightMM: 1000,
                            product: 'WPT9AG-1100',
                        },
                        '1250*': {
                            capacity: 1250,
                            lengthMM: 2150,
                            widthMM: 1030,
                            heightMM: 1060,
                            product: 'WPT9AG-1250',
                        },
                        '1500*': {
                            capacity: 1500,
                            lengthMM: 2150,
                            widthMM: 1030,
                            heightMM: 1190,
                            product: 'WPT9AG-1500',
                        },
                        '2000*': {
                            capacity: 2000,
                            lengthMM: 2350,
                            widthMM: 1030,
                            heightMM: 1360,
                            product: 'WPT9AG-2000',
                        },
                        '2500*': {
                            capacity: 2500,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1320,
                            product: 'WPT9AG-2500',
                        },
                        '3000*': {
                            capacity: 3000,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1520,
                            product: 'WPT9AG-3000',
                        },
                        '4000*': {
                            capacity: 4000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1320,
                            product: 'WPT9AG-4000',
                        },
                        '5000*': {
                            capacity: 5000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1600,
                            product: 'WPT9AG-5000',
                        },
                        '6000': {
                            capacity: 6000,
                            lengthMM: 3160,
                            widthMM: 1930,
                            heightMM: 1420,
                            product: 'WPT9AG-6000',
                        },
                        '7500': {
                            capacity: 7500,
                            lengthMM: 3760,
                            widthMM: 1930,
                            heightMM: 1500,
                            product: 'WPT9AG-7500',
                        },
                        '10000': {
                            capacity: 10000,
                            lengthMM: 4160,
                            widthMM: 2130,
                            heightMM: 1550,
                            product: 'WPT9AG-10000',
                        },
                    },
                },
                tas: {
                    belowGround: {
                        '250': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 830,
                            product: 'TPT9BG-250',
                        },
                        '300': {
                            capacity: 300,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 930,
                            product: 'TPT9BG-300',
                        },
                        '350': {
                            capacity: 350,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'TPT9BG-350',
                        },
                        '400': {
                            capacity: 400,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 890,
                            product: 'TPT9BG-400',
                        },
                        '450': {
                            capacity: 450,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 950,
                            product: 'TPT9BG-450',
                        },
                        '500': {
                            capacity: 500,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'TPT9BG-500',
                        },
                        '600': {
                            capacity: 600,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'TPT9BG-600',
                        },
                        '750': {
                            capacity: 750,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'TPT9BG-750',
                        },
                        '900': {
                            capacity: 900,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1210,
                            product: 'TPT9BG-900',
                        },
                        '1000': {
                            capacity: 1000,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1310,
                            product: 'TPT9BG-1000',
                        },
                        '1100': {
                            capacity: 1100,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1410,
                            product: 'TPT9BG-1100',
                        },
                        '1500': {
                            capacity: 1500,
                            lengthMM: 2400,
                            widthMM: 1000,
                            heightMM: 1410,
                            product: 'TPT9BG-1500',
                        },
                        '2000': {
                            capacity: 2000,
                            lengthMM: 3000,
                            widthMM: 1000,
                            heightMM: 1470,
                            product: 'TPT9BG-2000',
                        },
                        '2500': {
                            capacity: 2500,
                            lengthMM: 3000,
                            widthMM: 1400,
                            heightMM: 1510,
                            product: 'TPT9BG-2500',
                        },
                        '3000': {
                            capacity: 3000,
                            lengthMM: 3600,
                            widthMM: 1300,
                            heightMM: 1500,
                            product: 'TPT9BG-3000',
                        },
                        '4000': {
                            capacity: 4000,
                            lengthMM: 3600,
                            widthMM: 1400,
                            heightMM: 1880,
                            product: 'TPT9BG-4000',
                        },
                        '5000': {
                            capacity: 5000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 1750,
                            product: 'TPT9BG-5000',
                        },
                        '6000': {
                            capacity: 6000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 2050,
                            product: 'TPT9BG-6000',
                        },
                        '7500': {
                            capacity: 7500,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 1750,
                            product: 'TPT9BG-7500',
                        },
                        '10000': {
                            capacity: 10000,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 2200,
                            product: 'TPT9BG-10000',
                        },
                    },
                    aboveGround: {
                        '250': {
                            capacity: 250,
                            lengthMM: 900,
                            widthMM: 530,
                            heightMM: 730,
                            product: 'TP9AG-250',
                        },
                        '250a': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 530,
                            heightMM: 600,
                            product: 'TP9AG-250a',
                        },
                        '300': {
                            capacity: 300,
                            lengthMM: 1250,
                            widthMM: 600,
                            heightMM: 750,
                            product: 'TP9AG-300',
                        },
                        '400': {
                            capacity: 400,
                            lengthMM: 1250,
                            widthMM: 600,
                            heightMM: 850,
                            product: 'TP9AG-400',
                        },
                        '500': {
                            capacity: 500,
                            lengthMM: 1250,
                            widthMM: 750,
                            heightMM: 850,
                            product: 'TP9AG-500',
                        },
                        '600': {
                            capacity: 600,
                            lengthMM: 1360,
                            widthMM: 850,
                            heightMM: 1000,
                            product: 'TPT9AG-600',
                        },
                        '750': {
                            capacity: 750,
                            lengthMM: 1660,
                            widthMM: 850,
                            heightMM: 1000,
                            product: 'TPT9AG-750',
                        },
                        '1000': {
                            capacity: 1000,
                            lengthMM: 1810,
                            widthMM: 1030,
                            heightMM: 1000,
                            product: 'TPT9AG-1000',
                        },
                        '1100': {
                            capacity: 1100,
                            lengthMM: 1910,
                            widthMM: 1030,
                            heightMM: 1000,
                            product: 'TPT9AG-1100',
                        },
                        '1500': {
                            capacity: 1500,
                            lengthMM: 2360,
                            widthMM: 1130,
                            heightMM: 1000,
                            product: 'TPT9AG-1500',
                        },
                        '2000': {
                            capacity: 2000,
                            lengthMM: 2630,
                            widthMM: 1250,
                            heightMM: 1000,
                            product: 'TPT9AG-2000',
                        },
                        '2500': {
                            capacity: 2500,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1320,
                            product: 'TPT9AG-2500',
                        },
                        '3000': {
                            capacity: 3000,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1520,
                            product: 'TPT9AG-3000',
                        },
                        '4000': {
                            capacity: 4000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1320,
                            product: 'TPT9AG-4000',
                        },
                        '5000': {
                            capacity: 5000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1600,
                            product: 'TPT9AG-5000',
                        },
                        '6000': {
                            capacity: 6000,
                            lengthMM: 3160,
                            widthMM: 1930,
                            heightMM: 1420,
                            product: 'TPT9AG-6000',
                        },
                        '7500': {
                            capacity: 7500,
                            lengthMM: 3760,
                            widthMM: 1930,
                            heightMM: 1500,
                            product: 'TPT9AG-7500',
                        },
                        '10000': {
                            capacity: 10000,
                            lengthMM: 4160,
                            widthMM: 2130,
                            heightMM: 1550,
                            product: 'TPT9AG-10000',
                        },
                    },
                },
                nt: {
                    belowGround: {
                        '250': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 830,
                            product: 'NTPT9BG-250',
                        },
                        '300': {
                            capacity: 300,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 930,
                            product: 'NTPT9BG-300',
                        },
                        '350': {
                            capacity: 350,
                            lengthMM: 1200,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'NTPT9BG-350',
                        },
                        '400': {
                            capacity: 400,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 890,
                            product: 'NTPT9BG-400',
                        },
                        '450': {
                            capacity: 450,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 950,
                            product: 'NTPT9BG-450',
                        },
                        '500': {
                            capacity: 500,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'NTPT9BG-500',
                        },
                        '600': {
                            capacity: 600,
                            lengthMM: 1600,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'NTPT9BG-600',
                        },
                        '750': {
                            capacity: 750,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1050,
                            product: 'NTPT9BG-750',
                        },
                        '900': {
                            capacity: 900,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1210,
                            product: 'NTPT9BG-900',
                        },
                        '1000': {
                            capacity: 1000,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1310,
                            product: 'NTPT9BG-1000',
                        },
                        '1100': {
                            capacity: 1100,
                            lengthMM: 1800,
                            widthMM: 1000,
                            heightMM: 1410,
                            product: 'NTPT9BG-1100',
                        },
                        '1500': {
                            capacity: 1500,
                            lengthMM: 2400,
                            widthMM: 1000,
                            heightMM: 1410,
                            product: 'NTPT9BG-1500',
                        },
                        '2000': {
                            capacity: 2000,
                            lengthMM: 3000,
                            widthMM: 1000,
                            heightMM: 1470,
                            product: 'NTPT9BG-2000',
                        },
                        '2500': {
                            capacity: 2500,
                            lengthMM: 3000,
                            widthMM: 1400,
                            heightMM: 1510,
                            product: 'NTPT9BG-2500',
                        },
                        '3000': {
                            capacity: 3000,
                            lengthMM: 3600,
                            widthMM: 1300,
                            heightMM: 1500,
                            product: 'NTPT9BG-3000',
                        },
                        '4000': {
                            capacity: 4000,
                            lengthMM: 3600,
                            widthMM: 1400,
                            heightMM: 1880,
                            product: 'NTPT9BG-4000',
                        },
                        '5000': {
                            capacity: 5000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 1750,
                            product: 'NTPT9BG-5000',
                        },
                        '6000': {
                            capacity: 6000,
                            lengthMM: 4700,
                            widthMM: 1400,
                            heightMM: 2050,
                            product: 'NTPT9BG-6000',
                        },
                        '7500': {
                            capacity: 7500,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 1750,
                            product: 'NTPT9BG-7500',
                        },
                        '10000': {
                            capacity: 10000,
                            lengthMM: 5200,
                            widthMM: 1800,
                            heightMM: 2200,
                            product: 'NTPT9BG-10000',
                        },
                    },
                    aboveGround: {
                        '250': {
                            capacity: 250,
                            lengthMM: 900,
                            widthMM: 530,
                            heightMM: 730,
                            product: 'NTP9AG-250',
                        },
                        '250a': {
                            capacity: 250,
                            lengthMM: 1200,
                            widthMM: 530,
                            heightMM: 600,
                            product: 'NTP9AG-250a',
                        },
                        '300': {
                            capacity: 300,
                            lengthMM: 1250,
                            widthMM: 600,
                            heightMM: 750,
                            product: 'NTP9AG-300',
                        },
                        '400': {
                            capacity: 400,
                            lengthMM: 1250,
                            widthMM: 600,
                            heightMM: 850,
                            product: 'NTP9AG-400',
                        },
                        '500': {
                            capacity: 500,
                            lengthMM: 1250,
                            widthMM: 750,
                            heightMM: 850,
                            product: 'NTP9AG-500',
                        },
                        '600': {
                            capacity: 600,
                            lengthMM: 1360,
                            widthMM: 850,
                            heightMM: 1000,
                            product: 'NTPT9AG-600',
                        },
                        '750': {
                            capacity: 750,
                            lengthMM: 1660,
                            widthMM: 850,
                            heightMM: 1000,
                            product: 'NTPT9AG-750',
                        },
                        '1000': {
                            capacity: 1000,
                            lengthMM: 1810,
                            widthMM: 1030,
                            heightMM: 1000,
                            product: 'NTPT9AG-1000',
                        },
                        '1100': {
                            capacity: 1100,
                            lengthMM: 1910,
                            widthMM: 1030,
                            heightMM: 1000,
                            product: 'NTPT9AG-1100',
                        },
                        '1500': {
                            capacity: 1500,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1000,
                            product: 'NTPT9AG-1500',
                        },
                        '2000': {
                            capacity: 2000,
                            lengthMM: 2630,
                            widthMM: 1250,
                            heightMM: 1420,
                            product: 'NTPT9AG-2000',
                        },
                        '2500': {
                            capacity: 2500,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1620,
                            product: 'NTPT9AG-2500',
                        },
                        '3000': {
                            capacity: 3000,
                            lengthMM: 2630,
                            widthMM: 1130,
                            heightMM: 1420,
                            product: 'NTPT9AG-3000',
                        },
                        '4000': {
                            capacity: 4000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1700,
                            product: 'NTPT9AG-4000',
                        },
                        '5000': {
                            capacity: 5000,
                            lengthMM: 2630,
                            widthMM: 1730,
                            heightMM: 1420,
                            product: 'NTPT9AG-5000',
                        },
                        '6000': {
                            capacity: 6000,
                            lengthMM: 3160,
                            widthMM: 1930,
                            heightMM: 1500,
                            product: 'NTPT9AG-6000',
                        },
                        '7500': {
                            capacity: 7500,
                            lengthMM: 3760,
                            widthMM: 1930,
                            heightMM: 1550,
                            product: 'NTPT9AG-7500',
                        },
                        '10000': {
                            capacity: 10000,
                            lengthMM: 4160,
                            widthMM: 2130,
                            heightMM: 1000,
                            product: 'NTPT9AG-10000',
                        },
                    },
                },
            },
        },
    }
};
