/* ═══════════════════════════════════════════════════
   manutencoes.js — Gestão de Manutenções
   Renderiza tabela desktop + cards expandíveis mobile.
═══════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════
// ESTADO DA TABELA DE MANUTENÇÕES
// ═══════════════════════════════════════════════════
let manutencoesGeral = [];
let manutencoesFiltradas = [];
let paginaAtual = 1;
const itensPorPagina = 10;
let colunaOrdem = null;
let ordemAsc = true;

async function carregarVeiculosNoSelect() {
    try {
        const resposta = await fetch('/api/veiculos');
        const veiculos = await resposta.json();
        const select = document.getElementById('veiculo_id');
        veiculos.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.id;
            opt.textContent = `${v.placa} - ${v.marca} ${v.modelo}`;
            opt.dataset.km = v.quilometragem;
            select.appendChild(opt);
        });

        select.addEventListener('change', function() {
            const selectedOpt = this.options[this.selectedIndex];
            const campoOdometro = document.getElementById('quilometragem_manut');
            const campoData = document.getElementById('data_manutencao');
            
            if (selectedOpt && selectedOpt.dataset.km) {
                campoOdometro.value = selectedOpt.dataset.km;
                if (campoData && !campoData.value) {
                    campoData.value = new Date().toISOString().split('T')[0];
                }
            } else {
                campoOdometro.value = '';
            }
        });
    } catch (e) { console.error('Erro ao carregar veículos:', e); }
}

/** Badge visual para tipo de manutenção */
function badgeTipo(tipo) {
    if (tipo === 'Preventiva') {
        return `<span class="status-pill status-preventiva">✅ Preventiva</span>`;
    }
    return `<span class="status-pill status-corretiva">🔴 Corretiva</span>`;
}

/** Abre/fecha um maint-card mobile */
function toggleMaintCard(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    card.classList.toggle('open');
}

/** Carrega manutenções e renderiza tabela + cards mobile */
async function carregarManutencoes() {
    try {
        const resposta = await fetch('/api/manutencoes');
        manutencoesGeral = await resposta.json();
        aplicarFiltrosEOrdenacaoManutencoes();
    } catch (erro) {
        console.error('Erro ao carregar manutenções:', erro);
    }
}

function aplicarFiltrosEOrdenacaoManutencoes() {
    const termo = (document.getElementById('search-manutencoes')?.value || '').toLowerCase();
    
    // Filtro
    manutencoesFiltradas = manutencoesGeral.filter(m => 
        String(m.veiculo_id).toLowerCase().includes(termo) ||
        String(m.descricao || '').toLowerCase().includes(termo) ||
        String(m.tipo || '').toLowerCase().includes(termo) ||
        String(m.data_manutencao).toLowerCase().includes(termo)
    );

    // Ordenação
    if (colunaOrdem) {
        manutencoesFiltradas.sort((a, b) => {
            let valA = a[colunaOrdem] || '';
            let valB = b[colunaOrdem] || '';
            
            if (['quilometragem', 'custo', 'veiculo_id'].includes(colunaOrdem)) {
                valA = Number(valA); valB = Number(valB);
            } else {
                valA = String(valA).toLowerCase(); valB = String(valB).toLowerCase();
            }

            if (valA < valB) return ordemAsc ? -1 : 1;
            if (valA > valB) return ordemAsc ? 1 : -1;
            return 0;
        });
    }

    paginaAtual = 1;
    renderizarManutencoes();
}

function renderizarManutencoes() {
    const tbody      = document.getElementById('lista-manutencoes');
    const mobileList = document.getElementById('maint-list-mobile');
    const pagination = document.getElementById('pagination-manutencoes');

    if (!tbody) return;

    tbody.innerHTML = '';
    if (mobileList) mobileList.innerHTML = '';
    if (pagination) pagination.innerHTML = '';

    const emptyHtml = `
        <div style="text-align:center; padding:40px; color:var(--text-muted);">
            <div style="font-size:3rem; margin-bottom:10px;">📭</div>
            Nenhuma manutenção encontrada.
        </div>`;

    if (manutencoesFiltradas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6">${emptyHtml}</td></tr>`;
        if (mobileList) mobileList.innerHTML = emptyHtml;
        return;
    }

    // Paginação
    const totalPaginas = Math.ceil(manutencoesFiltradas.length / itensPorPagina);
    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
    if (paginaAtual < 1) paginaAtual = 1;

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const itensPagina = manutencoesFiltradas.slice(inicio, fim);

    /* ── Tabela Desktop ── */
    itensPagina.forEach((m, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${m.veiculo_id}</strong></td>
            <td>${m.data_manutencao}</td>
            <td>${badgeTipo(m.tipo)}</td>
            <td>${m.quilometragem} km</td>
            <td>${m.descricao}</td>
            <td>R$ ${Number(m.custo).toFixed(2)}</td>
        `;
        tbody.appendChild(tr);

        /* ── Cards Mobile Expandíveis ── */
        if (mobileList) {
            const cardId = `maint-card-${idx}`;
            const div = document.createElement('div');
            div.className = 'maint-card';
            div.id = cardId;
            div.setAttribute('role', 'listitem');

            const icone = m.tipo === 'Preventiva' ? '✅' : '🔴';
            div.innerHTML = `
                <div class="maint-card-header" onclick="toggleMaintCard('${cardId}')">
                    <div class="maint-card-left">
                        <div class="maint-card-title">${icone} ${m.tipo} — Veíc. #${m.veiculo_id}</div>
                        <div class="maint-card-sub">${m.data_manutencao} · ${m.quilometragem} km · R$ ${Number(m.custo).toFixed(2)}</div>
                    </div>
                    <span class="maint-card-toggle">▼</span>
                </div>
                <div class="maint-card-body">
                    <div class="maint-detail-row">
                        <span class="maint-detail-label">Natureza</span>
                        <span class="maint-detail-val">${badgeTipo(m.tipo)}</span>
                    </div>
                    <div class="maint-detail-row">
                        <span class="maint-detail-label">KM Registro</span>
                        <span class="maint-detail-val">${m.quilometragem} km</span>
                    </div>
                    <div class="maint-detail-row">
                        <span class="maint-detail-label">Descrição</span>
                        <span class="maint-detail-val" style="text-align:left">${m.descricao}</span>
                    </div>
                    <div class="maint-detail-row">
                        <span class="maint-detail-label">Custo Total</span>
                        <span class="maint-detail-val">R$ ${Number(m.custo).toFixed(2)}</span>
                    </div>
                </div>
            `;
            mobileList.appendChild(div);
        }
    });

    // Controles de Paginação
    if (totalPaginas > 1 && pagination) {
        let pagHtml = `<button class="page-btn" ${paginaAtual === 1 ? 'disabled' : ''} onclick="mudarPaginaManutencoes(${paginaAtual - 1})">Anterior</button>`;
        pagHtml += `<span class="page-info">Página ${paginaAtual} de ${totalPaginas}</span>`;
        pagHtml += `<button class="page-btn" ${paginaAtual === totalPaginas ? 'disabled' : ''} onclick="mudarPaginaManutencoes(${paginaAtual + 1})">Próximo</button>`;
        pagination.innerHTML = pagHtml;
    }
}

function mudarPaginaManutencoes(novaPagina) {
    paginaAtual = novaPagina;
    renderizarManutencoes();
}

function ordenarManutencoes(coluna, thElement) {
    const mapColunas = { 'veiculo': 'veiculo_id' };
    const colunaReal = mapColunas[coluna] || coluna;

    if (colunaOrdem === colunaReal) {
        ordemAsc = !ordemAsc;
    } else {
        colunaOrdem = colunaReal;
        ordemAsc = true;
    }

    const tabela = document.getElementById('lista-manutencoes')?.closest('table');
    if (tabela) {
        tabela.querySelectorAll('th.sortable').forEach(th => {
            th.classList.remove('active', 'asc', 'desc');
            th.querySelector('.sort-icon').textContent = '↕️';
        });
    }

    if (thElement) {
        thElement.classList.add('active', ordemAsc ? 'asc' : 'desc');
        thElement.querySelector('.sort-icon').textContent = ordemAsc ? '⬆️' : '⬇️';
    }

    aplicarFiltrosEOrdenacaoManutencoes();
}

// Evento de digitação na busca
document.getElementById('search-manutencoes')?.addEventListener('input', () => {
    aplicarFiltrosEOrdenacaoManutencoes();
});

/* ── Formulário ── */
document.getElementById('form-manutencao').addEventListener('submit', async function (e) {
    e.preventDefault();

    const payload = {
        veiculo_id:      parseInt(document.getElementById('veiculo_id').value),
        data_manutencao: document.getElementById('data_manutencao').value,
        tipo:            document.getElementById('tipo').value,
        custo:           parseFloat(document.getElementById('custo').value),
        descricao:       document.getElementById('descricao').value,
        quilometragem:   parseInt(document.getElementById('quilometragem_manut').value)
    };

    const btn = document.getElementById('btn-registrar-os');
    const textoOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Registrando...';

    try {
        const resposta = await fetch('/api/manutencoes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (resposta.ok) {
            document.getElementById('form-manutencao').reset();
            await carregarManutencoes();
            if (typeof showToast === 'function') showToast('Manutenção registada com sucesso!', 'success');
            else alert('Manutenção registada com sucesso!');
        } else {
            if (typeof showToast === 'function') showToast('Erro ao registar a manutenção.', 'error');
            else alert('Erro ao registar a manutenção.');
        }
    } catch (e) {
        console.error('Erro POST manutenções:', e);
        if (typeof showToast === 'function') showToast('Erro de conexão.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
    }
});

window.onload = () => {
    carregarVeiculosNoSelect();
    carregarManutencoes();
};