import json
import sys
from os import path
import datetime

from scripts.parse_fixtures import parse_fixtures
from scripts.parse_mixing_valves import parse_mixing_valves
from scripts.parse_pipe_materials import parse_pipe_materials
from scripts.parse_valves import parse_valves

if __name__=="__main__":
    if len(sys.argv) != 2:
        print("usage:")
        print("%s dir/" % (sys.argv[0], ))
        print("dir/ must contain PipeMaterials.csv Valves.csv Fixtures.csv MixingValves.csv" )
    else:
        with open(path.join(sys.argv[1], "PipeMaterials.csv")) as f:
            pipe_materials_text = f.read()
        with open(path.join(sys.argv[1], "Valves.csv")) as f:
            valves_text = f.read()
        with open(path.join(sys.argv[1], "Fixtures.csv")) as f:
            fixtures_text = f.read()
        with open(path.join(sys.argv[1], "MixingValves.csv")) as f:
            mixing_valves_text = f.read()

        obj = {
            "lastModified": datetime.datetime.now().isoformat(),
            "pipes": parse_pipe_materials(pipe_materials_text),
            "valves": parse_valves(valves_text),
            "fixtures": parse_fixtures(fixtures_text),
            "mixingValves": parse_mixing_valves(mixing_valves_text),
        }

        print(json.dumps(obj, indent=4, sort_keys=True))

