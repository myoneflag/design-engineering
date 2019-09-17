import csv
import io
import json
import sys

from scripts.utils import camelCase, value_or_null

field_mappings = {
    "Size (DN)": "diameterNominalMM",
    "Internal Diameter (mm)": "diameterInternalMM",
    "Colebrook White Coefficient": "colebrookWhiteCoefficient",
    "Safe Working Pressure (kPa)": "safeWorkingPressureKPA",
}


def parse_pipe_materials(text):
    obj = {}
    current_pipe = ""
    reader = csv.DictReader(io.StringIO(text))
    for line in reader:
        if line["Name"]:
            current_pipe = line["Name"]
            current_pipe_uid = camelCase(line["Name"])
            obj[current_pipe_uid] = {
                "name": line["Name"],
                "uid": current_pipe_uid,
                "pipesBySize": {},
            }

        material = obj[current_pipe_uid]
        dn = line["Size (DN)"]
        lineval = dict(line)
        for i in line:
            lineval[i.strip()] = line[i]
        material["pipesBySize"][dn] = dict(map(lambda a: (field_mappings[a], value_or_null(lineval[a])), field_mappings))
        material["pipesBySize"][dn]["pipeUid"] =  current_pipe_uid

    return obj


if __name__ == "__main__":
    if len(sys.argv) > 2:
        print ("usage:")
        print ("%s [<pipe_materials.csv>]" % (sys.argv[0],))
        exit(-1)
    elif len(sys.argv) == 2:
        filename = sys.argv[1]
        with open(filename) as f:
            text = f.read()
    else:
        text = sys.stdin.read()

    print(parse_pipe_materials(text))
