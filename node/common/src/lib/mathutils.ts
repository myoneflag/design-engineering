export function roundNumber(value: number, decimalPlaces: number) {
    const factor = Math.pow(10, decimalPlaces)
    return Math.round((value + Number.EPSILON) * factor) / factor
}
