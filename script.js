const API_KEY = 'd5d11f09de003425c4a68294'; // Get from ExchangeRate-API
let currentCurrency = 'USD';
let exchangeRates = {};
let costDistributionChart = null;
let calculationBreakdownChart = null;
let chartsInitialized = false;

function calculatePrice() {
    const values = {
        rawCost: parseFloat(document.getElementById("rawCost").value) || 0,
        productionCost: parseFloat(document.getElementById("productionCost").value) || 0,
        packagingCost: parseFloat(document.getElementById("packagingCost").value) || 0,
        discountPercent: parseFloat(document.getElementById("discountPercent").value) || 0,
        taxPercent: parseFloat(document.getElementById("taxPercent").value) || 0,
        profitMargin: parseFloat(document.getElementById("profitMargin").value) || 0
    };

    const baseTotal = values.rawCost + values.productionCost + values.packagingCost;
    const discountAmount = (baseTotal * values.discountPercent) / 100;
    const afterDiscount = baseTotal - discountAmount;
    const taxAmount = (afterDiscount * values.taxPercent) / 100;
    const profitAmount = (afterDiscount * values.profitMargin) / 100;
    const finalPrice = afterDiscount + taxAmount + profitAmount;

    document.getElementById("finalPrice").innerText = formatCurrency(finalPrice, currentCurrency);

    // Show the hidden sections after calculation
    document.getElementById('priceBreakdownSection').classList.remove('hidden');
    document.getElementById('chartsSection').classList.remove('hidden');
    document.getElementById('exportSection').classList.remove('hidden');

    // Update price breakdown first
    updateBreakdown(values);

    // Initialize charts if not already initialized
    if (!chartsInitialized) {
        initializeCharts();
    }
    
    // Update charts with new data
    updateCharts();

    // Automatically expand the breakdown
    const content = document.getElementById('breakdownContent');
    if (!content.classList.contains('show')) {
        toggleBreakdown();
    }
}

function toggleBreakdown() {
    const content = document.getElementById('breakdownContent');
    const toggle = document.querySelector('.breakdown-toggle');
    content.classList.toggle('show');
    toggle.textContent = content.classList.contains('show') ? 
        'Hide Price Breakdown ▲' : 'Show Price Breakdown ▼';
}

function updateBreakdown(values) {
    const {
        rawCost = 0,
        productionCost = 0,
        packagingCost = 0,
        discountPercent = 0,
        taxPercent = 0,
        profitMargin = 0
    } = values;

    const baseTotal = rawCost + productionCost + packagingCost;
    const discountAmount = (baseTotal * discountPercent) / 100;
    const afterDiscount = baseTotal - discountAmount;
    const taxAmount = (afterDiscount * taxPercent) / 100;
    const profitAmount = (afterDiscount * profitMargin) / 100;
    const finalPrice = afterDiscount + taxAmount + profitAmount;

    // Update breakdown display with currency
    document.getElementById('breakdownRaw').textContent = formatCurrency(rawCost, currentCurrency);
    document.getElementById('breakdownProduction').textContent = formatCurrency(productionCost, currentCurrency);
    document.getElementById('breakdownPackaging').textContent = formatCurrency(packagingCost, currentCurrency);
    document.getElementById('breakdownBase').textContent = formatCurrency(baseTotal, currentCurrency);
    document.getElementById('breakdownDiscount').textContent = `-${formatCurrency(discountAmount, currentCurrency)}`;
    document.getElementById('breakdownTax').textContent = formatCurrency(taxAmount, currentCurrency);
    document.getElementById('breakdownProfit').textContent = formatCurrency(profitAmount, currentCurrency);
    document.getElementById('breakdownTotal').textContent = formatCurrency(finalPrice, currentCurrency);
}

function initializeCharts() {
    if (chartsInitialized) return;
    
    const costCtx = document.getElementById('costDistributionChart').getContext('2d');
    const calcCtx = document.getElementById('calculationBreakdownChart').getContext('2d');

    // Destroy existing charts if any
    if (costDistributionChart) costDistributionChart.destroy();
    if (calculationBreakdownChart) calculationBreakdownChart.destroy();

    // Initialize charts with current theme colors
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
    
    // Cost Distribution Chart
    costDistributionChart = new Chart(costCtx, {
        type: 'pie',
        data: {
            labels: ['Raw Material', 'Production', 'Packaging'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    '#FF9A9E',
                    '#A1C4FD',
                    '#FAD0C4'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Cost Distribution',
                    color: textColor
                },
                legend: {
                    position: 'bottom',
                    labels: { color: textColor }
                }
            }
        }
    });
    
    // Calculation Breakdown Chart
    calculationBreakdownChart = new Chart(calcCtx, {
        type: 'bar',
        data: {
            labels: ['Base Cost', 'Discount', 'Tax', 'Profit', 'Final Price'],
            datasets: [{
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    '#4facfe',
                    '#e74c3c',
                    '#f1c40f',
                    '#2ecc71',
                    '#9b59b6'
                ]
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: borderColor
                    },
                    ticks: { color: textColor }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: { color: textColor }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Calculation Breakdown',
                    color: textColor
                },
                legend: {
                    display: false
                }
            }
        }
    });

    chartsInitialized = true;
}

function updateCharts() {
    const details = getCalculationDetails();
    
    // Update cost distribution chart
    costDistributionChart.data.datasets[0].data = [
        details.costs.rawMaterial,
        details.costs.production,
        details.costs.packaging
    ];
    costDistributionChart.update();
    
    // Update calculation breakdown chart
    calculationBreakdownChart.data.datasets[0].data = [
        details.costs.baseTotal,
        -details.calculations.discount,
        details.calculations.tax,
        details.calculations.profit,
        details.finalPrice
    ];
    calculationBreakdownChart.update();
}

document.addEventListener('DOMContentLoaded', function() {
    const bot = document.getElementById('helper-bot');
    const botMessage = bot.querySelector('.bot-message');

    // Direct cursor following
    function updatePosition(e) {
        bot.style.left = `${e.clientX}px`;
        bot.style.top = `${e.clientY}px`;
    }

    document.addEventListener('mousemove', updatePosition);

    // Touch device support
    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        updatePosition({
            clientX: touch.clientX,
            clientY: touch.clientY
        });
    }, { passive: false });

    // Interactive messages for different elements
    const messages = {
        'productName': 'Enter the name of your product here!',
        'rawCost': 'Input the cost of raw materials',
        'productionCost': 'How much does it cost to produce?',
        'packagingCost': 'Don\'t forget packaging costs!',
        'discountPercent': 'Any discounts to apply?',
        'taxPercent': 'Don\'t forget about taxes!',
        'profitMargin': 'What\'s your desired profit margin?'
    };

    // Show relevant messages when hovering over inputs
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('mouseenter', () => {
            botMessage.textContent = messages[input.id] || 'Need help?';
            botMessage.style.opacity = '1';
        });

        input.addEventListener('mouseleave', () => {
            botMessage.style.opacity = '0';
        });
    });

    // Special message for the calculate button
    document.querySelector('button').addEventListener('mouseenter', () => {
        botMessage.textContent = 'Click to calculate the final price!';
        botMessage.style.opacity = '1';
    });

    document.querySelector('button').addEventListener('mouseleave', () => {
        botMessage.style.opacity = '0';
    });

    console.log('Bot initialized:', bot); // Check console for errors

    // Add validation logic
    const validationRules = {
        productName: (value) => value.trim() !== '',
        rawCost: (value) => value >= 0,
        productionCost: (value) => value >= 0,
        packagingCost: (value) => value >= 0,
        discountPercent: (value) => value >= 0 && value <= 100,
        taxPercent: (value) => value >= 0 && value <= 100,
        profitMargin: (value) => value >= 0 && value <= 100
    };

    const errorMessages = {
        productName: 'Product name is required',
        rawCost: 'Must be a non-negative number',
        productionCost: 'Must be a non-negative number',
        packagingCost: 'Must be a non-negative number',
        discountPercent: 'Must be between 0-100%',
        taxPercent: 'Must be between 0-100%',
        profitMargin: 'Must be between 0-100%'
    };

    function validateInput(input) {
        const value = parseFloat(input.value) || input.value;
        const isValid = validationRules[input.id](value);
        const errorElement = document.getElementById(`${input.id}Error`);
        
        if (!isValid) {
            input.classList.add('invalid');
            errorElement.textContent = errorMessages[input.id];
        } else {
            input.classList.remove('invalid');
            errorElement.textContent = '';
        }
        return isValid;
    }

    function validateAll() {
        const inputs = document.querySelectorAll('input');
        let allValid = true;
        
        inputs.forEach(input => {
            if (!validateInput(input)) allValid = false;
        });
        
        document.querySelector('button').disabled = !allValid;
    }

    // Add event listeners
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            validateInput(input);
            validateAll();
        });
        
        input.addEventListener('blur', () => validateInput(input));
    });

    // Initial validation on page load
    validateAll();

    // Load saved calculations
    loadSavedCalculations();

    // Set initial theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateBotColors(savedTheme);

    // Update currency labels
    updateCurrencyLabels();

    // Initialize saved calculations display
    loadSavedCalculations();
});

async function fetchExchangeRates() {
    try {
        const response = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`);
        const data = await response.json();
        exchangeRates = data.conversion_rates;
        console.log('Exchange rates updated:', exchangeRates);
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Show error message to user
        alert('Unable to fetch currency conversion rates. Using stored rates.');
    }
}

function updateCurrency() {
    const newCurrency = document.getElementById('currencySelect').value;
    if (newCurrency === currentCurrency) return;

    currentCurrency = newCurrency;
    updateCurrencyLabels();
    calculatePrice(); // Recalculate with new currency
}

// Currency formatting helper
function formatCurrency(amount, currency) {
    const symbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'AUD': 'A$'
    };

    // Convert amount based on exchange rate
    if (currency !== 'USD') {
        amount *= exchangeRates[currency] || 1;
    }

    // Format based on currency
    if (currency === 'JPY') {
        return `${symbols[currency]}${Math.round(amount)}`;
    }
    
    return `${symbols[currency]}${amount.toFixed(2)}`;
}

// Add fallback exchange rates in case API fails
const fallbackRates = {
    'USD': 1,
    'EUR': 0.85,
    'GBP': 0.73,
    'JPY': 110.0,
    'AUD': 1.35
};

// Fetch rates every hour
setInterval(fetchExchangeRates, 3600000);

function saveCalculation() {
    const saveName = document.getElementById('saveName').value.trim();
    if (!saveName) {
        alert('Please enter a name for this calculation');
        return;
    }

    const calculationData = {
        name: saveName,
        date: new Date().toISOString(),
        values: {
            productName: document.getElementById('productName').value,
            rawCost: document.getElementById('rawCost').value,
            productionCost: document.getElementById('productionCost').value,
            packagingCost: document.getElementById('packagingCost').value,
            discountPercent: document.getElementById('discountPercent').value,
            taxPercent: document.getElementById('taxPercent').value,
            profitMargin: document.getElementById('profitMargin').value,
            currency: currentCurrency
        },
        finalPrice: document.getElementById('finalPrice').innerText
    };

    // Get existing calculations or initialize empty array
    const savedCalculations = JSON.parse(localStorage.getItem('savedCalculations') || '[]');
    
    // Add new calculation
    savedCalculations.push(calculationData);
    
    // Save back to localStorage
    localStorage.setItem('savedCalculations', JSON.stringify(savedCalculations));
    
    // Clear save name input
    document.getElementById('saveName').value = '';
    
    // Refresh the list
    loadSavedCalculations();
}

function loadCalculation(index) {
    const savedCalculations = JSON.parse(localStorage.getItem('savedCalculations') || '[]');
    const calculation = savedCalculations[index];
    
    if (!calculation) return;

    // Load values into form
    const values = calculation.values;
    Object.keys(values).forEach(key => {
        if (key === 'currency') {
            document.getElementById('currencySelect').value = values[key];
            currentCurrency = values[key];
        } else {
            const element = document.getElementById(key);
            if (element) element.value = values[key];
        }
    });

    // Update currency labels
    updateCurrencyLabels();

    // Recalculate
    calculatePrice();
}

function deleteCalculation(index) {
    if (!confirm('Are you sure you want to delete this saved calculation?')) return;

    const savedCalculations = JSON.parse(localStorage.getItem('savedCalculations') || '[]');
    savedCalculations.splice(index, 1);
    localStorage.setItem('savedCalculations', JSON.stringify(savedCalculations));
    
    // Refresh the list
    loadSavedCalculations();
}

function loadSavedCalculations() {
    const savedCalculations = JSON.parse(localStorage.getItem('savedCalculations') || '[]');
    const container = document.getElementById('savedCalculationsList');
    
    // Clear previous content
    container.innerHTML = '';

    if (savedCalculations.length === 0) {
        container.innerHTML = '<p class="no-saved">No saved calculations yet</p>';
        return;
    }

    savedCalculations.forEach((calc, index) => {
        const calculationElement = document.createElement('div');
        calculationElement.className = 'saved-calculation';
        calculationElement.innerHTML = `
            <div class="saved-calculation-info">
                <div class="saved-calculation-name">${escapeHtml(calc.name)}</div>
                <div class="saved-calculation-price">Final Price: ${calc.finalPrice}</div>
                <div class="saved-calculation-date">
                    ${new Date(calc.date).toLocaleDateString()}
                </div>
            </div>
            <div class="saved-calculation-actions">
                <button class="load-btn">Load</button>
                <button class="delete-btn">Delete</button>
            </div>
        `;

        // Add event listeners to new elements
        calculationElement.querySelector('.load-btn').addEventListener('click', () => loadCalculation(index));
        calculationElement.querySelector('.delete-btn').addEventListener('click', () => deleteCalculation(index));
        
        container.appendChild(calculationElement);
    });
}

// Helper function to prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update bot colors
    updateBotColors(newTheme);

    // Only reinitialize charts if they were already initialized
    if (chartsInitialized) {
        // Reset the initialization flag
        chartsInitialized = false;
        // Reinitialize charts with new theme colors
        initializeCharts();
        // Update charts with current data
        updateCharts();
    }
}

function updateBotColors(theme) {
    const bot = document.querySelector('.bot-body');
    const eyes = document.querySelectorAll('.eye');
    const antenna = document.querySelector('.bot-antenna');
    
    if (theme === 'dark') {
        bot.style.background = '#34495e';
        bot.style.borderColor = '#00f2fe';
        eyes.forEach(eye => eye.style.background = '#00f2fe');
        antenna.style.background = '#00f2fe';
    } else {
        bot.style.background = '#ffffff';
        bot.style.borderColor = '#FF9A9E';
        eyes.forEach(eye => eye.style.background = '#FF9A9E');
        antenna.style.background = '#FF9A9E';
    }
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 20;
    
    // First page: Calculation details
    doc.setFont("helvetica");
    doc.setFontSize(20);
    doc.text("PharmCalc Pro - Price Calculation", 20, y);
    
    // Add calculation details
    doc.setFontSize(12);
    const details = getCalculationDetails();
    y += 20;
    
    // Add product info
    doc.setFont("helvetica", "bold");
    doc.text(`Product: ${details.productName}`, 20, y);
    y += 10;
    
    // Add date
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, y);
    y += 20;
    
    // Add costs
    doc.text("Cost Breakdown:", 20, y);
    y += 10;
    
    Object.entries(details.costs).forEach(([key, value]) => {
        doc.text(`${formatLabel(key)}: ${formatCurrency(value, details.currency)}`, 30, y);
        y += 8;
    });
    
    y += 10;
    
    // Add calculations
    doc.text("Calculations:", 20, y);
    y += 10;
    
    Object.entries(details.calculations).forEach(([key, value]) => {
        if (key === 'discount') {
            doc.text(`${formatLabel(key)}: -${formatCurrency(value, details.currency)}`, 30, y);
        } else {
            doc.text(`${formatLabel(key)}: ${formatCurrency(value, details.currency)}`, 30, y);
        }
        y += 8;
    });
    
    y += 10;
    
    // Add final price
    doc.setFont("helvetica", "bold");
    doc.text(`Final Price: ${formatCurrency(details.finalPrice, details.currency)}`, 20, y);
    
    y += 20;

    // Add charts on a new page
    if (chartsInitialized) {
        doc.addPage();
        y = 20; // Reset y position for new page

        // Add Cost Distribution Chart
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Cost Distribution Chart", 20, y);
        y += 15;

        const costChartImg = document.getElementById('costDistributionChart').toDataURL('image/png');
        // Use more appropriate dimensions (width: 160, height: 100)
        doc.addImage(costChartImg, 'PNG', 25, y, 160, 100);
        y += 120; // More space between charts

        // Add Calculation Breakdown Chart
        doc.text("Calculation Breakdown Chart", 20, y);
        y += 15;

        const calcChartImg = document.getElementById('calculationBreakdownChart').toDataURL('image/png');
        // Use same dimensions for consistency
        doc.addImage(calcChartImg, 'PNG', 25, y, 160, 100);
    }
    
    // Save the PDF
    doc.save(`pharmcalc-${details.productName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

function exportToCSV() {
    const details = getCalculationDetails();
    
    // Prepare CSV content with chart data
    const csvContent = [
        ['PharmCalc Pro - Price Calculation'],
        ['Date', new Date().toLocaleDateString()],
        ['Product Name', details.productName],
        [''],
        ['Cost Distribution'],
        ['Component', 'Amount', 'Percentage'],
        ['Raw Material', formatCurrency(details.costs.rawMaterial, details.currency), 
            ((details.costs.rawMaterial / details.costs.baseTotal) * 100).toFixed(2) + '%'],
        ['Production', formatCurrency(details.costs.production, details.currency),
            ((details.costs.production / details.costs.baseTotal) * 100).toFixed(2) + '%'],
        ['Packaging', formatCurrency(details.costs.packaging, details.currency),
            ((details.costs.packaging / details.costs.baseTotal) * 100).toFixed(2) + '%'],
        ['Base Total', formatCurrency(details.costs.baseTotal, details.currency), '100%'],
        [''],
        ['Calculation Breakdown'],
        ['Component', 'Amount'],
        ['Base Total', formatCurrency(details.costs.baseTotal, details.currency)],
        ['Discount', `-${formatCurrency(details.calculations.discount, details.currency)}`],
        ['Tax', formatCurrency(details.calculations.tax, details.currency)],
        ['Profit', formatCurrency(details.calculations.profit, details.currency)],
        [''],
        ['Final Price', formatCurrency(details.finalPrice, details.currency)]
    ];
    
    // Convert to CSV string
    const csv = csvContent.map(row => 
        row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pharmcalc-${details.productName.toLowerCase().replace(/\s+/g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function getCalculationDetails() {
    const values = {
        productName: document.getElementById('productName').value || 'Unnamed Product',
        rawCost: parseFloat(document.getElementById('rawCost').value) || 0,
        productionCost: parseFloat(document.getElementById('productionCost').value) || 0,
        packagingCost: parseFloat(document.getElementById('packagingCost').value) || 0,
        discountPercent: parseFloat(document.getElementById('discountPercent').value) || 0,
        taxPercent: parseFloat(document.getElementById('taxPercent').value) || 0,
        profitMargin: parseFloat(document.getElementById('profitMargin').value) || 0
    };
    
    const baseTotal = values.rawCost + values.productionCost + values.packagingCost;
    const discountAmount = (baseTotal * values.discountPercent) / 100;
    const afterDiscount = baseTotal - discountAmount;
    const taxAmount = (afterDiscount * values.taxPercent) / 100;
    const profitAmount = (afterDiscount * values.profitMargin) / 100;
    const finalPrice = afterDiscount + taxAmount + profitAmount;
    
    return {
        productName: values.productName,
        currency: currentCurrency,
        costs: {
            rawMaterial: values.rawCost,
            production: values.productionCost,
            packaging: values.packagingCost,
            baseTotal: baseTotal
        },
        calculations: {
            discount: discountAmount,
            tax: taxAmount,
            profit: profitAmount
        },
        finalPrice: finalPrice
    };
}

function formatLabel(key) {
    return key.split(/(?=[A-Z])/).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function updateCurrencyLabels() {
    const symbol = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'AUD': 'A$'
    }[currentCurrency];

    // Update all cost input labels
    document.querySelector('label[for="rawCost"]').textContent = `Raw Material Cost (${symbol}):`;
    document.querySelector('label[for="productionCost"]').textContent = `Production Cost (${symbol}):`;
    document.querySelector('label[for="packagingCost"]').textContent = `Packaging Cost (${symbol}):`;
}
