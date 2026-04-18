# Guia de Implementação e Manual do Desenvolvedor

## 5.1 Visão Geral do Projeto

O **Sistema de Gestão de Frotas Integrado** é uma aplicação web full-stack desenvolvida para gerenciar a operação logística de uma empresa fictícia de transporte. O sistema abrange quatro pilares operacionais: **controle de veículos**, **gestão de motoristas**, **registro de abastecimentos** e **engenharia de manutenção**, além de contar com um módulo de **Inteligência Artificial** para análise preditiva e um **simulador de rotas GPS**.

---

## 5.2 Stack Tecnológica Completa

### 5.2.1 Visão Geral da Arquitetura

```
    ┌────────────────────────────────────────────────────────────────────┐
    │                   STACK TECNOLÓGICA DO SISTEMA                     │
    │                                                                    │
    │   ┌─────────────────────────────────────────────────────┐         │
    │   │                 FRONTEND (Cliente)                   │         │
    │   │                                                     │         │
    │   │  HTML5 + Jinja2    │  CSS3 (Variáveis + Dark Mode) │         │
    │   │  JavaScript ES6+   │  Chart.js (Gráficos BI)       │         │
    │   │  Leaflet.js (Mapas)│  VanillaTilt.js (Efeitos 3D)  │         │
    │   │  VLibras (LIBRAS)  │  UI Avatars (API Externa)     │         │
    │   └─────────────────────────────────────────────────────┘         │
    │                              │                                    │
    │                        HTTP / REST                                │
    │                              │                                    │
    │   ┌─────────────────────────────────────────────────────┐         │
    │   │                  BACKEND (Servidor)                  │         │
    │   │                                                     │         │
    │   │  Python 3.x       │  Flask (Framework Web)         │         │
    │   │  Flask-CORS        │  psycopg2 (Driver PostgreSQL)  │         │
    │   │  python-dotenv     │  Pandas (DataFrames)           │         │
    │   │  Scikit-Learn (ML) │  urllib (HTTP Client)          │         │
    │   └─────────────────────────────────────────────────────┘         │
    │                              │                                    │
    │                         psycopg2                                  │
    │                              │                                    │
    │   ┌─────────────────────────────────────────────────────┐         │
    │   │              BANCO DE DADOS (PostgreSQL)            │         │
    │   │                                                     │         │
    │   │  veiculos   │  motoristas  │  abastecimentos       │         │
    │   │  manutencoes                                        │         │
    │   └─────────────────────────────────────────────────────┘         │
    │                                                                    │
    │   ┌─────────────────────────────────────────────────────┐         │
    │   │                APIs EXTERNAS                         │         │
    │   │                                                     │         │
    │   │  Parallelum FIPE  │  OSRM (Routing)               │         │
    │   │  Nominatim (Geo)  │  OpenStreetMap (Tiles)         │         │
    │   │  UI Avatars       │  Google Favicons               │         │
    │   └─────────────────────────────────────────────────────┘         │
    └────────────────────────────────────────────────────────────────────┘
```

### 5.2.2 Tabela de Dependências

| Tecnologia      | Versão     | Camada      | Finalidade                                    |
|------------------|-----------|-------------|-----------------------------------------------|
| Python           | 3.x       | Backend     | Linguagem principal do servidor               |
| Flask            | 3.x       | Backend     | Framework web (rotas, templates, API REST)    |
| Flask-CORS       | 5.x       | Backend     | Permitir requisições cross-origin             |
| psycopg2-binary  | 2.x       | Backend     | Driver nativo para PostgreSQL                 |
| python-dotenv    | 1.x       | Backend     | Carregamento de variáveis de ambiente (.env)  |
| Pandas           | 2.x       | Backend     | Manipulação de dados e integração SQL→ML      |
| Scikit-Learn     | 1.x       | Backend     | Algoritmo de Regressão Linear                 |
| PostgreSQL       | 16.x      | Banco       | SGBDR principal                               |
| HTML5/CSS3/JS    | Padrão    | Frontend    | Estrutura, estilo e lógica da interface       |
| Jinja2           | Built-in  | Frontend    | Motor de templates (herança de layout)        |
| Chart.js         | 4.x       | Frontend    | Gráficos de barras e doughnut                 |
| Leaflet.js       | 1.x       | Frontend    | Mapas interativos e geolocalização            |
| VanillaTilt.js   | 1.8       | Frontend    | Efeito 3D nos cards                           |
| VLibras          | Gov BR    | Acessibility| Tradução de conteúdo para LIBRAS              |

---

## 5.3 Estrutura de Diretórios

```
sistema_frotas/
│
├── Manual_PIM_III - ADS.docx       # Manual do professor
│
├── backend/                        # Camada do Servidor
│   ├── .env                        # Variáveis de ambiente (NÃO versionar!)
│   ├── app.py                      # Controlador principal (446 linhas)
│   ├── models.py                   # Classes POO (111 linhas)
│   ├── database.py                 # Conexão com PostgreSQL (15 linhas)
│   ├── ml.py                       # Módulo de Machine Learning (39 linhas)
│   └── requirements.txt            # Dependências Python
│
├── frontend/                       # Camada do Cliente
│   ├── base.html                   # Template base (sidebar, tema, toast)
│   ├── index.html                  # Veículos + Mapa de Telemetria
│   ├── motoristas.html             # Gestão de Motoristas
│   ├── abastecimentos.html         # Controle de Abastecimentos
│   ├── manutencoes.html            # Engenharia de Manutenção
│   ├── dashboard.html              # Dashboard Executivo (KPIs + Gráficos)
│   ├── analise.html                # Análise IA + Simulador de Rotas
│   │
│   ├── css/
│   │   └── style.css               # Design System completo (202 linhas)
│   │
│   └── js/
│       ├── app.js                  # Lógica de veículos + API FIPE (161 linhas)
│       ├── motoristas.js           # CRUD de motoristas (81 linhas)
│       ├── abastecimentos.js       # CRUD + validação CNH (146 linhas)
│       ├── manutencoes.js          # CRUD de manutenções (87 linhas)
│       ├── dashboard.js            # IA, alertas, ranking, consumo (169 linhas)
│       └── charts.js               # Gráficos Chart.js + KPIs (118 linhas)
│
└── documentacao/                   # Documentação do Projeto (esta pasta)
    ├── 01_Tabelas_e_Relacionamentos.md
    ├── 02_Programacao_Orientada_a_Objetos.md
    ├── 03_Machine_Learning_e_Analise.md
    ├── 04_Design_UX_UI.md
    └── 05_Manual_do_Desenvolvedor.md
```

---

## 5.4 Guia de Instalação e Execução

### 5.4.1 Pré-requisitos

| Software       | Versão Mínima | Download                                    |
|----------------|--------------|----------------------------------------------|
| Python         | 3.10+        | https://python.org                           |
| PostgreSQL     | 14+          | https://postgresql.org                       |
| Git (opcional) | 2.x          | https://git-scm.com                          |

### 5.4.2 Passo a Passo para Execução

```bash
# 1. CLONAR OU ACESSAR O PROJETO
cd c:\Users\Corsini\Desktop\sistema_frotas

# 2. INSTALAR DEPENDÊNCIAS PYTHON
cd backend
pip install -r requirements.txt

# 3. CONFIGURAR O BANCO DE DADOS
# Criar o banco "pim_trab" no PostgreSQL com as tabelas definidas
# no documento 01_Tabelas_e_Relacionamentos.md (scripts DDL)

# 4. CONFIGURAR O ARQUIVO .env
# Criar/editar o arquivo backend/.env com:
#   DB_HOST=localhost
#   DB_NAME=pim_trab
#   DB_USER=postgres
#   DB_PASSWORD=<sua_senha>

# 5. INICIAR O SERVIDOR
python app.py

# 6. ACESSAR O SISTEMA
# Abrir o navegador em: http://localhost:5000
```

### 5.4.3 Script de Criação do Banco de Dados

```sql
-- Executar no PostgreSQL (pgAdmin ou psql)
CREATE DATABASE pim_trab;

\c pim_trab

CREATE TABLE veiculos (
    id            SERIAL       PRIMARY KEY,
    placa         VARCHAR(10)  UNIQUE NOT NULL,
    modelo        VARCHAR(100) NOT NULL,
    marca         VARCHAR(100) NOT NULL,
    ano           INTEGER      NOT NULL,
    quilometragem INTEGER      NOT NULL DEFAULT 0,
    tipo_veiculo  VARCHAR(20)  NOT NULL DEFAULT 'Carro',
    eixos         INTEGER      DEFAULT 0
);

CREATE TABLE motoristas (
    id            SERIAL       PRIMARY KEY,
    nome          VARCHAR(150) NOT NULL,
    cnh           VARCHAR(20)  UNIQUE NOT NULL,
    categoria_cnh VARCHAR(20)  NOT NULL
);

CREATE TABLE abastecimentos (
    id                  SERIAL        PRIMARY KEY,
    veiculo_id          INTEGER       NOT NULL REFERENCES veiculos(id),
    motorista_id        INTEGER       NOT NULL REFERENCES motoristas(id),
    data_abastecimento  DATE          NOT NULL,
    litros              DECIMAL(10,2) NOT NULL,
    valor_total         DECIMAL(10,2) NOT NULL,
    tipo_combustivel    VARCHAR(20)   NOT NULL,
    odometro            INTEGER       NOT NULL
);

CREATE TABLE manutencoes (
    id              SERIAL        PRIMARY KEY,
    veiculo_id      INTEGER       NOT NULL REFERENCES veiculos(id),
    data_manutencao DATE          NOT NULL,
    tipo            VARCHAR(20)   NOT NULL,
    custo           DECIMAL(10,2) NOT NULL,
    descricao       TEXT          NOT NULL,
    quilometragem   INTEGER       NOT NULL
);
```

---

## 5.5 Mapeamento de Rotas da API REST

O backend expõe as seguintes endpoints:

### 5.5.1 Rotas de Páginas (Frontend)

| Método | Rota                | Descrição                    |
|--------|---------------------|------------------------------|
| GET    | `/`                 | Página de Veículos (index)   |
| GET    | `/motoristas.html`  | Página de Motoristas         |
| GET    | `/abastecimentos.html` | Página de Abastecimentos  |
| GET    | `/manutencoes.html` | Página de Manutenções        |
| GET    | `/dashboard.html`   | Dashboard Executivo          |
| GET    | `/analise.html`     | Análise IA + Simulador       |

### 5.5.2 Rotas da API REST (Dados)

| Método | Rota                           | Entrada (JSON)                  | Saída (JSON)                    |
|--------|--------------------------------|---------------------------------|---------------------------------|
| GET    | `/api/veiculos`                | —                               | Lista de veículos com pedágio   |
| POST   | `/api/veiculos`                | placa, modelo, marca, ano, km, tipo, eixos | {mensagem} ou {erro} |
| GET    | `/api/motoristas`              | —                               | Lista de motoristas com CNH     |
| POST   | `/api/motoristas`              | nome, cnh, categoria_cnh        | {mensagem} ou {erro}            |
| GET    | `/api/abastecimentos`          | —                               | Lista com emissões CO₂          |
| POST   | `/api/abastecimentos`          | veiculo_id, motorista_id, data, litros, valor, tipo, odometro | {mensagem} ou {erro} |
| GET    | `/api/manutencoes`             | —                               | Lista de manutenções            |
| POST   | `/api/manutencoes`             | veiculo_id, data, tipo, custo, descricao, km | {mensagem} ou {erro} |
| GET    | `/api/dashboard/previsao`      | —                               | Previsão ML (custo aos 100k km) |
| GET    | `/api/dashboard/alertas`       | —                               | Lista de alertas de revisão     |
| GET    | `/api/dashboard/consumo`       | —                               | Relatório de eficiência         |
| GET    | `/api/dashboard/ranking`       | —                               | Top 5 eco-drivers               |
| POST   | `/api/dashboard/simular_viagem`| origem (lat,lng), destino (lat,lng) | Distância, tempo, custo, rota |

---

## 5.6 Integrações com APIs Externas

### 5.6.1 API Parallelum FIPE (Validação de Veículos)

```
Fluxo: Usuário digita marca → Sistema busca marcas na API FIPE
       Usuário digita modelo → Sistema busca modelos da marca
       Usuário digita ano → Sistema busca anos do modelo

URL Base: https://parallelum.com.br/fipe/api/v1/{tipo}/marcas
Tipos: "carros" | "caminhoes"
```

### 5.6.2 API OSRM (Roteamento GPS)

```
URL: http://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}
Retorno: Distância (metros), Duração (segundos), Geometria GeoJSON da rota
Fallback: Cálculo offline via Teorema de Pitágoras Geográfico
```

### 5.6.3 API Nominatim (Geocodificação)

```
URL: https://nominatim.openstreetmap.org/search?format=json&q={endereço}
Retorno: Latitude, Longitude, Nome formatado do local
Uso: Autocomplete no campo de origem/destino do simulador
```

---

## 5.7 Regras de Negócio Implementadas

| #  | Regra                                  | Onde                | Tipo           |
|----|----------------------------------------|---------------------|----------------|
| 1  | Validação de CNH por tipo de veículo   | `app.py` POST abast.| Segurança      |
| 2  | Odômetro não pode diminuir             | `app.py` POST abast.| Anti-fraude    |
| 3  | Atualização automática de quilometragem| `app.py` POST abast.| Consistência   |
| 4  | Cálculo de pedágio por tipo de veículo | `models.py` polimor.| Financeiro     |
| 5  | Alerta a cada 10.000 km sem preventiva | `app.py` GET alertas| Manutenção     |
| 6  | Mínimo de 3 registros para previsão ML | `ml.py`             | Qualidade dados|
| 7  | Emissão CO₂ = litros × 2.3 kg         | `models.py` property| Ambiental      |
| 8  | Filtro de motoristas por CNH no frontend| `abastecimentos.js`| UX             |

---

## 5.8 Integração Final — Fluxo Completo do Sistema

O diagrama abaixo mostra como todas as funcionalidades se integram:

```
    ╔═══════════════════════════════════════════════════════╗
    ║            SISTEMA DE GESTÃO DE FROTAS                ║
    ╠═══════════════════════════════════════════════════════╣
    ║                                                       ║
    ║   CADASTROS                                          ║
    ║   ┌──────────┐  ┌──────────┐  ┌──────────────────┐  ║
    ║   │ Veículos │  │Motoristas│  │ Manutenções      │  ║
    ║   │ (API FIPE│  │ (CNH)    │  │ (Prev./Corretiva)│  ║
    ║   └────┬─────┘  └────┬─────┘  └────────┬─────────┘  ║
    ║        │              │                 │             ║
    ║        └──────┬───────┘                 │             ║
    ║               │                         │             ║
    ║               ▼                         │             ║
    ║        OPERAÇÕES                        │             ║
    ║   ┌──────────────────┐                  │             ║
    ║   │  Abastecimentos  │                  │             ║
    ║   │ (Validação CNH + │                  │             ║
    ║   │  Odômetro + CO₂) │                  │             ║
    ║   └────────┬─────────┘                  │             ║
    ║            │                            │             ║
    ║            └────────┬───────────────────┘             ║
    ║                     │                                 ║
    ║                     ▼                                 ║
    ║            INTELIGÊNCIA                               ║
    ║   ┌──────────────────────────────────────────────┐   ║
    ║   │                                              │   ║
    ║   │  📊 Dashboard    │  🤖 ML (Regressão)        │   ║
    ║   │  KPIs, Gráficos  │  Previsão de custos       │   ║
    ║   │                  │                           │   ║
    ║   │  🏆 Ranking      │  🚨 Alertas               │   ║
    ║   │  Eco-Drivers     │  Revisão vencida           │   ║
    ║   │                  │                           │   ║
    ║   │  🛰️ Simulador    │  ⚡ Eficiência             │   ║
    ║   │  Rotas GPS       │  Km/L, R$/Km, CO₂         │   ║
    ║   └──────────────────────────────────────────────┘   ║
    ╚═══════════════════════════════════════════════════════╝
```

---

## 5.9 Limitações Técnicas Identificadas

| #  | Limitação                              | Impacto                           | Proposta de Melhoria              |
|----|----------------------------------------|-----------------------------------|-----------------------------------|
| 1  | Sem autenticação de usuários           | Qualquer pessoa pode acessar      | Implementar login com JWT         |
| 2  | Conexão nova a cada requisição         | Não é escalável para muitos users | Utilizar pool de conexões (pgBouncer) |
| 3  | Dados de telemetria (mapa) simulados   | Posição dos veículos é fictícia   | Integrar com GPS real (IoT)       |
| 4  | Modelo ML com uma única feature        | Previsão simplificada             | Adicionar mais variáveis (idade, tipo) |
| 5  | Sem operações DELETE/PUT              | Não é possível editar/excluir     | Implementar CRUD completo         |
| 6  | Sem paginação nas tabelas             | Performance com muitos registros  | Implementar paginação com LIMIT/OFFSET |

---

## 5.10 Proposição de Melhorias e Evolução Futura

### Curto Prazo (Próxima Sprint)
- 🔐 **Autenticação:** Sistema de login com roles (Admin/Operador)
- ✏️ **CRUD completo:** Edição e exclusão de registros
- 📄 **Exportação PDF:** Relatórios exportáveis para impressão

### Médio Prazo (3 meses)
- 📱 **Progressive Web App (PWA):** Acesso offline via service workers
- 🔔 **Notificações push:** Alertas de manutenção enviados ao celular
- 📊 **Dashboard personalizado:** Filtros por período, veículo e motorista

### Longo Prazo (6–12 meses)
- 🌐 **IoT Integration:** Sensores OBD-II para telemetria real
- 🤖 **ML Avançado:** Classificação de risco de avaria com Random Forest
- 📡 **Microservices:** Separação dos módulos em serviços independentes
- 🏗️ **Containerização:** Deploy com Docker + Kubernetes

---

## 5.11 Conclusão da Etapa de Integração

O **Sistema de Gestão de Frotas Integrado** demonstra a aplicação prática e integrada de múltiplas disciplinas do curso de Análise e Desenvolvimento de Sistemas:

- A **Modelagem de Banco de Dados** (Etapa 3) fornece a infraestrutura de persistência com integridade referencial.
- A **Programação Orientada a Objetos** (Etapa 4) estrutura o código com encapsulamento, herança e polimorfismo.
- O **Desenvolvimento Web Responsivo** (Etapa 5) entrega uma interface profissional com Dark Mode e templates reutilizáveis.
- O **UX/UI Design** (Etapa 6) garante uma experiência intuitiva com personas, fluxos validados e acessibilidade (VLibras).
- O **Machine Learning** (Etapa 7) transforma dados operacionais em inteligência preditiva para tomada de decisão.
- A **Acessibilidade (LIBRAS)** (Etapa 8) é contemplada com a integração do widget VLibras do Governo Federal em todas as páginas do sistema.

Todas essas camadas se integram em um sistema único, funcional e coerente, demonstrando maturidade técnica e visão sistêmica no desenvolvimento de software.
