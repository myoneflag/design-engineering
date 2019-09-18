import csv
import io
import json
import sys

from scripts.utils import camelCase, insert_field

field_mappings = {
    'Name': 'name',
    'Loading Units\\AS3500\\Cold': 'loadingUnits\\as3500\\cold',
    'Loading Units\\AS3500\\Hot': 'loadingUnits\\as3500\\hot',
    'Loading Units\\(Barrie\'s Book)\\Cold': 'loadingUnits\\barriesBook\\cold',
    'Loading Units\\(Barrie\'s Book)\\Hot': 'loadingUnits\\barriesBook\\hot',
    'Q (l/s)\\Cold': 'qLS\\cold',
    'Q (l/s)\\Hot': 'qLS\\hot',
    'Fixture Units': 'fixtureUnits',
    "Probability of Usage (%)": "probabilityOfUsagePCT",
    'Warm Temp. (degC)': 'warmTempC',
    'Outlet Above Floor (m)': 'outletAboveFloorM',
    'Min. Inlet Pressure (kPa)': 'minInletPressureKPA',
    'Max. Inlet Pressure (kPa)': 'maxInletPressureKPA',
}


def parse_fixtures(text):
    obj = {}
    reader = csv.DictReader(io.StringIO(text))
    for line in reader:
        line = dict(line)
        for i in line:
            line[i.strip()] = line[i]

        uid = camelCase(line["Name"])
        obj[uid] = {
            "name": line["Name"],
            "uid": uid,
        }

        fixture = obj[uid]
        for field in field_mappings:
            insert_field(fixture, line[field], field, field_mappings[field])

    return obj


if __name__ == "__main__":
    if len(sys.argv) > 2:
        print("usage:")
        print("%s [<Fixtures.csv>]" % (sys.argv[0],))
        exit(-1)
    elif len(sys.argv) == 2:
        filename = sys.argv[1]
        with open(filename) as f:
            text = f.read()
    else:
        text = sys.stdin.read()

    print(parse_fixtures(text))
