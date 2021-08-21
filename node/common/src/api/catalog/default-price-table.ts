import {PriceTable} from "./price-table";

export const defaultPriceTable: PriceTable = {
    'Insulation': {
        15: 14.25,
        20: 15.75,
        25: 21.5,
        30: 23,
        35: 27.5,
        50: 44,
    },
    'Pipes': {
        'PEX': {
            16: 40,
            20: 45,
            25: 41,
            32: 51,
            40: 62,
            50: 75,
            63: 84,
        },
        'Copper': {
            15: 54,
            20: 56,
            22: 56,
            25: 65,
            28: 65,
            32: 67,
            35: 67,
            40: 75,
            42: 75,
            50: 92,
            54: 92,
            65: 110,
            67: 110,
            76: 152,
            80: 152,
            100: 200,
            108: 200,
            133: 320,
            150: 320,
            159: 370,
            200: 420,
        },
        'Stainless Steel': {
            15: 51,
            20: 53,
            22: 53,
            25: 65,
            28: 65,
            32: 65,
            35: 65,
            40: 72,
            42: 72,
            50: 92,
            54: 92,
            65: 92,
            71: 92,
            76: 92,
            80: 134,
            100: 176,
            108: 176,
            150: 290,
            166: 290,
        },
        'CPVC': {
            15: 27,
            20: 30,
            25: 33,
            32: 40,
            40: 47,
            50: 56,
        },
        'HDPE': {
            16: 37,
            20: 39,
            25: 42,
            32: 44,
            40: 46,
            50: 56,
            63: 69,
            75: 75,
            90: 102,
            110: 124,
        },
        'GMS': {
            15: 48,
            20: 54,
            25: 57,
            40: 66,
            50: 82,
            65: 108,
            80: 124,
            100: 148,
            150: 215,
        },
        'Cast Iron': {
            50: 104,
            70: 132,
            100: 164,
            150: 240,
            200: 350,
            250: 480,
            300: 570,
        },

        'Stainless Steel (Sewer)': {
            50: 92,
            75: 134,
            110: 176,
            160: 290,
            200: 200,
            250: 250,
            315: 315
        },
        'uPVC (Sewer)': {
            40: 42,
            50: 52,
            65: 62,
            80: 70,
            100: 84,
            150: 124,
            225: 280,
            300: 450,
        },
        'HDPE (Sewer)': {
            50: 46,
            75: 61,
            90: 76,
            110: 136,
            160: 210,
            250: 320,
        },
        'Cast Iron (Sewer)': {
            50: 104,
            70: 132,
            100: 164,
            150: 240,
            200: 350,
            250: 480,
            300: 570,
        },
    },
    'Valves': {
        'Brass Ball Valve': {
            15: 59,
            20: 69,
            25: 94,
            32: 146,
            40: 235,
            50: 290,
            65: 640,
            80: 900,
            100: 1000,
            150: 1500,
            200: 1800,
            250: 2200,
            300: 2600,
        },
        'Brass Gate Valve': {
            15: 59,
            20: 69,
            25: 94,
            32: 146,
            40: 235,
            50: 290,
            65: 640,
            80: 900,
            100: 1000,
            150: 1500,
            200: 1800,
            250: 2200,
            300: 2600,
        },
        'Butterfly Valve': {
            15: 59,
            20: 69,
            25: 94,
            32: 146,
            40: 235,
            50: 290,
            65: 640,
            80: 900,
            100: 1000,
            150: 1500,
            200: 1800,
            250: 2200,
            300: 2600,
        },
        'Water Meter': {
            15: 75,
            20: 100,
            25: 140,
            32: 190,
            40: 240,
            50: 300,
            65: 500,
            80: 600,
            100: 800,
            150: 1500,
            200: 1800,
            250: 2200,
            300: 2600,
        },
        'Strainer': {
            15: 65,
            20: 90,
            25: 130,
            32: 185,
            40: 230,
            50: 285,
            65: 450,
            80: 520,
            100: 680,
            150: 920,
            200: 1200,
            250: 1600,
            300: 2100,
        },
        'Check Valve': {
            15: 76,
            20: 92,
            25: 132,
            32: 194,
            40: 280,
            50: 370,
            65: 750,
            80: 1095,
            100: 1350,
            150: 1600,
            200: 2300,
            250: 2900,
            300: 3500,
        },
    },
    'Fittings': {

        'Tee': {
            'PEX': {
                16: 18,
                20: 22,
                25: 34,
                32: 57,
                40: 120,
                50: 182,
                63: 240,
            },
            'Copper': {
                15: 18,
                20: 22,
                22: 22,
                25: 25,
                28: 25,
                32: 30,
                35: 30,
                40: 35,
                42: 35,
                50: 53,
                54: 53,
                65: 59,
                67: 59,
                76: 74,
                80: 74,
                100: 102,
                108: 102,
                133: 255,
                150: 255,
                159: 255,
                200: 280,
            },
            'Stainless Steel': {
                15: 50,
                20: 55,
                22: 55,
                25: 60,
                28: 60,
                32: 68,
                35: 68,
                40: 74,
                42: 74,
                50: 82,
                54: 82,
                65: 82,
                71: 82,
                76: 112,
                80: 112,
                100: 156,
                108: 156,
                150: 300,
                166: 300,
            },
            'CPVC': {
                15: 9,
                20: 11,
                25: 12.5,
                32: 15,
                40: 17.5,
                50: 26.5,
            },
            'HDPE': {
                16: 15,
                20: 18,
                25: 20,
                32: 39,
                40: 52,
                50: 68,
                63: 84,
                75: 122,
                90: 170,
                110: 285,
            },
            'GMS': {
                15: 18,
                20: 22,
                25: 25,
                40: 69,
                50: 77,
                65: 96,
                80: 136,
                100: 186,
                150: 215,
            },
            'Cast Iron': {
                50: 80,
                70: 90,
                100: 126,
                150: 235,
                200: 700,
                250: 1400,
                300: 2100,
            },


            'Stainless Steel (Sewer)': {
                50: 82,
                75: 112,
                110: 156,
                160: 300,
                200: 200,
                250: 250,
                315: 315    
            },
            'uPVC (Sewer)': {
                40: 28.5,
                50: 34,
                65: 45,
                80: 62,
                100: 59,
                150: 112,
            },
            'HDPE (Sewer)': {
                50: 98,
                75: 114,
                90: 126,
                110: 156,
                160: 230,
                250: 520,
            },
            'Cast Iron (Sewer)': {
                50: 80,
                70: 90,
                100: 126,
                150: 235,
                200: 700,
                250: 1400,
                300: 2100,
            },
        },
        'Elbow': {
            'PEX': {
                16: 15,
                20: 18,
                25: 27,
                32: 49,
                40: 78,
                50: 134,
                63: 196,
            },
            'Copper': {
                15: 15,
                20: 18,
                22: 18,
                25: 20,
                28: 20,
                32: 25.5,
                35: 25.5,
                40: 33,
                42: 33,
                50: 41,
                54: 41,
                65: 51,
                67: 51,
                76: 67,
                80: 67,
                100: 92,
                108: 92,
                133: 240,
                150: 240,
                159: 290,
                200: 290,
            },
            'Stainless Steel': {
                15: 30,
                20: 37,
                22: 37,
                25: 41,
                28: 41,
                32: 47,
                35: 47,
                40: 52,
                42: 52,
                50: 59,
                54: 59,
                65: 59,
                71: 59,
                76: 80,
                80: 80,
                100: 114,
                108: 114,
                150: 200,
                166: 200,
            },
            'CPVC': {
                15: 7.5,
                20: 9,
                25: 10,
                32: 13,
                40: 16.5,
                50: 20.5,
            },
            'HDPE': {
                16: 15,
                20: 18,
                25: 22,
                32: 27.5,
                40: 39.5,
                50: 50,
                63: 61,
                75: 88,
                90: 122,
                110: 180,
            },
            'GMS': {
                15: 15,
                20: 18,
                25: 20,
                40: 51,
                50: 54,
                65: 68,
                80: 86,
                100: 118,
                150: 176,
            },
            'Cast Iron': {
                50: 63,
                70: 77,
                100: 86,
                150: 142,
                200: 265,
                250: 580,
                300: 910,
            },


            'Stainless Steel (Sewer)': {
                50: 59,
                75: 80,
                110: 114,
                160: 200,
                200: 200,
                250: 250,
                315: 315    
            },
            'uPVC (Sewer)': {
                40: 22.5,
                50: 28,
                65: 36.5,
                80: 48,
                100: 54,
                150: 84,
            },
            'HDPE (Sewer)': {
                50: 75,
                75: 86,
                90: 102,
                110: 116,
                160: 200,
                250: 680,
            },
            'Cast Iron (Sewer)': {
                50: 63,
                70: 77,
                100: 88,
                150: 154,
                200: 275,
                250: 870,
                300: 1185,
            },
        },
        'Reducer': {
            'PEX': {
                20: 62,
                25: 85,
                32: 131,
                40: 212,
                50: 261,
                63: 576,
                80: 810,
                100: 900,
                150: 1350,
                200: 1620,
                250: 1980,
                300: 2340,
            },
            'Copper': {
                15: 50,
                20: 62,
                22: 62,
                25: 85,
                28: 85,
                32: 131,
                35: 131,
                40: 212,
                42: 212,
                50: 261,
                54: 261,
                65: 576,
                67: 576,
                76: 810,
                80: 810,
                100: 900,
                108: 900,
                150: 1350,
                159: 1350,
                200: 1620,
                250: 1980,
                300: 2340,
            },
            'Stainless Steel': {
                15: 62,
                20: 62,
                22: 62,
                25: 85,
                28: 85,
                32: 131,
                35: 131,
                40: 212,
                42: 212,
                50: 261,
                54: 261,
                65: 576,
                71: 576,
                76: 810,
                80: 810,
                100: 900,
                108: 900,
                150: 1350,
                166: 1350,
                200: 1620,
                250: 1980,
                300: 2340,
            },
            'CPVC': {
                15: 25,
                20: 31,
                25: 42.5,
                32: 65.5,
                40: 106,
                50: 130.5,
            },
            'HDPE': {
                20: 62,
                25: 85,
                32: 131,
                40: 212,
                50: 261,
                65: 576,
                80: 810,
                100: 900,
                150: 1350,
                200: 1620,
                250: 1980,
                300: 2340,
            },
            'GMS': {
                20: 62,
                25: 85,
                32: 131,
                40: 212,
                50: 261,
                65: 576,
                80: 810,
                100: 900,
                150: 1350,
                200: 1620,
                250: 1980,
                300: 2340,
            },
            'Cast Iron': {
                20: 62,
                25: 85,
                32: 131,
                40: 212,
                50: 261,
                65: 576,
                80: 810,
                100: 900,
                150: 1350,
                200: 1620,
                250: 1980,
                300: 2340,
            },


            'Stainless Steel (Sewer)': {
                50: 0,
                75: 0,
                110: 0,
                160: 0,
                200: 0,
                250: 0,
                315: 0    
            },
            'uPVC (Sewer)': {
                40: 0,
                50: 0,
                65: 0,
                80: 0,
                100: 0,
                150: 0,
            },
            'HDPE (Sewer)': {
                50: 0,
                75: 0,
                90: 0,
                110: 0,
                160: 0,
                250: 0,
            },
            'Cast Iron (Sewer)': {
                50: 0,
                70: 0,
                100: 0,
                150: 0,
                200: 0,
                250: 0,
                300: 0,
            },
        },
    },
    'Plants': {
        'Hot Water Plant': 15000,
        'Storage Tank': 100000,
        'Pump': 20000,
        'Custom': 10000,
    },
    'Equipment': {
        'PRV': {
            15: 102,
            20: 116,
            25: 190,
            32: 530,
            40: 900,
            50: 1035,
            65: 1200,
            80: 1450,
            100: 1700,
            150: 1900,
        },
        'TMV': 1200,
        'RPZD': {
            15: 490,
            20: 520,
            25: 600,
            32: 970,
            40: 1110,
            50: 1215,
            65: 4500,
            80: 8000,
            100: 10000,
            150: 12500,
        },
        'Tempering Valve': 600,
        'Balancing Valve': {
            15: 250,
            20: 290,
            25: 350,
            32: 410,
            40: 525,
            50: 625,
        },
        'Reflux Valve': {
            40: 280,
            50: 370,
            65: 750,
            70: 850,
            75: 920,
            80: 1095,
            90: 1200,
            100: 1350,
            110: 1420,
            150: 1600,
            160: 1800,
            200: 2300,
            250: 2900,
            300: 3500,
        },
        "Gas Filter": 3000,
        "Gas Regulator": 3000,
        "Gas Meter": 2000,


        'Inspection Opening': 0,
        'Floor Waste': 350,
        'Drainage Pit': 10000,
        'Grease Arrestor': 10000,
    },
    'Fixtures': {
        "Basin": 1655,
        "Kitchen Sink": 1340,
        "Shower": 3275,
        "WC": 1425,
        "WC DDA": 2000,
        "Cleaners Sink": 1560,
        "Bath": 1700,
        "Birthing Pool": 8000,
        "Washing Machine": 2200,
        "Dishwasher": 2200,
        "Laundry Trough": 1320,
        "Ablution Trough": 2200,
        "Beverage Bay": 3500,
        "Hose Tap": 500,
        "Flushing Rim Sink": 3000,
        "Bedpan Sanitiser": 3000,
        "Drinking Fountain": 2200,
        "Urinal": 2000,
    },
    'Node': {
        "Dwelling Node - Hot": 20000,
        "Dwelling Node - Cold": 20000,
        "Dwelling Node - Other": 20000,
        "Load Node - Hot": 10000,
        "Load Node - Cold": 10000,
        "Load Node - Other": 10000,
        "Continuous Flow Node": 2500,
    }
};
