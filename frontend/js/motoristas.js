async function carregarMotoristas() {
    try {
        const resposta = await fetch('/api/motoristas');
        if (!resposta.ok) throw new Error('Falha na rede');
        
        const motoristas = await resposta.json();
        const tbody = document.getElementById('lista-motoristas');
        
        if (!tbody) return; 
        tbody.innerHTML = '';
        
        // EMPTY STATE
        if (motoristas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 40px; color: var(--text-muted);">
                <div style="font-size: 3rem; margin-bottom: 10px;">🧑‍✈️</div>
                Nenhum motorista cadastrado ainda.
            </td></tr>`;
            return;
        }
        
        motoristas.forEach(mot => {
            const tr = document.createElement('tr');
            
            const categoriasBadge = mot.categoria_cnh.split(', ')
                .map(cat => `<span style="background: var(--primary-blue); color: var(--secondary-yellow); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-right: 5px; font-weight: bold;">${cat}</span>`)
                .join('');

            // ADICIONADO AVATAR DA API UI-AVATARS
            tr.innerHTML = `
                <td><img src="https://ui-avatars.com/api/?name=${mot.nome}&background=facc15&color=111827&rounded=true" width="35" style="vertical-align: middle;"></td>
                <td><strong>${mot.nome}</strong></td>
                <td><code>${mot.cnh}</code></td>
                <td>${categoriasBadge}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (erro) {
        console.error('Erro ao carregar motoristas:', erro);
    }
}

document.getElementById('form-motorista').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const checkboxes = document.querySelectorAll('input[name="cnh-cat"]:checked');
    const categorias = Array.from(checkboxes).map(cb => cb.value).join(', ');

    if (!categorias) {
        alert("Por favor, selecione pelo menos uma categoria de CNH.");
        return;
    }

    const dados = {
        nome: document.getElementById('nome').value,
        cnh: document.getElementById('cnh').value,
        categoria_cnh: categorias
    };
    
    try {
        const resposta = await fetch('/api/motoristas', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(dados)
        });
        
        if(resposta.ok) {
            document.getElementById('form-motorista').reset();
            document.querySelectorAll('input[name="cnh-cat"]').forEach(cb => cb.checked = false);
            carregarMotoristas(); 
            alert("Motorista guardado com sucesso!");
        } else {
            alert("Erro ao guardar motorista.");
        }
    } catch (erro) {
        console.error('Erro no envio:', erro);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    carregarMotoristas();
});