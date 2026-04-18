# 🚛 Sistema de Gestão de Frotas — PIM III (ADS)

> **Projeto Integrado Multidisciplinar III** — Análise e Desenvolvimento de Sistemas  
> Sistema web inteligente para gerenciamento de frotas com Machine Learning e acessibilidade WCAG 2.1

---

## 📌 Sobre o Projeto

Sistema completo de gestão de frotas empresariais que permite o controle de **veículos**, **motoristas**, **abastecimentos** e **manutenções**, com um módulo de **Inteligência Artificial** para predição de custos e uma interface **acessível** seguindo padrões internacionais.

### Destaques

- 🤖 **Machine Learning** — Regressão Linear para prever custos de manutenção com métricas R², MAE e RMSE
- ♿ **Acessibilidade WCAG 2.1 AA** — Alto Contraste, VLibras (Libras), Ampliação de Fonte
- 🗺️ **Simulador de Rotas GPS** — Integração com OSRM e Leaflet.js para cálculo de rotas inteligentes
- 📊 **Dashboard Interativo** — Gráficos dinâmicos com Chart.js e KPIs em tempo real
- 🌙 **Dark/Light Mode** — Tema adaptativo com preferência salva no navegador
- 🔒 **Segurança** — Prepared Statements contra SQL Injection, credenciais em `.env`

---

## 🛠️ Tecnologias Utilizadas

### Backend
| Tecnologia | Função |
|-----------|--------|
| Python 3.12+ | Linguagem principal |
| Flask | Framework web (API REST) |
| PostgreSQL | Banco de dados relacional |
| Scikit-Learn | Machine Learning (Regressão Linear) |
| Pandas / NumPy | Análise e manipulação de dados |
| psycopg2 | Driver de conexão com PostgreSQL |

### Frontend
| Tecnologia | Função |
|-----------|--------|
| HTML5 / CSS3 / JS | Base da interface |
| Chart.js | Gráficos interativos |
| Leaflet.js | Mapas e rotas GPS |
| VLibras | Tradução para Libras |
| VanillaTilt.js | Efeitos 3D nos cards |

### APIs Externas
| API | Função |
|-----|--------|
| OSRM | Roteamento de veículos (GPS) |
| Nominatim | Geocodificação de endereços |
| Parallelum FIPE | Consulta de tabela FIPE |

---

## 📁 Estrutura do Projeto

```
sistema_frotas/
│
├── backend/                    # Servidor (Controller + Model)
│   ├── app.py                  # Controlador principal (rotas REST)
│   ├── models.py               # Classes POO (Veículo, Motorista, etc.)
│   ├── ml.py                   # Módulo de Machine Learning
│   ├── database.py             # Conexão com PostgreSQL
│   ├── requirements.txt        # Dependências Python
│   └── .env                    # ⚠️ Credenciais (NÃO versionado)
│
├── frontend/                   # Interface (View)
│   ├── base.html               # Template base (navbar, footer, acessibilidade)
│   ├── dashboard.html          # Painel principal com KPIs
│   ├── analise.html            # Página de IA e simulador de rotas
│   ├── veiculos.html           # Cadastro de veículos
│   ├── motoristas.html         # Cadastro de motoristas
│   ├── abastecimentos.html     # Registro de abastecimentos
│   ├── manutencoes.html        # Registro de manutenções
│   ├── css/
│   │   └── style.css           # Design system (glassmorphism, dark mode)
│   └── js/
│       ├── charts.js           # Gráficos Chart.js
│       ├── dashboard.js        # Lógica do dashboard e IA
│       └── analise.js          # Simulador de rotas GPS
│
├── documentacao/               # Documentação acadêmica
│   ├── 01_Estrutura_Banco_de_Dados.md
│   ├── 02_POO_e_Estrutura_de_Classes.md
│   ├── 03_Machine_Learning_e_Analise.md
│   ├── 04_UX_UI_e_Frontend.md
│   └── 05_Manual_do_Desenvolvedor.md
│
├── .gitignore                  # Arquivos ignorados pelo Git
└── README.md                   # ← Você está aqui
```

---

## 🚀 Como Executar

### Pré-requisitos

- **Python 3.10+** instalado
- **PostgreSQL** instalado e rodando
- **Git** (opcional, para clonar)

### 1️⃣ Clonar o repositório (ou abrir a pasta do projeto)

```bash
git clone <url-do-repositorio>
cd sistema_frotas
```

### 2️⃣ Criar o banco de dados no PostgreSQL

Abra o **pgAdmin** ou o terminal do PostgreSQL e execute:

```sql
CREATE DATABASE pim_trab;

-- Conectar ao banco criado
\c pim_trab

-- Criar as tabelas
CREATE TABLE veiculos (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(10) UNIQUE NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    marca VARCHAR(50) NOT NULL,
    ano INTEGER NOT NULL,
    quilometragem INTEGER DEFAULT 0,
    tipo_veiculo VARCHAR(20) DEFAULT 'Carro',
    eixos INTEGER DEFAULT 2
);

CREATE TABLE motoristas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cnh VARCHAR(20) UNIQUE NOT NULL,
    categoria_cnh VARCHAR(10) NOT NULL
);

CREATE TABLE abastecimentos (
    id SERIAL PRIMARY KEY,
    veiculo_id INTEGER REFERENCES veiculos(id),
    motorista_id INTEGER REFERENCES motoristas(id),
    data_abastecimento DATE NOT NULL,
    litros DECIMAL(10,2) NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    tipo_combustivel VARCHAR(30) NOT NULL,
    odometro INTEGER NOT NULL
);

CREATE TABLE manutencoes (
    id SERIAL PRIMARY KEY,
    veiculo_id INTEGER REFERENCES veiculos(id),
    data_manutencao DATE NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    custo DECIMAL(10,2) NOT NULL,
    descricao TEXT,
    quilometragem INTEGER NOT NULL
);
```

### 3️⃣ Configurar as credenciais (arquivo `.env`)

Crie o arquivo `backend/.env` com suas credenciais do PostgreSQL:

```env
DB_HOST=localhost
DB_NAME=pim_trab
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
```

> ⚠️ **IMPORTANTE:** Este arquivo contém senhas e **nunca** deve ser commitado no Git (já está no `.gitignore`).

### 4️⃣ Instalar as dependências Python

```bash
cd backend
pip install -r requirements.txt
```

### 5️⃣ Iniciar o servidor

```bash
python app.py
```

### 6️⃣ Acessar no navegador

```
http://localhost:5000
```

---

## 📊 Funcionalidades

### Dashboard Principal
- KPIs em tempo real (total de veículos, motoristas, abastecimentos, manutenções)
- Gráficos de gastos mensais e distribuição de combustível
- Alertas de manutenção preventiva (veículos com >10.000 km sem revisão)
- Ranking de eco-drivers (menor emissão de CO₂)

### Módulo de Inteligência Artificial
- Previsão de custos de manutenção com **Regressão Linear**
- Métricas de avaliação: **R²**, **MAE**, **RMSE**
- Previsões para marcos de **50k**, **100k** e **150k** km
- Classificação automática de qualidade (Excelente/Bom/Moderado/Fraco)

### Simulador de Rotas GPS
- Geocodificação de endereços (nome → coordenadas)
- Cálculo de rota via OSRM (distância, tempo, custo de combustível)
- Visualização no mapa com Leaflet.js
- Fallback offline com cálculo por fórmula geográfica

### Acessibilidade (WCAG 2.1 AA)
- **VLibras** — Tradução automática para Libras (Governo Federal)
- **Alto Contraste** — Modo de cores para baixa visão
- **Ampliação de Fonte** — Até 30% maior
- **Redução de Movimento** — Desativa animações
- **Navegação por Teclado** — Tab, Enter, Escape
- **ARIA Labels** — Compatível com leitores de tela

---

## 🏗️ Arquitetura

O sistema segue o padrão **MVC (Model-View-Controller)**:

```
┌─────────────┐     HTTP      ┌──────────────┐     SQL       ┌────────────┐
│  Frontend   │ ◄──────────► │   app.py     │ ◄──────────► │ PostgreSQL │
│  (View)     │   JSON/HTML   │ (Controller) │  psycopg2     │  (Model)   │
│             │               │              │               │            │
│ HTML/CSS/JS │               │ Flask REST   │               │ veiculos   │
│ Chart.js    │               │ Validações   │               │ motoristas │
│ Leaflet.js  │               │ Segurança    │               │ abastec.   │
│ VLibras     │               │              │               │ manuten.   │
└─────────────┘               │   ml.py      │               └────────────┘
                              │ (ML Engine)  │
                              └──────────────┘
```

### Pilares da POO Implementados

| Pilar | Onde | Exemplo |
|-------|------|---------|
| **Encapsulamento** | `Pessoa._nome` | Atributo protegido com `@property` |
| **Herança** | `Motorista(Pessoa)` | Herda `_id`, `_nome` e `@property nome` |
| **Polimorfismo** | `calcular_custo_pedagio()` | Carro = R$12,50 fixo / Caminhão = eixos × R$9,80 |
| **Abstração** | `get_db_connection()` | Esconde complexidade de conexão com o banco |

---

## 📝 Documentação

A documentação completa está na pasta `documentacao/`:

| Arquivo | Conteúdo |
|---------|----------|
| `01_Estrutura_Banco_de_Dados.md` | Schema SQL, diagrama ER, tipos de dados |
| `02_POO_e_Estrutura_de_Classes.md` | Hierarquia de classes, diagramas UML |
| `03_Machine_Learning_e_Analise.md` | Algoritmo, pipeline, métricas, fórmulas |
| `04_UX_UI_e_Frontend.md` | Design system, acessibilidade, responsividade |
| `05_Manual_do_Desenvolvedor.md` | Setup, rotas API, troubleshooting |

---

## 👥 Equipe

- **Desenvolvimento Backend, Frontend e Banco de Dados** — [Victor Corsini]

---

## 📄 Licença

Projeto acadêmico desenvolvido para o PIM III do curso de Análise e Desenvolvimento de Sistemas.
