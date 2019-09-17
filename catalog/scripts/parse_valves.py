import csv
import io
import json
import sys

from scripts.utils import camelCase, value_or_null

field_mappings = {
    "Symbol": "symbol",
    "Size (DN)": "diameterNominalMM",
    "K Value": "kValue",
}


def parse_valves(text):
    obj = {}
    current_valve = ""
    reader = csv.DictReader(io.StringIO(text))
    for line in reader:
        line = dict(line)
        for i in line:
            line[i.strip()] = line[i]
        if line["Name"]:
            current_valve = line["Name"]
            uid = camelCase(current_valve);
            obj[uid] = {
                "name": line["Name"],
                "uid": uid,
                "abbreviation": line["Abbreviation"],
                "valvesBySize": {},
            }

        valve = obj[uid]
        dn = line["Size (DN)"]
        valve["valvesBySize"][dn] = dict(map(lambda a: (field_mappings[a], value_or_null(line[a])), field_mappings))
        valve["valvesBySize"][dn]["valveUid"] = uid

    return obj


if __name__ == "__main__":
    if len(sys.argv) > 2:
        print ("usage:")
        print ("%s [<Valves.csv>]" % (sys.argv[0],))
        exit(-1)
    elif len(sys.argv) == 2:
        filename = sys.argv[1]
        with open(filename) as f:
            text = f.read()
    else:
        text = sys.stdin.read()

    print(parse_valves(text))
