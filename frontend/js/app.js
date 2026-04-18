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

async function carregarVeiculos() {
    try {
        const resposta = await fetch('/api/veiculos');
        const veiculos = await resposta.json();
        const tbody = document.getElementById('lista-veiculos');
        tbody.innerHTML = '';

        // EMPTY STATE
        if (veiculos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--text-muted);">
                <div style="font-size: 3rem; margin-bottom: 10px;">🚗</div>
                Nenhum veículo cadastrado na frota.
            </td></tr>`;
            return;
        }

        veiculos.forEach(v => {
            const tr = document.createElement('tr');
            const infoAdicional = v.tipo === 'Caminhão' ? `${v.eixos} Eixos` : v.ano;
            
            tr.innerHTML = `
                <td><img src="${getLogoUrl(v.marca)}" class="car-table-img" onerror="this.src='https://ui-avatars.com/api/?name=${v.marca}&background=1e3a8a&color=fff'"></td>
                <td style="font-size: 0.8rem; color: var(--text-muted);">${v.tipo}</td>
                <td><strong>${v.placa}</strong></td>
                <td>${v.marca} ${v.modelo}</td>
                <td>${infoAdicional}</td>
                <td style="color: var(--primary-blue); font-weight: bold;">${v.pedagio}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (erro) { console.error(erro); }
}

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

    if (resposta.ok) {
        this.reset();
        document.getElementById('preview-container').style.display = 'none';
        toggleEixos('Carro');
        carregarVeiculos();
        alert("Veículo registado com sucesso!");
    } else {
        const res = await resposta.json();
        alert('Erro: ' + res.erro);
    }
});

window.onload = () => { iniciarAPI(); carregarVeiculos(); };