# Documentação Técnica — Programação Orientada a Objetos (POO)

## 4.1 Introdução

A Programação Orientada a Objetos (POO) é o paradigma central utilizado no desenvolvimento do **Sistema de Gestão de Frotas Integrado**. Embora o manual do PIM sugira a utilização da linguagem C#, o professor autorizou a implementação em **Python**, mantendo todos os conceitos e pilares da POO intactos.

Python suporta nativamente os quatro pilares da POO — **Encapsulamento**, **Herança**, **Polimorfismo** e **Abstração** — com uma sintaxe clara e expressiva. O sistema foi desenvolvido seguindo o padrão **MVC (Model-View-Controller)**, onde os modelos de dados (classes) estão isolados no arquivo `models.py`, a lógica de controle está em `app.py`, e as views são os templates HTML do frontend.

---

## 4.2 Arquitetura Geral da Aplicação

A aplicação segue uma arquitetura em **três camadas** bem definidas:

```
    ┌──────────────────────────────────────────────────────────────────┐
    │                    ARQUITETURA DO SISTEMA                        │
    │                                                                  │
    │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
    │   │   FRONTEND   │    │   BACKEND    │    │  BANCO DE    │      │
    │   │  (View)      │◄──▶│ (Controller) │◄──▶│   DADOS      │      │
    │   │              │    │              │    │  (Model)     │      │
    │   │ HTML/CSS/JS  │    │  Flask API   │    │ PostgreSQL   │      │
    │   │ Jinja2       │    │  app.py      │    │              │      │
    │   │ Chart.js     │    │  models.py   │    │ veiculos     │      │
    │   │ Leaflet.js   │    │  ml.py       │    │ motoristas   │      │
    │   │              │    │  database.py │    │ abastecim.   │      │
    │   └──────────────┘    └──────────────┘    │ manutencoes  │      │
    │                                           └──────────────┘      │
    └──────────────────────────────────────────────────────────────────┘
```

### Organização dos Arquivos do Backend

| Arquivo        | Responsabilidade                                                     |
|----------------|----------------------------------------------------------------------|
| `models.py`    | Classes POO (Pessoa, Motorista, Veiculo, CarroPasseio, Caminhao, etc.) |
| `app.py`       | Rotas da API REST (Flask), validações e regras de negócio            |
| `database.py`  | Conexão com o PostgreSQL via `psycopg2`                              |
| `ml.py`        | Classe `AnalisadorFrotas` para Machine Learning (Scikit-Learn)       |
| `.env`         | Variáveis de ambiente (credenciais do banco de dados)                |

---

## 4.3 Diagrama de Classes UML

O diagrama a seguir apresenta a hierarquia de classes implementadas no `models.py`, com indicação dos pilares POO utilizados:

```
                        ┌─────────────────────┐
                        │      Pessoa          │  ◄── CLASSE BASE (Abstração)
                        │─────────────────────│
                        │ # _id : int          │  ◄── ENCAPSULAMENTO (atributo protegido)
                        │ # _nome : str        │
                        │─────────────────────│
                        │ + nome : property    │  ◄── GETTER com lógica (.upper())
                        └──────────┬──────────┘
                                   │
                                   │ HERANÇA
                                   ▼
                        ┌─────────────────────┐
                        │     Motorista        │
                        │─────────────────────│
                        │ # _cnh : str         │
                        │ # _categoria : str   │
                        │─────────────────────│
                        │ + to_dict() : dict   │
                        └─────────────────────┘


                        ┌─────────────────────┐
                        │      Veiculo         │  ◄── CLASSE BASE (para Polimorfismo)
                        │─────────────────────│
                        │ + id : int           │
                        │ + placa : str        │
                        │ + modelo : str       │
                        │ + marca : str        │
                        │ + ano : int          │
                        │ + quilometragem : int│
                        │ + tipo_veiculo : str │
                        │─────────────────────│
                        │ + calcular_custo_    │
                        │   pedagio() → float  │  ◄── Método BASE (retorna 0.0)
                        │ + to_dict() : dict   │
                        └──────────┬──────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │ HERANÇA                      │ HERANÇA
                    ▼                              ▼
        ┌─────────────────────┐       ┌─────────────────────┐
        │   CarroPasseio      │       │     Caminhao         │
        │─────────────────────│       │─────────────────────│
        │                     │       │ + eixos : int        │
        │─────────────────────│       │─────────────────────│
        │ + calcular_custo_   │       │ + calcular_custo_   │
        │   pedagio() → 12.50│       │   pedagio()         │
        │   POLIMORFISMO ▲    │       │   → eixos * 9.80    │
        └─────────────────────┘       │   POLIMORFISMO ▲    │
                                      │ + to_dict() → dict  │
                                      │   (sobrescrito)     │
                                      └─────────────────────┘


        ┌─────────────────────┐       ┌─────────────────────┐
        │    Abastecimento     │       │     Manutencao       │
        │─────────────────────│       │─────────────────────│
        │ + id : int           │       │ + id : int           │
        │ + veiculo_id : int   │       │ + veiculo_id : int   │
        │ + motorista_id : int │       │ + data_manutencao    │
        │ + data_abastecimento │       │ + tipo : str         │
        │ + litros : float     │       │ + custo : float      │
        │ + valor_total : float│       │ + descricao : str    │
        │ + tipo_combustivel   │       │ + quilometragem : int│
        │ + odometro : int     │       │─────────────────────│
        │─────────────────────│       │ + to_dict() : dict   │
        │ + emissao_co2 :      │       └─────────────────────┘
        │   property ◄────────│─── ENCAPSULAMENTO (cálculo automático)
        │ + to_dict() : dict   │
        └─────────────────────┘

        ┌─────────────────────┐
        │  AnalisadorFrotas    │  ◄── Módulo de Machine Learning
        │─────────────────────│
        │ + conn : Connection  │
        │─────────────────────│
        │ + prever_custo_     │
        │   manutencao() → dict│
        └─────────────────────┘
```

---

## 4.4 Pilar 1 — Encapsulamento

O **encapsulamento** é o mecanismo que restringe o acesso direto aos dados internos de um objeto, controlando sua manipulação através de métodos públicos (getters e setters). Em Python, a convenção de sublinhado único (`_atributo`) indica atributos protegidos.

### 4.4.1 Exemplo: Classe `Pessoa` com Atributos Protegidos

```python
class Pessoa:
    def __init__(self, id, nome):
        self._id = id      # Atributo protegido (convenção _)
        self._nome = nome   # Não pode ser acessado diretamente de fora

    @property
    def nome(self):
        return self._nome.upper()  # Getter com lógica: retorna sempre em MAIÚSCULO
```

**Explicação técnica:**
- Os atributos `_id` e `_nome` são **protegidos**: não devem ser acessados diretamente por código externo.
- O **decorator `@property`** transforma o método `nome` em um getter que pode ser acessado como atributo (`objeto.nome`), porém com lógica interna — neste caso, converte o nome para maiúsculas automaticamente.
- Isso garante que o dado armazenado internamente nunca seja exposto "cru" ao resto do sistema.

### 4.4.2 Exemplo: Classe `Abastecimento` com Propriedade Calculada

```python
class Abastecimento:
    def __init__(self, id, veiculo_id, motorista_id, data_abastecimento,
                 litros, valor_total, tipo_combustivel, odometro):
        self.id = id
        self.veiculo_id = veiculo_id
        self.motorista_id = motorista_id
        self.data_abastecimento = data_abastecimento
        self.litros = float(litros)        # Conversão de tipo segura
        self.valor_total = float(valor_total)
        self.tipo_combustivel = tipo_combustivel
        self.odometro = int(odometro)

    @property
    def emissao_co2(self):
        """Cálculo automático de impacto ambiental via POO"""
        return round(self.litros * 2.3, 2)  # Fator: 2.3 kg CO₂ por litro
```

**Explicação técnica:**
- A propriedade `emissao_co2` é um **atributo derivado** — ele não existe no banco de dados, mas é calculado automaticamente toda vez que é acessado.
- O fator `2.3` representa a estimativa padrão de emissão de kg de CO₂ por litro de gasolina queimado.
- No método `to_dict()`, basta incluir `"emissoes_co2_kg": self.emissao_co2` para que o valor calculado seja enviado ao frontend.

---

## 4.5 Pilar 2 — Herança

A **herança** permite que uma classe filha reutilize e estenda os atributos e métodos de uma classe pai, evitando duplicação de código e promovendo a hierarquia lógica.

### 4.5.1 Herança em Pessoas: `Motorista` herda de `Pessoa`

```python
class Pessoa:
    def __init__(self, id, nome):
        self._id = id
        self._nome = nome

    @property
    def nome(self):
        return self._nome.upper()

class Motorista(Pessoa):   # ◄── HERDA de Pessoa
    def __init__(self, id, nome, cnh, categoria_cnh):
        super().__init__(id, nome)  # ◄── Chama o construtor da classe pai
        self._cnh = cnh
        self._categoria = categoria_cnh

    def to_dict(self):
        return {
            "id": self._id,           # Herdado de Pessoa
            "nome": self.nome,        # Property herdada (retorna em MAIÚSCULO)
            "cnh": self._cnh,
            "categoria_cnh": self._categoria
        }
```

**Explicação técnica:**
- `Motorista(Pessoa)` — indica que `Motorista` **herda** de `Pessoa`.
- `super().__init__(id, nome)` — invoca o construtor da classe pai para inicializar `_id` e `_nome`.
- `self.nome` no `to_dict()` — utiliza a **property herdada**, que aplica `.upper()`.
- Se futuramente criarmos um `Funcionario` ou `Gerente`, basta herdar de `Pessoa` — o encapsulamento do nome já estará disponível.

### 4.5.2 Herança em Veículos: `CarroPasseio` e `Caminhao` herdam de `Veiculo`

```python
class Veiculo:
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
        """Método base para Polimorfismo — retorna 0 por padrão"""
        return 0.0

    def to_dict(self):
        return {
            "id": self.id, "placa": self.placa, "modelo": self.modelo,
            "marca": self.marca, "ano": self.ano,
            "quilometragem": self.quilometragem,
            "tipo": self.tipo_veiculo,
            "pedagio": f"R$ {self.calcular_custo_pedagio():.2f}"
        }

class CarroPasseio(Veiculo):  # ◄── Herda de Veiculo
    def calcular_custo_pedagio(self):
        return 12.50  # Taxa fixa para carros de passeio

class Caminhao(Veiculo):      # ◄── Herda de Veiculo
    def __init__(self, id, placa, modelo, marca, ano, quilometragem, eixos=2):
        super().__init__(id, placa, modelo, marca, ano, quilometragem, 'Caminhão')
        self.eixos = eixos    # Atributo exclusivo de Caminhão
```

**Explicação técnica:**
- `CarroPasseio` e `Caminhao` **herdam** toda a estrutura de `Veiculo` sem reimplementar atributos comuns.
- `Caminhao` adiciona o atributo exclusivo `eixos` e chama o construtor pai com `tipo_veiculo='Caminhão'`.
- A herança permite que ambas as classes sejam tratadas como `Veiculo` em contextos genéricos (polimorfismo).

---

## 4.6 Pilar 3 — Polimorfismo

O **polimorfismo** permite que objetos de classes diferentes respondam à mesma chamada de método de formas distintas. No sistema, o método `calcular_custo_pedagio()` é polimórfico.

### 4.6.1 Demonstração do Polimorfismo

```python
class CarroPasseio(Veiculo):
    def calcular_custo_pedagio(self):
        return 12.50  # Taxa FIXA para carros

class Caminhao(Veiculo):
    def calcular_custo_pedagio(self):
        return round(self.eixos * 9.80, 2)  # Taxa VARIÁVEL por eixo
```

**Comportamento polimórfico em execução:**

```python
# Mesmo método, resultados diferentes dependendo do tipo do objeto:

carro = CarroPasseio(1, "ABC1D23", "Clio", "Renault", 2022, 35000)
caminhao = Caminhao(2, "XYZ9W87", "FH 540", "Volvo", 2021, 80000, eixos=6)

print(carro.calcular_custo_pedagio())     # → R$ 12.50 (taxa fixa)
print(caminhao.calcular_custo_pedagio())  # → R$ 58.80 (6 eixos × R$ 9,80)
```

### 4.6.2 Uso Real no Sistema (app.py)

O polimorfismo é aplicado no backend ao carregar veículos do banco de dados:

```python
# Trecho de app.py — Rota GET /api/veiculos
for linha in linhas:
    if linha[6] == 'Caminhão':
        # Instancia como Caminhão (com cálculo de pedágio por eixo)
        veiculo_obj = Caminhao(linha[0], linha[1], linha[2],
                               linha[3], linha[4], linha[5], linha[7])
    else:
        # Instancia como CarroPasseio (com pedágio fixo)
        veiculo_obj = CarroPasseio(linha[0], linha[1], linha[2],
                                    linha[3], linha[4], linha[5])

    lista_veiculos.append(veiculo_obj.to_dict())
    # O to_dict() chama calcular_custo_pedagio() internamente
    # → Cada tipo de veículo calcula seu próprio custo!
```

**Resultado:** O frontend exibe automaticamente o custo correto de pedágio para cada tipo de veículo, sem precisar de nenhuma lógica adicional — o polimorfismo resolve tudo internamente.

### 4.6.3 Sobrescrita de `to_dict()` no `Caminhao`

```python
class Caminhao(Veiculo):
    def to_dict(self):
        d = super().to_dict()   # Chama o to_dict() do pai (Veiculo)
        d["eixos"] = self.eixos # Adiciona informação exclusiva
        return d
```

**Explicação:** O `Caminhao` sobrescreve o `to_dict()` para incluir o campo `eixos`, mas reutiliza toda a lógica da classe pai com `super().to_dict()`.

---

## 4.7 Pilar 4 — Abstração

A **abstração** é o princípio de expor apenas as funcionalidades essenciais de um objeto, ocultando a complexidade interna. No sistema, isso é demonstrado em vários pontos.

### 4.7.1 Abstração na Camada de Banco de Dados

```python
# database.py — Abstrai toda a complexidade de conexão
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )
    return conn
```

**Explicação:** Quem chama `get_db_connection()` não precisa saber:
- Qual driver está sendo usado (`psycopg2`)
- De onde vêm as credenciais (`.env`)
- Qual é o host ou a porta do servidor

A função **abstrai** todos esses detalhes e entrega uma conexão pronta.

### 4.7.2 Abstração no Machine Learning

```python
# ml.py — O analisador esconde TODA a complexidade da IA
class AnalisadorFrotas:
    def __init__(self, conexao_db):
        self.conn = conexao_db

    def prever_custo_manutencao(self):
        # ... toda a lógica interna do ML é escondida
        # Para quem chama, basta fazer:
        #   resultado = analisador.prever_custo_manutencao()
        # E receber um dicionário com o resultado pronto
```

**Uso simplificado no `app.py`:**

```python
@app.route('/api/dashboard/previsao', methods=['GET'])
def obter_previsao():
    conn = get_db_connection()
    analisador = AnalisadorFrotas(conn)
    resultado = analisador.prever_custo_manutencao()  # Simplesmente "pede" o resultado
    return jsonify(resultado)
```

---

## 4.8 Regras de Negócio Implementadas com POO

### 4.8.1 Validação de CNH para Abastecimento

O sistema implementa uma **regra de negócio de segurança** que impede um motorista de abastecer um veículo para o qual não possui habilitação:

```python
# Trecho do app.py — Rota POST /api/abastecimentos

# 1. Busca o tipo do veículo e a categoria da CNH do motorista
tipo_v = v_info[0]       # Ex: 'Carro' ou 'Caminhão'
cat_cnh = m_info[0]      # Ex: 'B' ou 'B, C, D'

# 2. Validação de Categoria de CNH
autorizado = False
if tipo_v == 'Carro':
    if 'B' in cat_cnh:           # Carro exige CNH tipo B
        autorizado = True
elif tipo_v == 'Caminhão':
    if any(x in cat_cnh for x in ['C', 'D', 'E']):  # Caminhão aceita C, D ou E
        autorizado = True

if not autorizado:
    return jsonify({
        "erro": f"Bloqueio de Segurança: O motorista não possui a "
                f"categoria específica para {tipo_v}. (CNH atual: {cat_cnh})"
    }), 403  # HTTP 403 Forbidden
```

### 4.8.2 Validação de Odômetro Antifraude

```python
# Impede que o odômetro seja "voltado" (fraude)
if novo_odometro < km_atual_v:
    return jsonify({
        "erro": f"Odômetro inválido! O atual é {km_atual_v} km."
    }), 400
```

### 4.8.3 Atualização Automática do Odômetro

```python
# Após registrar o abastecimento, atualiza a quilometragem do veículo
cursor.execute(
    "UPDATE veiculos SET quilometragem = %s WHERE id = %s",
    (novo_odometro, veiculo_id)
)
```

---

## 4.9 Padrões de Projeto Utilizados

| Padrão                   | Onde é Aplicado                          | Descrição                                             |
|--------------------------|------------------------------------------|-------------------------------------------------------|
| **MVC**                  | Toda a aplicação                         | Separação entre Modelo (models.py), View (HTML), Controller (app.py) |
| **Factory Method**       | `app.py` (criação de veículos)           | Decide instanciar `CarroPasseio` ou `Caminhao` baseado no tipo |
| **Template Method**      | `Veiculo.to_dict()`                      | Define estrutura base, filhos podem sobrescrever       |
| **Strategy**             | `calcular_custo_pedagio()`               | Cada classe implementa sua própria estratégia de cálculo |

---

## 4.10 Resumo dos Pilares POO no Projeto

| Pilar            | Onde está no código                | Exemplo Prático                            |
|------------------|------------------------------------|--------------------------------------------|
| **Encapsulamento** | `Pessoa._id`, `Pessoa._nome`, `@property` | Nome sempre retornado em maiúsculas       |
| **Herança**      | `Motorista(Pessoa)`, `Caminhao(Veiculo)` | Motorista reutiliza atributos de Pessoa  |
| **Polimorfismo** | `calcular_custo_pedagio()`         | Carro: R$12,50 fixo / Caminhão: eixos × R$9,80 |
| **Abstração**    | `get_db_connection()`, `AnalisadorFrotas` | Complexidade oculta, interface simples    |
