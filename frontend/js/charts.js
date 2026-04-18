/**
 * frontend/js/charts.js
 * Business Intelligence — Visualização Premium com Chart.js
 * Gráficos com gradientes, animações e adaptação Dark/Light Mode
 */

async function renderizarGraficos() {
    console.log("⚡ Inicializando pipeline de dados do Dashboard...");

    const chartCustosElement = document.getElementById('chartCustos');
    const chartCO2Element = document.getElementById('chartCO2');

    // Skeleton Loading Screen
    const skeletonHTML = '<div class="skeleton-loader" style="width:100%;height:100%;background:linear-gradient(90deg,var(--border-color) 25%,var(--white) 50%,var(--border-color) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px;"></div>';

    if (chartCustosElement) {
        chartCustosElement.parentElement.innerHTML = skeletonHTML + '<canvas id="chartCustos" style="display:none;"></canvas>';
    }
    if (chartCO2Element) {
        chartCO2Element.parentElement.innerHTML = skeletonHTML + '<canvas id="chartCO2" style="display:none;"></canvas>';
    }

    try {
        // Buscar dados + contadores extras em paralelo
        const [resConsumo, resAbast, resManut, resMotoristas] = await Promise.all([
            fetch('/api/dashboard/consumo'),
            fetch('/api/abastecimentos').catch(() => null),
            fetch('/api/manutencoes').catch(() => null),
            fetch('/api/motoristas').catch(() => null)
        ]);

        const dados = await resConsumo.json();

        // Mini Stats (Dashboard novo)
        if (resAbast && resAbast.ok) {
            const abasts = await resAbast.json();
            const el = document.getElementById('stat-abastecimentos');
            if (el) el.textContent = abasts.length;
        }
        if (resManut && resManut.ok) {
            const manuts = await resManut.json();
            const el = document.getElementById('stat-manutencoes');
            if (el) el.textContent = manuts.length;
        }
        if (resMotoristas && resMotoristas.ok) {
            const mots = await resMotoristas.json();
            const el = document.getElementById('stat-motoristas');
            if (el) el.textContent = mots.length;
        }

        if (dados.length === 0) {
            const kpiV = document.getElementById('kpi-veiculos');
            if (kpiV) kpiV.textContent = "0";

            // Remove skeleton e mostra mensagens
            const canvasCustos = document.getElementById('chartCustos');
            const canvasCO2 = document.getElementById('chartCO2');
            if (canvasCustos) {
                const skel = canvasCustos.previousSibling;
                if (skel) skel.remove();
                canvasCustos.parentElement.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-muted);"><span style="font-size:3rem;margin-bottom:10px;">📊</span><p style="font-weight:600;">Sem dados disponíveis</p><p style="font-size:0.8rem;">Registre abastecimentos para gerar o gráfico.</p></div>';
            }
            if (canvasCO2) {
                const skel = canvasCO2.previousSibling;
                if (skel) skel.remove();
                canvasCO2.parentElement.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-muted);"><span style="font-size:3rem;margin-bottom:10px;">🌱</span><p style="font-weight:600;">Sem dados de emissões</p><p style="font-size:0.8rem;">Os dados de CO₂ aparecerão aqui.</p></div>';
            }
            return;
        }

        const labels = dados.map(d => d.veiculo);
        const custos = dados.map(d => parseFloat(d.total_gasto.replace('R$ ', '')) || 0);
        const co2 = dados.map(d => parseFloat(d.co2_total.replace(' kg', '')) || 0);

        const custoTotalAcumulado = custos.reduce((acc, curr) => acc + curr, 0);
        const co2TotalAcumulado = co2.reduce((acc, curr) => acc + curr, 0);

        // Atualizar KPIs
        if (document.getElementById('kpi-veiculos')) {
            document.getElementById('kpi-veiculos').textContent = dados.length;
            document.getElementById('kpi-custo-total').textContent = `R$ ${custoTotalAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            document.getElementById('kpi-co2-total').textContent = `${co2TotalAcumulado.toFixed(2)} kg`;
        }

        // ── Configuração global do Chart.js ──
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        Chart.defaults.color = isDark ? '#94a3b8' : '#64748b';
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.font.weight = '500';

        const gridColor = isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(226, 232, 240, 0.8)';

        // ── Gráfico de Barras (Custos) ──
        const canvasCustos = document.getElementById('chartCustos');
        if (canvasCustos) {
            const skel = canvasCustos.previousSibling;
            if (skel) skel.remove();
            canvasCustos.style.display = 'block';

            const ctx = canvasCustos.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, isDark ? 'rgba(96, 165, 250, 0.9)' : 'rgba(30, 58, 138, 0.9)');
            gradient.addColorStop(1, isDark ? 'rgba(96, 165, 250, 0.3)' : 'rgba(30, 58, 138, 0.3)');

            new Chart(canvasCustos, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Investimento (R$)',
                        data: custos,
                        backgroundColor: gradient,
                        borderColor: isDark ? '#60a5fa' : '#1e3a8a',
                        borderWidth: 2,
                        borderRadius: 10,
                        borderSkipped: false,
                        hoverBackgroundColor: '#facc15',
                        hoverBorderColor: '#f59e0b',
                        barPercentage: 0.65,
                        categoryPercentage: 0.7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 1200, easing: 'easeOutQuart' },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: isDark ? '#1e293b' : '#111827',
                            titleColor: '#facc15',
                            bodyColor: '#f8fafc',
                            borderColor: isDark ? '#334155' : '#1e3a8a',
                            borderWidth: 1,
                            cornerRadius: 10,
                            padding: 14,
                            titleFont: { weight: '700' },
                            callbacks: {
                                label: ctx => `  💰 R$ ${ctx.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: gridColor, drawBorder: false },
                            ticks: {
                                callback: v => 'R$ ' + v.toLocaleString('pt-BR'),
                                font: { size: 11 }
                            },
                            border: { display: false }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { font: { size: 11, weight: '600' } },
                            border: { display: false }
                        }
                    }
                }
            });
        }

        // ── Gráfico Doughnut (CO₂) ──
        const canvasCO2 = document.getElementById('chartCO2');
        if (canvasCO2) {
            const skel = canvasCO2.previousSibling;
            if (skel) skel.remove();
            canvasCO2.style.display = 'block';

            const paletaCO2 = isDark
                ? ['#60a5fa', '#fde047', '#f87171', '#34d399', '#a78bfa', '#fb923c']
                : ['#1e3a8a', '#facc15', '#ef4444', '#10b981', '#8b5cf6', '#f97316'];

            new Chart(canvasCO2, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: co2,
                        backgroundColor: paletaCO2.slice(0, labels.length),
                        borderWidth: 3,
                        borderColor: isDark ? '#1e293b' : '#ffffff',
                        hoverOffset: 20,
                        hoverBorderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 1400, easing: 'easeOutQuart', animateRotate: true },
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                boxWidth: 14,
                                padding: 18,
                                font: { size: 12, weight: '600' },
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            backgroundColor: isDark ? '#1e293b' : '#111827',
                            titleColor: '#facc15',
                            bodyColor: '#f8fafc',
                            borderColor: isDark ? '#334155' : '#1e3a8a',
                            borderWidth: 1,
                            cornerRadius: 10,
                            padding: 14,
                            callbacks: {
                                label: ctx => `  🌱 ${ctx.parsed.toFixed(2)} kg CO₂`
                            }
                        }
                    },
                    cutout: '72%'
                }
            });
        }

    } catch (erro) {
        console.error("❌ Erro ao processar dados do dashboard:", erro);
    }
}

document.addEventListener('DOMContentLoaded', renderizarGraficos);