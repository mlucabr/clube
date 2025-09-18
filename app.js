class MLUCADashboard {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.performanceChart = null;
        this.fundamentalsChart = null;
        this.currentSection = 'dashboard';
        this.initializeEventListeners();
        this.loadSampleData();
        this.showSection('dashboard');
    }

    initializeEventListeners() {
        // File upload events
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const selectFileBtn = document.getElementById('selectFileBtn');

        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        uploadArea.addEventListener('click', () => fileInput.click());

        selectFileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileInput.click();
        });

        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Other controls
        document.getElementById('refreshBtn').addEventListener('click', this.refreshData.bind(this));
        document.getElementById('periodSelect').addEventListener('change', this.filterByPeriod.bind(this));
        document.getElementById('exportPerformance').addEventListener('click', () => this.exportChart('performance'));
        document.getElementById('exportFundamentals').addEventListener('click', () => this.exportChart('fundamentals'));

        // Navigation - Fixed to work properly with section switching
        document.querySelectorAll('.nav-item a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = e.target.closest('a').getAttribute('href').replace('#', '');
                this.handleNavigation(href, e.target.closest('.nav-item'));
            });
        });
    }

    showSection(sectionName) {
        // Hide all sections first
        const sections = ['dashboard-section', 'upload-section', 'performance-section', 'fundamentals-section'];
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });

        // Show the requested section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Update current section
        this.currentSection = sectionName;

        // Update header title based on section
        const headerTitle = document.querySelector('.dashboard-header h1');
        switch(sectionName) {
            case 'dashboard':
                headerTitle.textContent = 'Dashboard de Performance';
                break;
            case 'upload':
                headerTitle.textContent = 'Upload de Dados';
                break;
            case 'performance':
                headerTitle.textContent = 'Análise de Performance';
                break;
            case 'fundamentals':
                headerTitle.textContent = 'Análise Fundamentalista';
                break;
        }

        // Recreate charts if switching to chart sections
        if (sectionName === 'performance' || sectionName === 'fundamentals') {
            setTimeout(() => {
                if (sectionName === 'performance') {
                    this.createPerformanceChart();
                } else {
                    this.createFundamentalsChart();
                }
            }, 100);
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.classList.add('dragover');
        uploadArea.style.borderColor = '#007bff';
        uploadArea.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
    }

    handleDragLeave(e) {
        e.preventDefault();
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.classList.remove('dragover');
        uploadArea.style.borderColor = '';
        uploadArea.style.backgroundColor = '';
    }

    handleDrop(e) {
        e.preventDefault();
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.classList.remove('dragover');
        uploadArea.style.borderColor = '';
        uploadArea.style.backgroundColor = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    async processFile(file) {
        if (!file.name.toLowerCase().includes('.xlsx') && !file.name.toLowerCase().includes('.xls')) {
            this.showStatus('Erro: Selecione um arquivo Excel (.xlsx ou .xls)', 'error');
            return;
        }

        this.showLoading(true);
        this.showStatus('Processando arquivo...', 'info');

        try {
            const rows = await readXlsxFile(file);
            const processedData = this.processExcelData(rows);
            
            if (processedData.length > 0) {
                this.data = processedData;
                this.filteredData = [...this.data];
                this.updateDashboard();
                this.showStatus(`Sucesso! ${processedData.length} registros carregados.`, 'success');
                this.showDataPreview();
                
                // Automatically switch to dashboard after successful upload
                this.handleNavigation('dashboard');
            } else {
                this.showStatus('Erro: Nenhum dado válido encontrado no arquivo.', 'error');
            }
        } catch (error) {
            console.error('Erro ao processar arquivo:', error);
            this.showStatus('Erro ao processar arquivo. Verifique o formato.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    processExcelData(rows) {
        if (rows.length < 2) return [];

        const headers = rows[0];
        const dataRows = rows.slice(1);
        
        return dataRows.map(row => {
            const record = {};
            headers.forEach((header, index) => {
                record[`__${index === 0 ? '' : index}`] = row[index];
            });
            return record;
        }).filter(record => record[''] && record[''] !== 'Mês');
    }

    loadSampleData() {
        // Dados de exemplo expandidos
        this.data = [
            {
                "": "mai./23", "__1": "100,0000", "__2": "0,00%", "__3": 0, "__4": 108335,
                "__5": "0,00%", "__6": 0, "__7": "0,00%", "__8": "0,00%", "__9": "100,0000",
                "__10": 0, "__11": "-", "__12": "0,00%", "__13": "0,00%", "__14": "",
                "__15": "", "__16": "", "__17": "", "__18": ""
            },
            {
                "": "jun./23", "__1": "102,5000", "__2": "2,50%", "__3": 2.5, "__4": 110245,
                "__5": "1,76%", "__6": 1.76, "__7": "0,74%", "__8": "1,05%", "__9": "101,0500",
                "__10": 1.05, "__11": "MLUCA", "__12": "12,50%", "__13": "15,00%", "__14": "12,5",
                "__15": "1,2", "__16": "4,25%", "__17": "350,00", "__18": "8,5%"
            },
            {
                "": "jul./23", "__1": "105,2000", "__2": "2,63%", "__3": 5.2, "__4": 112580,
                "__5": "2,12%", "__6": 3.92, "__7": "1,28%", "__8": "1,12%", "__9": "102,1800",
                "__10": 2.18, "__11": "MLUCA", "__12": "11,80%", "__13": "14,20%", "__14": "11,8",
                "__15": "1,18", "__16": "4,12%", "__17": "365,00", "__18": "7,8%"
            },
            {
                "": "ago./23", "__1": "103,8000", "__2": "-1,33%", "__3": 3.8, "__4": 111200,
                "__5": "-1,23%", "__6": 2.64, "__7": "1,16%", "__8": "1,18%", "__9": "103,3900",
                "__10": 3.39, "__11": "CDI", "__12": "13,20%", "__13": "16,80%", "__14": "10,2",
                "__15": "1,05", "__16": "3,95%", "__17": "342,00", "__18": "9,2%"
            },
            {
                "": "set./23", "__1": "107,1000", "__2": "3,17%", "__3": 7.1, "__4": 114850,
                "__5": "3,28%", "__6": 6.01, "__7": "1,09%", "__8": "1,15%", "__9": "104,5800",
                "__10": 4.58, "__11": "MLUCA", "__12": "10,90%", "__13": "13,50%", "__14": "13,2",
                "__15": "1,25", "__16": "4,45%", "__17": "380,00", "__18": "6,8%"
            },
            {
                "": "out./23", "__1": "104,5000", "__2": "-2,43%", "__3": 4.5, "__4": 112100,
                "__5": "-2,39%", "__6": 3.49, "__7": "1,01%", "__8": "1,08%", "__9": "105,7100",
                "__10": 5.71, "__11": "CDI", "__12": "14,80%", "__13": "18,20%", "__14": "9,8",
                "__15": "0,98", "__16": "3,75%", "__17": "295,00", "__18": "11,5%"
            },
            {
                "": "nov./23", "__1": "108,2000", "__2": "3,54%", "__3": 8.2, "__4": 116500,
                "__5": "3,92%", "__6": 7.52, "__7": "0,68%", "__8": "0,98%", "__9": "106,7400",
                "__10": 6.74, "__11": "IBOV", "__12": "9,20%", "__13": "11,80%", "__14": "15,6",
                "__15": "1,32", "__16": "4,68%", "__17": "420,00", "__18": "5,2%"
            },
            {
                "": "dez./23", "__1": "110,5000", "__2": "2,13%", "__3": 10.5, "__4": 119800,
                "__5": "2,83%", "__6": 10.57, "__7": "-0,07%", "__8": "1,12%", "__9": "107,9400",
                "__10": 7.94, "__11": "CDI", "__12": "8,90%", "__13": "10,40%", "__14": "14,8",
                "__15": "1,28", "__16": "4,92%", "__17": "445,00", "__18": "4,8%"
            }
        ];

        this.filteredData = [...this.data];
        this.updateDashboard();
        this.showStatus('Dados de exemplo carregados. Faça upload do arquivo MLUCA.xlsx para dados reais.', 'info');
    }

    updateDashboard() {
        this.updateKPIs();
        if (this.currentSection === 'performance' || this.currentSection === 'dashboard') {
            setTimeout(() => this.createPerformanceChart(), 100);
        }
        if (this.currentSection === 'fundamentals' || this.currentSection === 'dashboard') {
            setTimeout(() => this.createFundamentalsChart(), 100);
        }
    }

    updateKPIs() {
        const lastRecord = this.filteredData[this.filteredData.length - 1];
        
        if (!lastRecord) return;

        // Performance MLUCA
        const mlucaPerf = this.parseNumber(lastRecord['__3']);
        document.getElementById('mlucaPerformance').textContent = this.formatPercent(mlucaPerf);

        // vs IBOV
        const ibovPerf = this.parseNumber(lastRecord['__6']);
        const diff = mlucaPerf - ibovPerf;
        const diffElement = document.getElementById('vsIbov');
        diffElement.textContent = this.formatPercent(diff);
        diffElement.className = diff >= 0 ? 'text-green' : 'text-red';

        // Dividend Yield médio
        const dyValues = this.filteredData.map(d => this.parsePercent(d['__16'])).filter(v => v > 0);
        const avgDY = dyValues.length > 0 ? dyValues.reduce((a, b) => a + b, 0) / dyValues.length : 0;
        document.getElementById('dividendYield').textContent = this.formatPercent(avgDY);

        // Volatilidade atual
        const currentVol = this.parsePercent(lastRecord['__13']);
        document.getElementById('volatility').textContent = this.formatPercent(currentVol);
    }

    createPerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;
        
        if (this.performanceChart) {
            this.performanceChart.destroy();
        }

        const labels = this.filteredData.map(d => d['']);
        const mlucaData = this.filteredData.map(d => this.parseNumber(d['__3']));
        const ibovData = this.filteredData.map(d => this.parseNumber(d['__6']));
        const cdiData = this.filteredData.map(d => this.parseNumber(d['__10']));
        const volData = this.filteredData.map(d => this.parsePercent(d['__13']));

        this.performanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'MLUCA (acc)',
                        data: mlucaData,
                        borderColor: '#1FB8CD',
                        backgroundColor: 'rgba(31, 184, 205, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'IBOV (acc)',
                        data: ibovData,
                        borderColor: '#FFC185',
                        backgroundColor: 'rgba(255, 193, 133, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'CDI (acc)',
                        data: cdiData,
                        borderColor: '#B4413C',
                        backgroundColor: 'rgba(180, 65, 60, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Vol (ano)',
                        data: volData,
                        type: 'bar',
                        backgroundColor: 'rgba(93, 135, 143, 0.6)',
                        borderColor: '#5D878F',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: false
                    },
                    legend: {
                        labels: {
                            color: '#ffffff',
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(45, 45, 45, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#404040',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label;
                                const value = context.parsed.y;
                                return `${label}: ${value.toFixed(2)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(64, 64, 64, 0.3)'
                        },
                        ticks: {
                            color: '#b3b3b3'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: {
                            color: 'rgba(64, 64, 64, 0.3)'
                        },
                        ticks: {
                            color: '#b3b3b3',
                            callback: function(value) {
                                return value.toFixed(1) + '%';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Performance Acumulada (%)',
                            color: '#b3b3b3'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            color: '#b3b3b3',
                            callback: function(value) {
                                return value.toFixed(1) + '%';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Volatilidade (%)',
                            color: '#b3b3b3'
                        }
                    }
                }
            }
        });
    }

    createFundamentalsChart() {
        const ctx = document.getElementById('fundamentalsChart');
        if (!ctx) return;
        
        if (this.fundamentalsChart) {
            this.fundamentalsChart.destroy();
        }

        const labels = this.filteredData.map(d => d['']);
        const dyData = this.filteredData.map(d => this.parsePercent(d['__16']));
        const gapData = this.filteredData.map(d => this.parsePercent(d['__18']));

        this.fundamentalsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'DY (%)',
                        data: dyData,
                        borderColor: '#1FB8CD',
                        backgroundColor: 'rgba(31, 184, 205, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'GAP (risco)',
                        data: gapData,
                        borderColor: '#DB4545',
                        backgroundColor: 'rgba(219, 69, 69, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: false
                    },
                    legend: {
                        labels: {
                            color: '#ffffff',
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(45, 45, 45, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#404040',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label;
                                const value = context.parsed.y;
                                return `${label}: ${value.toFixed(2)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(64, 64, 64, 0.3)'
                        },
                        ticks: {
                            color: '#b3b3b3'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: {
                            color: 'rgba(64, 64, 64, 0.3)'
                        },
                        ticks: {
                            color: '#b3b3b3',
                            callback: function(value) {
                                return value.toFixed(1) + '%';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Dividend Yield (%)',
                            color: '#b3b3b3'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            color: '#b3b3b3',
                            callback: function(value) {
                                return value.toFixed(1) + '%';
                            }
                        },
                        title: {
                            display: true,
                            text: 'GAP Risco (%)',
                            color: '#b3b3b3'
                        }
                    }
                }
            }
        });
    }

    filterByPeriod() {
        const period = document.getElementById('periodSelect').value;
        
        if (period === 'all') {
            this.filteredData = [...this.data];
        } else {
            const months = parseInt(period);
            this.filteredData = this.data.slice(-months);
        }

        this.updateDashboard();
        this.showStatus(`Filtro aplicado: ${period === 'all' ? 'todos os períodos' : period + ' meses'}`, 'success');
    }

    showDataPreview() {
        const dataSection = document.getElementById('dataSection');
        const dataTable = document.getElementById('dataTable');
        const dataCount = document.getElementById('dataCount');

        dataCount.textContent = `${this.data.length} registros`;

        if (this.data.length > 0) {
            const headers = ['Mês', 'MLUCA (cota)', 'MLUCA (acc)', 'IBOV (acc)', 'CDI (acc)', 'Vol (ano)', 'DY(%)', 'GAP (risco)'];
            const headerRow = dataTable.querySelector('thead');
            const bodyRow = dataTable.querySelector('tbody');

            headerRow.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
            
            bodyRow.innerHTML = this.data.slice(0, 10).map(row => {
                return `<tr>
                    <td>${row['']}</td>
                    <td>${row['__1']}</td>
                    <td>${this.formatPercent(this.parseNumber(row['__3']))}</td>
                    <td>${this.formatPercent(this.parseNumber(row['__6']))}</td>
                    <td>${this.formatPercent(this.parseNumber(row['__10']))}</td>
                    <td>${this.formatPercent(this.parsePercent(row['__13']))}</td>
                    <td>${row['__16'] || '-'}</td>
                    <td>${row['__18'] || '-'}</td>
                </tr>`;
            }).join('');

            dataSection.style.display = 'block';
        }
    }

    exportChart(chartType) {
        const chart = chartType === 'performance' ? this.performanceChart : this.fundamentalsChart;
        if (chart) {
            const url = chart.toBase64Image();
            const link = document.createElement('a');
            link.download = `mluca-${chartType}-chart.png`;
            link.href = url;
            link.click();
            this.showStatus(`Gráfico ${chartType === 'performance' ? 'de Performance' : 'de Fundamentos'} exportado!`, 'success');
        }
    }

    refreshData() {
        const refreshBtn = document.getElementById('refreshBtn');
        const originalText = refreshBtn.innerHTML;
        
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Atualizando...';
        refreshBtn.disabled = true;
        
        this.showLoading(true);
        
        setTimeout(() => {
            this.updateDashboard();
            this.showLoading(false);
            this.showStatus('Dashboard atualizado com sucesso!', 'success');
            
            refreshBtn.innerHTML = originalText;
            refreshBtn.disabled = false;
        }, 1500);
    }

    handleNavigation(section, navItem = null) {
        // Update active nav item if provided
        if (navItem) {
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            navItem.classList.add('active');
        }

        // Show the appropriate section
        this.showSection(section);
        
        // Provide feedback
        const sectionNames = {
            dashboard: 'Dashboard principal',
            performance: 'Análise de Performance', 
            fundamentals: 'Análise Fundamentalista',
            upload: 'Upload de dados'
        };
        
        this.showStatus(`Navegando para ${sectionNames[section]}`, 'success');
    }

    showLoading(show) {
        const modal = document.getElementById('loadingModal');
        if (show) {
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    }

    showStatus(message, type) {
        const statusDiv = document.getElementById('uploadStatus');
        statusDiv.className = `status-${type}`;
        statusDiv.textContent = message;
        
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = '';
        }, 3000);
    }

    parseNumber(value) {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            return parseFloat(value.replace(',', '.')) || 0;
        }
        return 0;
    }

    parsePercent(value) {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            return parseFloat(value.replace('%', '').replace(',', '.')) || 0;
        }
        return 0;
    }

    formatPercent(value) {
        return `${value.toFixed(2)}%`.replace('.', ',');
    }

    formatNumber(value) {
        return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    new MLUCADashboard();
});