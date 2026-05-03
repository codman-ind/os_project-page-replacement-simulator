document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const refStringInput = document.getElementById('refStringInput');
    const framesInput = document.getElementById('framesInput');
    const randomBtn = document.getElementById('randomBtn');
    const algoSelect = document.getElementById('algoSelect');
    const speedSlider = document.getElementById('speedSlider');
    const speedValue = document.getElementById('speedValue');
    
    const runBtn = document.getElementById('runBtn');
    const runText = document.getElementById('runText');
    const runIcon = document.getElementById('runIcon');
    const stepBtn = document.getElementById('stepBtn');
    const resetBtn = document.getElementById('resetBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const analyzeInsightsBtn = document.getElementById('analyzeInsightsBtn');
    
    const simulationsContainer = document.getElementById('simulationsContainer');
    const chartSection = document.getElementById('chartSection');
    const simulationTemplate = document.getElementById('simulationTemplate');

    // --- State ---
    let isPlaying = false;
    let currentStep = 0;
    let maxSteps = 0;
    let intervalId = null;
    let activeSimulations = [];
    let chartInstance = null;

    // --- Speed Handling ---
    function updateSpeedLabel(val) {
        if (val < 500) return 'Ultra';
        if (val < 1000) return 'Fast';
        if (val < 1500) return 'Normal';
        return 'Slow';
    }

    speedSlider.addEventListener('input', (e) => {
        speedValue.textContent = updateSpeedLabel(e.target.value);
        if (isPlaying) {
            pauseSimulation();
            playSimulation();
        }
    });

    // --- Inputs ---
    randomBtn.addEventListener('click', () => {
        const length = Math.floor(Math.random() * 10) + 12;
        const str = Array.from({length}, () => Math.floor(Math.random() * 10)).join(',');
        refStringInput.value = str;
        resetSimulation();
    });

    refStringInput.addEventListener('input', resetSimulation);
    framesInput.addEventListener('input', resetSimulation);
    algoSelect.addEventListener('change', resetSimulation);

    // --- Control Handlers ---
    runBtn.addEventListener('click', () => {
        if (activeSimulations.length === 0) setupSimulations();
        if (isPlaying) {
            pauseSimulation();
        } else {
            if (currentStep >= maxSteps) resetSimulation() || setupSimulations();
            playSimulation();
        }
    });

    stepBtn.addEventListener('click', () => {
        if (activeSimulations.length === 0) setupSimulations();
        if (isPlaying) pauseSimulation();
        if (currentStep < maxSteps) {
            currentStep++;
            renderStep();
        }
    });

    resetBtn.addEventListener('click', resetSimulation);

    // --- Simulation Engine ---
    function getInputs() {
        const refString = refStringInput.value.split(',').map(s => s.trim()).filter(s => s !== '').map(Number);
        const numFrames = parseInt(framesInput.value, 10);
        return { refString, numFrames };
    }

    function resetSimulation() {
        pauseSimulation();
        currentStep = 0;
        maxSteps = 0;
        activeSimulations = [];
        simulationsContainer.innerHTML = '';
        chartSection.classList.add('hidden');
        updateRunButtonState(false);
    }

    function setupSimulations() {
        const { refString, numFrames } = getInputs();
        if (refString.length === 0 || isNaN(numFrames) || numFrames < 1) return alert('Enter valid inputs.');

        const selectedAlgo = algoSelect.value;
        const algosToRun = selectedAlgo === 'ALL' ? ['FIFO', 'LRU', 'OPTIMAL'] : [selectedAlgo];

        simulationsContainer.innerHTML = '';
        activeSimulations = algosToRun.map(algoName => {
            const trace = window.algorithms[algoName](refString, numFrames);
            const domRefs = createSimulationUI(algoName, numFrames, refString);
            return { id: algoName, name: algoName, trace, domRefs };
        });

        maxSteps = refString.length;
        currentStep = 0;
        if (selectedAlgo === 'ALL') {
            chartSection.classList.remove('hidden');
            updateChart();
        }
    }

    function createSimulationUI(algoName, numFrames, refString) {
        const clone = simulationTemplate.content.cloneNode(true);
        const wrapper = clone.querySelector('.simulation-card');
        
        wrapper.querySelector('.algo-title-badge').textContent = algoName;
        const titles = { 'FIFO': 'First-In, First-Out', 'LRU': 'Least Recently Used', 'OPTIMAL': 'Optimal Strategy' };
        wrapper.querySelector('.algo-name').textContent = titles[algoName] || algoName;

        const refCellsContainer = wrapper.querySelector('.ref-cells');
        const statusCellsContainer = wrapper.querySelector('.status-cells');
        const framesContainer = wrapper.querySelector('.frames-container');
        const logContainer = wrapper.querySelector('.decision-log');

        const frameRows = [];
        for (let i = 0; i < numFrames; i++) {
            const row = document.createElement('div');
            row.className = 'flex border-b border-dark-border/20 relative group';
            
            const label = document.createElement('div');
            label.className = 'w-24 shrink-0 border-r border-dark-border/30 p-3 flex items-center justify-center font-bold text-slate-500 text-[9px] uppercase tracking-tighter';
            label.textContent = `Frame ${i + 1}`;
            row.appendChild(label);

            const cellsContainer = document.createElement('div');
            cellsContainer.className = 'flex-1 flex relative';
            row.appendChild(cellsContainer);
            framesContainer.appendChild(row);
            frameRows.push(cellsContainer);
        }

        const cols = [];
        for (let i = 0; i < refString.length; i++) {
            const refCell = document.createElement('div');
            refCell.className = 'grid-cell text-brand-400 opacity-0';
            refCell.textContent = refString[i];
            refCellsContainer.appendChild(refCell);

            const statusCell = document.createElement('div');
            statusCell.className = 'grid-cell text-[10px] font-bold opacity-0';
            statusCellsContainer.appendChild(statusCell);

            const frameColCells = [];
            for (let j = 0; j < numFrames; j++) {
                const fCell = document.createElement('div');
                fCell.className = 'grid-cell opacity-0';
                frameRows[j].appendChild(fCell);
                frameColCells.push(fCell);
            }
            cols.push({ refCell, statusCell, frameCells: frameColCells });
        }

        simulationsContainer.appendChild(wrapper);
        setTimeout(() => wrapper.classList.replace('opacity-0', 'opacity-100'), 50);

        return {
            wrapper, cols, logContainer,
            statFaults: wrapper.querySelector('.stat-faults'),
            statHits: wrapper.querySelector('.stat-hits'),
            statHitRatio: wrapper.querySelector('.stat-hit-ratio'),
            statusText: wrapper.querySelector('.status-text')
        };
    }

    function playSimulation() {
        isPlaying = true;
        updateRunButtonState(true);
        if (currentStep < maxSteps) { currentStep++; renderStep(); }
        intervalId = setInterval(() => {
            if (currentStep < maxSteps) { currentStep++; renderStep(); }
            else {
                pauseSimulation();
                activeSimulations.forEach(sim => {
                    sim.domRefs.statusText.textContent = "PROCESS COMPLETE";
                    sim.domRefs.statusText.classList.replace('text-slate-400', 'text-emerald-400');
                });
                if (algoSelect.value !== 'ALL') { chartSection.classList.remove('hidden'); updateChart(); }
            }
        }, parseInt(speedSlider.value, 10));
    }

    function pauseSimulation() {
        isPlaying = false;
        updateRunButtonState(false);
        if (intervalId) { clearInterval(intervalId); intervalId = null; }
    }

    function updateRunButtonState(playing) {
        if (playing) {
            runText.textContent = 'PAUSE EXECUTION';
            runIcon.innerHTML = `<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />`;
            runBtn.classList.replace('bg-brand-600', 'bg-amber-600');
        } else {
            runText.textContent = currentStep >= maxSteps && maxSteps > 0 ? 'RESTART CORE' : 'EXECUTE SYSTEM';
            runIcon.innerHTML = currentStep >= maxSteps && maxSteps > 0 
                ? `<path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />`
                : `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />`;
            runBtn.classList.replace('bg-amber-600', 'bg-brand-600');
        }
    }

    function renderStep() {
        const stepIndex = currentStep - 1;
        activeSimulations.forEach(sim => {
            const stepData = sim.trace[stepIndex];
            const colRefs = sim.domRefs.cols[stepIndex];

            sim.domRefs.statusText.textContent = `Processing Step ${currentStep}/${maxSteps}`;
            colRefs.refCell.classList.replace('opacity-0', 'animate-pop-in');
            colRefs.refCell.classList.add('cell-active');

            // Log entry
            const logEntry = document.createElement('div');
            logEntry.className = `p-3 rounded-xl log-entry ${stepData.isHit ? 'log-entry-hit' : 'log-entry-fault'} animate-slide-up`;
            logEntry.innerHTML = `<span class="font-bold mr-2">Step ${currentStep}:</span> ${stepData.reason}`;
            sim.domRefs.logContainer.prepend(logEntry);

            // Pointer & Aging logic
            for (let i = 0; i < stepData.frames.length; i++) {
                const val = stepData.frames[i];
                const fCell = colRefs.frameCells[i];
                fCell.textContent = val !== null ? val : '-';
                fCell.className = 'grid-cell animate-pop-in cell-active';

                // Heat map for LRU
                if (sim.id === 'LRU' && stepData.metadata && stepData.metadata.ages) {
                    const age = stepData.metadata.ages[i];
                    if (age !== null) {
                        const diff = stepData.metadata.currentTime - age;
                        if (diff === 0) fCell.classList.add('age-new');
                        else if (diff < 4) fCell.classList.add('age-mid');
                        else fCell.classList.add('age-old');
                    }
                }

                // Pointer for FIFO
                if (sim.id === 'FIFO' && stepData.metadata && stepData.metadata.nextPointer === i) {
                    const pointer = document.createElement('div');
                    pointer.className = 'fifo-pointer';
                    fCell.appendChild(pointer);
                }

                if (val === stepData.page) {
                    fCell.classList.add(stepData.isHit ? 'text-emerald-400' : 'text-red-400');
                }
            }

            colRefs.statusCell.textContent = stepData.isHit ? 'HIT' : 'FAULT';
            colRefs.statusCell.classList.replace('opacity-0', 'animate-pop-in');
            colRefs.statusCell.classList.add(stepData.isHit ? 'highlight-hit' : 'highlight-fault');

            if (stepIndex > 0) {
                const prevCol = sim.domRefs.cols[stepIndex - 1];
                prevCol.refCell.classList.remove('cell-active');
                prevCol.frameCells.forEach(c => c.classList.remove('cell-active'));
            }

            sim.domRefs.statFaults.textContent = stepData.faultsCount;
            sim.domRefs.statHits.textContent = stepData.hitsCount;
            sim.domRefs.statHitRatio.textContent = `${(stepData.hitsCount / (stepData.faultsCount + stepData.hitsCount) * 100).toFixed(1)}%`;

            const scrollCont = sim.domRefs.wrapper.querySelector('.custom-scrollbar');
            const targetX = colRefs.refCell.offsetLeft - (scrollCont.clientWidth / 2);
            scrollCont.scrollTo({ left: targetX, behavior: 'smooth' });
        });
        if (algoSelect.value === 'ALL') updateChart();
    }

    function updateChart() {
        const ctx = document.getElementById('comparisonChart').getContext('2d');
        const labels = activeSimulations.map(sim => sim.name);
        const data = activeSimulations.map(sim => {
            const trace = sim.trace[Math.max(0, currentStep - 1)];
            return trace ? trace.faultsCount : 0;
        });

        if (chartInstance) {
            chartInstance.data.datasets[0].data = data;
            chartInstance.update();
        } else {
            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Page Faults',
                        data: data,
                        backgroundColor: ['rgba(20, 184, 166, 0.6)', 'rgba(59, 130, 246, 0.6)', 'rgba(139, 92, 246, 0.6)'],
                        borderColor: ['#14b8a6', '#3b82f6', '#8b5cf6'],
                        borderWidth: 2,
                        borderRadius: 12
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true, grid: { color: 'rgba(51, 65, 85, 0.3)' } }, x: { grid: { display: false } } },
                    plugins: { legend: { display: false } }
                }
            });
        }
    }

    exportCsvBtn.addEventListener('click', () => {
        if (!activeSimulations.length) return alert('No simulation to export.');
        let csv = "Algorithm,Step,Page,Status,Faults,Hits,Frames\n";
        activeSimulations.forEach(sim => {
            sim.trace.forEach((s, i) => {
                csv += `${sim.name},${i+1},${s.page},${s.isHit?'Hit':'Fault'},${s.faultsCount},${s.hitsCount},"${s.frames.join('|')}"\n`;
            });
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'os_simulation_report.csv'; a.click();
    });

    if (analyzeInsightsBtn) {
        analyzeInsightsBtn.addEventListener('click', () => {
            window.location.href = `/insights?ref=${encodeURIComponent(refStringInput.value)}&frames=${encodeURIComponent(framesInput.value)}`;
        });
    }
    speedValue.textContent = updateSpeedLabel(speedSlider.value);
});
