let todosMotoristas = []; 

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
            opt.dataset.km = v.quilometragem;
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

    const motoristasFiltrados = todosMotoristas.filter(m => {
        const cnh = m.categoria_cnh;
        if (tipoVeiculo === 'Carro') {
            return cnh.includes('B');
        } else if (tipoVeiculo === 'Caminhão') {
            return cnh.includes('C') || cnh.includes('D') || cnh.includes('E');
        }
        return false;
    });

    if (motoristasFiltrados.length === 0) {
        selectM.innerHTML = '<option value="">Nenhum motorista habilitado encontrado</option>';
        selectM.disabled = true;
    } else {
        motoristasFiltrados.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = `${m.nome} (CNH: ${m.categoria_cnh})`;
            selectM.appendChild(opt);
        });
    }
}

document.getElementById('veiculo_id').addEventListener('change', function() {
    const selectedOption = this.options[this.selectedIndex];
    const campoOdometro = document.getElementById('odometro');
    const campoData = document.getElementById('data_abastecimento');
    const selectM = document.getElementById('motorista_id');
    
    if (selectedOption && selectedOption.value !== "") {
        campoOdometro.value = selectedOption.dataset.km;
        campoData.value = new Date().toISOString().split('T')[0];
        filtrarMotoristas(selectedOption.dataset.tipo);
    } else {
        campoOdometro.value = "";
        campoData.value = "";
        selectM.innerHTML = '<option value="">Selecione primeiro o veículo...</option>';
        selectM.disabled = true;
    }
});

async function carregarAbastecimentos() {
    try {
        const resposta = await fetch('/api/abastecimentos');
        const abastecimentos = await resposta.json();
        const tbody = document.getElementById('lista-abastecimentos');
        tbody.innerHTML = '';
        
        // EMPTY STATE
        if (abastecimentos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--text-muted);">
                <div style="font-size: 3rem; margin-bottom: 10px;">⛽</div>
                Nenhum abastecimento registado.
            </td></tr>`;
            return;
        }

        abastecimentos.forEach(ab => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>ID Veíc: ${ab.veiculo_id}</td>
                <td>ID Mot: ${ab.motorista_id}</td>
                <td>${ab.data_abastecimento}</td>
                <td><strong>${ab.odometro} Km</strong></td>
                <td>${ab.litros} L</td>
                <td>R$ ${ab.valor_total.toFixed(2)}</td>
                <td style="color: #c0392b; font-weight: bold;">${ab.emissoes_co2_kg} kg</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (erro) {
        console.error('Erro ao carregar histórico:', erro);
    }
}

document.getElementById('form-abastecimento').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const dados = {
        veiculo_id: document.getElementById('veiculo_id').value,
        motorista_id: document.getElementById('motorista_id').value,
        data_abastecimento: document.getElementById('data_abastecimento').value,
        litros: document.getElementById('litros').value,
        valor_total: document.getElementById('valor_total').value,
        tipo_combustivel: document.getElementById('tipo_combustivel').value,
        odometro: document.getElementById('odometro').value
    };
    
    try {
        const resposta = await fetch('/api/abastecimentos', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(dados)
        });
        
        const resJSON = await resposta.json();

        if (resposta.ok) {
            document.getElementById('form-abastecimento').reset();
            carregarAbastecimentos();
            alert("Sucesso: Abastecimento registado e odómetro atualizado!");
        } else {
            alert("Erro: " + resJSON.erro);
        }
    } catch (erro) {
        console.error('Erro na requisição:', erro);
    }
});

window.onload = () => { 
    carregarSelects(); 
    carregarAbastecimentos(); 
};