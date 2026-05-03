const { simulateFIFO } = require('./algorithms');

function analyzePattern(refString) {
    if (!refString || refString.length === 0) return { type: 'Unknown', description: 'No data to analyze.' };

    let sequentialCount = 0;
    let localityScore = 0;

    for (let i = 1; i < refString.length; i++) {
        // Sequential check (e.g. 1, 2, 3)
        if (refString[i] === refString[i - 1] + 1 || refString[i] === refString[i - 1] - 1) {
            sequentialCount++;
        }
        
        // Locality check (repeated pages within short window)
        const windowSize = 4;
        const start = Math.max(0, i - windowSize);
        const window = refString.slice(start, i);
        if (window.includes(refString[i])) {
            localityScore++;
        }
    }

    const seqRatio = sequentialCount / refString.length;
    const locRatio = localityScore / refString.length;

    if (seqRatio > 0.4) {
        return { type: 'Sequential', description: 'Strong sequential pattern detected. Pages are often accessed in order.' };
    } else if (locRatio > 0.4) {
        return { type: 'High Locality', description: 'High spatial/temporal locality detected. Pages are frequently re-accessed within short intervals.' };
    } else {
        return { type: 'Random', description: 'Low repetition or sequential access. Pattern appears mostly random.' };
    }
}

function recommendAlgorithm(analysis, numFrames) {
    if (analysis.type === 'High Locality') {
        return {
            algo: 'LRU (Least Recently Used)',
            reason: 'Since pages are frequently re-accessed, keeping the most recently used pages in memory will minimize faults.'
        };
    } else if (analysis.type === 'Sequential') {
        return {
            algo: 'FIFO (First-In, First-Out)',
            reason: 'For sequential reads without much reuse, older pages can be safely discarded via FIFO.'
        };
    } else {
        return {
            algo: 'LRU or Optimal',
            reason: 'Random access patterns are difficult to optimize. LRU is generally the best practical choice.'
        };
    }
}

function detectBeladysAnomaly(refString, maxFrames = 7) {
    const results = [];
    let anomalyDetected = false;
    let anomalyDetails = null;

    let prevFaults = null;

    for (let frames = 1; frames <= maxFrames; frames++) {
        const trace = simulateFIFO(refString, frames);
        const faults = trace.length > 0 ? trace[trace.length - 1].faultsCount : 0;
        
        results.push({ frames, faults });

        if (prevFaults !== null && faults > prevFaults && !anomalyDetected) {
            anomalyDetected = true;
            anomalyDetails = `Detected when increasing from ${frames - 1} frames (${prevFaults} faults) to ${frames} frames (${faults} faults).`;
        }
        prevFaults = faults;
    }

    return {
        detected: anomalyDetected,
        details: anomalyDetails || 'No anomaly detected within tested frame sizes.',
        data: results
    };
}

module.exports = {
    analyzePattern,
    recommendAlgorithm,
    detectBeladysAnomaly
};
