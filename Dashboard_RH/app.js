// HR PCD Dashboard — Lógica Javascript (app.js)

// -------------------------------------------------------------
// 1. Estado Global da Aplicação
// -------------------------------------------------------------
let dataRaw = {
    colaboradores: [],
    movimentacoes: [],
    kpisMensais: [],
    resumoPCD: []
};

let state = {
    periodType: 'anual', // 'mensal', 'trimestral', 'anual'
    selectedPeriod: 'Todos',
    selectedDept: 'Todos',
    selectedPcdStatus: 'Todos',
    simulationActive: false
};

// Instâncias de Gráficos Chart.js
let charts = {
    evolution: null,
    disability: null,
    salaryDept: null,
    compSalary: null,
    compTenure: null,
    compLeaves: null
};

// Mapeamento de Meses (Inglês -> Português + Metadados)
const monthMap = {
    'Jan/2024': { label: 'Janeiro / 2024', short: 'Jan', month: 0, endDay: 31 },
    'Feb/2024': { label: 'Fevereiro / 2024', short: 'Fev', month: 1, endDay: 29 },
    'Mar/2024': { label: 'Março / 2024', short: 'Mar', month: 2, endDay: 31 },
    'Apr/2024': { label: 'Abril / 2024', short: 'Abr', month: 3, endDay: 30 },
    'May/2024': { label: 'Maio / 2024', short: 'Mai', month: 4, endDay: 31 },
    'Jun/2024': { label: 'Junho / 2024', short: 'Jun', month: 5, endDay: 30 },
    'Jul/2024': { label: 'Julho / 2024', short: 'Jul', month: 6, endDay: 31 },
    'Aug/2024': { label: 'Agosto / 2024', short: 'Ago', month: 7, endDay: 31 },
    'Sep/2024': { label: 'Setembro / 2024', short: 'Set', month: 8, endDay: 30 },
    'Oct/2024': { label: 'Outubro / 2024', short: 'Out', month: 9, endDay: 31 },
    'Nov/2024': { label: 'Novembro / 2024', short: 'Nov', month: 10, endDay: 30 },
    'Dec/2024': { label: 'Dezembro / 2024', short: 'Dez', month: 11, endDay: 31 }
};

// Líderes por Área (Mapeamento baseado nos dados simulados)
const departmentLeaders = {
    'RH': { name: 'Ana Lima', role: 'Supervisor' },
    'Comercial': { name: 'João Batista', role: 'Supervisor' },
    'Projetos': { name: 'Nathan Pereira', role: 'Gerente' },
    'TI': { name: 'Bernardo Lima', role: 'Gerente' },
    'Financeiro': { name: 'Yasmin Faria', role: 'Gerente' },
    'Jurídico': { name: 'Zé Cardoso', role: 'Supervisor' },
    'Operações': { name: 'Quintino Dias', role: 'Gerente' },
    'Marketing': { name: 'Julia Nunes', role: 'Supervisor' }
};

// Cores para os Gráficos (Tema Dark Slate)
const chartColors = {
    blue: '#3b82f6',
    blueAlpha: 'rgba(59, 130, 246, 0.2)',
    teal: '#0d9488',
    tealAlpha: 'rgba(13, 148, 136, 0.2)',
    purple: '#8b5cf6',
    purpleAlpha: 'rgba(139, 92, 246, 0.2)',
    orange: '#f97316',
    orangeAlpha: 'rgba(249, 115, 22, 0.2)',
    success: '#10b981',
    successAlpha: 'rgba(16, 185, 129, 0.2)',
    danger: '#ef4444',
    text: '#9ca3af',
    border: 'rgba(255, 255, 255, 0.08)',
    grid: 'rgba(255, 255, 255, 0.04)',
    tooltipBg: '#151522',
    tooltipBorder: 'rgba(255, 255, 255, 0.1)'
};

// -------------------------------------------------------------
// 2. Parsers e Helpers
// -------------------------------------------------------------

// Parser manual de CSV extremamente robusto
function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0 || !lines[0].trim()) return [];
    
    // Remove o BOM se presente
    const headers = lines[0].split(',').map(h => h.trim().replace(/^\uFEFF/, ''));
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = [];
        let insideQuotes = false;
        let currentValue = '';
        
        // Split manual para tratar possíveis aspas em strings
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim());
        
        const obj = {};
        headers.forEach((header, index) => {
            let val = values[index] !== undefined ? values[index] : '';
            // Limpa aspas do início e fim
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.substring(1, val.length - 1);
            }
            obj[header] = val;
        });
        result.push(obj);
    }
    return result;
}

// Converte string YYYY-MM-DD para objeto Date local (sem fuso horário UTC)
function parseDate(str) {
    if (!str || str === '—' || str === '') return null;
    const parts = str.split(' ')[0].split('-');
    if (parts.length < 3) return null;
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}

// Formata data para dd/mm/aaaa
function formatDate(date) {
    if (!date) return '—';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Formata valores monetários em R$
function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

// Retorna a data final de um período selecionado
function getPeriodLimits(periodType, periodValue) {
    const defaultEnd = new Date(2024, 11, 31); // Fim de Dezembro/2024
    const defaultStart = new Date(2018, 0, 1);
    
    if (periodValue === 'Todos') {
        return { start: defaultStart, end: defaultEnd };
    }
    
    if (periodType === 'mensal') {
        const info = monthMap[periodValue];
        if (info) {
            return {
                start: new Date(2024, info.month, 1),
                end: new Date(2024, info.month, info.endDay)
            };
        }
    } else if (periodType === 'trimestral') {
        if (periodValue === 'Q1') {
            return { start: new Date(2024, 0, 1), end: new Date(2024, 2, 31) };
        } else if (periodValue === 'Q2') {
            return { start: new Date(2024, 3, 1), end: new Date(2024, 5, 30) };
        } else if (periodValue === 'Q3') {
            return { start: new Date(2024, 6, 1), end: new Date(2024, 8, 30) };
        } else if (periodValue === 'Q4') {
            return { start: new Date(2024, 9, 1), end: new Date(2024, 11, 31) };
        }
    } else if (periodType === 'anual') {
        return { start: new Date(2024, 0, 1), end: new Date(2024, 11, 31) };
    }
    
    return { start: defaultStart, end: defaultEnd };
}

// -------------------------------------------------------------
// 3. Inicialização e Carregamento de Arquivos
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
});

async function loadAllData() {
    try {
        // Carrega arquivos CSV locais gerados pelo script Python
        const [resColab, resMov, resKpis, resResumo] = await Promise.all([
            fetch('Colaboradores.csv').then(res => res.text()),
            fetch('Movimentações.csv').then(res => res.text()),
            fetch('KPIs Mensais.csv').then(res => res.text()),
            fetch('Resumo PCD.csv').then(res => res.text())
        ]);
        
        dataRaw.colaboradores = parseCSV(resColab);
        dataRaw.movimentacoes = parseCSV(resMov);
        dataRaw.kpisMensais = parseCSV(resKpis);
        dataRaw.resumoPCD = parseCSV(resResumo);
        
        console.log('Dados carregados com sucesso:', dataRaw);
        
        // Inicializa filtros e tela
        setPeriodType('anual'); // Inicia com filtro anual
        
    } catch (e) {
        console.error('Erro ao carregar os arquivos CSV do dashboard:', e);
        alert('Erro ao carregar dados do dashboard. Certifique-se de executar no servidor local.');
    }
}

// Controla a mudança do tipo de período (Mensal, Trimestral, Anual)
function setPeriodType(type) {
    state.periodType = type;
    
    // Atualiza botões ativos na UI
    document.getElementById('btn-period-mensal').classList.toggle('active', type === 'mensal');
    document.getElementById('btn-period-trimestral').classList.toggle('active', type === 'trimestral');
    document.getElementById('btn-period-anual').classList.toggle('active', type === 'anual');
    
    // Altera opções do select de acordo com a periodicidade
    const select = document.getElementById('select-period');
    select.innerHTML = '';
    
    if (type === 'mensal') {
        select.innerHTML += `<option value="Todos">Todos os Meses (2024)</option>`;
        Object.keys(monthMap).forEach(key => {
            select.innerHTML += `<option value="${key}">${monthMap[key].label}</option>`;
        });
    } else if (type === 'trimestral') {
        select.innerHTML += `
            <option value="Todos">Todos os Trimestres (2024)</option>
            <option value="Q1">1º Trimestre (Q1)</option>
            <option value="Q2">2º Trimestre (Q2)</option>
            <option value="Q3">3º Trimestre (Q3)</option>
            <option value="Q4">4º Trimestre (Q4)</option>
        `;
    } else if (type === 'anual') {
        select.innerHTML += `
            <option value="Todos">Todos os Anos</option>
            <option value="2024">Ano Completo (2024)</option>
        `;
    }
    
    state.selectedPeriod = 'Todos';
    applyFilters();
}

// -------------------------------------------------------------
// 4. Mecanismo de Filtro e Cálculos
// -------------------------------------------------------------
function applyFilters() {
    // Lê os filtros da sidebar
    state.selectedPeriod = document.getElementById('select-period').value;
    state.selectedDept = document.getElementById('select-dept').value;
    state.selectedPcdStatus = document.getElementById('select-pcd-status').value;
    
    // Define limites de datas
    const { start: dateStart, end: dateEnd } = getPeriodLimits(state.periodType, state.selectedPeriod);
    
    // Monta o resumo textual de filtros ativos
    const periodText = state.selectedPeriod === 'Todos' 
        ? (state.periodType === 'mensal' ? 'Todos os Meses' : state.periodType === 'trimestral' ? 'Todos os Trimestres' : 'Anual 2024')
        : (state.periodType === 'mensal' ? monthMap[state.selectedPeriod].label : state.selectedPeriod === '2024' ? 'Ano Completo 2024' : state.selectedPeriod);
    
    document.getElementById('active-filters-summary').innerText = `Filtros: Área: ${state.selectedDept} | Período: ${periodText} | PCD: ${state.selectedPcdStatus}`;

    // Mapeia histórico de demissões em dicionário para junção (Join)
    const dismissalDates = {};
    dataRaw.movimentacoes.forEach(m => {
        if (m.Tipo === 'Desligamento') {
            dismissalDates[m.Nome] = parseDate(m.Data);
        }
    });

    // 1. Processamento da lista de colaboradores ativos e demitidos no período
    let filteredEmployees = dataRaw.colaboradores.map(emp => {
        const admDate = parseDate(emp['Data Admissão']);
        const disDate = dismissalDates[emp.Nome] || null;
        
        // Simulação de afastamento controlada
        let status = emp.Status;
        if (state.simulationActive) {
            if (emp.ID === '8' || emp.ID === '18' || emp.ID === '34') {
                status = 'Afastado';
            }
        }
        
        return {
            ...emp,
            parsedAdm: admDate,
            parsedDis: disDate,
            Status: status
        };
    });

    // Determina quem estava ATIVO no período selecionado (até dateEnd)
    let activeEmployees = filteredEmployees.filter(emp => {
        if (!emp.parsedAdm || emp.parsedAdm > dateEnd) return false;
        
        // Se desligado, verifica se foi desligado após o fim do período filtrado
        if (emp.parsedDis && emp.parsedDis <= dateEnd) return false;
        
        // Se o status da planilha for desligado mas ele foi demitido depois do período, ele conta
        return true;
    });

    // Aplica Filtro Organizacional (Departamento)
    if (state.selectedDept !== 'Todos') {
        activeEmployees = activeEmployees.filter(emp => emp.Área === state.selectedDept);
        filteredEmployees = filteredEmployees.filter(emp => emp.Área === state.selectedDept);
    }
    
    // Aplica Filtro de Status PCD
    if (state.selectedPcdStatus !== 'Todos') {
        activeEmployees = activeEmployees.filter(emp => emp.PCD === state.selectedPcdStatus);
    }

    // 2. Cálculos das Métricas Consolidadas (KPI Cards)
    
    // KPI 1: Headcount
    const totalHeadcount = activeEmployees.filter(emp => emp.Status !== 'Desligado').length;
    document.getElementById('val-headcount').innerText = totalHeadcount;
    
    // Sub-legenda de Headcount
    const activePcdCount = activeEmployees.filter(emp => emp.PCD === 'Sim' && emp.Status !== 'Desligado').length;
    document.getElementById('val-headcount-sub').innerText = `${activePcdCount} PCDs ativos no quadro`;
    
    // KPI 2: Média Salarial
    let avgSalary = 0;
    const activeWithSalary = activeEmployees.filter(emp => emp.Status !== 'Desligado' && emp['Salário (R$)'] > 0);
    if (activeWithSalary.length > 0) {
        const sumSalaries = activeWithSalary.reduce((acc, curr) => acc + parseFloat(curr['Salário (R$)']), 0);
        avgSalary = sumSalaries / activeWithSalary.length;
    }
    document.getElementById('val-salary').innerText = formatCurrency(avgSalary);

    // KPI 3: Afastados
    const activeLeaves = activeEmployees.filter(emp => emp.Status === 'Afastado').length;
    document.getElementById('val-leaves').innerText = activeLeaves;
    document.getElementById('val-leaves-sub').innerText = state.simulationActive 
        ? `${activeLeaves} colaboradores em licença (Demonstração)` 
        : 'Nenhum afastamento ativo';

    // KPI 4: Percentual Cota PCD e Status Legal
    const pcdPercent = totalHeadcount > 0 ? (activePcdCount / totalHeadcount) * 100 : 0;
    document.getElementById('val-quota').innerText = `${pcdPercent.toFixed(1)}%`;
    
    const quotaSub = document.getElementById('val-quota-sub');
    const trendQuotaIcon = document.getElementById('trend-quota').querySelector('.trend-indicator');
    
    if (pcdPercent >= 5.0) {
        quotaSub.innerText = 'Supera cota máxima (5%)';
        quotaSub.className = 'trend-text';
        trendQuotaIcon.innerText = '✔';
        trendQuotaIcon.className = 'trend-indicator ok';
    } else if (pcdPercent >= 2.0) {
        quotaSub.innerText = 'Cota mínima atendida (2%)';
        quotaSub.className = 'trend-text';
        trendQuotaIcon.innerText = '✔';
        trendQuotaIcon.className = 'trend-indicator ok';
    } else {
        quotaSub.innerText = 'Abaixo da cota legal (2%)';
        quotaSub.className = 'trend-text text-danger';
        trendQuotaIcon.innerText = '✘';
        trendQuotaIcon.className = 'trend-indicator down';
    }

    // 3. Admissões, Desligamentos e Turnover no Período
    // Filtra movimentações históricas que ocorreram dentro do intervalo de data filtrado
    let periodMovements = dataRaw.movimentacoes.filter(m => {
        const mDate = parseDate(m.Data);
        return mDate && mDate >= dateStart && mDate <= dateEnd;
    });

    if (state.selectedDept !== 'Todos') {
        periodMovements = periodMovements.filter(m => m.Área === state.selectedDept);
    }

    const admissionsCount = periodMovements.filter(m => m.Tipo === 'Admissão').length;
    const dismissalsCount = periodMovements.filter(m => m.Tipo === 'Desligamento').length;

    // Calcula Turnover Dinâmico (usando Headcount Final do período)
    const turnoverRate = totalHeadcount > 0 ? (dismissalsCount / totalHeadcount) * 100 : 0;

    // 4. Atualiza tabelas
    renderDepartmentTable(activeEmployees, periodMovements);
    renderEmployeeTable(filteredEmployees);

    // 5. Renderiza Gráficos
    renderEvolutionChart(dateStart, dateEnd);
    renderDisabilityChart(activeEmployees);
    renderSalaryByDeptChart(activeEmployees);
    renderComparativeCharts(activeEmployees, periodMovements);
}

// -------------------------------------------------------------
// 5. Renderizadores de Tabelas
// -------------------------------------------------------------

// Tabela 1: Departamentos e Líderes
function renderDepartmentTable(activeEmployees, periodMovements) {
    const tableBody = document.getElementById('table-departments-body');
    tableBody.innerHTML = '';

    const departments = ['RH', 'TI', 'Projetos', 'Financeiro', 'Jurídico', 'Operações', 'Marketing', 'Comercial'];
    
    departments.forEach(dept => {
        // Filtra funcionários e movimentações deste departamento
        const deptActive = activeEmployees.filter(emp => emp.Área === dept && emp.Status !== 'Desligado');
        const deptPcds = deptActive.filter(emp => emp.PCD === 'Sim');
        const deptMovements = periodMovements.filter(m => m.Área === dept);
        
        const deptHeadcount = deptActive.length;
        const deptPcdCount = deptPcds.length;
        
        let deptAvgSalary = 0;
        if (deptHeadcount > 0) {
            const sum = deptActive.reduce((acc, curr) => acc + parseFloat(curr['Salário (R$)']), 0);
            deptAvgSalary = sum / deptHeadcount;
        }

        // Calcula rotatividade deste departamento
        const deptDismissals = deptMovements.filter(m => m.Tipo === 'Desligamento').length;
        const deptTurnover = deptHeadcount > 0 ? (deptDismissals / deptHeadcount) * 100 : 0;

        // Dados do líder
        const leaderInfo = departmentLeaders[dept] || { name: 'Não Definido', role: '—' };

        const rowHTML = `
            <tr>
                <td style="font-weight: 600;">${dept}</td>
                <td>${leaderInfo.name}</td>
                <td><span style="font-size: 0.75rem; color: var(--text-secondary);">${leaderInfo.role}</span></td>
                <td class="text-center" style="font-weight: 500;">${deptHeadcount}</td>
                <td class="text-center">
                    <span class="pcd-badge ${deptPcdCount > 0 ? 'sim' : 'nao'}">${deptPcdCount}</span>
                </td>
                <td class="text-right" style="font-weight: 500;">${formatCurrency(deptAvgSalary)}</td>
                <td class="text-right" style="color: ${deptTurnover > 15 ? 'var(--color-danger)' : 'var(--text-primary)'}; font-weight: 500;">
                    ${deptTurnover.toFixed(1)}%
                </td>
            </tr>
        `;
        tableBody.innerHTML += rowHTML;
    });
}

// Tabela 2: Banco de Detalhes dos Colaboradores
function renderEmployeeTable(employees) {
    const tableBody = document.getElementById('table-employees-body');
    tableBody.innerHTML = '';
    
    if (employees.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center" style="color: var(--text-secondary); padding: 20px;">Nenhum funcionário encontrado.</td></tr>`;
        return;
    }

    employees.forEach(emp => {
        const admDate = formatDate(emp.parsedAdm);
        const statusClass = emp.Status.toLowerCase();
        const pcdClass = emp.PCD.toLowerCase();
        
        const rowHTML = `
            <tr>
                <td style="color: var(--text-secondary); font-family: monospace;">${emp.ID}</td>
                <td style="font-weight: 600;">${emp.Nome}</td>
                <td>${emp.Área}</td>
                <td>${emp.Cargo}</td>
                <td>
                    <span class="status-badge ${statusClass}">${emp.Status}</span>
                </td>
                <td>${admDate}</td>
                <td class="text-right" style="font-weight: 500; font-family: monospace;">${formatCurrency(emp['Salário (R$)'])}</td>
                <td class="text-center">
                    <span class="pcd-badge ${pcdClass}">${emp.PCD}</span>
                </td>
                <td style="font-size: 0.8rem; color: ${emp.PCD === 'Sim' ? '#2dd4bf' : 'var(--text-secondary)'};">
                    ${emp['Tipo Deficiência'] || '—'}
                </td>
            </tr>
        `;
        tableBody.innerHTML += rowHTML;
    });
}

// Filtra dinamicamente a tabela de colaboradores de acordo com o input
function filterEmployeeTable() {
    const query = document.getElementById('input-search-employees').value.toLowerCase();
    const rows = document.getElementById('table-employees-body').getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        if (cells.length < 2) continue;
        
        const name = cells[1].innerText.toLowerCase();
        const cargo = cells[3].innerText.toLowerCase();
        const dept = cells[2].innerText.toLowerCase();
        
        if (name.includes(query) || cargo.includes(query) || dept.includes(query)) {
            rows[i].style.display = '';
        } else {
            rows[i].style.display = 'none';
        }
    }
}

// Exportação da tabela atual para CSV UTF-8
function exportEmployeeTableToCSV() {
    const table = document.getElementById('table-employees');
    let csvContent = '\uFEFF'; // Adiciona BOM para caracteres especiais no Excel
    
    // Headers
    const headers = [];
    const ths = table.querySelectorAll('thead th');
    ths.forEach(th => headers.push(`"${th.innerText}"`));
    csvContent += headers.join(',') + '\n';
    
    // Rows
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        if (row.style.display === 'none') return;
        const cols = row.querySelectorAll('td');
        const rowData = [];
        cols.forEach(col => {
            let text = col.innerText.replace(/"/g, '""');
            rowData.push(`"${text}"`);
        });
        csvContent += rowData.join(',') + '\n';
    });
    
    // Download Link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Banco_Talentos_RH_PCD_${state.selectedDept}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// -------------------------------------------------------------
// 6. Configurações e Renderizações dos Gráficos (Chart.js)
// -------------------------------------------------------------

// Gráfico 1: Evolução Histórica (Headcount vs % PCD)
function renderEvolutionChart(dateStart, dateEnd) {
    const ctx = document.getElementById('chart-evolution').getContext('2d');
    
    // Filtra meses de KPIs no ano
    let kpiData = [...dataRaw.kpisMensais];
    
    // Ordena meses se necessário (presume Jan-Dez)
    const labels = kpiData.map(d => monthMap[d.Mês] ? monthMap[d.Mês].short + '/24' : d.Mês);
    const headcounts = kpiData.map(d => parseInt(d['Headcount Final']));
    const pcdPercentages = kpiData.map(d => parseFloat(d['% PCD']) * 100);

    if (charts.evolution) charts.evolution.destroy();

    charts.evolution = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Headcount Final',
                    data: headcounts,
                    borderColor: chartColors.blue,
                    backgroundColor: chartColors.blueAlpha,
                    borderWidth: 3,
                    pointBackgroundColor: chartColors.blue,
                    tension: 0.35,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Proporção PCD (%)',
                    data: pcdPercentages,
                    borderColor: chartColors.teal,
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    pointBackgroundColor: chartColors.teal,
                    pointStyle: 'circle',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    tension: 0.3,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: chartColors.text, font: { family: 'Inter', size: 11, weight: '500' } }
                },
                tooltip: {
                    backgroundColor: chartColors.tooltipBg,
                    borderColor: chartColors.tooltipBorder,
                    borderWidth: 1,
                    titleColor: '#fff',
                    bodyColor: chartColors.text,
                    padding: 10
                }
            },
            scales: {
                x: {
                    grid: { color: chartColors.grid },
                    ticks: { color: chartColors.text }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: chartColors.grid },
                    ticks: { color: chartColors.text },
                    title: { display: true, text: 'Funcionários Ativos', color: chartColors.text }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { 
                        color: chartColors.text,
                        callback: function(value) { return value.toFixed(1) + '%'; }
                    },
                    title: { display: true, text: 'Participação PCD (%)', color: chartColors.text }
                }
            }
        }
    });
}

// Gráfico 2: Distribuição por Tipo de Deficiência
function renderDisabilityChart(activeEmployees) {
    const ctx = document.getElementById('chart-disability-types').getContext('2d');
    
    // Filtra funcionários PCD ativos
    const activePcds = activeEmployees.filter(emp => emp.PCD === 'Sim' && emp.Status !== 'Desligado');
    
    // Contadores por tipo
    const counts = {
        'Auditiva': 0,
        'Visual': 0,
        'Motora': 0,
        'Intelectual': 0,
        'Múltipla': 0
    };
    
    activePcds.forEach(emp => {
        const type = emp['Tipo Deficiência'] || '';
        if (type.includes('Auditiva')) counts['Auditiva']++;
        else if (type.includes('Visual')) counts['Visual']++;
        else if (type.includes('Motora')) counts['Motora']++;
        else if (type.includes('Intelectual')) counts['Intelectual']++;
        else if (type.includes('Múltipla')) counts['Múltipla']++;
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    if (charts.disability) charts.disability.destroy();

    charts.disability = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#3b82f6', // Blue
                    '#0d9488', // Teal
                    '#8b5cf6', // Purple
                    '#f59e0b', // Yellow/Intellectual
                    '#ec4899'  // Pink/Multiple
                ],
                borderWidth: 2,
                borderColor: varColor('--bg-card', '#151522')
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: chartColors.text, font: { family: 'Inter', size: 12 } }
                },
                tooltip: {
                    backgroundColor: chartColors.tooltipBg,
                    borderColor: chartColors.tooltipBorder,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const val = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? (val / total * 100).toFixed(1) : 0;
                            return ` ${context.label}: ${val} (${pct}%)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

// Gráfico 3: Salário Médio por Departamento
function renderSalaryByDeptChart(activeEmployees) {
    const ctx = document.getElementById('chart-salary-by-dept').getContext('2d');
    
    const depts = ['RH', 'TI', 'Projetos', 'Financeiro', 'Jurídico', 'Operações', 'Marketing', 'Comercial'];
    const salaries = depts.map(dept => {
        const list = activeEmployees.filter(emp => emp.Área === dept && emp.Status !== 'Desligado');
        if (list.length === 0) return 0;
        const sum = list.reduce((acc, curr) => acc + parseFloat(curr['Salário (R$)']), 0);
        return Math.round(sum / list.length);
    });

    if (charts.salaryDept) charts.salaryDept.destroy();

    charts.salaryDept = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: depts,
            datasets: [{
                label: 'Salário Médio (R$)',
                data: salaries,
                backgroundColor: chartColors.purpleAlpha,
                borderColor: chartColors.purple,
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: chartColors.tooltipBg,
                    borderColor: chartColors.tooltipBorder,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) { return ` Salário: ${formatCurrency(context.raw)}`; }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: chartColors.grid },
                    ticks: { color: chartColors.text }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: chartColors.text }
                }
            }
        }
    });
}

// Gráfico 4: Comparativo Clustered (3 Canvas)
function renderComparativeCharts(activeEmployees, periodMovements) {
    const activePcd = activeEmployees.filter(emp => emp.PCD === 'Sim' && emp.Status !== 'Desligado');
    const activeNonPcd = activeEmployees.filter(emp => emp.PCD === 'Não' && emp.Status !== 'Desligado');

    // 1. Salário Médio
    let salaryPcd = 0, salaryNonPcd = 0;
    if (activePcd.length > 0) {
        salaryPcd = activePcd.reduce((acc, curr) => acc + parseFloat(curr['Salário (R$)']), 0) / activePcd.length;
    }
    if (activeNonPcd.length > 0) {
        salaryNonPcd = activeNonPcd.reduce((acc, curr) => acc + parseFloat(curr['Salário (R$)']), 0) / activeNonPcd.length;
    }

    // 2. Tempo de Empresa (Anos)
    const dateLimit = getPeriodLimits(state.periodType, state.selectedPeriod).end;
    let tenurePcd = 0, tenureNonPcd = 0;
    
    if (activePcd.length > 0) {
        const sumDays = activePcd.reduce((acc, curr) => {
            const days = (dateLimit - curr.parsedAdm) / (1000 * 60 * 60 * 24);
            return acc + (days / 365.25);
        }, 0);
        tenurePcd = sumDays / activePcd.length;
    }
    if (activeNonPcd.length > 0) {
        const sumDays = activeNonPcd.reduce((acc, curr) => {
            const days = (dateLimit - curr.parsedAdm) / (1000 * 60 * 60 * 24);
            return acc + (days / 365.25);
        }, 0);
        tenureNonPcd = sumDays / activeNonPcd.length;
    }

    // 3. Taxa de Afastamento (ou Desligamento Histórico)
    let ratePcd = 0, rateNonPcd = 0;
    let rateLabel = 'Taxa Desligamento (%)';
    
    if (state.simulationActive) {
        // Se a simulação de afastamento estiver ligada
        rateLabel = 'Taxa Afastamento (%)';
        const leavesPcd = activeEmployees.filter(emp => emp.PCD === 'Sim' && emp.Status === 'Afastado').length;
        const leavesNonPcd = activeEmployees.filter(emp => emp.PCD === 'Não' && emp.Status === 'Afastado').length;
        
        ratePcd = activePcd.length > 0 ? (leavesPcd / activePcd.length) * 100 : 0;
        rateNonPcd = activeNonPcd.length > 0 ? (leavesNonPcd / activeNonPcd.length) * 100 : 0;
    } else {
        // Se desligada, calcula taxa de desligamento histórico com base nas movimentações totais
        const movementsPcd = dataRaw.movimentacoes.filter(m => {
            const col = dataRaw.colaboradores.find(c => c.Nome === m.Nome);
            return col && col.PCD === 'Sim';
        });
        const movementsNonPcd = dataRaw.movimentacoes.filter(m => {
            const col = dataRaw.colaboradores.find(c => c.Nome === m.Nome);
            return col && col.PCD === 'Não';
        });
        
        const disPcd = movementsPcd.filter(m => m.Tipo === 'Desligamento').length;
        const disNonPcd = movementsNonPcd.filter(m => m.Tipo === 'Desligamento').length;
        
        // Denominador = ativos atuais + desligamentos históricos
        ratePcd = (activePcd.length + disPcd) > 0 ? (disPcd / (activePcd.length + disPcd)) * 100 : 0;
        rateNonPcd = (activeNonPcd.length + disNonPcd) > 0 ? (disNonPcd / (activeNonPcd.length + disNonPcd)) * 100 : 0;
    }

    // Renderiza os 3 sub-gráficos comparativos
    renderSubCompChart('chart-comp-salary', 'Salário Médio', [salaryPcd, salaryNonPcd], 'R$', chartColors.purple, chartColors.purpleAlpha);
    renderSubCompChart('chart-comp-tenure', 'Tempo Empresa (Anos)', [tenurePcd, tenureNonPcd], 'anos', chartColors.blue, chartColors.blueAlpha);
    renderSubCompChart('chart-comp-leaves', rateLabel, [ratePcd, rateNonPcd], '%', chartColors.teal, chartColors.tealAlpha);
}

// Helper para desenhar os gráficos menores do comparativo
function renderSubCompChart(canvasId, title, data, unit, color, colorAlpha) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Destrói instância anterior se existir
    if (charts[canvasId]) charts[canvasId].destroy();

    charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['PCD', 'Não PCD'],
            datasets: [{
                data: data,
                backgroundColor: [chartColors.tealAlpha, chartColors.blueAlpha],
                borderColor: [chartColors.teal, chartColors.blue],
                borderWidth: 2,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: title,
                    color: '#fff',
                    font: { family: 'Outfit', size: 11, weight: '600' },
                    padding: { bottom: 10 }
                },
                tooltip: {
                    backgroundColor: chartColors.tooltipBg,
                    borderColor: chartColors.tooltipBorder,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const val = context.raw;
                            if (unit === 'R$') return ` ${formatCurrency(val)}`;
                            return ` ${val.toFixed(1)} ${unit}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: chartColors.text, font: { size: 10 } }
                },
                y: {
                    grid: { color: chartColors.grid },
                    ticks: { 
                        color: chartColors.text, 
                        font: { size: 9 },
                        callback: function(value) {
                            if (unit === 'R$') return value >= 1000 ? (value/1000) + 'k' : value;
                            return value + (unit === '%' ? '%' : '');
                        }
                    }
                }
            }
        }
    });
}

// Helper para ler propriedades CSS no JS
function varColor(variableName, fallback) {
    return getComputedStyle(document.body).getPropertyValue(variableName).trim() || fallback;
}

// -------------------------------------------------------------
// 7. Handlers de Simulação
// -------------------------------------------------------------
function toggleLeaveSimulation() {
    state.simulationActive = document.getElementById('toggle-sim-leaves').checked;
    
    const textStatus = document.getElementById('sim-status-text');
    if (state.simulationActive) {
        textStatus.innerText = "Afastamentos simulados ativados (3 colaboradores).";
        textStatus.style.color = "var(--color-orange)";
    } else {
        textStatus.innerText = "Métricas de afastamento baseadas em zero.";
        textStatus.style.color = "var(--text-muted)";
    }
    
    applyFilters();
}
