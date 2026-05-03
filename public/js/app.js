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
    
    const simulationsContainer = document.getElementById('simulationsContainer');
    const chartSection = document.getElementById('chartSection');
    const simulationTemplate = document.getElementById('simulationTemplate');

    // --- State ---
    let isPlaying = false;
    let currentStep = 0;
    let maxSteps = 0;
    let intervalId = null;
    let activeSimulations = []; // Array of { id, name, trace, domRefs }
    let chartInstance = null;

    // --- Speed Labels ---
    function updateSpeedLabel(val) {
        if (val < 500) return 'Very Fast';
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

    // --- Input Handling ---
    randomBtn.addEventListener('click', () => {
        const length = Math.floor(Math.random() * 10) + 10; // 10 to 20
        const str = Array.from({length}, () => Math.floor(Math.random() * 10)).join(',');
        refStringInput.value = str;
        resetSimulation();
    });

    refStringInput.addEventListener('input', resetSimulation);
    framesInput.addEventListener('input', resetSimulation);
    algoSelect.addEventListener('change', resetSimulation);

    // --- Controls ---
    runBtn.addEventListener('click', () => {
        if (activeSimulations.length === 0) {
            setupSimulations();
        }
        
        if (isPlaying) {
            pauseSimulation();
        } else {
            if (currentStep >= maxSteps) {
                // If finished, reset and play again
                resetSimulation();
                setupSimulations();
            }
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

    // --- Core Logic ---
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
        if (refString.length === 0 || isNaN(numFrames) || numFrames < 1) {
            alert('Please enter valid inputs.');
            return;
        }

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
        
        // Setup initial chart if ALL
        if (selectedAlgo === 'ALL') {
            chartSection.classList.remove('hidden');
            updateChart();
        }
    }

    function createSimulationUI(algoName, numFrames, refString) {
        const clone = simulationTemplate.content.cloneNode(true);
        const wrapper = clone.querySelector('.simulation-card');
        
        wrapper.querySelector('.algo-title-badge').textContent = algoName;
        
        const algoTitles = {
            'FIFO': 'First-In, First-Out',
            'LRU': 'Least Recently Used',
            'OPTIMAL': 'Optimal Replacement'
        };
        wrapper.querySelector('.algo-name').textContent = algoTitles[algoName] || algoName;

        const refCellsContainer = wrapper.querySelector('.ref-cells');
        const statusCellsContainer = wrapper.querySelector('.status-cells');
        const framesContainer = wrapper.querySelector('.frames-container');

        // Setup Frame Rows
        const frameRows = [];
        for (let i = 0; i < numFrames; i++) {
            const row = document.createElement('div');
            row.className = 'flex border-b border-dark-border bg-dark-bg/30';
            
            const label = document.createElement('div');
            label.className = 'w-20 shrink-0 border-r border-dark-border p-3 flex items-center justify-center font-medium text-slate-500 text-xs';
            label.textContent = `Frame ${i + 1}`;
            row.appendChild(label);

            const cellsContainer = document.createElement('div');
            cellsContainer.className = 'flex-1 flex relative';
            row.appendChild(cellsContainer);

            framesContainer.appendChild(row);
            frameRows.push(cellsContainer);
        }

        // Pre-create cells for the grid
        const cols = [];
        for (let i = 0; i < refString.length; i++) {
            // Ref string cell
            const refCell = document.createElement('div');
            refCell.className = 'grid-cell text-brand-400 font-bold opacity-0 transition-opacity';
            refCell.textContent = refString[i];
            refCellsContainer.appendChild(refCell);

            // Status cell
            const statusCell = document.createElement('div');
            statusCell.className = 'grid-cell text-xs opacity-0 transition-opacity';
            statusCellsContainer.appendChild(statusCell);

            // Frame cells
            const frameColCells = [];
            for (let j = 0; j < numFrames; j++) {
                const fCell = document.createElement('div');
                fCell.className = 'grid-cell opacity-0';
                frameRows[j].appendChild(fCell);
                frameColCells.push(fCell);
            }

            cols.push({
                refCell,
                statusCell,
                frameCells: frameColCells
            });
        }

        simulationsContainer.appendChild(wrapper);
        
        // Trigger entrance animation
        setTimeout(() => wrapper.classList.add('show-sim'), 50);

        return {
            wrapper,
            cols,
            statFaults: wrapper.querySelector('.stat-faults'),
            statHits: wrapper.querySelector('.stat-hits'),
            statFaultRatio: wrapper.querySelector('.stat-fault-ratio'),
            statHitRatio: wrapper.querySelector('.stat-hit-ratio'),
            statusText: wrapper.querySelector('.status-text')
        };
    }

    function playSimulation() {
        isPlaying = true;
        updateRunButtonState(true);
        const speed = parseInt(speedSlider.value, 10);
        
        if (currentStep < maxSteps) {
            currentStep++;
            renderStep();
        }

        intervalId = setInterval(() => {
            if (currentStep < maxSteps) {
                currentStep++;
                renderStep();
            } else {
                pauseSimulation();
                activeSimulations.forEach(sim => {
                    sim.domRefs.statusText.textContent = "Completed";
                    sim.domRefs.statusText.classList.replace('text-brand-400', 'text-emerald-400');
                });
                if(algoSelect.value !== 'ALL') {
                    chartSection.classList.remove('hidden');
                    updateChart();
                }
            }
        }, speed);
    }

    function pauseSimulation() {
        isPlaying = false;
        updateRunButtonState(false);
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    function updateRunButtonState(playing) {
        if (playing) {
            runText.textContent = 'Pause';
            runIcon.innerHTML = `<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />`;
            runBtn.classList.replace('from-brand-600', 'from-amber-600');
            runBtn.classList.replace('to-brand-500', 'to-amber-500');
        } else {
            runText.textContent = currentStep >= maxSteps && maxSteps > 0 ? 'Restart' : 'Run Simulation';
            runIcon.innerHTML = currentStep >= maxSteps && maxSteps > 0 
                ? `<path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />`
                : `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />`;
            runBtn.classList.replace('from-amber-600', 'from-brand-600');
            runBtn.classList.replace('to-amber-500', 'to-brand-500');
        }
    }

    function renderStep() {
        const stepIndex = currentStep - 1;

        activeSimulations.forEach(sim => {
            const stepData = sim.trace[stepIndex];
            const colRefs = sim.domRefs.cols[stepIndex];

            // Update status text
            sim.domRefs.statusText.textContent = `Running Step ${currentStep}/${maxSteps}`;
            sim.domRefs.statusText.className = 'text-sm font-medium status-text text-brand-400';

            // Reveal reference cell
            colRefs.refCell.classList.remove('opacity-0');
            colRefs.refCell.classList.add('cell-enter', 'active-col');

            // Set frame cells
            for (let i = 0; i < stepData.frames.length; i++) {
                const val = stepData.frames[i];
                const fCell = colRefs.frameCells[i];
                fCell.textContent = val !== null ? val : '-';
                fCell.classList.remove('opacity-0');
                fCell.classList.add('cell-enter', 'active-col');
                
                // Highlight the cell that caused the fault/hit (the newly added/accessed page)
                if (val === stepData.page) {
                    if (stepData.isHit) {
                        fCell.classList.add('text-emerald-400', 'font-bold');
                    } else {
                        fCell.classList.add('text-red-400', 'font-bold');
                    }
                }
            }

            // Status cell
            colRefs.statusCell.textContent = stepData.isHit ? 'HIT' : 'FAULT';
            colRefs.statusCell.classList.remove('opacity-0');
            colRefs.statusCell.classList.add('cell-enter', 'active-col');
            if (stepData.isHit) {
                colRefs.statusCell.classList.add('highlight-hit');
            } else {
                colRefs.statusCell.classList.add('highlight-fault');
            }

            // Remove active col highlighting from previous step
            if (stepIndex > 0) {
                const prevCol = sim.domRefs.cols[stepIndex - 1];
                prevCol.refCell.classList.remove('active-col');
                prevCol.statusCell.classList.remove('active-col');
                prevCol.frameCells.forEach(c => c.classList.remove('active-col'));
            }

            // Update Stats Sidebar
            sim.domRefs.statFaults.textContent = stepData.faultsCount;
            sim.domRefs.statHits.textContent = stepData.hitsCount;
            
            const totalSoFar = stepData.faultsCount + stepData.hitsCount;
            const fRatio = ((stepData.faultsCount / totalSoFar) * 100).toFixed(1);
            const hRatio = ((stepData.hitsCount / totalSoFar) * 100).toFixed(1);
            
            sim.domRefs.statFaultRatio.textContent = `${fRatio}%`;
            sim.domRefs.statHitRatio.textContent = `${hRatio}%`;

            // Auto-scroll logic if grid is wider than container
            const gridContainer = sim.domRefs.wrapper.querySelector('.custom-scrollbar');
            const scrollWidth = colRefs.refCell.offsetLeft;
            if (scrollWidth > gridContainer.clientWidth - 100) {
                gridContainer.scrollTo({
                    left: scrollWidth - gridContainer.clientWidth / 2,
                    behavior: 'smooth'
                });
            }
        });

        if (algoSelect.value === 'ALL') {
            updateChart();
        }
    }

    function updateChart() {
        const ctx = document.getElementById('comparisonChart').getContext('2d');
        
        const labels = activeSimulations.map(sim => sim.name);
        const data = activeSimulations.map(sim => {
            const currentTrace = sim.trace[Math.max(0, currentStep - 1)];
            return currentTrace ? currentTrace.faultsCount : 0;
        });

        if (chartInstance) {
            chartInstance.data.datasets[0].data = data;
            chartInstance.update();
        } else {
            Chart.defaults.color = '#94a3b8'; // text-slate-400
            Chart.defaults.font.family = "'Outfit', sans-serif";
            
            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Total Page Faults',
                        data: data,
                        backgroundColor: [
                            'rgba(20, 184, 166, 0.6)', // brand-500
                            'rgba(59, 130, 246, 0.6)', // blue-500
                            'rgba(139, 92, 246, 0.6)'  // violet-500
                        ],
                        borderColor: [
                            'rgba(20, 184, 166, 1)',
                            'rgba(59, 130, 246, 1)',
                            'rgba(139, 92, 246, 1)'
                        ],
                        borderWidth: 1,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(51, 65, 85, 0.5)' // dark-border
                            },
                            ticks: {
                                stepSize: 1
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    animation: {
                        duration: 300
                    }
                }
            });
        }
    }

    // --- Export CSV ---
    exportCsvBtn.addEventListener('click', () => {
        if (activeSimulations.length === 0) {
            alert('No simulation data to export. Please run a simulation first.');
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        
        activeSimulations.forEach(sim => {
            csvContent += `Algorithm: ${sim.name}\n`;
            csvContent += `Step,Page,Hit/Fault,Faults Count,Hits Count,Frames State\n`;
            
            sim.trace.forEach((step, index) => {
                const status = step.isHit ? 'Hit' : 'Fault';
                const frameState = step.frames.map(f => f !== null ? f : '-').join(' | ');
                csvContent += `${index + 1},${step.page},${status},${step.faultsCount},${step.hitsCount},${frameState}\n`;
            });
            csvContent += `\n`; // blank line between algos
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "page_replacement_simulation.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Initialize labels
    speedValue.textContent = updateSpeedLabel(speedSlider.value);
});
