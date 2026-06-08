/* ═══════════════════════════════════════════════════
   motoristas.js — Gestão de Condutores
   Renderiza tabela (desktop) e cards expandíveis (mobile).
═══════════════════════════════════════════════════ */

/** Gera badges de categoria CNH */
function renderCategorias(categoriaCnh) {
    if (!categoriaCnh || !categoriaCnh.trim()) {
        return '<span style="color: var(--text-muted); font-size: 0.8rem;">—</span>';
    }
    return categoriaCnh
        .split(',')
        .map(cat => cat.trim())
        .filter(Boolean)
        .map(cat => `<span class="cnh-badge">${cat}</span>`)
        .join('');
}

/** Gera iniciais para avatar */
function getIniciais(nome) {
    const partes = (nome || '?').trim().split(' ');
    return partes.length >= 2
        ? partes[0][0].toUpperCase() + partes[partes.length - 1][0].toUpperCase()
        : partes[0][0].toUpperCase();
}

/**
 * Carrega motoristas e renderiza TANTO a tabela desktop
 * QUANTO os cards mobile expandíveis.
 */
// ════════════════════════════════════════════
// ESTADO DA TABELA DE MOTORISTAS
// ════════════════════════════════════════════
let motoristasGeral = [];
let motoristasFiltrados = [];
let paginaAtual = 1;
const itensPorPagina = 10;
let colunaOrdem = null;
let ordemAsc = true;

async function carregarMotoristas() {
    try {
        const resposta = await fetch('/api/motoristas');
        if (!resposta.ok) throw new Error('Falha na rede');
        motoristasGeral = await resposta.json();
        aplicarFiltrosEOrdenacaoMotoristas();
    } catch (erro) {
        console.error('Erro ao carregar motoristas:', erro);
        const tbody = document.getElementById('lista-motoristas');
        const mobileList = document.getElementById('drivers-list-mobile');
        const errHtml = `
            <div class="empty-state">
                <span class="empty-icon">⚠️</span>
                <p>Erro ao carregar motoristas. Verifique a conexão.</p>
            </div>`;
        if (tbody) tbody.innerHTML = `<tr><td colspan="4">${errHtml}</td></tr>`;
        if (mobileList) mobileList.innerHTML = errHtml;
    }
}

function aplicarFiltrosEOrdenacaoMotoristas() {
    const termo = (document.getElementById('search-motoristas')?.value || '').toLowerCase();
    
    // Filtro
    motoristasFiltrados = motoristasGeral.filter(m => 
        (m.nome && m.nome.toLowerCase().includes(termo)) ||
        (m.cnh && m.cnh.toLowerCase().includes(termo)) ||
        (m.categoria_cnh && m.categoria_cnh.toLowerCase().includes(termo))
    );

    // Ordenação
    if (colunaOrdem) {
        motoristasFiltrados.sort((a, b) => {
            let valA = a[colunaOrdem] || '';
            let valB = b[colunaOrdem] || '';
            
            valA = String(valA).toLowerCase();
            valB = String(valB).toLowerCase();

            if (valA < valB) return ordemAsc ? -1 : 1;
            if (valA > valB) return ordemAsc ? 1 : -1;
            return 0;
        });
    }

    paginaAtual = 1;
    renderizarMotoristas();
}

function renderizarMotoristas() {
    const tbody      = document.getElementById('lista-motoristas');
    const mobileList = document.getElementById('drivers-list-mobile');
    const pagination = document.getElementById('pagination-motoristas');

    if (!tbody) return;

    tbody.innerHTML = '';
    if (mobileList) mobileList.innerHTML = '';
    if (pagination) pagination.innerHTML = '';

    if (motoristasFiltrados.length === 0) {
        const emptyHtml = `
            <div class="empty-state">
                <span class="empty-icon">🧑‍✈️</span>
                <p>Nenhum motorista encontrado.</p>
            </div>`;
        tbody.innerHTML = `<tr><td colspan="4">${emptyHtml}</td></tr>`;
        if (mobileList) mobileList.innerHTML = emptyHtml;
        return;
    }

    // Paginação Matemática
    const totalPaginas = Math.ceil(motoristasFiltrados.length / itensPorPagina);
    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
    if (paginaAtual < 1) paginaAtual = 1;

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const itensPagina = motoristasFiltrados.slice(inicio, fim);

    // Render Tabela Desktop
    itensPagina.forEach((mot, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="avatar-circle" title="${mot.nome}" aria-label="Avatar de ${mot.nome}">
                    ${getIniciais(mot.nome)}
                </div>
            </td>
            <td><strong>${mot.nome}</strong></td>
            <td><code>${mot.cnh}</code></td>
            <td>${renderCategorias(mot.categoria_cnh)}</td>
        `;
        tbody.appendChild(tr);

        // Render Cards Mobile
        if (mobileList) {
            const cardId = `driver-card-${idx}`;
            const div = document.createElement('div');
            div.className = 'driver-card';
            div.setAttribute('role', 'listitem');

            div.innerHTML = `
                <div class="driver-card-header" onclick="toggleDriverCard('${cardId}')" 
                     aria-expanded="false" aria-controls="${cardId}-body">
                    <div class="avatar-circle" style="flex-shrink:0">${getIniciais(mot.nome)}</div>
                    <div class="driver-card-info">
                        <div class="driver-card-name">${mot.nome}</div>
                        <div class="driver-card-cnh">CNH ${mot.cnh}</div>
                    </div>
                    <span class="driver-card-toggle" aria-hidden="true">▼</span>
                </div>
                <div class="driver-card-body" id="${cardId}-body" role="region">
                    <div class="driver-detail-row">
                        <span class="driver-detail-label">CNH</span>
                        <span class="driver-detail-val"><code>${mot.cnh}</code></span>
                    </div>
                    <div class="driver-detail-row">
                        <span class="driver-detail-label">Categorias</span>
                        <span class="driver-detail-val">${renderCategorias(mot.categoria_cnh)}</span>
                    </div>
                </div>
            `;
            mobileList.appendChild(div);
        }
    });

    // Controles de Paginação
    if (totalPaginas > 1 && pagination) {
        let pagHtml = `<button class="page-btn" ${paginaAtual === 1 ? 'disabled' : ''} onclick="mudarPaginaMotoristas(${paginaAtual - 1})">Anterior</button>`;
        pagHtml += `<span class="page-info">Página ${paginaAtual} de ${totalPaginas}</span>`;
        pagHtml += `<button class="page-btn" ${paginaAtual === totalPaginas ? 'disabled' : ''} onclick="mudarPaginaMotoristas(${paginaAtual + 1})">Próximo</button>`;
        pagination.innerHTML = pagHtml;
    }
}

function mudarPaginaMotoristas(novaPagina) {
    paginaAtual = novaPagina;
    renderizarMotoristas();
}

function ordenarMotoristas(coluna, thElement) {
    // Mapeamento caso a coluna no HTML seja diferente do JSON
    const mapColunas = { 'categorias': 'categoria_cnh' };
    const colunaReal = mapColunas[coluna] || coluna;

    if (colunaOrdem === colunaReal) {
        ordemAsc = !ordemAsc;
    } else {
        colunaOrdem = colunaReal;
        ordemAsc = true;
    }

    const tabela = document.getElementById('lista-motoristas')?.closest('table');
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

    aplicarFiltrosEOrdenacaoMotoristas();
}

// Evento de digitação na busca
document.getElementById('search-motoristas')?.addEventListener('input', () => {
    aplicarFiltrosEOrdenacaoMotoristas();
});

/** Abre/fecha um card mobile */
function toggleDriverCard(cardId) {
    const card   = document.getElementById(cardId + '-body')?.closest('.driver-card');
    const header = card?.querySelector('.driver-card-header');
    if (!card) return;
    card.classList.toggle('open');
    header?.setAttribute('aria-expanded', card.classList.contains('open') ? 'true' : 'false');
}

/* ── Formulário de cadastro ── */
document.getElementById('form-motorista').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome      = document.getElementById('nome').value.trim();
    const cnh       = document.getElementById('cnh').value.trim();
    const checkboxes = document.querySelectorAll('input[name="cnh-cat"]:checked');
    const categorias = Array.from(checkboxes).map(cb => cb.value).join(', ');

    if (!nome) {
        if (typeof showToast === 'function') showToast('Informe o nome do colaborador.', 'error');
        else alert('Informe o nome do colaborador.');
        document.getElementById('nome').focus();
        return;
    }
    if (!cnh) {
        if (typeof showToast === 'function') showToast('Informe o número da CNH.', 'error');
        else alert('Informe o número da CNH.');
        document.getElementById('cnh').focus();
        return;
    }
    if (!categorias) {
        if (typeof showToast === 'function') showToast('Selecione pelo menos uma categoria de CNH.', 'error');
        else alert('Selecione pelo menos uma categoria de CNH.');
        return;
    }

    const btn = document.getElementById('btn-efetivar');
    const textoOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Salvando...';

    try {
        const resposta = await fetch('/api/motoristas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, cnh, categoria_cnh: categorias })
        });

        if (resposta.ok) {
            document.getElementById('form-motorista').reset();
            await carregarMotoristas();
            if (typeof showToast === 'function') showToast('Motorista registrado com sucesso!', 'success');
            else alert('Motorista registrado com sucesso!');
        } else {
            const dados = await resposta.json().catch(() => ({}));
            const msg = dados.erro || 'Erro ao registrar motorista.';
            if (typeof showToast === 'function') showToast(msg, 'error');
            else alert(msg);
        }
    } catch (erro) {
        console.error('Erro no envio:', erro);
        if (typeof showToast === 'function') showToast('Erro de conexão com o servidor.', 'error');
        else alert('Erro de conexão com o servidor.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
    }
});

/* Carrega ao iniciar */
document.addEventListener('DOMContentLoaded', carregarMotoristas);