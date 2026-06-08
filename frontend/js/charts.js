/**
 * frontend/js/charts.js
 * Dashboard Executivo — Visualização Premium com Chart.js e Glassmorphism
 */

async function renderizarDashboard() {
    console.log("⚡ Inicializando pipeline de dados do Dashboard...");

    const timelineEl = document.getElementById('timeline-feed');
    
    try {
        // Fetch all required data in parallel
        const [resConsumo, resAbast, resManut, resVeiculos] = await Promise.all([
            fetch('/api/dashboard/consumo').catch(() => null),
            fetch('/api/abastecimentos').catch(() => null),
            fetch('/api/manutencoes').catch(() => null),
            fetch('/api/veiculos').catch(() => null)
        ]);

        let dadosConsumo = [];
        if (resConsumo && resConsumo.ok) dadosConsumo = await resConsumo.json();
        
        let abastecimentos = [];
        if (resAbast && resAbast.ok) abastecimentos = await resAbast.json();
        
        let manutencoes = [];
        if (resManut && resManut.ok) manutencoes = await resManut.json();
        
        let veiculos = [];
        if (resVeiculos && resVeiculos.ok) veiculos = await resVeiculos.json();

        // 1. Processar KPIs
        const frotaAtiva = veiculos.length;
        const kmTotal = veiculos.reduce((acc, v) => acc + (Number(v.quilometragem) || 0), 0);
        
        let custoCombustivelTotal = abastecimentos.reduce((acc, a) => acc + (Number(a.valor_total) || 0), 0);
        let custoManutencaoTotal = manutencoes.reduce((acc, m) => acc + (Number(m.custo) || 0), 0);
        let custoTotal = custoCombustivelTotal + custoManutencaoTotal;

        // Map para nome dos veiculos (ID -> Placa/Modelo)
        const mapaVeiculos = {};
        veiculos.forEach(v => { mapaVeiculos[v.id] = `${v.placa} (${v.modelo})`; });

        // Identificar Veículo de Maior Despesa
        const gastosPorVeiculo = {};
        veiculos.forEach(v => { gastosPorVeiculo[v.id] = 0; });
        
        abastecimentos.forEach(a => { if (gastosPorVeiculo[a.veiculo_id] !== undefined) gastosPorVeiculo[a.veiculo_id] += Number(a.valor_total); });
        manutencoes.forEach(m => { if (gastosPorVeiculo[m.veiculo_id] !== undefined) gastosPorVeiculo[m.veiculo_id] += Number(m.custo); });

        let maiorGasto = -1;
        let veiculoMaiorGasto = "--";
        
        for (const vid in gastosPorVeiculo) {
            if (gastosPorVeiculo[vid] > maiorGasto && gastosPorVeiculo[vid] > 0) {
                maiorGasto = gastosPorVeiculo[vid];
                veiculoMaiorGasto = mapaVeiculos[vid] || `ID ${vid}`;
            }
        }

        // Atualizar Tela - KPIs
        document.getElementById('kpi-veiculos').textContent = frotaAtiva;
        document.getElementById('kpi-km-total').textContent = `${kmTotal.toLocaleString('pt-BR')} km`;
        document.getElementById('kpi-custo-total').textContent = `R$ ${custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        
        const kpiMaiorDespesa = document.getElementById('kpi-maior-despesa');
        if (veiculoMaiorGasto !== "--") {
            const veicCurto = veiculoMaiorGasto.split(' ').slice(0, 2).join(' ');
            kpiMaiorDespesa.innerHTML = `<span style="font-size:0.8rem" class="d-none-mobile">${veiculoMaiorGasto}</span><span style="font-size:0.8rem" class="d-show-mobile">${veicCurto}</span><br>R$ ${maiorGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        }

        // 2. Processar Feed de Atividades
        const feed = [];
        abastecimentos.forEach(a => feed.push({ ...a, _tipoItem: 'abast', _dataReal: new Date(a.data_abastecimento) }));
        manutencoes.forEach(m => feed.push({ ...m, _tipoItem: 'manut', _dataReal: new Date(m.data_manutencao) }));
        
        // Ordenar decrescente
        feed.sort((a, b) => b._dataReal - a._dataReal);
        
        // Renderizar Top 8 no Timeline
        timelineEl.innerHTML = '';
        if (feed.length === 0) {
            timelineEl.innerHTML = '<div style="color:var(--text-muted);padding:10px;">Nenhuma atividade recente.</div>';
        } else {
            feed.slice(0, 8).forEach(item => {
                const li = document.createElement('li');
                li.className = 'timeline-item';
                
                const nomeCarro = mapaVeiculos[item.veiculo_id] || 'Veículo Desconhecido';
                const nomeCurto = nomeCarro.split(' ').slice(0, 2).join(' ');
                const nomeHTML = `<span class="d-none-mobile">${nomeCarro}</span><span class="d-show-mobile">${nomeCurto}</span>`;
                
                const dataFormatada = item._dataReal.toLocaleDateString('pt-BR');
                const valorItem = item._tipoItem === 'abast' ? item.valor_total : item.custo;
                const custoFormatado = `R$ ${Number(valorItem).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

                if (item._tipoItem === 'abast') {
                    li.innerHTML = `
                        <div class="timeline-icon fuel" title="Abastecimento">⛽</div>
                        <div class="timeline-content">
                            <span class="time-date">${dataFormatada}</span>
                            <h4 class="time-title">Abastecimento</h4>
                            <p class="time-desc">${nomeHTML} • ${item.litros}L de ${item.tipo_combustivel}</p>
                            <span class="time-value">${custoFormatado}</span>
                        </div>
                    `;
                } else {
                    li.innerHTML = `
                        <div class="timeline-icon maint" title="Manutenção">🔧</div>
                        <div class="timeline-content">
                            <span class="time-date">${dataFormatada}</span>
                            <h4 class="time-title">Manutenção (${item.tipo})</h4>
                            <p class="time-desc">${nomeHTML} • ${item.descricao}</p>
                            <span class="time-value" style="color:#f59e0b;">${custoFormatado}</span>
                        </div>
                    `;
                }
                timelineEl.appendChild(li);
            });
        }

        // 3. Preparar Gráficos Chart.js
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        Chart.defaults.color = isDark ? '#94a3b8' : '#64748b';
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.font.weight = '600';
        const gridColor = isDark ? 'rgba(71, 85, 105, 0.2)' : 'rgba(226, 232, 240, 0.6)';

        // a) Gráfico de Custos por Veículo (Area Chart elegante)
        const labelsVeiculos = [];
        const dataCustos = [];
        veiculos.forEach(v => {
            if (gastosPorVeiculo[v.id] > 0) {
                labelsVeiculos.push(v.placa);
                dataCustos.push(gastosPorVeiculo[v.id]);
            }
        });

        const ctxCustos = document.getElementById('chartCustos').getContext('2d');
        const bgGradCustos = ctxCustos.createLinearGradient(0, 0, 0, 400);
        bgGradCustos.addColorStop(0, isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.3)');
        bgGradCustos.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

        const borderGradCustos = ctxCustos.createLinearGradient(0, 0, 400, 0);
        borderGradCustos.addColorStop(0, '#3b82f6');
        borderGradCustos.addColorStop(1, '#8b5cf6');

        const tooltipCustom = {
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            titleColor: isDark ? '#f8fafc' : '#0f172a',
            bodyColor: isDark ? '#94a3b8' : '#475569',
            borderColor: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)',
            borderWidth: 1,
            padding: 14,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13, weight: '600' },
            boxPadding: 6,
            usePointStyle: true,
            cornerRadius: 12
        };

        new Chart(ctxCustos, {
            type: 'bar',
            data: {
                labels: labelsVeiculos.length ? labelsVeiculos : ['Sem dados'],
                datasets: [{
                    label: 'Investimento (R$)',
                    data: dataCustos.length ? dataCustos : [0],
                    backgroundColor: bgGradCustos,
                    borderColor: borderGradCustos,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                    barPercentage: 0.6,
                    hoverBackgroundColor: borderGradCustos
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        ...tooltipCustom,
                        callbacks: {
                            label: ctx => ` R$ ${ctx.raw.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        }
                    }
                },
                scales: {
                    y: { 
                        grid: { color: gridColor, drawBorder: false }, 
                        border: { display: false },
                        beginAtZero: true,
                        ticks: {
                            callback: function(val) { return 'R$ ' + val; }
                        }
                    },
                    x: { grid: { display: false }, border: { display: false } }
                }
            }
        });

        // Configuração comum para os Doughnuts (mantido para a proporção)
        const doughnutOptions = {
            responsive: true, maintainAspectRatio: false, cutout: '78%',
            plugins: { 
                legend: { 
                    position: 'bottom', 
                    labels: { padding: 20, usePointStyle: true, pointStyle: 'circle', font: { weight: '600' } } 
                },
                tooltip: tooltipCustom
            }
        };

        // b) Gráfico CO2 (Polar Area - Excelente para impactos múltiplos)
        const labelsCO2 = dadosConsumo.map(d => d.veiculo);
        const dataCO2 = dadosConsumo.map(d => parseFloat(d.co2_total.replace(' kg', '')) || 0);

        // Paleta extensa e vibrante para suportar muitos veículos
        const baseColors = [
            '16, 185, 129',  // Emerald
            '59, 130, 246',  // Blue
            '245, 158, 11',  // Amber
            '239, 68, 68',   // Red
            '139, 92, 246',  // Violet
            '6, 182, 212',   // Cyan
            '236, 72, 153',  // Pink
            '132, 204, 22',  // Lime
            '99, 102, 241',  // Indigo
            '249, 115, 22',  // Orange
            '20, 184, 166',  // Teal
            '168, 85, 247',  // Purple
            '234, 179, 8',   // Yellow
            '217, 70, 239',  // Fuchsia
            '14, 165, 233'   // Sky
        ];

        const bgColorsCO2 = labelsCO2.map((_, i) => `rgba(${baseColors[i % baseColors.length]}, 0.75)`);
        const hoverColorsCO2 = labelsCO2.map((_, i) => `rgba(${baseColors[i % baseColors.length]}, 1)`);

        const ctxCO2 = document.getElementById('chartCO2').getContext('2d');
        new Chart(ctxCO2, {
            type: 'polarArea',
            data: {
                labels: labelsCO2.length ? labelsCO2 : ['Sem dados'],
                datasets: [{
                    data: dataCO2.length ? dataCO2 : [1],
                    backgroundColor: labelsCO2.length ? bgColorsCO2 : ['rgba(16, 185, 129, 0.75)'],
                    borderWidth: 2, borderColor: isDark ? '#1e293b' : '#ffffff',
                    hoverBackgroundColor: labelsCO2.length ? hoverColorsCO2 : ['rgba(16, 185, 129, 1)']
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                layout: { padding: 0 },
                scales: {
                    r: {
                        ticks: { display: false },
                        grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                        angleLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
                    }
                },
                plugins: {
                    legend: { 
                        position: 'right', 
                        labels: { 
                            padding: 12, 
                            usePointStyle: true, 
                            pointStyle: 'circle', 
                            boxWidth: 8,
                            font: { weight: '600', size: 10 } 
                        } 
                    },
                    tooltip: {
                        ...tooltipCustom,
                        callbacks: {
                            label: ctx => ` ${ctx.raw} kg de CO₂`
                        }
                    }
                }
            }
        });

        // c) Gráfico Combustível vs Manutenção (Doughnut)
        const ctxProp = document.getElementById('chartProporcao').getContext('2d');
        new Chart(ctxProp, {
            type: 'doughnut',
            data: {
                labels: ['Combustível', 'Manutenção'],
                datasets: [{
                    data: [custoCombustivelTotal, custoManutencaoTotal],
                    backgroundColor: ['#3b82f6', '#f59e0b'],
                    borderWidth: 3, borderColor: isDark ? '#1e293b' : '#ffffff',
                    hoverOffset: 6
                }]
            },
            options: {
                ...doughnutOptions,
                plugins: {
                    ...doughnutOptions.plugins,
                    tooltip: {
                        ...tooltipCustom,
                        callbacks: {
                            label: ctx => ` R$ ${ctx.parsed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        }
                    }
                }
            }
        });

    } catch (erro) {
        console.error("❌ Erro ao processar dados do dashboard:", erro);
        timelineEl.innerHTML = '<div style="color:var(--text-muted);padding:10px;">Erro ao carregar atividades.</div>';
    }
}

document.addEventListener('DOMContentLoaded', renderizarDashboard);