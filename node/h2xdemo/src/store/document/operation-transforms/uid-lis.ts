
// Returns array of [value, isInLIS?] in original order.
export function longestIncreasingSubsequence(values: string[], order: string[]): Array<[string, boolean]> {
    const dp: Array<[number, number]> = []; // length, prevIndex
    let high: [number, number] = [-1, -1]; // length, index
    for (let i = 0; i < values.length; i++) {
        // Find longest prev less than this
        let thisBest: [number, number] = [0, -1];

        for (let j = 0; j < i; j++) {
            if (order.indexOf(values[j]) < order.indexOf(values[i])) {
                if (dp[j][0] > thisBest[0]) {
                    thisBest = [dp[j][0], j];
                }
            }
        }

        if (thisBest[0] > high[0]) {
            high = [thisBest[0], i];
        }
        thisBest[0] ++;
        dp.push(thisBest);
    }

    // Reconstruct the DP.
    const result: Array<[string, boolean]> = values.map((val) => [val, false]);
    let index = high[1];
    while (index !== -1) {
        result[index][1] = true;
        index = dp[index][1];
    }
    return result;
}

// This function assumes all elements are unique and bijective.
// The task is to rearrange the before to the after version in as few moves as possible.
// Strategy: Find the LIS, and push remaining items into its places.
// https://stackoverflow.com/questions/20392743/the-minimum-number-of-insertions-to-sort-an-array
//
// Returns an array of "remove-and-replace-in-index" operations, which, if done in order, will sort
// the array, and this list of operations is the minimal size.
export function findOptimalSwaps(before: string[], after: string[]): Array<[string, number]> {
    const progress = longestIncreasingSubsequence(before, after);
    const results: Array<[string, number]> = [];
    for (let i = 0; i < progress.length; i++) {
        if (!progress[i][1]) {
            // We need to reposition this guy
            const val = progress.splice(i, 1)[0][0];

            // Look for the first in-order that is greater than ours.
            for (let j = 0; j <= progress.length; j++) {
                if (j === progress.length || after.indexOf(progress[j][0]) > after.indexOf(val) && progress[j][1]) {
                    progress.splice(j, 0, [val, true]);
                    results.push([val, j]);
                    break;
                }
            }

            i--; // go back one in case we shifted the array backwards during the move.
        }
    }
    return results;
}
