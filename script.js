document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const requestQueueInput = document.getElementById('requestQueue');
    const initialHeadInput = document.getElementById('initialHead');
    const prevHeadInput = document.getElementById('prevHead');
    const diskSizeInput = document.getElementById('diskSize');
    const directionSelect = document.getElementById('direction');
    const algoButtons = document.querySelectorAll('.algo-btn');
    const simulateBtn = document.getElementById('simulateBtn');
    const currentAlgoLabel = document.getElementById('currentAlgoLabel');
    const totalSeekTimeLabel = document.getElementById('totalSeekTime');
    const avgSeekTimeLabel = document.getElementById('avgSeekTime');
    const resultsTableBody = document.getElementById('resultsTableBody');
    const canvas = document.getElementById('headMovementChart');

    let currentAlgorithm = 'FCFS';
    let chart = null;

    // Initialize Algorithm Selection
    algoButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            algoButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentAlgorithm = btn.dataset.algo;
            currentAlgoLabel.textContent = currentAlgorithm;
        });
    });

    // Main Simulation Function
    simulateBtn.addEventListener('click', () => {
        const inputData = validateAndGetInputs();
        if (!inputData) return;

        const { queue, head, size, direction } = inputData;
        let result;

        switch (currentAlgorithm) {
            case 'FCFS': result = runFCFS(queue, head); break;
            case 'SSTF': result = runSSTF(queue, head); break;
            case 'SCAN': result = runSCAN(queue, head, size, direction); break;
            case 'C-SCAN': result = runCSCAN(queue, head, size, direction); break;
            case 'LOOK': result = runLOOK(queue, head, direction); break;
            case 'C-LOOK': result = runCLOOK(queue, head, direction); break;
        }

        updateUI(result);
    });

    // Input Validation
    function validateAndGetInputs() {
        const queueStr = requestQueueInput.value.trim();
        const head = parseInt(initialHeadInput.value);
        const prevHeadValue = prevHeadInput.value.trim();
        const size = parseInt(diskSizeInput.value);
        let direction = directionSelect.value;

        // Auto-detect direction if prevHead is provided
        if (prevHeadValue !== "") {
            const prevHead = parseInt(prevHeadValue);
            if (!isNaN(prevHead)) {
                direction = (head >= prevHead) ? 'right' : 'left';
                directionSelect.value = direction;
            }
        }

        if (!queueStr) {
            alert('Please enter a request queue.');
            return null;
        }

        const queue = queueStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        
        if (queue.length === 0) {
            alert('Invalid request queue format.');
            return null;
        }

        if (isNaN(head) || head < 0 || head >= size) {
            alert(`Initial head position must be between 0 and ${size - 1}.`);
            return null;
        }

        // Check if any request is out of bounds
        const outOfBounds = queue.find(q => q < 0 || q >= size);
        if (outOfBounds !== undefined) {
            alert(`Request ${outOfBounds} is outside disk range (0-${size - 1}).`);
            return null;
        }

        return { queue, head, size, direction };
    }

    // --- ALGORITHMS ---

    function runFCFS(queue, head) {
        let sequence = [head, ...queue];
        return calculateStats(sequence);
    }

    function runSSTF(queue, head) {
        let sequence = [head];
        let pending = [...queue];
        let currentHead = head;

        while (pending.length > 0) {
            let closestIndex = 0;
            let minDistance = Math.abs(currentHead - pending[0]);

            for (let i = 1; i < pending.length; i++) {
                let dist = Math.abs(currentHead - pending[i]);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestIndex = i;
                }
            }

            currentHead = pending[closestIndex];
            sequence.push(currentHead);
            pending.splice(closestIndex, 1);
        }
        return calculateStats(sequence);
    }

    function runSCAN(queue, head, size, direction) {
        let sequence = [head];
        let sortedQueue = [...queue].sort((a, b) => a - b);
        let left = sortedQueue.filter(q => q < head);
        let right = sortedQueue.filter(q => q > head);

        if (direction === 'left') {
            sequence.push(...left.reverse());
            sequence.push(0);
            sequence.push(...right);
        } else {
            sequence.push(...right);
            sequence.push(size - 1);
            sequence.push(...left.reverse());
        }
        return calculateStats(sequence);
    }

    function runCSCAN(queue, head, size, direction) {
        let sequence = [head];
        let sortedQueue = [...queue].sort((a, b) => a - b);
        let left = sortedQueue.filter(q => q < head);
        let right = sortedQueue.filter(q => q > head);

        if (direction === 'left') {
            sequence.push(...left.reverse());
            sequence.push(0);
            sequence.push(size - 1);
            sequence.push(...right.reverse());
        } else {
            sequence.push(...right);
            sequence.push(size - 1);
            sequence.push(0);
            sequence.push(...left);
        }
        return calculateStats(sequence);
    }

    function runLOOK(queue, head, direction) {
        let sequence = [head];
        let sortedQueue = [...queue].sort((a, b) => a - b);
        let left = sortedQueue.filter(q => q < head);
        let right = sortedQueue.filter(q => q > head);

        if (direction === 'left') {
            sequence.push(...left.reverse());
            sequence.push(...right);
        } else {
            sequence.push(...right);
            sequence.push(...left.reverse());
        }
        return calculateStats(sequence);
    }

    function runCLOOK(queue, head, direction) {
        let sequence = [head];
        let sortedQueue = [...queue].sort((a, b) => a - b);
        let left = sortedQueue.filter(q => q < head);
        let right = sortedQueue.filter(q => q > head);

        if (direction === 'left') {
            sequence.push(...left.reverse());
            sequence.push(...right.reverse());
        } else {
            sequence.push(...right);
            sequence.push(...left);
        }
        return calculateStats(sequence);
    }

    // Helper to calculate seek time and sequence details
    function calculateStats(sequence) {
        let totalSeekTime = 0;
        let steps = [];

        for (let i = 0; i < sequence.length - 1; i++) {
            let from = sequence[i];
            let to = sequence[i+1];
            let distance = Math.abs(to - from);
            totalSeekTime += distance;
            steps.push({ step: i + 1, from, to, distance });
        }

        return {
            sequence,
            steps,
            totalSeekTime,
            avgSeekTime: (totalSeekTime / (sequence.length - 1)).toFixed(2)
        };
    }

    // --- UI UPDATES ---

    function updateUI(result) {
        totalSeekTimeLabel.textContent = result.totalSeekTime;
        avgSeekTimeLabel.textContent = result.avgSeekTime;

        // Update Table
        resultsTableBody.innerHTML = '';
        result.steps.forEach(step => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${step.step}</td>
                <td>${step.from}</td>
                <td>${step.to}</td>
                <td>${step.distance}</td>
                <td><span class="badge">Served</span></td>
            `;
            resultsTableBody.appendChild(row);
        });

        // Update Chart
        renderChart(result.sequence);
    }

    function renderChart(sequence) {
        const labels = sequence.map((_, i) => `Step ${i}`);
        const data = {
            labels: labels,
            datasets: [{
                label: 'Head Position',
                data: sequence,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderWidth: 3,
                pointBackgroundColor: '#ec4899',
                pointRadius: 5,
                pointHoverRadius: 8,
                fill: false,
                tension: 0.1
            }]
        };

        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Swap axes for vertical time flow
                scales: {
                    x: {
                        title: { display: true, text: 'Track Number', color: '#94a3b8' },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#94a3b8' },
                        min: 0,
                        max: parseInt(diskSizeInput.value)
                    },
                    y: {
                        reverse: true, // Steps go downwards
                        title: { display: true, text: 'Execution Order', color: '#94a3b8' },
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Track: ${context.raw}`
                        }
                    }
                }
            }
        };

        if (chart) {
            chart.destroy();
        }
        chart = new Chart(canvas, config);
    }

    // Run initial simulation
    simulateBtn.click();
});
