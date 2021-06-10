import { DwellingStandardType, PSDStandardType } from "../psd-standard/types";
import {Catalog, State} from "../types";
import {EN12056FrequencyFactor} from "../../config";

export const usCatalog: Catalog = {
    fixtures: {
        ablutionTrough: {
            priceTableName: "Ablution Trough",
            abbreviation: "AT",
            asnzFixtureUnits: "3",
            enDischargeUnits: "0.6",
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
                cibseGuideG: {
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
            maxInletPressureKPA: "551.5805832",
            minInletPressureKPA: "103.42135935",
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
            abbreviation: "LS",
            asnzFixtureUnits: "1",
            enDischargeUnits: "0.3",
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
                cibseGuideG: {
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
            maxInletPressureKPA: "551.5805832",
            minInletPressureKPA: "103.42135935",
            name: "Lavatory Sink",
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
            enDischargeUnits: "0.6",
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
                cibseGuideG: {
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
            maxInletPressureKPA: "551.5805832",
            minInletPressureKPA: "103.42135935",
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
            enDischargeUnits: "0.6",
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
                cibseGuideG: {
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
            maxInletPressureKPA: "551.5805832",
            minInletPressureKPA: "103.42135935",
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
            enDischargeUnits: "0.6",
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
                cibseGuideG: {
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
            maxInletPressureKPA: "551.5805832",
            minInletPressureKPA: "103.42135935",
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
            enDischargeUnits: "1",
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
                cibseGuideG: {
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
            maxInletPressureKPA: "551.5805832",
            minInletPressureKPA: "103.42135935",
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
            enDischargeUnits: "0.6",
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
                cibseGuideG: {
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
            maxInletPressureKPA: "551.5805832",
            minInletPressureKPA: "103.42135935",
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
            enDischargeUnits: "0.6",
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
                cibseGuideG: {
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
            maxInletPressureKPA: "551.5805832",
            minInletPressureKPA: "103.42135935",
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
            enDischargeUnits: "0.3",
            upcFixtureUnits: "0.5",
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
                cibseGuideG: {
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
            maxInletPressureKPA: "551.5805832",
            minInletPressureKPA: "103.42135935",
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
            enDischargeUnits: "1.8",
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
                cibseGuideG: {
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
            maxInletPressureKPA: "551.5805832",
            minInletPressureKPA: "103.42135935",
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
                cibseGuideG: {
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
            maxInletPressureKPA: "551.5805832",
            minInletPressureKPA: "103.42135935",
            name: "Hose Bibb",
            outletAboveFloorM: "0.5",
            probabilityOfUsagePCT: "0",
            qLS: {
                generic:{ default: { "cold-water": "0.3" } }
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
            enDischargeUnits: "0.6",
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
                cibseGuideG: {
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
            maxInletPressureKPA: "551.5805832",
            minInletPressureKPA: "103.42135935",
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
            enDischargeUnits: "0.6",
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
                cibseGuideG: {
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
            maxInletPressureKPA: "551.5805832",
            minInletPressureKPA: "103.42135935",
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
            abbreviation: "S",
            asnzFixtureUnits: "5",
            enDischargeUnits: "0.6",
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
                cibseGuideG: {
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
            maxInletPressureKPA: "551.5805832",
            minInletPressureKPA: "103.42135935",
            name: "Laundry Sink (Warm)",
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
            abbreviation: "S",
            asnzFixtureUnits: "5",
            enDischargeUnits: "0.6",
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
                cibseGuideG: {
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
            maxInletPressureKPA: "551.5805832",
            minInletPressureKPA: "103.42135935",
            name: "Laundry Sink (Hot)",
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
            enDischargeUnits: "0.5",
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
                cibseGuideG: {
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
            maxInletPressureKPA: "551.5805832",
            minInletPressureKPA: "103.42135935",
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
                cibseGuideG: {
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
            maxInletPressureKPA: "551.5805832",
            minInletPressureKPA: "103.42135935",
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
            abbreviation: "CW",
            asnzFixtureUnits: "5",
            enDischargeUnits: "1.2",
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
                cibseGuideG: {
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
            maxInletPressureKPA: "551.5805832",
            minInletPressureKPA: "103.42135935",
            name: "Clothes Washer",
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
            enDischargeUnits: "1.8",
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
                cibseGuideG: {
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
            maxInletPressureKPA: "551.5805832",
            minInletPressureKPA: "103.42135935",
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
            name: "Copper (Type B)",
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
                }
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
                }
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
            name: "PEX (SDR 7.4)",
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
                }
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
                }
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
                }
            ],
            abbreviation: "S/S",
            pipesBySize: {
                generic: {
                    100: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "104",
                        diameterNominalMM: "100",
                        diameterOutsideMM: "108",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "4500"
                    },
                    15: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "13",
                        diameterNominalMM: "15",
                        diameterOutsideMM: "15",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "20000"
                    },
                    150: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "162",
                        diameterNominalMM: "150",
                        diameterOutsideMM: "166",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "4000"
                    },
                    20: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "19.6",
                        diameterNominalMM: "20",
                        diameterOutsideMM: "22",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "15800"
                    },
                    25: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "25.6",
                        diameterNominalMM: "25",
                        diameterOutsideMM: "28",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "12500"
                    },
                    32: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "32",
                        diameterNominalMM: "32",
                        diameterOutsideMM: "35",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "9800"
                    },
                    40: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "39",
                        diameterNominalMM: "40",
                        diameterOutsideMM: "42",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "8500"
                    },
                    50: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "51",
                        diameterNominalMM: "50",
                        diameterOutsideMM: "54",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "6800"
                    },
                    65: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "67",
                        diameterNominalMM: "65",
                        diameterOutsideMM: "71",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "7200"
                    },
                    80: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "72.1",
                        diameterNominalMM: "80",
                        diameterOutsideMM: "76.1",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "5900"
                    }
                },
                'kemblaS/s': {
                    100: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "104",
                        diameterNominalMM: "100",
                        diameterOutsideMM: "108",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "1600"
                    },
                    15: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "13",
                        diameterNominalMM: "15",
                        diameterOutsideMM: "15",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "4000"
                    },
                    20: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "19.6",
                        diameterNominalMM: "20",
                        diameterOutsideMM: "22",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "4000"
                    },
                    25: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "25.6",
                        diameterNominalMM: "25",
                        diameterOutsideMM: "28",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "2500"
                    },
                    32: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "32",
                        diameterNominalMM: "32",
                        diameterOutsideMM: "35",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "2500"
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
                    80: {
                        colebrookWhiteCoefficient: "0.0015",
                        diameterInternalMM: "72.1",
                        diameterNominalMM: "80",
                        diameterOutsideMM: "76.1",
                        pipeUid: "stainlessSteel",
                        safeWorkingPressureKPA: "1600"
                    }
                }
            },
            uid: "stainlessSteel"
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
        cibseGuideG: {
            type: PSDStandardType.LU_LOOKUP_TABLE,
            name: "BS 6700",
            table: {
                0: "0.00", // added manually to force interpolation
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
                },
            }
        }
    },
    en12056FrequencyFactor: {
        [EN12056FrequencyFactor.CongestedUse]: 1.0
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
            { name: "Generic", abbreviation: "Generic", uid: "generic", priceTableName: 'Balancing Valve'},
            { name: "Cimberio", abbreviation: "Cimberio", uid: "cimberio", priceTableName: 'Balancing Valve'}
        ],
    },
    hotWaterPlant: {
        manufacturer: [
            { name: "Generic", abbreviation: "Generic", uid: "generic", priceTableName: "Hot Water Plant"},
            { name: "Grundfos", abbreviation: "Grundfos", uid: "grundfos", priceTableName: "Hot Water Plant"}
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
        }
    }
};
