const express = require('express');
const router = express.Router();
const { simulateFIFO, simulateLRU, simulateOptimal } = require('../utils/algorithms');
const workloadGenerator = require('../utils/workloadGenerator');

router.get('/', (req, res) => {
    // Parameters
    const numFrames = parseInt(req.query.frames, 10) || 4;
    const numRuns = parseInt(req.query.runs, 10) || 5;
    const seqLength = parseInt(req.query.length, 10) || 50;
    
    // Page Domain (0-9)
    const pageDomain = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    // Define workloads to test
    const workloads = [
        { id: 'locality', name: 'High Locality', generator: workloadGenerator.generateHighLocality },
        { id: 'random', name: 'Random (Low Locality)', generator: workloadGenerator.generateRandom },
        { id: 'sequential', name: 'Sequential Access', generator: workloadGenerator.generateSequential },
        { id: 'mixed', name: 'Mixed Pattern', generator: workloadGenerator.generateMixed }
    ];

    const results = {};

    workloads.forEach(wl => {
        let totalFIFO = 0; let hitsFIFO = 0;
        let totalLRU = 0; let hitsLRU = 0;
        let totalOPT = 0; let hitsOPT = 0;

        for (let i = 0; i < numRuns; i++) {
            const traceInput = wl.generator(seqLength, pageDomain);
            
            const traceFIFO = simulateFIFO(traceInput, numFrames);
            const traceLRU = simulateLRU(traceInput, numFrames);
            const traceOPT = simulateOptimal(traceInput, numFrames);

            totalFIFO += traceFIFO[traceFIFO.length - 1].faultsCount;
            hitsFIFO += traceFIFO[traceFIFO.length - 1].hitsCount;

            totalLRU += traceLRU[traceLRU.length - 1].faultsCount;
            hitsLRU += traceLRU[traceLRU.length - 1].hitsCount;

            totalOPT += traceOPT[traceOPT.length - 1].faultsCount;
            hitsOPT += traceOPT[traceOPT.length - 1].hitsCount;
        }

        // Averages
        const avgFaultsFIFO = totalFIFO / numRuns;
        const avgFaultsLRU = totalLRU / numRuns;
        const avgFaultsOPT = totalOPT / numRuns;

        // Hit Ratios
        const totalReferences = numRuns * seqLength;
        const ratioFIFO = (hitsFIFO / totalReferences * 100).toFixed(1);
        const ratioLRU = (hitsLRU / totalReferences * 100).toFixed(1);
        const ratioOPT = (hitsOPT / totalReferences * 100).toFixed(1);

        // Find Best (Lowest Faults)
        const minFaults = Math.min(avgFaultsFIFO, avgFaultsLRU, avgFaultsOPT);
        let bestAlgo = 'Optimal'; // optimal is usually best, but let's calculate programmatically
        if (minFaults === avgFaultsFIFO && minFaults === avgFaultsLRU) bestAlgo = 'Tie (FIFO/LRU/OPT)';
        else if (minFaults === avgFaultsFIFO) bestAlgo = 'FIFO';
        else if (minFaults === avgFaultsLRU) bestAlgo = 'LRU';

        results[wl.id] = {
            name: wl.name,
            fifo: { faults: avgFaultsFIFO.toFixed(1), ratio: ratioFIFO },
            lru: { faults: avgFaultsLRU.toFixed(1), ratio: ratioLRU },
            opt: { faults: avgFaultsOPT.toFixed(1), ratio: ratioOPT },
            bestAlgo,
            minFaults
        };
    });

    res.render('stressTest', {
        title: 'Workload Stress Test | OS Simulator',
        activePage: 'stresstest',
        inputs: { frames: numFrames, runs: numRuns, length: seqLength },
        results
    });
});

module.exports = router;
