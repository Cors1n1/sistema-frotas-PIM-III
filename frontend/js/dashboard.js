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
            const tendencia = dados.tendencia_coeficiente > 0 ? '📈 Tendência crescente' : '📉 Tendência decrescente';
            const corTendencia = dados.tendencia_coeficiente > 0 ? '#ef4444' : '#10b981';

            divResultado.innerHTML = `
                <div style="display: grid; gap: 16px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: rgba(30, 58, 138, 0.06); border-radius: 10px; border: 1px solid rgba(30, 58, 138, 0.1);">
                        <div>
                            <span style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-muted); font-weight: 700;">Amostra de Treino</span>
                            <p style="font-size: 1.6rem; font-weight: 900; color: var(--primary-blue); margin-top: 2px;">${dados.total_analisado} <span style="font-size: 0.8rem; font-weight: 500;">ocorrências</span></p>
                        </div>
                        <span style="font-size: 2.4rem;" aria-hidden="true">🧬</span>
                    </div>

                    <div style="padding: 20px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.06), rgba(239, 68, 68, 0.02)); border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.12); text-align: center;">
                        <span style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-muted); font-weight: 700;">Custo Previsto aos 100.000 Km</span>
                        <p style="font-size: 2.8rem; font-weight: 900; color: #ef4444; margin: 8px 0 4px; letter-spacing: -0.03em;" aria-label="Previsão de custo: R$ ${dados.previsao_100k.toFixed(2)}">R$ ${dados.previsao_100k.toFixed(2)}</p>
                        <span style="font-size: 0.75rem; color: ${corTendencia}; font-weight: 600;">${tendencia}</span>
                    </div>

                    <div style="text-align: center; padding: 10px; background: var(--input-bg); border-radius: 8px;">
                        <span style="font-size: 0.7rem; color: var(--text-muted);">Modelo: <strong>Regressão Linear (Scikit-Learn)</strong> · Confiança baseada em ${dados.total_analisado} pontos</span>
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
            let porcentagem = (alerta.km_atual / 10000) * 100;
            if (porcentagem > 100) porcentagem = 100;

            const li = document.createElement('li');
            li.setAttribute('role', 'alert');
            li.style = `margin-bottom: 12px; padding: 16px; border: 1px solid var(--border-color); background: var(--white); border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.04);`;

            li.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.2rem;" aria-hidden="true">⚠️</span>
                        <strong style="color: var(--dark-black); font-size: 0.88rem;">${alerta.veiculo}</strong>
                    </div>
                    <button onclick="confirmarRevisaoDireta(${alerta.veiculo_id}, ${alerta.km_atual}, '${alerta.veiculo}')"
                            style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 7px 16px; border-radius: 8px; cursor: pointer; font-size: 0.75rem; font-weight: 700; transition: all 0.2s; letter-spacing: 0.5px;"
                            onmouseover="this.style.transform='translateY(-1px)'"
                            onmouseout="this.style.transform='translateY(0)'"
                            aria-label="Confirmar revisão do veículo ${alerta.veiculo}">
                        ✔ Concluir
                    </button>
                </div>
                <div style="background: rgba(239, 68, 68, 0.08); width: 100%; height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 8px;" role="progressbar" aria-valuenow="${porcentagem}" aria-valuemin="0" aria-valuemax="100">
                    <div style="background: linear-gradient(90deg, #f59e0b, #ef4444); width: ${porcentagem}%; height: 100%; border-radius: 3px; transition: width 1s ease;"></div>
                </div>
                <span style="color: #ef4444; font-size: 0.8rem; font-weight: 500;">${alerta.mensagem}</span>
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