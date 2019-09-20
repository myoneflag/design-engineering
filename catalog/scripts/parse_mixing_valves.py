import csv
import io
import sys

from scripts.utils import camelCase, value_or_null, insert_field

field_mappings = {
    "Min. Inlet Pressure (kPa)": "minInletPressureKPA",
    "Max. Inlet Pressure (kPa)": "maxInletPressureKPA",
    "Max. Hot and Cold Pressure Differential": "maxHotColdPressureDifferentialPCT",
    "Minimum Flow Rate (L/s)": "minFlowRateLS",
    "Maximum Flow Rate (L/s)": "maxFlowRateLS",
}


def parse_mixing_valves(text):
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
        print("%s [<MixingValves.csv>]" % (sys.argv[0],))
        exit(-1)
    elif len(sys.argv) == 2:
        filename = sys.argv[1]
        with open(filename) as f:
            text = f.read()
    else:
        text = sys.stdin.read()

    print(parse_mixing_valves(text))
