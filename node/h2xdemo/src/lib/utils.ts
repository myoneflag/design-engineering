/* tslint:disable:no-bitwise */

export const lighten = (col: string, percent: number, alpha: number = 1.0) => {

    const num = parseInt(col.substr(1), 16);

    let b = num & 0xFF;
    let g = (num >> 8) & 0xFF;
    let r = (num >> 16) & 0xFF;

    if (percent < 0) {
        // darken
        b *= (100 + percent) / 100;
        g *= (100 + percent) / 100;
        r *= (100 + percent) / 100;
    } else {
        // lighten
        b += (255 - b) * (percent / 100);
        g += (255 - g) * (percent / 100);
        r += (255 - r) * (percent / 100);
    }

    if (alpha === 1) {
        let str = ((r << 16) | (g << 8) | (b << 0)).toString(16);
        while (str.length < 6) {
            str = '0' + str;
        }
        return '#' + str;
    } else {
        return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
    }
};
