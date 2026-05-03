/**
 * Core Logic for Page Replacement Algorithms
 * Each function takes a reference string (array of numbers) and number of frames.
 * Returns an array of step objects:
 * {
 *   page: Number (current page referenced),
 *   frames: Array (state of memory frames at this step, null if empty),
 *   isHit: Boolean,
 *   faultsCount: Number,
 *   hitsCount: Number
 * }
 */

function simulateFIFO(refString, numFrames) {
    const frames = new Array(numFrames).fill(null);
    const trace = [];
    let faults = 0;
    let hits = 0;
    let pointer = 0; // points to the oldest page

    for (let i = 0; i < refString.length; i++) {
        const page = refString[i];
        let isHit = false;

        if (frames.includes(page)) {
            isHit = true;
            hits++;
        } else {
            faults++;
            frames[pointer] = page;
            pointer = (pointer + 1) % numFrames;
        }

        trace.push({
            page: page,
            frames: [...frames],
            isHit: isHit,
            faultsCount: faults,
            hitsCount: hits
        });
    }

    return trace;
}

function simulateLRU(refString, numFrames) {
    const frames = new Array(numFrames).fill(null);
    const trace = [];
    let faults = 0;
    let hits = 0;
    // Keep track of the last used index for each page in memory
    const lastUsed = new Map(); 

    for (let i = 0; i < refString.length; i++) {
        const page = refString[i];
        let isHit = false;

        if (frames.includes(page)) {
            isHit = true;
            hits++;
            lastUsed.set(page, i);
        } else {
            faults++;
            // Find empty frame or replace least recently used
            const emptyIndex = frames.indexOf(null);
            if (emptyIndex !== -1) {
                frames[emptyIndex] = page;
            } else {
                // Find LRU page
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
                frames[replaceIndex] = page;
            }
            lastUsed.set(page, i);
        }

        trace.push({
            page: page,
            frames: [...frames],
            isHit: isHit,
            faultsCount: faults,
            hitsCount: hits
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

        if (frames.includes(page)) {
            isHit = true;
            hits++;
        } else {
            faults++;
            const emptyIndex = frames.indexOf(null);
            if (emptyIndex !== -1) {
                frames[emptyIndex] = page;
            } else {
                // Optimal logic: find the page that will not be used for the longest time
                let farthest = -1;
                let replaceIndex = -1;

                for (let j = 0; j < frames.length; j++) {
                    const currentFramePage = frames[j];
                    let nextUse = -1;

                    // Look ahead in the reference string
                    for (let k = i + 1; k < refString.length; k++) {
                        if (refString[k] === currentFramePage) {
                            nextUse = k;
                            break;
                        }
                    }

                    // If a page is never used again, replace it immediately
                    if (nextUse === -1) {
                        replaceIndex = j;
                        break;
                    }

                    // Otherwise, find the one used farthest in the future
                    if (nextUse > farthest) {
                        farthest = nextUse;
                        replaceIndex = j;
                    }
                }

                frames[replaceIndex] = page;
            }
        }

        trace.push({
            page: page,
            frames: [...frames],
            isHit: isHit,
            faultsCount: faults,
            hitsCount: hits
        });
    }

    return trace;
}

// Export for use in app.js
window.algorithms = {
    FIFO: simulateFIFO,
    LRU: simulateLRU,
    OPTIMAL: simulateOptimal
};
