/**
 * Generates reference strings simulating different workload patterns.
 */

// Helper to get a random integer between min and max (inclusive)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * High Locality: 80% of references come from a small "hot" subset (20% of domain).
 */
function generateHighLocality(length, pageDomain) {
    const subsetSize = Math.max(1, Math.floor(pageDomain.length * 0.2));
    const hotSubset = pageDomain.slice(0, subsetSize);
    const trace = [];

    for (let i = 0; i < length; i++) {
        if (Math.random() < 0.8) {
            trace.push(hotSubset[getRandomInt(0, hotSubset.length - 1)]);
        } else {
            trace.push(pageDomain[getRandomInt(0, pageDomain.length - 1)]);
        }
    }
    return trace;
}

/**
 * Random (Low Locality): Uniform random selection.
 */
function generateRandom(length, pageDomain) {
    const trace = [];
    for (let i = 0; i < length; i++) {
        trace.push(pageDomain[getRandomInt(0, pageDomain.length - 1)]);
    }
    return trace;
}

/**
 * Sequential: Loops through a sequence of pages.
 */
function generateSequential(length, pageDomain, loopSize = 5) {
    const trace = [];
    const sequence = pageDomain.slice(0, Math.min(loopSize, pageDomain.length));
    
    for (let i = 0; i < length; i++) {
        trace.push(sequence[i % sequence.length]);
    }
    return trace;
}

/**
 * Mixed: Appends chunks of different patterns.
 */
function generateMixed(length, pageDomain) {
    const trace = [];
    const chunk1 = Math.floor(length / 3);
    const chunk2 = Math.floor(length / 3);
    const chunk3 = length - chunk1 - chunk2;

    trace.push(...generateSequential(chunk1, pageDomain, 4));
    trace.push(...generateHighLocality(chunk2, pageDomain));
    trace.push(...generateRandom(chunk3, pageDomain));

    return trace;
}

module.exports = {
    generateHighLocality,
    generateRandom,
    generateSequential,
    generateMixed
};
