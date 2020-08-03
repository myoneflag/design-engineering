import string


def camelCase(name):
    res = ""
    last = 'z'
    for i in name.lower():
        if i in string.ascii_lowercase:
            if last in string.ascii_lowercase:
                res += i
            else:
                res += i.upper()
        elif i in string.digits:
            res += i
        last = i
    return res


def insert_field(obj, val, field, name):
    if field.count("\\") != name.count("\\"):
        raise SyntaxError("Fields and their alias don't match")

    if "\\" in field:
        sf = field.index("\\")
        sn = name.index("\\")
        if name[:sn] not in obj:
            obj[name[:sn]] = {}
        insert_field(obj[name[:sn]], val, field[sf+1:], name[sn+1:])
    else:
        obj[name] = value_or_null(val)


def value_or_null(value):
    if value in [None, "", "NA", "na", "N/A", "n/a", "?", " "]:
        return None
    else:
        return value
