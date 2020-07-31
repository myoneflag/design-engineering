#!/usr/bin/python3
import sys
import json
import re

# Use this script to convert a JSON documentState to a typescript literal.

regexes = [
    ('\n( *?[\])}])', ',\n\\1'),
    ('"(.*?)":',        '\\1:'),
    ('type: "(.*?)_OPERATION"',  'type: OPERATION_NAMES.\\1_OPERATION'),
    ('type: "(BACKGROUND_IMAGE|FLOW_SOURCE|FLOW_RETURN|PIPE|TMV|SYSTEM_NODE|FIXTURE|RESULTS_MESSAGE|DIRECTED_VALVE)"', 'type: EntityType.\\1'),
    ('type: "VALVE"',   'type: EntityType.FITTING'),
    ('psdMethod: "(.*?)"', 'psdMethod: SupportedPsdStandards.\\1'),
    ('type: "(CHECK_VALVE|ISOLATION_VALVE|PRESSURE_RELIEF_VALVE|RPZD|WATER_METER|STRAINER)"', 'type: ValveType.\\1'),
]

if __name__=="__main__":
    string = sys.stdin.read()
    parsed = json.loads(string)
    pretty = json.dumps(parsed, indent=4, sort_keys=True)

    for pat, rep in regexes:
        pretty = re.sub(pat, rep, pretty)

    print (pretty)

