let tipoVeiculoFipe = "carros"; 
let marcasCache = [];
let codigoMarcaSelecionada = null;

function getApiUrl() {
    return `https://parallelum.com.br/fipe/api/v1/${tipoVeiculoFipe}/marcas`;
}

function getLogoUrl(marca) {
    const cleanMarca = marca.toLowerCase().trim().replace(/\s/g, '');
    return `https://www.google.com/s2/favicons?domain=${cleanMarca}.com.br&sz=64`;
}

async function toggleEixos(valor) {
    const container = document.getElementById('container-eixos');
    container.style.display = (valor === 'Caminhão') ? 'flex' : 'none';
    
    tipoVeiculoFipe = (valor === 'Caminhão') ? 'caminhoes' : 'carros';
    
    document.getElementById('marca').value = '';
    document.getElementById('modelo').value = '';
    document.getElementById('modelo').disabled = true;
    document.getElementById('ano').value = '';
    document.getElementById('ano').disabled = true;
    document.getElementById('preview-container').style.display = 'none';

    await iniciarAPI();
}

async function iniciarAPI() {
    try {
        const res = await fetch(getApiUrl());
        marcasCache = await res.json();
        const datalist = document.getElementById('marcas-list');
        datalist.innerHTML = ''; 
        marcasCache.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.nome;
            datalist.appendChild(opt);
        });
    } catch (e) { console.error("Erro ao carregar marcas:", e); }
}

document.getElementById('marca').addEventListener('input', async (e) => {
    const valor = e.target.value;
    const marcaEncontrada = marcasCache.find(m => m.nome.toLowerCase() === valor.toLowerCase());
    const inputModelo = document.getElementById('modelo');
    const container = document.getElementById('preview-container');

    if (marcaEncontrada) {
        codigoMarcaSelecionada = marcaEncontrada.codigo;
        container.style.display = 'flex';
        document.getElementById('preview-logo').src = getLogoUrl(marcaEncontrada.nome);
        document.getElementById('preview-nome').textContent = marcaEncontrada.nome;
        
        try {
            const res = await fetch(`${getApiUrl()}/${codigoMarcaSelecionada}/modelos`);
            const dados = await res.json();
            const datalistMod = document.getElementById('modelos-list');
            datalistMod.innerHTML = '';
            window.modelosCache = dados.modelos;
            dados.modelos.forEach(mod => {
                const opt = document.createElement('option');
                opt.value = mod.nome;
                datalistMod.appendChild(opt);
            });
            inputModelo.disabled = false;
        } catch (err) { console.error(err); }
    } else {
        inputModelo.disabled = true;
        container.style.display = 'none';
    }
});

document.getElementById('modelo').addEventListener('input', async (e) => {
    const valor = e.target.value;
    const modeloEncontrado = (window.modelosCache || []).find(m => m.nome.toLowerCase() === valor.toLowerCase());
    const inputAno = document.getElementById('ano');

    if (modeloEncontrado && codigoMarcaSelecionada) {
        try {
            const res = await fetch(`${getApiUrl()}/${codigoMarcaSelecionada}/modelos/${modeloEncontrado.codigo}/anos`);
            const anos = await res.json();
            const datalistAnos = document.getElementById('anos-list');
            datalistAnos.innerHTML = '';
            anos.forEach(a => {
                const opt = document.createElement('option');
                opt.value = a.nome.split(' ')[0];
                datalistAnos.appendChild(opt);
            });
            inputAno.disabled = false;
        } catch (err) { console.error(err); }
    } else {
        inputAno.disabled = true;
    }
});

function toggleVehicleCard(cardId) {
    const card = document.getElementById(cardId);
    if(card) card.classList.toggle('open');
}

// ════════════════════════════════════════════
// ESTADO DA TABELA DE FROTA
// ════════════════════════════════════════════
let frotaGeral = [];
let frotaFiltrada = [];
let paginaAtual = 1;
const itensPorPagina = 10;
let colunaOrdem = null;
let ordemAsc = true;

async function carregarVeiculos() {
    try {
        const resposta = await fetch('/api/veiculos');
        frotaGeral = await resposta.json();
        aplicarFiltrosEOrdenacao();
    } catch (erro) { console.error(erro); }
}

function aplicarFiltrosEOrdenacao() {
    const termo = (document.getElementById('search-veiculos')?.value || '').toLowerCase();
    
    // 1. Filtro
    frotaFiltrada = frotaGeral.filter(v => 
        v.placa.toLowerCase().includes(termo) ||
        v.marca.toLowerCase().includes(termo) ||
        v.modelo.toLowerCase().includes(termo) ||
        v.tipo.toLowerCase().includes(termo)
    );

    // 2. Ordenação
    if (colunaOrdem) {
        frotaFiltrada.sort((a, b) => {
            let valA = a[colunaOrdem];
            let valB = b[colunaOrdem];
            
            if (colunaOrdem === 'quilometragem') {
                valA = Number(valA); valB = Number(valB);
            } else if (typeof valA === 'string') {
                valA = valA.toLowerCase(); valB = valB.toLowerCase();
            }

            if (valA < valB) return ordemAsc ? -1 : 1;
            if (valA > valB) return ordemAsc ? 1 : -1;
            return 0;
        });
    }

    // Ao digitar, voltamos sempre para a primeira página
    paginaAtual = 1;
    renderizarVeiculos();
}

function renderizarVeiculos() {
    const tbody = document.getElementById('lista-veiculos');
    const mobileList = document.getElementById('vehicles-list-mobile');
    const pagination = document.getElementById('pagination-veiculos');
    
    tbody.innerHTML = '';
    if (mobileList) mobileList.innerHTML = '';
    if (pagination) pagination.innerHTML = '';

    if (frotaFiltrada.length === 0) {
        const emptyHtml = `<div style="text-align:center; padding: 40px; color: var(--text-muted);">
            <div style="font-size: 3rem; margin-bottom: 10px;">🚗</div>
            Nenhum veículo encontrado.
        </div>`;
        tbody.innerHTML = `<tr><td colspan="7">${emptyHtml}</td></tr>`;
        if (mobileList) mobileList.innerHTML = emptyHtml;
        return;
    }

    // 3. Paginação Matemática
    const totalPaginas = Math.ceil(frotaFiltrada.length / itensPorPagina);
    // Impede paginaAtual de ser maior que o total (caso a busca restrinja os resultados)
    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
    if (paginaAtual < 1) paginaAtual = 1;
    
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const itensPagina = frotaFiltrada.slice(inicio, fim);

    itensPagina.forEach((v, idx) => {
        const tr = document.createElement('tr');
        const infoAdicional = v.tipo === 'Caminhão' ? `${v.eixos} Eixos` : v.ano;
        
        tr.innerHTML = `
            <td><img src="${getLogoUrl(v.marca)}" class="car-table-img" onerror="this.src='https://ui-avatars.com/api/?name=${v.marca}&background=1e3a8a&color=fff'"></td>
            <td style="font-size: 0.8rem; color: var(--text-muted);">${v.tipo}</td>
            <td><strong>${v.placa}</strong></td>
            <td>${v.marca} ${v.modelo}</td>
            <td>${infoAdicional}</td>
            <td style="font-weight: 600;">${Number(v.quilometragem).toLocaleString('pt-BR')} km</td>
            <td style="color: var(--primary-blue); font-weight: bold;">${v.pedagio}</td>
        `;
        tbody.appendChild(tr);

        /* ── Card Mobile ── */
        if (mobileList) {
            const cardId = `vehicle-card-${idx}`;
            const div = document.createElement('div');
            div.className = 'vehicle-card';
            div.id = cardId;
            div.setAttribute('role', 'listitem');
            div.innerHTML = `
                <div class="vehicle-card-header" onclick="toggleVehicleCard('${cardId}')">
                    <div class="vehicle-card-left">
                        <img src="${getLogoUrl(v.marca)}" style="width:36px; border-radius:6px;" onerror="this.src='https://ui-avatars.com/api/?name=${v.marca}&background=1e3a8a&color=fff'">
                        <div>
                            <div class="vehicle-card-title">${v.placa}</div>
                            <div class="vehicle-card-sub">${v.marca} ${v.modelo}</div>
                        </div>
                    </div>
                    <span class="vehicle-card-toggle">▼</span>
                </div>
                <div class="vehicle-card-body">
                    <div class="vehicle-detail-row">
                        <span class="vehicle-detail-label">Categoria</span>
                        <span class="vehicle-detail-val">${v.tipo}</span>
                    </div>
                    <div class="vehicle-detail-row">
                        <span class="vehicle-detail-label">Ano / Config.</span>
                        <span class="vehicle-detail-val">${infoAdicional}</span>
                    </div>
                    <div class="vehicle-detail-row">
                        <span class="vehicle-detail-label">Odômetro</span>
                        <span class="vehicle-detail-val">${Number(v.quilometragem).toLocaleString('pt-BR')} km</span>
                    </div>
                    <div class="vehicle-detail-row">
                        <span class="vehicle-detail-label">Pedágio Médio</span>
                        <span class="vehicle-detail-val" style="color: var(--primary-blue);">${v.pedagio}</span>
                    </div>
                </div>
            `;
            mobileList.appendChild(div);
        }
    });

    // 4. Renderizar Controles de Paginação
    if (totalPaginas > 1) {
        let pagHtml = `<button class="page-btn" ${paginaAtual === 1 ? 'disabled' : ''} onclick="mudarPaginaVeiculos(${paginaAtual - 1})">Anterior</button>`;
        pagHtml += `<span class="page-info">Página ${paginaAtual} de ${totalPaginas}</span>`;
        pagHtml += `<button class="page-btn" ${paginaAtual === totalPaginas ? 'disabled' : ''} onclick="mudarPaginaVeiculos(${paginaAtual + 1})">Próximo</button>`;
        pagination.innerHTML = pagHtml;
    }
}

function mudarPaginaVeiculos(novaPagina) {
    paginaAtual = novaPagina;
    renderizarVeiculos();
}

function ordenarVeiculos(coluna, thElement) {
    if (colunaOrdem === coluna) {
        ordemAsc = !ordemAsc; // Inverte a ordem
    } else {
        colunaOrdem = coluna;
        ordemAsc = true;
    }

    // Atualizar interface visual dos cabecalhos
    const tabela = document.getElementById('lista-veiculos').closest('table');
    tabela.querySelectorAll('th.sortable').forEach(th => {
        th.classList.remove('active', 'asc', 'desc');
        th.querySelector('.sort-icon').textContent = '↕️';
    });

    if (thElement) {
        thElement.classList.add('active', ordemAsc ? 'asc' : 'desc');
        thElement.querySelector('.sort-icon').textContent = ordemAsc ? '⬆️' : '⬇️';
    }

    aplicarFiltrosEOrdenacao();
}

// Evento de digitação na busca
document.getElementById('search-veiculos')?.addEventListener('input', () => {
    aplicarFiltrosEOrdenacao();
});



document.getElementById('form-veiculo').addEventListener('submit', async function(e) {
    e.preventDefault();
    const dados = {
        placa: document.getElementById('placa').value,
        marca: document.getElementById('marca').value,
        modelo: document.getElementById('modelo').value,
        ano: document.getElementById('ano').value,
        quilometragem: document.getElementById('quilometragem').value,
        tipo: document.getElementById('tipo_veiculo').value,
        eixos: document.getElementById('eixos').value || 0
    };

    const resposta = await fetch('/api/veiculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });

    const res = await resposta.json();
    if (resposta.ok) {
        this.reset();
        document.getElementById('preview-container').style.display = 'none';
        toggleEixos('Carro');
        carregarVeiculos();
        if (typeof showToast === 'function') showToast("Veículo registado com sucesso!", 'success');
        else alert("Veículo registado com sucesso!");
    } else {
        if (typeof showToast === 'function') showToast('Erro: ' + res.erro, 'error');
        else alert('Erro: ' + res.erro);
    }
});

window.onload = () => { iniciarAPI(); carregarVeiculos(); };