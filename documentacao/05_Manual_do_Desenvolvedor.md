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
| Flask-Login      | 0.6.x     | Backend     | Gerenciamento de sessões autenticadas          |
| Flask-Bcrypt     | 1.0.x     | Backend     | Hash seguro de senhas (algoritmo bcrypt)       |
| itsdangerous     | 2.x       | Backend     | Geração e validação de tokens de recuperação  |
| waitress         | 3.x       | Backend     | Servidor WSGI de produção (Windows-friendly)  |
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
│   ├── app.py                      # Controlador principal (autenticação + SMTP + rotas)
│   ├── models.py                   # Classes POO + classe Usuario (Flask-Login)
│   ├── database.py                 # Conexão com PostgreSQL
│   ├── ml.py                       # Módulo de Machine Learning
│   ├── requirements.txt            # Dependências Python
│   ├── criar_admin.py              # Script para criar o primeiro administrador
│   └── seed_apresentacao.py        # ⭐ Seed rico para demonstração (22 veíc., 20 mot.)
│
├── frontend/                       # Camada do Cliente
│   ├── base.html                   # Template base (sidebar, tema, acessibilidade, logout)
│   ├── login.html                  # Autenticação (glassmorphism + recuperação de senha)
│   ├── usuarios.html               # Painel de gerenciamento de usuários (somente admin)
│   ├── index.html                  # Veículos + Mapa de Telemetria
│   ├── motoristas.html             # Gestão de Motoristas
│   ├── abastecimentos.html         # Controle de Abastecimentos
│   ├── manutencoes.html            # Engenharia de Manutenção
│   ├── dashboard.html              # Dashboard Executivo (KPIs + Gráficos)
│   ├── analise.html                # Análise IA + Simulador de Rotas
│   │
│   ├── imagens/
│   │   └── logo.jpg                # Logo da empresa (UniLog) — usada no e-mail de reset
│   │
│   ├── css/
│   │   └── style.css               # Design System completo
│   │
│   └── js/
│       ├── app.js                  # Lógica de veículos + API FIPE
│       ├── motoristas.js           # CRUD de motoristas
│       ├── abastecimentos.js       # CRUD + validação CNH
│       ├── manutencoes.js          # CRUD de manutenções
│       ├── dashboard.js            # IA, alertas, ranking, consumo
│       └── charts.js               # Gráficos Chart.js + KPIs
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
# 1. CLONAR O REPOSITÓRIO
git clone https://github.com/Cors1n1/sistema-frotas-PIM-III.git
cd sistema-frotas-PIM-III

# 2. INSTALAR DEPENDÊNCIAS PYTHON
cd backend
pip install -r requirements.txt

# 3. CONFIGURAR O BANCO DE DADOS
# Criar o banco "pim_trab" no PostgreSQL com as tabelas:
# (ver README.md ou 01_Tabelas_e_Relacionamentos.md para o script completo)
psql -U postgres -c "CREATE DATABASE pim_trab;"

# 4. CONFIGURAR O ARQUIVO .env
# Criar o arquivo backend/.env com:
#   DB_HOST=localhost
#   DB_NAME=pim_trab
#   DB_USER=postgres
#   DB_PASSWORD=<sua_senha>
#   SECRET_KEY=<chave_segura_gerada_com_secrets.token_hex(32)>
#
#   # Opcional — recuperação de senha por e-mail:
#   SMTP_SERVER=smtp.gmail.com
#   SMTP_PORT=587
#   SMTP_USER=seu_email@gmail.com
#   SMTP_PASSWORD=sua_senha_de_app_gmail

# 5. CRIAR O PRIMEIRO ADMINISTRADOR
python criar_admin.py

# 5.1 (ALTERNATIVA) Popular com dados ricos para demonstração
python seed_apresentacao.py
# → Cria: 22 veículos, 20 motoristas, histórico 12 meses
# → Login pronto: corsini / Pulga@2013

# 6. INICIAR O SERVIDOR
# Desenvolvimento:
python app.py

# Produção (Windows) com Waitress:
waitress-serve --port=8000 app:app

# 7. ACESSAR O SISTEMA
# Abrir o navegador em: http://localhost:5000/login
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
    tipo            VARCHAR(20)   NOT NULL,  -- 'Preventiva', 'Corretiva' ou 'Preditiva'
    custo           DECIMAL(10,2) NOT NULL,
    descricao       TEXT          NOT NULL,
    quilometragem   INTEGER       NOT NULL
);

-- Tabela de usuários (autenticação + recuperação de senha)
CREATE TABLE usuarios (
    id          SERIAL       PRIMARY KEY,
    nome        VARCHAR(150) NOT NULL,
    username    VARCHAR(80)  UNIQUE NOT NULL,
    senha_hash  VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'operador'
                             CHECK (role IN ('admin', 'operador')),
    email       VARCHAR(255) UNIQUE,  -- para recuperação de senha
    criado_em   TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_usuarios_username ON usuarios (username);
```

---

## 5.5 Mapeamento de Rotas da API REST

O backend expõe as seguintes endpoints:

### 5.5.1 Rotas de Páginas (Frontend)

| Método | Rota                   | Autenticação | Descrição                    |
|--------|------------------------|--------------|------------------------------|
| GET    | `/login`               | Pública      | Página de login               |
| POST   | `/login`               | Pública      | Processar credenciais         |
| GET    | `/logout`              | Requer login | Encerrar sessão              |
| GET    | `/`                    | Requer login | Página de Veículos (index)   |
| GET    | `/motoristas.html`     | Requer login | Página de Motoristas         |
| GET    | `/abastecimentos.html` | Requer login | Página de Abastecimentos     |
| GET    | `/manutencoes.html`    | Requer login | Página de Manutenções        |
| GET    | `/dashboard.html`      | Requer login | Dashboard Executivo          |
| GET    | `/analise.html`        | Requer login | Análise IA + Simulador       |
| GET    | `/usuarios.html`       | Somente Admin| Painel de Usuários          |

### 5.5.2 Rotas da API REST (Dados)

| Método | Rota                              | Acesso       | Entrada / Saída                 |
|--------|-----------------------------------|--------------|----------------------------------|
| GET    | `/api/veiculos`                   | Requer login | Lista de veículos com pedágio   |
| POST   | `/api/veiculos`                   | Requer login | placa, modelo, marca, ano...     |
| GET    | `/api/motoristas`                 | Requer login | Lista de motoristas com CNH     |
| POST   | `/api/motoristas`                 | Requer login | nome, cnh, categoria_cnh        |
| GET    | `/api/abastecimentos`             | Requer login | Lista com emissões CO₂         |
| POST   | `/api/abastecimentos`             | Requer login | veiculo_id, motorista_id, ...   |
| GET    | `/api/manutencoes`                | Requer login | Lista de manutenções           |
| POST   | `/api/manutencoes`                | Requer login | veiculo_id, data, tipo, custo   |
| GET    | `/api/dashboard/previsao`         | Requer login | Previsão ML                     |
| GET    | `/api/dashboard/alertas`          | Requer login | Alertas de revisão             |
| GET    | `/api/dashboard/consumo`          | Requer login | Relatório de eficiência        |
| GET    | `/api/dashboard/ranking`          | Requer login | Top 5 eco-drivers               |
| POST   | `/api/dashboard/simular_viagem`   | Requer login | Distância, tempo, custo, rota  |
| GET    | `/api/usuarios`                   | Somente Admin| Lista de usuários cadastrados  |
| POST   | `/api/usuarios`                   | Somente Admin| nome, username, email, senha, role |
| DELETE | `/api/usuarios/<id>`              | Somente Admin| Remove usuário por ID          |
| GET    | `/api/me`                         | Requer login | Dados do usuário logado        |
| POST   | `/api/auth/forgot-password`       | Pública      | email → envia link de reset    |
| POST   | `/api/auth/reset-password`        | Pública      | token + senha → atualiza hash  |

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
| 9  | Token de reset expira em 30 minutos    | `app.py` itsdangerous| Segurança     |
| 10 | Admin não pode excluir a própria conta | `app.py` DELETE user| Integridade    |

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

| #  | Limitação                              | Impacto                           | Status / Melhoria                 |
|----|----------------------------------------|-----------------------------------|-----------------------------------|
| 1  | ~~Sem autenticação de usuários~~       | ~~Qualquer pessoa pode acessar~~  | ✅ **Implementado** (Flask-Login + Bcrypt) |
| 2  | ~~Sem recuperação de senha~~           | ~~Senha perdida = conta inacessível~~ | ✅ **Implementado** (SMTP + itsdangerous) |
| 3  | Conexão nova a cada requisição         | Não é escalável para muitos users | Utilizar pool de conexões (pgBouncer) |
| 4  | Dados de telemetria (mapa) simulados   | Posição dos veículos é fictícia   | Integrar com GPS real (IoT)       |
| 5  | Modelo ML com uma única feature        | Previsão simplificada             | Adicionar mais variáveis (idade, tipo) |
| 6  | Sem operações DELETE/PUT              | Não é possível editar/excluir     | Implementar CRUD completo         |
| 7  | Sem paginação nas tabelas             | Performance com muitos registros  | Implementar paginação com LIMIT/OFFSET |

---

## 5.10 Proposição de Melhorias e Evolução Futura

### Curto Prazo (Próxima Sprint)
- ✅ ~~**Autenticação:** Sistema de login com roles (Admin/Operador)~~ — **Implementado**
- ✅ ~~**Recuperação de senha:** Reset por e-mail com token temporário~~ — **Implementado**
- ✏️ **CRUD completo:** Edição e exclusão de registros existentes
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
