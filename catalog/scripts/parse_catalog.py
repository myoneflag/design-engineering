import json
import sys

from scripts.parse_fixtures import parse_fixtures
from scripts.parse_pipe_materials import parse_pipe_materials
from scripts.parse_valves import parse_valves

if __name__=="__main__":
    if len(sys.argv) != 4:
        print("usage:")
        print("%s PipeMaterials.csv Valves.csv Fixtures.csv" % (sys.argv[0], ))
    else:
        with open(sys.argv[1]) as f:
            pipe_materials_text = f.read()
        with open(sys.argv[2]) as f:
            valves_text = f.read()
        with open(sys.argv[3]) as f:
            fixtures_text = f.read()

        obj = {
            "pipes": parse_pipe_materials(pipe_materials_text),
            "valves": parse_valves(valves_text),
            "fixtures": parse_fixtures(fixtures_text),
        }

        print(json.dumps(obj, indent=4, sort_keys=True))

