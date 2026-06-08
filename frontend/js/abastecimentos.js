/* ═══════════════════════════════════════════════════
   abastecimentos.js — Gestão de Abastecimentos
   Renderiza tabela desktop + cards expandíveis mobile.
═══════════════════════════════════════════════════ */

let todosMotoristas = [];

// ═══════════════════════════════════════════════════
// ESTADO DA TABELA DE ABASTECIMENTOS
// ═══════════════════════════════════════════════════
let abastecimentosGeral = [];
let abastecimentosFiltrados = [];
let paginaAtual = 1;
const itensPorPagina = 10;
let colunaOrdem = null;
let ordemAsc = true;

async function carregarSelects() {
    try {
        const resV = await fetch('/api/veiculos');
        const veiculos = await resV.json();
        const selectV = document.getElementById('veiculo_id');
        selectV.innerHTML = '<option value="">Selecione o Veículo...</option>';

        veiculos.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.id;
            opt.textContent = `${v.placa} (${v.modelo})`;
            opt.dataset.km   = v.quilometragem;
            opt.dataset.tipo = v.tipo;
            selectV.appendChild(opt);
        });

        const resM = await fetch('/api/motoristas');
        todosMotoristas = await resM.json();

        const selectM = document.getElementById('motorista_id');
        selectM.innerHTML = '<option value="">Selecione primeiro o veículo...</option>';
        selectM.disabled = true;

    } catch (e) { console.error('Erro ao carregar selects:', e); }
}

function filtrarMotoristas(tipoVeiculo) {
    const selectM = document.getElementById('motorista_id');
    selectM.innerHTML = '<option value="">Selecione o Motorista...</option>';
    selectM.disabled = false;

    const filtrados = todosMotoristas.filter(m => {
        const cnh = m.categoria_cnh;
        if (tipoVeiculo === 'Carro')   return cnh.includes('B');
        if (tipoVeiculo === 'Caminhão') return cnh.includes('C') || cnh.includes('D') || cnh.includes('E');
        return false;
    });

    if (filtrados.length === 0) {
        selectM.innerHTML = '<option value="">Nenhum motorista habilitado encontrado</option>';
        selectM.disabled = true;
    } else {
        filtrados.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = `${m.nome} (CNH: ${m.categoria_cnh})`;
            selectM.appendChild(opt);
        });
    }
}

document.getElementById('veiculo_id').addEventListener('change', function () {
    const sel = this.options[this.selectedIndex];
    const campoOdometro = document.getElementById('odometro');
    const campoData     = document.getElementById('data_abastecimento');
    const selectM       = document.getElementById('motorista_id');

    if (sel && sel.value !== '') {
        campoOdometro.value = sel.dataset.km;
        campoData.value     = new Date().toISOString().split('T')[0];
        filtrarMotoristas(sel.dataset.tipo);
    } else {
        campoOdometro.value = '';
        campoData.value     = '';
        selectM.innerHTML   = '<option value="">Selecione primeiro o veículo...</option>';
        selectM.disabled    = true;
    }
});

/** Abre/fecha um fuel-card mobile */
function toggleFuelCard(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    card.classList.toggle('open');
}

async function carregarAbastecimentos() {
    try {
        const resposta = await fetch('/api/abastecimentos');
        abastecimentosGeral = await resposta.json();
        aplicarFiltrosEOrdenacaoAbastecimentos();
    } catch (erro) {
        console.error('Erro ao carregar abastecimentos:', erro);
    }
}

function aplicarFiltrosEOrdenacaoAbastecimentos() {
    const termo = (document.getElementById('search-abastecimentos')?.value || '').toLowerCase();
    
    // Filtro
    abastecimentosFiltrados = abastecimentosGeral.filter(ab => 
        String(ab.veiculo_id).toLowerCase().includes(termo) ||
        String(ab.motorista_id).toLowerCase().includes(termo) ||
        String(ab.tipo_combustivel || '').toLowerCase().includes(termo) ||
        String(ab.data_abastecimento).toLowerCase().includes(termo)
    );

    // Ordenação
    if (colunaOrdem) {
        abastecimentosFiltrados.sort((a, b) => {
            let valA = a[colunaOrdem] || '';
            let valB = b[colunaOrdem] || '';
            
            // Tratamento numérico para odômetro, litros, valor_total, co2, ids
            if (['odometro', 'litros', 'valor_total', 'emissoes_co2_kg', 'veiculo_id', 'motorista_id'].includes(colunaOrdem)) {
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
    renderizarAbastecimentos();
}

function renderizarAbastecimentos() {
    const tbody      = document.getElementById('lista-abastecimentos');
    const mobileList = document.getElementById('fuel-list-mobile');
    const pagination = document.getElementById('pagination-abastecimentos');

    if (!tbody) return;

    tbody.innerHTML = '';
    if (mobileList) mobileList.innerHTML = '';
    if (pagination) pagination.innerHTML = '';

    const emptyHtml = `
        <div style="text-align:center; padding:40px; color:var(--text-muted);">
            <div style="font-size:3rem; margin-bottom:10px;">⛽</div>
            Nenhum abastecimento encontrado.
        </div>`;

    if (abastecimentosFiltrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">${emptyHtml}</td></tr>`;
        if (mobileList) mobileList.innerHTML = emptyHtml;
        return;
    }

    // Paginação Matemática
    const totalPaginas = Math.ceil(abastecimentosFiltrados.length / itensPorPagina);
    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
    if (paginaAtual < 1) paginaAtual = 1;

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const itensPagina = abastecimentosFiltrados.slice(inicio, fim);

    /* ── Tabela Desktop ── */
    itensPagina.forEach((ab, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>Veíc. ${ab.veiculo_id}</td>
            <td>Mot. ${ab.motorista_id}</td>
            <td>${ab.data_abastecimento}</td>
            <td><strong>${ab.odometro} km</strong></td>
            <td>${ab.litros} L</td>
            <td>R$ ${Number(ab.valor_total).toFixed(2)}</td>
            <td class="co2-highlight">${ab.emissoes_co2_kg} kg</td>
        `;
        tbody.appendChild(tr);

        /* ── Cards Mobile ── */
        if (mobileList) {
            const cardId = `fuel-card-${idx}`;
            const div = document.createElement('div');
            div.className = 'fuel-card';
            div.id = cardId;
            div.setAttribute('role', 'listitem');

            div.innerHTML = `
                <div class="fuel-card-header" onclick="toggleFuelCard('${cardId}')">
                    <div class="fuel-card-left">
                        <div class="fuel-card-title">⛽ Veíc. ${ab.veiculo_id} — ${ab.litros} L</div>
                        <div class="fuel-card-sub">${ab.data_abastecimento} · Mot. ${ab.motorista_id}</div>
                    </div>
                    <span class="fuel-card-co2">🌱 ${ab.emissoes_co2_kg} kg CO₂</span>
                    <span class="fuel-card-toggle">▼</span>
                </div>
                <div class="fuel-card-body">
                    <div class="fuel-detail-row">
                        <span class="fuel-detail-label">Odômetro</span>
                        <span class="fuel-detail-val">${ab.odometro} km</span>
                    </div>
                    <div class="fuel-detail-row">
                        <span class="fuel-detail-label">Volume</span>
                        <span class="fuel-detail-val">${ab.litros} L</span>
                    </div>
                    <div class="fuel-detail-row">
                        <span class="fuel-detail-label">Investimento</span>
                        <span class="fuel-detail-val">R$ ${Number(ab.valor_total).toFixed(2)}</span>
                    </div>
                    <div class="fuel-detail-row">
                        <span class="fuel-detail-label">CO₂</span>
                        <span class="fuel-detail-val" style="color:#ef4444; font-weight:800;">${ab.emissoes_co2_kg} kg</span>
                    </div>
                </div>
            `;
            mobileList.appendChild(div);
        }
    });

    // Renderizar Controles de Paginação
    if (totalPaginas > 1 && pagination) {
        let pagHtml = `<button class="page-btn" ${paginaAtual === 1 ? 'disabled' : ''} onclick="mudarPaginaAbastecimentos(${paginaAtual - 1})">Anterior</button>`;
        pagHtml += `<span class="page-info">Página ${paginaAtual} de ${totalPaginas}</span>`;
        pagHtml += `<button class="page-btn" ${paginaAtual === totalPaginas ? 'disabled' : ''} onclick="mudarPaginaAbastecimentos(${paginaAtual + 1})">Próximo</button>`;
        pagination.innerHTML = pagHtml;
    }
}

document.getElementById('form-abastecimento').addEventListener('submit', async (e) => {
    e.preventDefault();

    const dados = {
        veiculo_id:         document.getElementById('veiculo_id').value,
        motorista_id:       document.getElementById('motorista_id').value,
        data_abastecimento: document.getElementById('data_abastecimento').value,
        litros:             document.getElementById('litros').value,
        valor_total:        document.getElementById('valor_total').value,
        tipo_combustivel:   document.getElementById('tipo_combustivel').value,
        odometro:           document.getElementById('odometro').value
    };

    const btn = document.getElementById('btn-validar-ticket');
    const textoOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⏳ Registrando...';

    try {
        const resposta = await fetch('/api/abastecimentos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const resJSON = await resposta.json();

        if (resposta.ok) {
            document.getElementById('form-abastecimento').reset();
            await carregarAbastecimentos();
            if (typeof showToast === 'function') showToast('Abastecimento registado com sucesso!', 'success');
            else alert('Abastecimento registado com sucesso!');
        } else {
            if (typeof showToast === 'function') showToast('Erro: ' + resJSON.erro, 'error');
            else alert('Erro: ' + resJSON.erro);
        }
    } catch (erro) {
        console.error('Erro na requisição:', erro);
        if (typeof showToast === 'function') showToast('Erro de conexão.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
    }
});

window.onload = () => {
    carregarSelects();
    carregarAbastecimentos();
};