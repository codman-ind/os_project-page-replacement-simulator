const express = require('express');
const router = express.Router();
const { simulateFIFO, simulateLRU, simulateOptimal } = require('../utils/algorithms');
const { analyzePattern, recommendAlgorithm, detectBeladysAnomaly } = require('../utils/analyzer');

router.get('/', (req, res) => {
    let refString = [];
    let numFrames = 3;

    if (req.query.ref) {
        refString = req.query.ref.split(',').map(s => s.trim()).filter(s => s !== '').map(Number);
    }
    if (req.query.frames) {
        numFrames = parseInt(req.query.frames, 10) || 3;
    }

    if (refString.length === 0) {
        // Default values if no query params
        refString = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2];
    }

    // 1. Analyze Pattern & Recommend
    const patternAnalysis = analyzePattern(refString);
    const recommendation = recommendAlgorithm(patternAnalysis, numFrames);

    // 2. Detect Belady's Anomaly
    const anomalyData = detectBeladysAnomaly(refString, 10);

    // 3. Comparison Timeline Data
    const fifoTrace = simulateFIFO(refString, numFrames);
    const lruTrace = simulateLRU(refString, numFrames);
    const optTrace = simulateOptimal(refString, numFrames);

    const timelineLabels = refString.map((_, i) => `Step ${i + 1}`);
    const fifoFaults = fifoTrace.map(t => t.faultsCount);
    const lruFaults = lruTrace.map(t => t.faultsCount);
    const optFaults = optTrace.map(t => t.faultsCount);

    // Summary Totals
    const totalFIFO = fifoFaults[fifoFaults.length - 1] || 0;
    const totalLRU = lruFaults[lruFaults.length - 1] || 0;
    const totalOPT = optFaults[optFaults.length - 1] || 0;

    let improvement = 0;
    if (totalFIFO > 0) {
        improvement = (((totalFIFO - totalLRU) / totalFIFO) * 100).toFixed(1);
    }

    res.render('insights', {
        title: 'Insights & Analysis | OS Simulator',
        activePage: 'insights',
        inputs: {
            refString: refString.join(', '),
            frames: numFrames
        },
        patternAnalysis,
        recommendation,
        anomalyData,
        charts: {
            labels: JSON.stringify(timelineLabels),
            fifo: JSON.stringify(fifoFaults),
            lru: JSON.stringify(lruFaults),
            opt: JSON.stringify(optFaults),
            anomalyLabels: JSON.stringify(anomalyData.data.map(d => d.frames)),
            anomalyFaults: JSON.stringify(anomalyData.data.map(d => d.faults))
        },
        summary: {
            fifo: totalFIFO,
            lru: totalLRU,
            opt: totalOPT,
            improvement
        }
    });
});

module.exports = router;
