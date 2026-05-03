/**
 * Core Logic for Page Replacement Algorithms (Backend version)
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
            reason = `Page ${page} found in memory.`;
        } else {
            faults++;
            reason = `Replacing page at Frame ${pointer + 1} with ${page}.`;
            frames[pointer] = page;
            pointer = (pointer + 1) % numFrames;
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
            reason = `Page ${page} accessed (LRU update).`;
        } else {
            faults++;
            const emptyIndex = frames.indexOf(null);
            if (emptyIndex !== -1) {
                frames[emptyIndex] = page;
                reason = `Loading ${page} into Frame ${emptyIndex + 1}.`;
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
                reason = `Replacing Least Recently Used page ${lruPage} with ${page}.`;
                frames[replaceIndex] = page;
            }
            lastUsed.set(page, i);
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
            reason = `Page ${page} in memory.`;
        } else {
            faults++;
            const emptyIndex = frames.indexOf(null);
            if (emptyIndex !== -1) {
                frames[emptyIndex] = page;
                reason = `Loading ${page} into Frame ${emptyIndex + 1}.`;
            } else {
                let farthest = -1;
                let replaceIndex = -1;

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
                        break;
                    }

                    if (nextUse > farthest) {
                        farthest = nextUse;
                        replaceIndex = j;
                    }
                }
                reason = `Replacing page used farthest in future with ${page}.`;
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

module.exports = {
    simulateFIFO,
    simulateLRU,
    simulateOptimal
};
