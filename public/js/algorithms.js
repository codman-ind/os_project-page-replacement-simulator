/**
 * Core Logic for Page Replacement Algorithms
 * Returns an array of step objects with detailed 'reason' and 'metadata' for UI.
 */

function simulateFIFO(refString, numFrames) {
    const frames = new Array(numFrames).fill(null);
    const trace = [];
    let faults = 0;
    let hits = 0;
    let pointer = 0;

    for (let i = 0; i < refString.length; i++) {
        const page = refString[i];
        let isHit = false;
        let reason = "";

        if (frames.includes(page)) {
            isHit = true;
            hits++;
            reason = `Page ${page} found in memory. No replacement needed.`;
        } else {
            faults++;
            const oldPage = frames[pointer];
            if (oldPage === null) {
                reason = `Frame ${pointer + 1} is empty. Loading page ${page}.`;
            } else {
                reason = `Page ${page} is not in memory. Replacing oldest page ${oldPage} at Frame ${pointer + 1}.`;
            }
            frames[pointer] = page;
            pointer = (pointer + 1) % numFrames;
        }

        trace.push({
            page: page,
            frames: [...frames],
            isHit: isHit,
            faultsCount: faults,
            hitsCount: hits,
            reason: reason,
            metadata: { pointer: pointer === 0 ? numFrames - 1 : pointer - 1, nextPointer: pointer }
        });
    }
    return trace;
}

function simulateLRU(refString, numFrames) {
    const frames = new Array(numFrames).fill(null);
    const trace = [];
    let faults = 0;
    let hits = 0;
    const lastUsed = new Map();

    for (let i = 0; i < refString.length; i++) {
        const page = refString[i];
        let isHit = false;
        let reason = "";

        if (frames.includes(page)) {
            isHit = true;
            hits++;
            lastUsed.set(page, i);
            reason = `Page ${page} recently accessed. Updated its recency status.`;
        } else {
            faults++;
            const emptyIndex = frames.indexOf(null);
            if (emptyIndex !== -1) {
                frames[emptyIndex] = page;
                reason = `Empty slot found at Frame ${emptyIndex + 1}. Loading page ${page}.`;
            } else {
                let lruPage = frames[0];
                let minIndex = lastUsed.get(lruPage);
                
                for (let j = 1; j < frames.length; j++) {
                    const p = frames[j];
                    if (lastUsed.get(p) < minIndex) {
                        minIndex = lastUsed.get(p);
                        lruPage = p;
                    }
                }
                const replaceIndex = frames.indexOf(lruPage);
                reason = `Memory full. Replacing Least Recently Used page ${lruPage} with ${page}.`;
                frames[replaceIndex] = page;
            }
            lastUsed.set(page, i);
        }

        // Calculate 'ages' for visualization (lower index = older)
        const frameAges = frames.map(p => {
            if (p === null) return null;
            return lastUsed.get(p);
        });

        trace.push({
            page: page,
            frames: [...frames],
            isHit: isHit,
            faultsCount: faults,
            hitsCount: hits,
            reason: reason,
            metadata: { ages: frameAges, currentTime: i }
        });
    }
    return trace;
}

function simulateOptimal(refString, numFrames) {
    const frames = new Array(numFrames).fill(null);
    const trace = [];
    let faults = 0;
    let hits = 0;

    for (let i = 0; i < refString.length; i++) {
        const page = refString[i];
        let isHit = false;
        let reason = "";

        if (frames.includes(page)) {
            isHit = true;
            hits++;
            reason = `Page ${page} is already in memory. Total optimization maintained.`;
        } else {
            faults++;
            const emptyIndex = frames.indexOf(null);
            if (emptyIndex !== -1) {
                frames[emptyIndex] = page;
                reason = `Loading page ${page} into available Frame ${emptyIndex + 1}.`;
            } else {
                let farthest = -1;
                let replaceIndex = -1;
                let replacePage = -1;

                for (let j = 0; j < frames.length; j++) {
                    const currentFramePage = frames[j];
                    let nextUse = -1;

                    for (let k = i + 1; k < refString.length; k++) {
                        if (refString[k] === currentFramePage) {
                            nextUse = k;
                            break;
                        }
                    }

                    if (nextUse === -1) {
                        replaceIndex = j;
                        replacePage = currentFramePage;
                        reason = `Optimal: Page ${currentFramePage} is never used again. Replacing with ${page}.`;
                        break;
                    }

                    if (nextUse > farthest) {
                        farthest = nextUse;
                        replaceIndex = j;
                        replacePage = currentFramePage;
                    }
                }

                if (!reason) {
                    reason = `Optimal: Page ${replacePage} will be used farthest in the future (step ${farthest + 1}). Replacing with ${page}.`;
                }
                frames[replaceIndex] = page;
            }
        }

        trace.push({
            page: page,
            frames: [...frames],
            isHit: isHit,
            faultsCount: faults,
            hitsCount: hits,
            reason: reason
        });
    }
    return trace;
}

window.algorithms = {
    FIFO: simulateFIFO,
    LRU: simulateLRU,
    OPTIMAL: simulateOptimal
};
