async function carregarVeiculosNoSelect() {
    try {
        const resposta = await fetch('/api/veiculos');
        const veiculos = await resposta.json();
        
        const select = document.getElementById('veiculo_id');
        
        veiculos.forEach(veiculo => {
            const option = document.createElement('option');
            option.value = veiculo.id;
            option.textContent = `${veiculo.placa} - ${veiculo.marca} ${veiculo.modelo}`;
            select.appendChild(option);
        });
    } catch (erro) {
        console.error('Erro ao carregar veículos para o select:', erro);
    }
}

async function carregarManutencoes() {
    try {
        const resposta = await fetch('/api/manutencoes');
        const manutencoes = await resposta.json();
        
        const tbody = document.getElementById('lista-manutencoes');
        tbody.innerHTML = ''; 

        // EMPTY STATE
        if (manutencoes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--text-muted);">
                <div style="font-size: 3rem; margin-bottom: 10px;">📭</div>
                Nenhuma manutenção registrada ainda.
            </td></tr>`;
            return;
        }

        manutencoes.forEach(manut => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${manut.veiculo_id}</strong></td>
                <td>${manut.data_manutencao}</td>
                <td><span style="background-color: ${manut.tipo === 'Preventiva' ? '#d4edda' : '#f8d7da'}; color: ${manut.tipo === 'Preventiva' ? '#155724' : '#721c24'}; padding: 4px 8px; border-radius: 4px; font-weight: 500; font-size: 0.85rem;">${manut.tipo}</span></td>
                <td>${manut.quilometragem} Km</td>
                <td>${manut.descricao}</td>
                <td>R$ ${manut.custo.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (erro) {
        console.error('Erro ao carregar manutenções:', erro);
    }
}

window.onload = () => {
    carregarVeiculosNoSelect();
    carregarManutencoes();
};

document.getElementById('form-manutencao').addEventListener('submit', async function(evento) {
    evento.preventDefault();

    const novaManutencao = {
        veiculo_id: parseInt(document.getElementById('veiculo_id').value),
        data_manutencao: document.getElementById('data_manutencao').value,
        tipo: document.getElementById('tipo').value,
        custo: parseFloat(document.getElementById('custo').value),
        descricao: document.getElementById('descricao').value,
        quilometragem: parseInt(document.getElementById('quilometragem_manut').value)
    };

    try {
        const resposta = await fetch('/api/manutencoes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaManutencao)
        });

        if (resposta.ok) {
            document.getElementById('form-manutencao').reset();
            carregarManutencoes(); 
            alert('Sucesso: Manutenção registada!');
        } else {
            alert('Erro ao registar a manutenção.');
        }
    } catch (erro) {
        console.error('Erro na requisição POST (manutenções):', erro);
    }
});