/**
 * frontend/js/dashboard.js
 * Dashboard – Predição, Alertas, Ranking, Consumo
 * Indicadores consolidados do sistema
 */

/* ══════════════════════════════════════════
   HELPERS VISUAIS
══════════════════════════════════════════ */

function badgeQualidade(qualidade) {
    const map = {
        excelente: { cor: '#10b981', bg: 'rgba(16,185,129,0.12)', label: '✅ Excelente' },
        bom:       { cor: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  label: '👍 Bom' },
        moderado:  { cor: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: '⚠️ Regular' },
        fraco:     { cor: '#ef4444', bg: 'rgba(239,68,68,0.12)',   label: '❌ Fraco' }
    };
    const s = map[qualidade] || map.moderado;
    return `<span style="display:inline-block;padding:4px 10px;border-radius:8px;font-size:0.72rem;font-weight:800;background:${s.bg};color:${s.cor};border:1px solid ${s.cor}33;">${s.label}</span>`;
}

/* ══════════════════════════════════════════
   1. PREDIÇÃO DE CUSTOS (IA)
══════════════════════════════════════════ */

async function carregarAnaliseIA() {
    const div = document.getElementById('resultado-ia');
    if (!div) return;

    try {
        const resposta = await fetch('/api/dashboard/previsao');
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
        const dados = await resposta.json();

        /* ── Sem dados suficientes ── */
        if (dados.status === 'insuficiente') {
            div.innerHTML = `
                <div style="display:flex;align-items:flex-start;gap:14px;padding:18px;background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.2);border-radius:14px;width:100%;box-sizing:border-box;">
                    <span style="font-size:2rem;flex-shrink:0;">⚠️</span>
                    <div>
                        <p style="font-weight:800;color:#f59e0b;margin:0 0 4px;font-size:0.95rem;">Poucos dados ainda</p>
                        <p style="font-size:0.85rem;color:var(--ia-muted);line-height:1.5;margin:0;">
                            Registre mais abastecimentos para que o sistema consiga fazer previsões precisas.
                        </p>
                    </div>
                </div>`;
            return;
        }

        if (dados.status === 'sucesso') {
            const sobe = dados.tendencia_coeficiente > 0;
            const tendenciaLabel = sobe ? '📈 Custos em alta' : '📉 Custos em queda';
            const tendenciaCor   = sobe ? '#ef4444' : '#10b981';

            const metricas  = dados.previsao_geral?.metricas || {};
            const qualidade = metricas.qualidade || 'moderado';
            const confianca = metricas.r2_score != null ? (metricas.r2_score * 100).toFixed(0) : '--';

            const valorGeral = dados.previsao_100k != null
                ? Number(dados.previsao_100k).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '0,00';

            /* Cards por tipo de veículo */
            const tiposHtml = Object.entries(dados.previsoes_por_tipo || {}).map(([tipo, info]) => {
                const icone = tipo === 'Carro' ? '🚗' : '🚛';
                const nomeTipo = tipo === 'Carro' ? 'Carros' : 'Caminhões';

                if (info.status === 'insuficiente') {
                    return `
                        <div style="display:flex;align-items:center;gap:12px;padding:14px;background:var(--input-bg);border:1px dashed var(--pro-border);border-radius:12px;">
                            <span style="font-size:1.6rem;">${icone}</span>
                            <div>
                                <span style="font-size:0.75rem;font-weight:700;color:var(--pro-text);display:block;">${nomeTipo}</span>
                                <span style="font-size:0.78rem;color:#f59e0b;font-weight:600;">Aguardando mais registros</span>
                            </div>
                        </div>`;
                }

                const prev = info.previsao_100k != null
                    ? Number(info.previsao_100k).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '--';
                const q = info.metricas?.qualidade || 'moderado';

                return `
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px;background:var(--input-bg);border:1px solid var(--pro-border);border-radius:12px;flex-wrap:wrap;">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <span style="font-size:1.6rem;">${icone}</span>
                            <div>
                                <span style="font-size:0.75rem;font-weight:700;color:var(--pro-text);display:block;">${nomeTipo}</span>
                                <span style="font-size:0.7rem;color:var(--ia-muted);">${info.amostras} registros</span>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <span style="font-size:1.1rem;font-weight:900;color:var(--pro-text);display:block;">R$ ${prev}</span>
                            ${badgeQualidade(q)}
                        </div>
                    </div>`;
            }).join('');

            div.innerHTML = `
                <div style="display:flex;flex-direction:column;gap:16px;width:100%;min-width:0;">

                    <!-- Confiabilidade do sistema -->
                    <div class="ia-prediction-grid">
                        <div title="Quantidade de registros históricos de manutenção usados para treinar o algoritmo de Inteligência Artificial." style="padding:14px;background:var(--input-bg);border-radius:12px;border:1px solid var(--pro-border); cursor: help;">
                            <span style="font-size:0.68rem;font-weight:700;text-transform:uppercase;color:var(--ia-muted);letter-spacing:0.5px;display:block;margin-bottom:4px;">
                                📋 Registros analisados
                            </span>
                            <div style="display:flex;align-items:baseline;gap:5px;">
                                <span style="font-size:1.7rem;font-weight:900;color:var(--pro-header-text);">${dados.total_analisado || 0}</span>
                                <span style="font-size:0.8rem;color:var(--ia-muted);">abastecimentos</span>
                            </div>
                        </div>
                        <div title="R² Score (Coeficiente de Determinação): Indica a precisão do modelo matemático. Quanto mais próximo de 100%, mais as previsões refletem a realidade." style="padding:14px;background:var(--input-bg);border-radius:12px;border:1px solid var(--pro-border); cursor: help;">
                            <span style="font-size:0.68rem;font-weight:700;text-transform:uppercase;color:var(--ia-muted);letter-spacing:0.5px;display:block;margin-bottom:4px;">
                                🎯 Confiabilidade
                            </span>
                            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                                <span style="font-size:1.7rem;font-weight:900;">${confianca}%</span>
                                ${badgeQualidade(qualidade)}
                            </div>
                        </div>
                    </div>

                    <!-- Previsão principal -->
                    <div title="Estimativa financeira feita pela IA do custo acumulado previsto de manutenções ao cruzar a marca de 100.000 km rodados." style="padding:26px 20px;background:linear-gradient(135deg,rgba(124,58,237,0.07),rgba(59,130,246,0.04));border-radius:16px;border:1px solid rgba(124,58,237,0.18);text-align:center;position:relative;overflow:hidden; cursor: help;">
                        <div style="position:absolute;top:-30px;left:50%;transform:translateX(-50%);width:120px;height:120px;background:rgba(124,58,237,0.15);filter:blur(40px);border-radius:50%;pointer-events:none;"></div>
                        <span style="font-size:0.72rem;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#8b5cf6;display:block;margin-bottom:10px;">
                            💰 Gasto previsto para 100.000 km
                        </span>
                        <p style="font-size:clamp(2rem, 8vw, 3rem);font-weight:900;color:var(--pro-text);margin:0 0 12px;letter-spacing:-0.04em;line-height:1;word-break:break-word;">
                            <span style="font-size:1.4rem;vertical-align:super;opacity:0.55;">R$</span>${valorGeral}
                        </p>
                        <span title="Tendência matemática baseada na inclinação da reta de regressão (coeficiente angular)." style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;background:${tendenciaCor}14;border-radius:20px;border:1px solid ${tendenciaCor}33;font-size:0.78rem;font-weight:800;color:${tendenciaCor};">
                            ${tendenciaLabel}
                        </span>
                    </div>

                    <!-- Por tipo de veículo -->
                    ${tiposHtml ? `
                        <div>
                            <span style="font-size:0.68rem;font-weight:700;text-transform:uppercase;color:var(--ia-muted);letter-spacing:1px;display:block;margin-bottom:10px;">
                                🚘 Por tipo de veículo
                            </span>
                            <div style="display:flex;flex-direction:column;gap:8px;">${tiposHtml}</div>
                        </div>` : ''}
                </div>`;

        } else {
            div.innerHTML = _erroBox('Dados indisponíveis', dados.mensagem || 'Verifique os registros de abastecimento.');
        }

    } catch (err) {
        div.innerHTML = _erroBox('Falha de conexão', 'Não foi possível carregar a análise. Verifique o servidor.');
    }
}

function _erroBox(titulo, msg) {
    return `
        <div style="display:flex;align-items:flex-start;gap:14px;padding:18px;background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.2);border-radius:14px;width:100%;box-sizing:border-box;">
            <span style="font-size:2rem;flex-shrink:0;">⚠️</span>
            <div>
                <p style="font-weight:800;color:#ef4444;margin:0 0 4px;font-size:0.95rem;">${titulo}</p>
                <p style="font-size:0.85rem;color:var(--ia-muted);margin:0;line-height:1.5;">${msg}</p>
            </div>
        </div>`;
}

/* ══════════════════════════════════════════
   2. GESTÃO DE RISCOS (Alertas)
══════════════════════════════════════════ */

async function carregarAlertas() {
    try {
        const resposta = await fetch('/api/dashboard/alertas');
        if (!resposta.ok) throw new Error('Falha ao buscar alertas');

        const alertas = await resposta.json();
        const lista   = document.getElementById('lista-alertas');
        if (!lista) return;
        lista.innerHTML = '';

        /* Sem alertas = tudo ok */
        if (alertas.length === 0) {
            lista.innerHTML = `
                <li style="padding:28px 16px;background:rgba(16,185,129,0.05);border-radius:14px;border:1px dashed rgba(16,185,129,0.3);display:flex;flex-direction:column;align-items:center;text-align:center;min-height:160px;justify-content:center;width:100%;box-sizing:border-box;" role="status">
                    <span style="font-size:2.5rem;margin-bottom:10px;">🛡️</span>
                    <strong style="color:#10b981;font-size:1rem;font-weight:800;display:block;margin-bottom:4px;">Frota em dia!</strong>
                    <p style="font-size:0.83rem;color:var(--ia-muted);margin:0;">Nenhuma manutenção atrasada ou risco detectado.</p>
                </li>`;
            return;
        }

        alertas.forEach(alerta => {
            const vencida = alerta.mensagem.includes('vencida');
            const icon    = vencida ? '⚠️' : '🔔';
            const iconBg  = vencida
                ? 'linear-gradient(135deg,#ef4444,#b91c1c)'
                : 'linear-gradient(135deg,#f59e0b,#d97706)';
            const borderColor = vencida ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.2)';
            const bgColor     = vencida ? 'rgba(239,68,68,0.04)' : 'var(--input-bg)';
            const labelStatus = vencida ? 'Revisão necessária' : 'Atenção';
            const labelCor    = vencida ? '#ef4444' : '#f59e0b';

            /* Extrair KM para mensagem amigável */
            let detalhes = '';
            const match = alerta.mensagem.match(/Última: (\d+) km\. Atual: (\d+) km\./);
            if (vencida && match) {
                const kmAtual    = parseInt(match[2]).toLocaleString('pt-BR');
                const kmExcedido = (parseInt(match[2]) - (parseInt(match[1]) + 10000)).toLocaleString('pt-BR');
                detalhes = `
                    <p style="font-size:0.82rem;color:var(--ia-muted);margin:8px 0 10px;line-height:1.4;">
                        A revisão deveria ter sido feita há <strong style="color:#ef4444;">+${kmExcedido} km</strong>.
                        KM atual: <strong>${kmAtual}</strong>.
                    </p>`;
            } else {
                detalhes = `<p style="font-size:0.82rem;color:var(--ia-muted);margin:8px 0 10px;line-height:1.4;">${alerta.mensagem}</p>`;
            }

            const nomeCurto = alerta.veiculo.split(' ').slice(0, 2).join(' ');
            const veiculoHTML = `<span class="d-none-mobile">${alerta.veiculo}</span><span class="d-show-mobile">${nomeCurto}</span>`;

            const li = document.createElement('li');
            li.setAttribute('role', 'alert');
            li.style = `padding:16px;border:1px solid ${borderColor};background:${bgColor};border-radius:14px;display:flex;align-items:flex-start;gap:14px;overflow:hidden;flex-shrink:0;width:100%;box-sizing:border-box;`;
            li.innerHTML = `
                <div style="width:44px;height:44px;border-radius:12px;background:${iconBg};display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;box-shadow:0 4px 10px rgba(0,0,0,0.15);">
                    ${icon}
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;">
                        <div style="min-width:0; flex:1;">
                            <strong style="font-size:1rem;color:var(--pro-text);display:block;margin-bottom:4px;">${veiculoHTML}</strong>
                            <span style="padding:3px 9px;border-radius:7px;font-size:0.68rem;font-weight:800;background:${labelCor}18;color:${labelCor};border:1px solid ${labelCor}30;white-space:nowrap;">${labelStatus}</span>
                        </div>
                        <button onclick="confirmarRevisaoDireta(${alerta.veiculo_id}, ${alerta.km_atual}, '${alerta.veiculo.replace(/'/g, "\\'")}')"
                                class="btn-risco"
                                style="background:var(--pro-card-bg);color:var(--ia-muted);border:1px solid var(--pro-border);border-radius:10px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:5px;padding:7px 12px;font-size:0.75rem;font-weight:700;white-space:nowrap;flex-shrink:0;"
                                onmouseover="this.style.background='#10b981';this.style.color='white';this.style.borderColor='#10b981';"
                                onmouseout="this.style.background='var(--pro-card-bg)';this.style.color='var(--ia-muted)';this.style.borderColor='var(--pro-border)';"
                                title="Registrar revisão e encerrar alerta">
                            <span class="d-none-mobile">✅ Registrar revisão</span>
                            <span class="d-show-mobile" style="font-size:1.1rem;line-height:1;">✅</span>
                        </button>
                    </div>
                    ${detalhes}
                </div>`;
            lista.appendChild(li);
        });
    } catch (err) {
        console.error('Erro nos alertas:', err);
    }
}

async function confirmarRevisaoDireta(veiculoId, kmAtual, nomeVeiculo) {
    // Criação do Modal Customizado Glassmorphism
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.6)';
    overlay.style.backdropFilter = 'blur(5px)';
    overlay.style.zIndex = '99999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '20px';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';
    
    const modal = document.createElement('div');
    modal.style.background = 'var(--pro-card-bg, #fff)';
    modal.style.borderRadius = '16px';
    modal.style.padding = '24px';
    modal.style.width = '100%';
    modal.style.maxWidth = '420px';
    modal.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
    modal.style.border = '1px solid var(--pro-border, #e5e7eb)';
    modal.style.transform = 'translateY(20px)';
    modal.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    
    modal.innerHTML = `
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;">
            <div style="width:48px;height:48px;border-radius:12px;background:rgba(16,185,129,0.15);color:#10b981;display:flex;align-items:center;justify-content:center;font-size:1.5rem;box-shadow:0 4px 10px rgba(16,185,129,0.2);">
                ✅
            </div>
            <div>
                <h3 style="margin:0;font-size:1.2rem;font-weight:800;color:var(--pro-text, #111);">Registrar Revisão</h3>
                <p style="margin:0;font-size:0.85rem;color:var(--ia-muted, #666);margin-top:2px;">${nomeVeiculo} • KM: ${kmAtual}</p>
            </div>
        </div>
        
        <div style="margin-bottom:16px;">
            <label style="display:block;font-size:0.85rem;font-weight:700;color:var(--pro-text, #111);margin-bottom:8px;">Serviço Realizado</label>
            <input type="text" id="modal-descricao" value="Revisão preventiva completa." style="width:100%;padding:12px 16px;border-radius:10px;border:1px solid var(--pro-border, #ddd);background:var(--ia-input, #fafafa);color:var(--pro-text, #111);font-size:0.95rem;box-sizing:border-box;outline:none;transition:border-color 0.2s;" onfocus="this.style.borderColor='#10b981'" onblur="this.style.borderColor='var(--pro-border, #ddd)'">
        </div>
        
        <div style="margin-bottom:28px;">
            <label style="display:block;font-size:0.85rem;font-weight:700;color:var(--pro-text, #111);margin-bottom:8px;">Valor Total Gasto (R$)</label>
            <div style="position:relative;">
                <span style="position:absolute;left:16px;top:50%;transform:translateY(-50%);color:var(--ia-muted);font-weight:700;">R$</span>
                <input type="number" id="modal-custo" value="500.00" step="0.01" style="width:100%;padding:12px 16px 12px 45px;border-radius:10px;border:1px solid var(--pro-border, #ddd);background:var(--ia-input, #fafafa);color:var(--pro-text, #111);font-size:0.95rem;font-weight:700;box-sizing:border-box;outline:none;transition:border-color 0.2s;" onfocus="this.style.borderColor='#10b981'" onblur="this.style.borderColor='var(--pro-border, #ddd)'">
            </div>
        </div>
        
        <div style="display:flex;justify-content:flex-end;gap:12px;">
            <button id="modal-cancel" style="padding:12px 20px;border-radius:10px;border:none;background:rgba(239,68,68,0.1);color:#ef4444;font-size:0.9rem;font-weight:800;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.2)'" onmouseout="this.style.background='rgba(239,68,68,0.1)'">Cancelar</button>
            <button id="modal-confirm" style="padding:12px 20px;border-radius:10px;border:none;background:#10b981;color:white;font-size:0.9rem;font-weight:800;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 12px rgba(16,185,129,0.3);" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 15px rgba(16,185,129,0.4)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 12px rgba(16,185,129,0.3)'">Salvar Revisão</button>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Trigger animations
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        modal.style.transform = 'translateY(0)';
    });
    
    return new Promise((resolve) => {
        const closeModal = () => {
            overlay.style.opacity = '0';
            modal.style.transform = 'translateY(20px)';
            setTimeout(() => document.body.removeChild(overlay), 300);
        };
        
        document.getElementById('modal-cancel').onclick = () => {
            closeModal();
            resolve(null);
        };
        
        document.getElementById('modal-confirm').onclick = () => {
            const desc = document.getElementById('modal-descricao').value;
            const cust = document.getElementById('modal-custo').value;
            closeModal();
            resolve({ descricao: desc, custo: cust });
        };
    }).then(async (dados) => {
        if (!dados) return; // cancelado
        
        try {
            const resposta = await fetch('/api/manutencoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    veiculo_id:      veiculoId,
                    data_manutencao: new Date().toISOString().split('T')[0],
                    tipo:            'Preventiva',
                    custo:           parseFloat(dados.custo) || 0,
                    descricao:       dados.descricao,
                    quilometragem:   kmAtual
                })
            });
            if (resposta.ok) {
                if (typeof showToast === 'function') showToast('Revisão registrada e alerta resolvido!', 'success');
                carregarAlertas();
            } else {
                if (typeof showToast === 'function') showToast('Falha ao registrar a revisão.', 'error');
            }
        } catch (err) {
            if (typeof showToast === 'function') showToast('Erro de comunicação.', 'error');
        }
    });
}

/* ══════════════════════════════════════════
   3. EFICIÊNCIA (Tabela de Consumo)
══════════════════════════════════════════ */

let consumosGeral = [];
let consumosFiltrados = [];
let paginaAtualConsumo = 1;
const itensPorPaginaConsumo = 10;
let colunaOrdemConsumo = null;
let ordemAscConsumo = true;

async function carregarConsumo() {
    try {
        const resposta = await fetch('/api/dashboard/consumo');
        if (!resposta.ok) throw new Error('Falha no consumo');

        consumosGeral = await resposta.json();
        aplicarFiltrosEOrdenacaoConsumo();
    } catch (err) {
        console.error('Erro no consumo:', err);
    }
}

function aplicarFiltrosEOrdenacaoConsumo() {
    const termo = (document.getElementById('search-consumo')?.value || '').toLowerCase();
    
    consumosFiltrados = consumosGeral.filter(c => 
        String(c.veiculo).toLowerCase().includes(termo)
    );

    if (colunaOrdemConsumo) {
        consumosFiltrados.sort((a, b) => {
            let valA = a[colunaOrdemConsumo] || '';
            let valB = b[colunaOrdemConsumo] || '';
            
            // Tentar extrair números se possível (ex: "R$ 2,50", "12 kg")
            const numA = parseFloat(String(valA).replace(/[^\d.,]/g, '').replace(',', '.'));
            const numB = parseFloat(String(valB).replace(/[^\d.,]/g, '').replace(',', '.'));
            
            if (!isNaN(numA) && !isNaN(numB)) {
                valA = numA; valB = numB;
            } else {
                valA = String(valA).toLowerCase(); valB = String(valB).toLowerCase();
            }

            if (valA < valB) return ordemAscConsumo ? -1 : 1;
            if (valA > valB) return ordemAscConsumo ? 1 : -1;
            return 0;
        });
    }

    paginaAtualConsumo = 1;
    renderizarConsumo();
}

function renderizarConsumo() {
    const tbody = document.getElementById('lista-consumo');
    const pagination = document.getElementById('pagination-consumo');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (pagination) pagination.innerHTML = '';

    if (consumosFiltrados.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="4" style="text-align:center;padding:40px;color:var(--ia-muted);">
                <span style="font-size:2.5rem;display:block;margin-bottom:10px;opacity:0.5;">📊</span>
                <span style="font-weight:700;font-size:0.95rem;">
                    Nenhum registro encontrado.
                </span>
            </td></tr>`;
        return;
    }

    const totalPaginas = Math.ceil(consumosFiltrados.length / itensPorPaginaConsumo);
    if (paginaAtualConsumo > totalPaginas) paginaAtualConsumo = totalPaginas;
    if (paginaAtualConsumo < 1) paginaAtualConsumo = 1;

    const inicio = (paginaAtualConsumo - 1) * itensPorPaginaConsumo;
    const fim = inicio + itensPorPaginaConsumo;
    const itensPagina = consumosFiltrados.slice(inicio, fim);

    itensPagina.forEach(c => {
        const isCaminhao = c.veiculo.includes('Scania') || c.veiculo.includes('Volvo')
            || c.veiculo.includes('Mercedes') || c.veiculo.includes('Constellation');
        const nomeCurto = c.veiculo.split(' ').slice(0, 2).join(' ');
        const veiculoHTML = `<span class="d-none-mobile">${c.veiculo}</span><span class="d-show-mobile">${nomeCurto}</span>`;

        tbody.innerHTML += `
            <tr onclick="this.classList.toggle('expanded')">
                <td data-label="Ativo Operacional">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:36px;height:36px;background:rgba(59,130,246,0.1);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">
                            ${isCaminhao ? '🚛' : '🚗'}
                        </div>
                        <strong style="color:var(--pro-text);font-size:0.9rem;">${veiculoHTML}</strong>
                    </div>
                </td>
                <td data-label="Desempenho">
                    <span style="font-weight:800;color:#10b981;background:rgba(16,185,129,0.1);padding:5px 11px;border-radius:8px;border:1px solid rgba(16,185,129,0.2);font-size:0.88rem;">
                        ${c.eficiencia}
                    </span>
                </td>
                <td data-label="Custo/Km" style="font-weight:700;color:var(--pro-text);font-size:0.9rem;">${c.custo_km}</td>
                <td data-label="Pegada CO₂">
                    <div style="display:inline-flex;align-items:center;gap:5px;color:#ef4444;font-weight:800;background:rgba(239,68,68,0.1);padding:5px 11px;border-radius:8px;border:1px solid rgba(239,68,68,0.2);font-size:0.88rem;">
                        ☁️ ${c.co2_total}
                    </div>
                </td>
            </tr>`;
    });

    if (totalPaginas > 1 && pagination) {
        let pagHtml = `<button class="page-btn" ${paginaAtualConsumo === 1 ? 'disabled' : ''} onclick="mudarPaginaConsumo(${paginaAtualConsumo - 1})">Anterior</button>`;
        pagHtml += `<span class="page-info">Página ${paginaAtualConsumo} de ${totalPaginas}</span>`;
        pagHtml += `<button class="page-btn" ${paginaAtualConsumo === totalPaginas ? 'disabled' : ''} onclick="mudarPaginaConsumo(${paginaAtualConsumo + 1})">Próximo</button>`;
        pagination.innerHTML = pagHtml;
    }
}

function mudarPaginaConsumo(novaPagina) {
    paginaAtualConsumo = novaPagina;
    renderizarConsumo();
}

function ordenarConsumo(coluna, thElement) {
    if (colunaOrdemConsumo === coluna) {
        ordemAscConsumo = !ordemAscConsumo;
    } else {
        colunaOrdemConsumo = coluna;
        ordemAscConsumo = true;
    }

    const tabela = document.getElementById('lista-consumo')?.closest('table');
    if (tabela) {
        tabela.querySelectorAll('th.sortable').forEach(th => {
            th.classList.remove('active', 'asc', 'desc');
            th.querySelector('.sort-icon').textContent = '↕️';
        });
    }

    if (thElement) {
        thElement.classList.add('active', ordemAscConsumo ? 'asc' : 'desc');
        thElement.querySelector('.sort-icon').textContent = ordemAscConsumo ? '⬆️' : '⬇️';
    }

    aplicarFiltrosEOrdenacaoConsumo();
}

document.getElementById('search-consumo')?.addEventListener('input', () => {
    aplicarFiltrosEOrdenacaoConsumo();
});

/* ══════════════════════════════════════════
   4. TOP ECO-DRIVERS (Ranking)
══════════════════════════════════════════ */

async function carregarRanking() {
    try {
        const resposta = await fetch('/api/dashboard/ranking');
        if (!resposta.ok) throw new Error('Falha no ranking');

        const ranking = await resposta.json();
        const lista   = document.getElementById('lista-ranking');
        if (!lista) return;
        lista.innerHTML = '';

        if (ranking.length === 0) {
            lista.innerHTML = `
                <li style="text-align:center;padding:32px;color:var(--ia-muted);background:var(--input-bg);border-radius:14px;border:1px dashed var(--pro-border);" role="status">
                    <span style="font-size:2.5rem;display:block;margin-bottom:10px;opacity:0.5;">🏁</span>
                    <span style="font-weight:700;font-size:0.9rem;">Aguardando dados de abastecimento.</span>
                </li>`;
            return;
        }

        const estilos = [
            { bg: 'rgba(250,204,21,0.12)', border: '#facc15', medal: '🥇', borda: '#facc1566' },
            { bg: 'rgba(148,163,184,0.12)', border: '#94a3b8', medal: '🥈', borda: '#94a3b866' },
            { bg: 'rgba(217,119,6,0.12)',   border: '#d97706', medal: '🥉', borda: '#d9770666' },
            { bg: 'var(--input-bg)', border: 'var(--pro-border)', medal: '4º', borda: 'var(--pro-border)' },
            { bg: 'var(--input-bg)', border: 'var(--pro-border)', medal: '5º', borda: 'var(--pro-border)' }
        ];

        ranking.forEach((motorista, i) => {
            const e    = estilos[i] || estilos[3];
            const top3 = i < 3;

            const li = document.createElement('li');
            li.setAttribute('role', 'listitem');
            li.style = `padding:14px 16px;background:${e.bg};border-radius:14px;border:1px solid ${e.borda};display:flex;align-items:center;justify-content:space-between;gap:12px;position:relative;overflow:hidden;`;

            if (top3) {
                li.innerHTML += `<div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:${e.border};"></div>`;
            }

            li.innerHTML += `
                <div style="display:flex;align-items:center;gap:12px;padding-left:${top3 ? '6px' : '0'};min-width:0;">
                    <div style="width:40px;height:40px;border-radius:50%;background:${top3 ? 'var(--pro-card-bg)' : 'var(--input-bg)'};display:flex;align-items:center;justify-content:center;font-size:${top3 ? '1.4rem' : '1rem'};font-weight:900;border:1px solid ${e.borda};flex-shrink:0;">
                        ${e.medal}
                    </div>
                    <div style="min-width:0;">
                        <strong style="color:var(--pro-text);display:block;font-size:0.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${motorista.nome}</strong>
                        <span style="font-size:0.75rem;color:var(--ia-muted);">Média: <strong style="color:#10b981;">${motorista.preco_medio}</strong></span>
                    </div>
                </div>
                <div style="text-align:right;flex-shrink:0;">
                    <span style="display:block;font-size:1rem;font-weight:900;color:var(--primary-blue);">${motorista.gasto}</span>
                    <span style="font-size:0.72rem;font-weight:800;color:#ef4444;">☁️ ${motorista.co2} CO₂</span>
                </div>`;
            lista.appendChild(li);
        });
    } catch (err) {
        console.error('Erro no ranking:', err);
    }
}

/* ══════════════════════════════════════════
   INICIALIZAÇÃO
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    carregarAnaliseIA();
    carregarAlertas();
    carregarConsumo();
    carregarRanking();
});