/**
 * frontend/js/dashboard.js
 * Módulo de Inteligência — Predição ML, Alertas, Ranking, Consumo
 * Renderização premium com visual enterprise
 */

async function carregarAnaliseIA() {
    const divResultado = document.getElementById('resultado-ia');
    if (!divResultado) return;

    try {
        const resposta = await fetch('/api/dashboard/previsao');
        const dados = await resposta.json();

        if (dados.status === 'insuficiente') {
            divResultado.innerHTML = `
                <div style="display: flex; align-items: flex-start; gap: 14px; padding: 16px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 10px;">
                    <span style="font-size: 1.8rem; flex-shrink: 0;" aria-hidden="true">⚠️</span>
                    <div>
                        <p style="font-weight: 700; color: #f59e0b; margin-bottom: 4px; font-size: 0.85rem;">Dados Insuficientes</p>
                        <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.5;">${dados.mensagem}</p>
                    </div>
                </div>`;
        } else if (dados.status === 'sucesso') {
            const tendencia    = dados.tendencia_coeficiente > 0 ? '📈 Tendência crescente' : '📉 Tendência decrescente';
            const corTendencia = dados.tendencia_coeficiente > 0 ? '#ef4444' : '#10b981';

            // Métricas do modelo geral
            const metricas  = dados.previsao_geral?.metricas  || {};
            const qualidade = metricas.qualidade || 'moderado';
            const corQual   = { excelente: '#10b981', bom: '#3b82f6', moderado: '#f59e0b', fraco: '#ef4444' }[qualidade] || '#6b7280';
            const r2Pct     = metricas.r2_score != null ? (metricas.r2_score * 100).toFixed(1) : '--';

            // Blocos por tipo de veiculo
            const tiposHtml = Object.entries(dados.previsoes_por_tipo || {}).map(([tipo, info]) => {
                if (info.status === 'insuficiente') {
                    return `<div style="padding: 12px 14px; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(245,158,11,0.05); display:flex; align-items:center; gap:10px;">
                                <span style="font-size:1.2rem;">${tipo === 'Carro' ? '🚗' : '🚛'}</span>
                                <div>
                                    <span style="font-size:0.72rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px;">${tipo}</span>
                                    <p style="font-size:0.78rem; color:#f59e0b; margin-top:2px;">${info.mensagem}</p>
                                </div>
                            </div>`;
                }
                const prev100 = info.previsao_100k?.toFixed(2) ?? '--';
                const qTipo   = info.metricas?.qualidade || 'moderado';
                const corQt   = { excelente: '#10b981', bom: '#3b82f6', moderado: '#f59e0b', fraco: '#ef4444' }[qTipo] || '#6b7280';
                return `<div style="padding: 14px 16px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--white); display:flex; align-items:center; justify-content:space-between;">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <span style="font-size:1.4rem;">${tipo === 'Carro' ? '🚗' : '🚛'}</span>
                                <div>
                                    <span style="font-size:0.7rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); font-weight:700;">${tipo} · ${info.amostras} amostras</span>
                                    <p style="font-size:1.1rem; font-weight:900; color:#ef4444; margin-top:2px;">R$ ${prev100}</p>
                                    <span style="font-size:0.68rem; color:var(--text-muted);">aos 100.000 km</span>
                                </div>
                            </div>
                            <span style="padding: 4px 10px; border-radius: 20px; font-size: 0.68rem; font-weight: 700; background: ${corQt}22; color: ${corQt}; text-transform: uppercase; letter-spacing: 0.5px;">${qTipo}</span>
                        </div>`;
            }).join('');

            divResultado.innerHTML = `
                <div style="display: grid; gap: 14px;">

                    <!-- Amostra de treino -->
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: rgba(30, 58, 138, 0.06); border-radius: 10px; border: 1px solid rgba(30, 58, 138, 0.1);">
                        <div>
                            <span style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-muted); font-weight: 700;">Amostra de Treino</span>
                            <p style="font-size: 1.6rem; font-weight: 900; color: var(--primary-blue); margin-top: 2px;">${dados.total_analisado} <span style="font-size: 0.8rem; font-weight: 500;">ocorrências</span></p>
                        </div>
                        <span style="font-size: 2.4rem;" aria-hidden="true">🧬</span>
                    </div>

                    <!-- Previsão geral 100k -->
                    <div style="padding: 20px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.06), rgba(239, 68, 68, 0.02)); border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.12); text-align: center;">
                        <span style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-muted); font-weight: 700;">Custo Previsto (Frota Geral) · 100.000 km</span>
                        <p style="font-size: 2.8rem; font-weight: 900; color: #ef4444; margin: 8px 0 4px; letter-spacing: -0.03em;" aria-label="Previsão de custo: R$ ${dados.previsao_100k.toFixed(2)}">R$ ${dados.previsao_100k.toFixed(2)}</p>
                        <span style="font-size: 0.75rem; color: ${corTendencia}; font-weight: 600;">${tendencia}</span>
                    </div>

                    <!-- Métricas do modelo -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                        <div style="padding: 10px; background: var(--input-bg); border-radius: 8px; text-align: center;">
                            <span style="font-size: 0.6rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); font-weight: 700; display:block;">R²</span>
                            <strong style="font-size: 1.1rem; color: ${corQual};">${r2Pct}%</strong>
                        </div>
                        <div style="padding: 10px; background: var(--input-bg); border-radius: 8px; text-align: center;">
                            <span style="font-size: 0.6rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); font-weight: 700; display:block;">MAE</span>
                            <strong style="font-size: 1.1rem; color: var(--dark-black);">R$ ${metricas.mae?.toFixed(0) ?? '--'}</strong>
                        </div>
                        <div style="padding: 10px; background: ${corQual}22; border-radius: 8px; text-align: center; border: 1px solid ${corQual}44;">
                            <span style="font-size: 0.6rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); font-weight: 700; display:block;">Modelo</span>
                            <strong style="font-size: 0.85rem; color: ${corQual}; text-transform: capitalize;">${qualidade}</strong>
                        </div>
                    </div>

                    <!-- Previsões por tipo -->
                    ${tiposHtml ? `<div>
                        <span style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-muted); font-weight: 700; display: block; margin-bottom: 8px;">Por Categoria</span>
                        <div style="display: grid; gap: 8px;">${tiposHtml}</div>
                    </div>` : ''}

                    <!-- Rodapé -->
                    <div style="text-align: center; padding: 10px; background: var(--input-bg); border-radius: 8px;">
                        <span style="font-size: 0.7rem; color: var(--text-muted);">Algoritmo: <strong>Regressão Linear OLS (Scikit-Learn)</strong> · km registrado no momento da manutenção</span>
                    </div>
                </div>`;

            // Sincroniza o status global do subsistema analítico
            const iaStatus = document.getElementById('stat-ia-status');
            if (iaStatus) iaStatus.textContent = 'Ativo';
        }
    } catch (erro) {
        divResultado.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: rgba(239, 68, 68, 0.06); border-radius: 10px; border: 1px solid rgba(239, 68, 68, 0.15);">
                <span style="font-size: 1.8rem;" aria-hidden="true">❌</span>
                <div>
                    <p style="font-weight: 700; color: #ef4444; font-size: 0.85rem;">Erro de Conexão</p>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">Falha ao conectar com o modelo de IA.</p>
                </div>
            </div>`;
    }
}

async function carregarAlertas() {
    try {
        const resposta = await fetch('/api/dashboard/alertas');
        const alertas = await resposta.json();
        const lista = document.getElementById('lista-alertas');
        if (!lista) return;

        lista.innerHTML = '';

        if (alertas.length === 0) {
            lista.innerHTML = `
                <li style="padding: 20px; background: rgba(16, 185, 129, 0.06); border-radius: 10px; border: 1px solid rgba(16, 185, 129, 0.15); display: flex; align-items: center; gap: 12px;" role="status">
                    <span style="font-size: 1.6rem;" aria-hidden="true">✅</span>
                    <div>
                        <strong style="color: #10b981; font-size: 0.85rem;">Frota Saudável</strong>
                        <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">Nenhuma manutenção pendente detectada.</p>
                    </div>
                </li>`;
            return;
        }

        alertas.forEach(alerta => {
            const isVencida = alerta.mensagem.includes("vencida");
            const icon = isVencida ? '🚨' : '⚠️';
            const corDestaque = isVencida ? '#ef4444' : '#f59e0b';
            const corFundoIcone = isVencida ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)';
            const borderGlow = isVencida ? '0 0 10px rgba(239, 68, 68, 0.15)' : 'none';
            
            // Parse da mensagem para extrair informações (se for revisão vencida)
            let infoExtra = '';
            if (isVencida) {
                const match = alerta.mensagem.match(/Última: (\d+) km\. Atual: (\d+) km\./);
                if (match) {
                    const ultima = parseInt(match[1]).toLocaleString('pt-BR');
                    const atual = parseInt(match[2]).toLocaleString('pt-BR');
                    const excedido = (parseInt(match[2]) - (parseInt(match[1]) + 10000)).toLocaleString('pt-BR');
                    infoExtra = `
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px;">
                            <div style="background: rgba(128, 128, 128, 0.05); padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(128, 128, 128, 0.1);">
                                <span style="font-size: 0.62rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; display: block; letter-spacing: 0.5px;">KM Atual</span>
                                <strong style="font-size: 0.95rem; color: var(--pro-text);">${atual}</strong>
                            </div>
                            <div style="background: rgba(239, 68, 68, 0.08); padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2);">
                                <span style="font-size: 0.62rem; text-transform: uppercase; color: #ef4444; font-weight: 800; display: block; letter-spacing: 0.5px;">Excedido</span>
                                <strong style="font-size: 0.95rem; color: #ef4444;">+${excedido} km</strong>
                            </div>
                        </div>
                    `;
                } else {
                    infoExtra = `<p style="font-size: 0.8rem; color: ${corDestaque}; font-weight: 600; margin-top: 6px;">${alerta.mensagem}</p>`;
                }
            } else {
                infoExtra = `<p style="font-size: 0.8rem; color: ${corDestaque}; font-weight: 600; margin-top: 6px;">${alerta.mensagem}</p>`;
            }

            const li = document.createElement('li');
            li.setAttribute('role', 'alert');
            li.style = `margin-bottom: 12px; padding: 16px; border: 1px solid ${isVencida ? 'rgba(239,68,68,0.3)' : 'var(--pro-border)'}; background: var(--pro-card-bg); border-radius: 12px; box-shadow: ${borderGlow}; transition: all 0.2s; position: relative; overflow: hidden;`;
            li.onmouseover = function() { this.style.transform = 'translateY(-2px)'; this.style.borderColor = corDestaque; };
            li.onmouseout = function() { this.style.transform = 'translateY(0)'; this.style.borderColor = isVencida ? 'rgba(239,68,68,0.3)' : 'var(--pro-border)'; };

            li.innerHTML = `
                ${isVencida ? `<div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: ${corDestaque};"></div>` : ''}
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding-left: ${isVencida ? '4px' : '0'};">
                    
                    <div style="display: flex; gap: 14px; flex: 1;">
                        <div style="background: ${corFundoIcone}; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; border: 1px solid ${corDestaque}33;">
                            <span aria-hidden="true">${icon}</span>
                        </div>
                        
                        <div style="flex: 1;">
                            <strong style="color: var(--pro-text); font-size: 0.95rem; display: block; margin-bottom: 4px; letter-spacing: -0.01em;">${alerta.veiculo}</strong>
                            <span style="font-size: 0.65rem; padding: 3px 8px; border-radius: 20px; background: ${corDestaque}15; color: ${corDestaque}; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">${isVencida ? 'Ação Crítica' : 'Atenção'}</span>
                            
                            ${infoExtra}
                        </div>
                    </div>

                    <button onclick="confirmarRevisaoDireta(${alerta.veiculo_id}, ${alerta.km_atual}, '${alerta.veiculo}')"
                            style="background: var(--input-bg); color: var(--text-muted); border: 1px solid var(--pro-border); border-radius: 10px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 40px; height: 40px; flex-shrink: 0;"
                            onmouseover="this.style.background='#10b981'; this.style.color='white'; this.style.borderColor='#10b981'; this.style.boxShadow='0 4px 10px rgba(16,185,129,0.3)';"
                            onmouseout="this.style.background='var(--input-bg)'; this.style.color='var(--text-muted)'; this.style.borderColor='var(--pro-border)'; this.style.boxShadow='none';"
                            title="Concluir Revisão e Resolver Risco"
                            aria-label="Confirmar revisão do veículo ${alerta.veiculo}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </button>
                </div>
            `;
            lista.appendChild(li);
        });
    } catch (erro) {
        console.error('Erro nos alertas:', erro);
    }
}

async function confirmarRevisaoDireta(veiculoId, kmAtual, nomeVeiculo) {
    const descricao = prompt(`O que foi feito no ${nomeVeiculo} (${kmAtual}km)?`, "Revisão preventiva completa.");
    if (descricao === null) return;
    const custo = prompt("Qual o valor total gasto?", "500.00");
    if (custo === null) return;

    const dados = {
        veiculo_id: veiculoId,
        data_manutencao: new Date().toISOString().split('T')[0],
        tipo: 'Preventiva',
        custo: parseFloat(custo),
        descricao: descricao,
        quilometragem: kmAtual
    };

    const resposta = await fetch('/api/manutencoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });

    if (resposta.ok) {
        alert("Revisão registrada com sucesso!");
        carregarAlertas();
    }
}

async function carregarConsumo() {
    try {
        const resposta = await fetch('/api/dashboard/consumo');
        const consumos = await resposta.json();
        const tbody = document.getElementById('lista-consumo');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (consumos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 30px; color: var(--text-muted);">
                <span style="font-size: 2rem; display: block; margin-bottom: 8px;">📊</span>
                <span style="font-weight: 600;">Sem dados de consumo registrados.</span>
            </td></tr>`;
            return;
        }

        consumos.forEach(c => {
            tbody.innerHTML += `
                <tr style="transition: background 0.2s;" onmouseover="this.style.background='var(--primary-blue-glow)'" onmouseout="this.style.background=''">
                    <td><strong style="color: var(--primary-blue);">${c.veiculo}</strong></td>
                    <td style="font-weight: 700; color: var(--primary-blue);">${c.eficiencia}</td>
                    <td>${c.custo_km}</td>
                    <td style="color: #ef4444; font-weight: 700;">${c.co2_total}</td>
                </tr>
            `;
        });
    } catch (erro) {
        console.error('Erro no consumo:', erro);
    }
}

async function carregarRanking() {
    try {
        const resposta = await fetch('/api/dashboard/ranking');
        const ranking = await resposta.json();
        const lista = document.getElementById('lista-ranking');
        if (!lista) return;

        lista.innerHTML = '';

        if (ranking.length === 0) {
            lista.innerHTML = `
                <li style="text-align: center; padding: 20px; color: var(--text-muted);" role="status">
                    <span style="font-size: 2rem; display: block; margin-bottom: 6px;">🏆</span>
                    <span style="font-weight: 600; font-size: 0.85rem;">Sem dados de abastecimento.</span>
                </li>`;
            return;
        }

        ranking.forEach((motorista, index) => {
            const bgColors = ['rgba(250, 204, 21, 0.08)', 'rgba(192, 192, 192, 0.06)', 'rgba(205, 127, 50, 0.06)', 'transparent', 'transparent'];
            const borderColors = ['rgba(250, 204, 21, 0.2)', 'rgba(192, 192, 192, 0.15)', 'rgba(205, 127, 50, 0.12)', 'var(--border-color)', 'var(--border-color)'];

            const li = document.createElement('li');
            li.setAttribute('role', 'listitem');
            li.style = `display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: ${bgColors[index] || 'transparent'}; border-radius: 10px; border: 1px solid ${borderColors[index] || 'var(--border-color)'}; transition: all 0.2s;`;
            li.onmouseover = function() { this.style.transform = 'translateX(4px)'; };
            li.onmouseout = function() { this.style.transform = 'translateX(0)'; };

            li.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 1.6rem;" aria-label="Posição ${index + 1}">${motorista.posicao}</span>
                    <div>
                        <strong style="color: var(--dark-black); display: block; font-size: 0.9rem;">${motorista.nome}</strong>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">Média: <strong style="color: #10b981;">${motorista.preco_medio}</strong></span>
                    </div>
                </div>
                <div style="text-align: right;">
                    <span style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--primary-blue);">${motorista.gasto}</span>
                    <span style="display: block; font-size: 0.7rem; color: #ef4444; font-weight: 600;">${motorista.co2} CO₂</span>
                </div>
            `;
            lista.appendChild(li);
        });
    } catch (erro) {
        console.error('Erro no ranking:', erro);
    }
}

// ──── INICIALIZAÇÃO ────
window.onload = () => {
    carregarAnaliseIA();
    carregarAlertas();
    carregarConsumo();
    carregarRanking();
};