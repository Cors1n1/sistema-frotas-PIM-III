"""
╔══════════════════════════════════════════════════════════════════════╗
║  MODELOS DE DADOS (POO) — Sistema de Gestão de Frotas (PIM III)     ║
║                                                                      ║
║  Este módulo implementa os 4 Pilares da Programação Orientada a     ║
║  Objetos de forma prática e funcional:                               ║
║                                                                      ║
║  1. ENCAPSULAMENTO: Atributos protegidos (_id, _nome) com @property  ║
║  2. HERANÇA:        Motorista(Pessoa), Caminhao(Veiculo)             ║
║  3. POLIMORFISMO:   calcular_custo_pedagio() retorna valor diferente ║
║                     para CarroPasseio (fixo) e Caminhao (por eixo)   ║
║  4. ABSTRAÇÃO:      to_dict() esconde a complexidade de serialização ║
║                                                                      ║
║  Hierarquia de Classes:                                              ║
║    Pessoa ──► Motorista                                              ║
║    Veiculo ──► CarroPasseio                                          ║
║    Veiculo ──► Caminhao                                              ║
║    Abastecimento (independente, com @property emissao_co2)           ║
║    Manutencao (independente)                                         ║
╚══════════════════════════════════════════════════════════════════════╝
"""


# ═══════════════════════════════════════════════════════════════
# CLASSE BASE: Pessoa (Encapsulamento + Abstração)
# ═══════════════════════════════════════════════════════════════

class Pessoa:
    """
    Classe base abstrata para qualquer indivíduo no sistema.
    
    ENCAPSULAMENTO demonstrado aqui:
    - `_id` e `_nome` são atributos PROTEGIDOS (convenção Python com _)
    - O acesso externo ao nome é feito via @property, que aplica
      transformação automática (.upper()) — o dado interno nunca
      é exposto "cru" ao resto do sistema.
    
    ABSTRAÇÃO demonstrada aqui:
    - Quem usa a classe Pessoa não precisa saber que o nome
      é armazenado em minúsculas internamente.
    
    Attributes:
        _id (int): Identificador único (protegido).
        _nome (str): Nome completo (protegido, retornado em MAIÚSCULAS).
    """

    def __init__(self, id, nome):
        self._id = id      # Atributo protegido — acesso controlado
        self._nome = nome   # Atributo protegido — getter com lógica

    @property
    def nome(self):
        """
        Getter com lógica: retorna o nome sempre em MAIÚSCULAS.
        
        Isso demonstra ENCAPSULAMENTO: o atributo interno _nome
        pode ter qualquer formato, mas o valor exposto é sempre
        padronizado. Se a regra mudar (ex: Title Case), basta
        # O polimorfismo permite que novos tipos de taxa sejam adicionados aqui sem impactar as classes filhas.
        """
        return self._nome.upper()


# ═══════════════════════════════════════════════════════════════
# CLASSE DERIVADA: Motorista (Herança)
# ═══════════════════════════════════════════════════════════════

class Motorista(Pessoa):
    """
    Representa um motorista habilitado da empresa.
    
    HERANÇA demonstrada aqui:
    - Motorista(Pessoa) herda _id, _nome e a @property nome
    - super().__init__() invoca o construtor da classe pai
    - self.nome no to_dict() usa a property herdada (retorna MAIÚSCULAS)
    
    Atributos exclusivos:
        _cnh (str): Número do registro da CNH (protegido).
        _categoria (str): Categorias de habilitação (ex: "B, C, D").
    
    Regra de negócio (implementada em app.py):
        - Categoria B → pode dirigir Carro
        - Categorias C, D, E → pode dirigir Caminhão
    """

    def __init__(self, id, nome, cnh, categoria_cnh):
        super().__init__(id, nome)  # Chama construtor de Pessoa
        self._cnh = cnh
        self._categoria = categoria_cnh

    def to_dict(self):
        """Serializa o motorista para JSON (resposta da API)."""
        return {
            "id": self._id,              # Herdado de Pessoa
            "nome": self.nome,           # Property herdada (sempre MAIÚSCULA)
            "cnh": self._cnh,
            "categoria_cnh": self._categoria
        }


# ═══════════════════════════════════════════════════════════════
# CLASSE BASE: Veiculo (Base para Polimorfismo)
# ═══════════════════════════════════════════════════════════════

class Veiculo:
    """
    Classe base para todos os tipos de veículos da frota.
    
    Define a estrutura comum (placa, modelo, marca, ano, km, tipo)
    e o método polimórfico calcular_custo_pedagio().
    
    O método to_dict() chama calcular_custo_pedagio() internamente,
    então o pedágio exibido no frontend é automaticamente correto
    para cada tipo de veículo — sem nenhuma lógica condicional
    no controller (app.py).
    
    Attributes:
        id (int): Identificador único do veículo no banco.
        placa (str): Placa no padrão Mercosul (ex: ABC1D23).
        modelo (str): Modelo do veículo (ex: Clio, FH 540).
        marca (str): Fabricante (ex: Renault, Volvo).
        ano (int): Ano de fabricação.
        quilometragem (int): Odômetro atual (atualizado a cada abastecimento).
        tipo_veiculo (str): Discriminador: 'Carro' ou 'Caminhão'.
    """

    def __init__(self, id, placa, modelo, marca, ano, quilometragem,
                 tipo_veiculo='Carro'):
        self.id = id
        self.placa = placa
        self.modelo = modelo
        self.marca = marca
        self.ano = ano
        self.quilometragem = quilometragem
        self.tipo_veiculo = tipo_veiculo

    def calcular_custo_pedagio(self):
        """
        Método base para POLIMORFISMO.
        
        Retorna 0.0 por padrão. As subclasses CarroPasseio e
        Caminhao sobrescrevem este método com implementações
        específicas, demonstrando polimorfismo em ação.
        """
        return 0.0

    def to_dict(self):
        """
        Serializa o veículo para JSON.
        
        IMPORTANTE: Chama self.calcular_custo_pedagio() internamente.
        Graças ao polimorfismo, o valor correto é calculado
        automaticamente dependendo do tipo real do objeto
        (CarroPasseio → R$12,50 / Caminhao → eixos × R$9,80).
        """
        return {
            "id": self.id, "placa": self.placa, "modelo": self.modelo,
            "marca": self.marca, "ano": self.ano,
            "quilometragem": self.quilometragem,
            "tipo": self.tipo_veiculo,
            "pedagio": f"R$ {self.calcular_custo_pedagio():.2f}"
        }


# ═══════════════════════════════════════════════════════════════
# CLASSE DERIVADA: CarroPasseio (Polimorfismo — taxa fixa)
# ═══════════════════════════════════════════════════════════════

class CarroPasseio(Veiculo):
    """
    Carro de passeio — pedágio com taxa fixa de R$ 12,50.
    
    POLIMORFISMO: Sobrescreve calcular_custo_pedagio() da classe pai.
    Quando app.py instancia CarroPasseio e chama to_dict(),
    o pedágio exibido será sempre R$ 12,50.
    """

    def calcular_custo_pedagio(self):
        """Taxa fixa para carros de passeio (veículos de eixo simples)."""
        return 12.50


# ═══════════════════════════════════════════════════════════════
# CLASSE DERIVADA: Caminhao (Polimorfismo — taxa por eixo)
# ═══════════════════════════════════════════════════════════════

class Caminhao(Veiculo):
    """
    Caminhão — pedágio calculado por número de eixos (R$ 9,80/eixo).
    
    POLIMORFISMO: Mesmo método calcular_custo_pedagio(), resultado
    diferente baseado no número de eixos do caminhão.
    
    Exemplos:
        Caminhão de 2 eixos: 2 × R$ 9,80 = R$ 19,60
        Caminhão de 6 eixos: 6 × R$ 9,80 = R$ 58,80
    
    HERANÇA: Também sobrescreve to_dict() para incluir o campo
    'eixos', que é exclusivo de caminhões (não existe em carros).
    Usa super().to_dict() para reutilizar a lógica do pai.
    
    Attributes:
        eixos (int): Número de eixos do caminhão (default: 2).
    """

    def __init__(self, id, placa, modelo, marca, ano, quilometragem, eixos=2):
        super().__init__(id, placa, modelo, marca, ano, quilometragem, 'Caminhão')
        self.eixos = eixos

    def calcular_custo_pedagio(self):
        """Taxa variável: R$ 9,80 × número de eixos do caminhão."""
        return round(self.eixos * 9.80, 2)

    def to_dict(self):
        """Adiciona o campo 'eixos' ao dicionário base do veículo."""
        d = super().to_dict()    # Reutiliza todo o to_dict() do pai
        d["eixos"] = self.eixos  # Adiciona informação exclusiva
        return d


# ═══════════════════════════════════════════════════════════════
# CLASSE: Abastecimento (Encapsulamento com @property calculada)
# ═══════════════════════════════════════════════════════════════

class Abastecimento:
    """
    Registra uma operação de abastecimento, vinculando veículo e motorista.
    
    ENCAPSULAMENTO com @property:
    - A propriedade `emissao_co2` é um ATRIBUTO DERIVADO — não existe
      no banco de dados, mas é calculado automaticamente toda vez que
      é acessado. O cálculo usa o fator padrão de emissão de CO₂
      da gasolina: 2.3 kg por litro queimado.
    
    - No to_dict(), `self.emissao_co2` é incluído sem parênteses
      porque @property torna o método acessível como atributo.
    
    Regras de negócio (implementadas em app.py):
    - O odômetro não pode ser menor que o quilômetro atual do veículo
      (prevenção de fraude — antifraude de odômetro)
    - O motorista deve ter a categoria de CNH compatível com o veículo
      (validação de segurança)
    - Após inserir o abastecimento, a quilometragem do veículo é
      atualizada automaticamente (UPDATE veiculos SET km = novo_odometro)
    """

    FATOR_CO2_GASOLINA = 2.3  # kg de CO₂ por litro de gasolina

    def __init__(self, id, veiculo_id, motorista_id, data_abastecimento,
                 litros, valor_total, tipo_combustivel, odometro):
        self.id = id
        self.veiculo_id = veiculo_id
        self.motorista_id = motorista_id
        self.data_abastecimento = data_abastecimento
        self.litros = float(litros)            # Conversão de tipo segura
        self.valor_total = float(valor_total)
        self.tipo_combustivel = tipo_combustivel
        self.odometro = int(odometro)

    @property
    def emissao_co2(self):
        """
        Cálculo automático de impacto ambiental via POO.
        
        Fórmula: litros × 2.3 (fator de emissão padrão da gasolina)
        
        Isso demonstra ENCAPSULAMENTO: o cálculo é interno à classe.
        Quem chama `abastecimento.emissao_co2` recebe o valor pronto,
        sem precisar conhecer a fórmula ou o fator de emissão.
        
        Returns:
            float: Emissão estimada em kg de CO₂.
        """
        return round(self.litros * self.FATOR_CO2_GASOLINA, 2)

    def to_dict(self):
        """Serializa o abastecimento para JSON, incluindo emissões calculadas."""
        return {
            "id": self.id,
            "veiculo_id": self.veiculo_id,
            "motorista_id": self.motorista_id,
            "data_abastecimento": self.data_abastecimento.strftime('%Y-%m-%d')
                if self.data_abastecimento else None,
            "litros": self.litros,
            "valor_total": self.valor_total,
            "tipo_combustivel": self.tipo_combustivel,
            "odometro": self.odometro,
            "emissoes_co2_kg": self.emissao_co2  # Atributo derivado (@property)
        }


# ═══════════════════════════════════════════════════════════════
# CLASSE: Manutencao
# ═══════════════════════════════════════════════════════════════

class Manutencao:
    """
    Registra uma ordem de serviço de manutenção de um veículo.
    
    Tipos de Manutenção:
    - 'Preventiva': Programada a cada X km (ex: troca de óleo a cada 10.000 km).
      Usada pelo sistema de alertas para detectar revisões vencidas.
    - 'Corretiva': Reparos emergenciais (ex: troca de peça quebrada).
      Usada pelo modelo de Machine Learning para prever custos futuros.
    
    Regra de negócio:
    - O sistema alerta quando (km_atual - última_preventiva) >= 10.000 km
    - Manutenções corretivas alimentam o modelo de Regressão Linear (ml.py)
    
    Attributes:
        id (int): ID da manutenção no banco.
        veiculo_id (int): FK para veiculos(id).
        data_manutencao (date): Data da intervenção.
        tipo (str): 'Preventiva' ou 'Corretiva'.
        custo (float): Valor total do serviço (R$).
        descricao (str): Descrição dos serviços realizados.
        quilometragem (int): Odômetro no momento da manutenção.
    """

    def __init__(self, id, veiculo_id, data_manutencao, tipo, custo,
                 descricao, quilometragem):
        self.id = id
        self.veiculo_id = veiculo_id
        self.data_manutencao = data_manutencao
        self.tipo = tipo
        self.custo = float(custo)
        self.descricao = descricao
        self.quilometragem = int(quilometragem)

    def to_dict(self):
        """Serializa a manutenção para JSON."""
        return {
            "id": self.id, "veiculo_id": self.veiculo_id,
            "data_manutencao": self.data_manutencao.strftime('%Y-%m-%d')
                if self.data_manutencao else None,
            "tipo": self.tipo, "custo": self.custo,
            "descricao": self.descricao, "quilometragem": self.quilometragem
        }


# ═══════════════════════════════════════════════════════════════
# CLASSE: Usuario (Autenticação Multi-Usuário — Flask-Login)
# ═══════════════════════════════════════════════════════════════

from flask_login import UserMixin

class Usuario(UserMixin):
    """
    Representa um usuário autenticado do sistema.

    Herda de UserMixin (Flask-Login) que fornece automaticamente os
    métodos e propriedades exigidos pelo framework de autenticação:
    - is_authenticated, is_active, is_anonymous → controlam o estado da sessão
    - get_id() → retorna str(self.id), usado pelo Flask-Login para recarregar
      o usuário da sessão a cada requisição via user_loader.

    Perfis (roles):
        'admin'    → acesso total, incluindo gerenciar usuários
        'operador' → acesso ao sistema, sem gerenciar usuários

    ENCAPSULAMENTO:
        O atributo `senha_hash` nunca é exposto no to_dict() por segurança.

    Attributes:
        id (int): PK da tabela usuarios.
        nome (str): Nome completo de exibição.
        username (str): Login único (sem espaços).
        senha_hash (str): Hash bcrypt da senha (nunca texto puro).
        role (str): Perfil do usuário ('admin' ou 'operador').
    """

    def __init__(self, id, nome, username, senha_hash, role='operador'):
        self.id = id
        self.nome = nome
        self.username = username
        self.senha_hash = senha_hash  # Hash bcrypt — nunca a senha real
        self.role = role

    def is_admin(self):
        """Verifica se o usuário tem perfil de administrador."""
        return self.role == 'admin'

    def to_dict(self):
        """Serializa para JSON — senha_hash NUNCA é incluído."""
        return {
            "id": self.id,
            "nome": self.nome,
            "username": self.username,
            "role": self.role
        }