# 🚛 Sistema de Gestão de Frotas — PIM III (ADS)

> **Projeto Integrado Multidisciplinar III** — Análise e Desenvolvimento de Sistemas · UNIP  
> Sistema web completo com autenticação multi-usuário, Machine Learning, recuperação de senha por e-mail e acessibilidade WCAG 2.1

![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=flat&logo=flask&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/Licença-Acadêmica-green?style=flat)

---

## 📌 Sobre o Projeto

Sistema full-stack de gestão de frotas empresariais com controle de **veículos**, **motoristas**, **abastecimentos** e **manutenções**, módulo de **Inteligência Artificial** para predição de custos, simulador de **rotas GPS**, sistema de **login multi-usuário** com roles de acesso e **recuperação de senha por e-mail**.

### ✨ Destaques

| Feature | Descrição |
|---------|-----------|
| 🔐 **Autenticação Multi-Usuário** | Flask-Login + Bcrypt com roles `admin` e `operador` |
| 📧 **Recuperação de Senha** | Token seguro por e-mail (SMTP + itsdangerous, válido 30 min) |
| 🤖 **Machine Learning** | Regressão Linear segmentada (Carros/Caminhões) com R² otimizado |
| ♿ **Acessibilidade WCAG 2.1 AA** | Alto Contraste, VLibras (Libras), Ampliação de Fonte |
| 🗺️ **Simulador de Rotas GPS** | Integração OSRM + Leaflet.js com fallback offline |
| 📊 **Dashboard Interativo** | Chart.js com KPIs, rankings e Gestão de Riscos Premium UI |
| 🌙 **Dark / Light Mode** | Tema adaptativo salvo no localStorage |
| 🛡️ **Segurança** | Prepared Statements, senhas em hash bcrypt, `@login_required` em todas as rotas |
| 🌱 **Seed de Apresentação** | Script que popula 22 veículos, 20 motoristas e +200 registros de histórico |

---

## 🛠️ Tecnologias

### Backend
| Tecnologia | Versão | Função |
|-----------|--------|--------|
| Python | 3.12+ | Linguagem principal |
| Flask | 3.x | Framework web (API REST + templates) |
| Flask-Login | 0.6.x | Gerenciamento de sessões autenticadas |
| Flask-Bcrypt | 1.0.x | Hash seguro de senhas (bcrypt) |
| Flask-CORS | 5.x | Cross-Origin Resource Sharing |
| itsdangerous | 2.x | Geração e validação de tokens de recuperação de senha |
| PostgreSQL | 16+ | Banco de dados relacional |
| psycopg2 | 2.x | Driver de conexão com PostgreSQL |
| Scikit-Learn | 1.x | Machine Learning (Regressão Linear) |
| Pandas | 2.x | Manipulação de dados |
| python-dotenv | 1.x | Carregamento de variáveis de ambiente |
| waitress | 3.x | Servidor WSGI de produção (alternativa ao Gunicorn no Windows) |

### Frontend
| Tecnologia | Função |
|-----------|--------|
| HTML5 + Jinja2 | Estrutura e templates com herança |
| CSS3 (Dark Mode + Glassmorphism) | Design system adaptativo |
| JavaScript ES6+ | Lógica da interface e chamadas REST |
| Chart.js 4.x | Gráficos interativos |
| Leaflet.js | Mapas e rotas GPS |
| VLibras (Gov BR) | Tradução automática para Libras |
| VanillaTilt.js | Efeitos 3D nos cards |

### APIs Externas
| API | Função |
|-----|--------|
| OSRM | Roteamento de veículos (GPS real) |
| Nominatim | Geocodificação de endereços |
| Parallelum FIPE | Consulta da tabela FIPE de veículos |
| SMTP (Gmail/Outlook) | Envio de e-mail de recuperação de senha |

---

## 📁 Estrutura do Projeto

```
sistema_frotas/
│
├── backend/                        # Camada do Servidor (Controller + Model)
│   ├── app.py                      # Controlador principal (rotas REST + autenticação + email)
│   ├── models.py                   # Classes POO + classe Usuario (Flask-Login)
│   ├── ml.py                       # Módulo de Machine Learning
│   ├── database.py                 # Conexão com PostgreSQL
│   ├── requirements.txt            # Dependências Python
│   ├── criar_admin.py              # Script para criar o primeiro administrador
│   ├── seed_apresentacao.py        # ⭐ Seed rico para demonstração (22 veíc., 20 mot., histórico 12 meses)
│   └── .env                        # ⚠️ Credenciais (NÃO versionado — ver .gitignore)
│
├── frontend/                       # Camada do Cliente (View)
│   ├── base.html                   # Template base (sidebar, tema, acessibilidade, logout)
│   ├── login.html                  # Página de autenticação (glassmorphism + recuperação de senha)
│   ├── usuarios.html               # Painel de gerenciamento de usuários (somente admin)
│   ├── index.html                  # Veículos + Mapa de Telemetria
│   ├── motoristas.html             # Gestão de Motoristas
│   ├── abastecimentos.html         # Controle de Abastecimentos
│   ├── manutencoes.html            # Engenharia de Manutenção
│   ├── dashboard.html              # Dashboard Executivo (KPIs + Gráficos)
│   ├── analise.html                # Análise IA + Simulador de Rotas
│   ├── imagens/
│   │   └── logo.jpg                # Logo da empresa (UniLog)
│   ├── css/
│   │   └── style.css               # Design System completo
│   └── js/
│       ├── app.js                  # Lógica de veículos + API FIPE
│       ├── motoristas.js           # CRUD de motoristas
│       ├── abastecimentos.js       # CRUD + validação CNH
│       ├── manutencoes.js          # CRUD de manutenções
│       ├── dashboard.js            # IA, alertas, ranking, consumo
│       └── charts.js               # Gráficos Chart.js
│
├── documentacao/                   # Documentação Acadêmica
│   ├── 01_Tabelas_e_Relacionamentos.md
│   ├── 02_Programacao_Orientada_a_Objetos.md
│   ├── 03_Machine_Learning_e_Analise.md
│   ├── 04_Design_UX_UI.md
│   └── 05_Manual_do_Desenvolvedor.md
│
├── .gitignore
└── README.md
```

---

## 🚀 Como Executar

### Pré-requisitos

- **Python 3.10+** instalado
- **PostgreSQL 14+** instalado e em execução
- **Git** (para clonar)

### 1️⃣ Clonar o repositório

```bash
git clone https://github.com/Cors1n1/sistema-frotas-PIM-III.git
cd sistema-frotas-PIM-III
```

### 2️⃣ Instalar dependências Python

```bash
cd backend
pip install -r requirements.txt
```

### 3️⃣ Criar o banco de dados no PostgreSQL

```sql
-- Execute no pgAdmin ou psql
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

-- Tabela de usuários (autenticação + recuperação de senha)
CREATE TABLE usuarios (
    id          SERIAL       PRIMARY KEY,
    nome        VARCHAR(150) NOT NULL,
    username    VARCHAR(80)  UNIQUE NOT NULL,
    senha_hash  VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'operador'
                             CHECK (role IN ('admin', 'operador')),
    email       VARCHAR(255) UNIQUE,
    criado_em   TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_usuarios_username ON usuarios (username);
```

### 4️⃣ Configurar o arquivo `.env`

Crie o arquivo `backend/.env`:

```env
DB_HOST=localhost
DB_NAME=pim_trab
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
SECRET_KEY=gere_com_python_-c_"import_secrets;print(secrets.token_hex(32))"

# Configurações de e-mail para recuperação de senha (opcional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_de_app_gmail
```

> ⚠️ **NUNCA** versione este arquivo. Ele já está no `.gitignore`.

Para gerar uma `SECRET_KEY` segura:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 5️⃣ Criar o primeiro administrador

```bash
python criar_admin.py
```

O script solicitará nome, username, e-mail e senha interativamente. A senha é armazenada como hash bcrypt.

### 6️⃣ (Opcional) Popular o banco com dados de demonstração

Para ter dados ricos prontos para apresentação (22 veículos, 20 motoristas, histórico de 12 meses):

```bash
python seed_apresentacao.py
```

Isso cria o usuário admin padrão: `corsini / Pulga@2013`

### 7️⃣ Iniciar o servidor

**Desenvolvimento:**
```bash
python app.py
```

**Produção (Windows) com Waitress:**
```bash
waitress-serve --port=8000 app:app
```

### 8️⃣ Acessar no navegador

```
http://localhost:5000/login
```

---

## 🔐 Sistema de Autenticação

O sistema utiliza **Flask-Login** para gerenciamento de sessões e **Flask-Bcrypt** para hash seguro de senhas.

### Perfis de Acesso (Roles)

| Role | Permissões |
|------|-----------|
| `admin` | Acesso total ao sistema + gerenciar usuários (criar/excluir) |
| `operador` | Acesso a todas as funcionalidades, exceto gerenciamento de usuários |

### Fluxo de Autenticação

```
Usuário → POST /login → Valida bcrypt → Flask-Login session → Cookie seguro
Qualquer rota → @login_required → Redireciona para /login se não autenticado
APIs JSON → 401 Unauthorized (sem redirect) se não autenticado
```

### Recuperação de Senha por E-mail

```
Usuário → POST /api/auth/forgot-password (email) → Token gerado (itsdangerous)
→ E-mail HTML enviado via SMTP com link → Token válido por 30 minutos
→ POST /api/auth/reset-password (token + nova senha) → Hash atualizado no banco
```

---

## 📊 Funcionalidades

### 🏠 Veículos
- Cadastro com integração à **API FIPE** (marca, modelo, ano)
- Suporte a **Carro de Passeio** e **Caminhão** (com número de eixos)
- Cálculo automático de pedágio por tipo de veículo

### 🧑‍✈️ Motoristas
- Cadastro com número e **categorias de CNH** (A, B, C, D, E)
- Validação automática de CNH vs tipo de veículo no abastecimento

### ⛽ Abastecimentos
- Registro com **validação de odômetro** (não pode diminuir — anti-fraude)
- **Bloqueio por CNH** inadequada para o tipo de veículo
- Cálculo de **emissão de CO₂** (litros × 2,3 kg)

### 🔧 Manutenções
- Registro de manutenções **Preventivas**, **Corretivas** e **Preditivas**
- **Alertas automáticos** para veículos com +10.000 km sem revisão preventiva

### 📊 Dashboard
- KPIs em tempo real
- Gráficos com Chart.js (consumo, gastos, distribuição)
- **Ranking de Eco-Drivers** (menor custo por litro)
- **Relatório de eficiência** (km/L, R$/km, CO₂ total)

### 🤖 Análise (IA) & Gestão de Riscos
- **Regressão Linear Segmentada** (Scikit-Learn) separando predições para Carros e Caminhões
- Métricas de avaliação em tempo real: **R², MAE**, indicando a qualidade de confiança do modelo
- **Gestão de Riscos (UI Premium)**: Alertas visuais com badges de severidade e ações rápidas
- **Simulador de Rotas GPS** com OSRM + Leaflet.js (distâncias, tempo estimado e fallback offline)

### 👥 Usuários (Admin)
- Painel exclusivo para administradores
- Criar novos usuários com campo de **e-mail** para recuperação de senha
- Excluir usuários (não pode excluir a si mesmo)

### 📧 Recuperação de Senha
- Fluxo completo de reset por e-mail
- Token seguro gerado com **itsdangerous** (expiração de 30 minutos)
- E-mail HTML responsivo com branding da UniLog

---

## 🏗️ Arquitetura MVC

```
┌─────────────┐    HTTP / Jinja2    ┌─────────────────┐    SQL      ┌────────────┐
│  Frontend   │  ◄────────────────► │    app.py        │  ◄────────► │ PostgreSQL │
│   (View)    │     JSON / HTML     │  (Controller)    │  psycopg2   │   (Model)  │
│             │                     │                  │             │            │
│ HTML/CSS/JS │                     │ Flask + Login    │             │ veiculos   │
│ Chart.js    │                     │ @login_required  │             │ motoristas │
│ Leaflet.js  │                     │ Validações POO   │             │ abastec.   │
│ VLibras     │                     │ SMTP (reset pwd) │             │ manutencoes│
└─────────────┘                     │                  │             │ usuarios   │
                                    │    ml.py         │             └────────────┘
                                    │  (ML Engine)     │
                                    └─────────────────┘
```

### Pilares da POO Implementados

| Pilar | Onde | Exemplo |
|-------|------|---------|
| **Encapsulamento** | `Pessoa._nome` | Atributo protegido com `@property` |
| **Herança** | `Motorista(Pessoa)`, `Caminhao(Veiculo)` | Herda atributos e métodos da superclasse |
| **Polimorfismo** | `calcular_custo_pedagio()` | Carro = R$12,50 fixo / Caminhão = eixos × R$9,80 |
| **Abstração** | `Usuario(UserMixin)` | Integração Flask-Login sem expor detalhes internos |

---

## 📝 Documentação Completa

| Arquivo | Conteúdo |
|---------|----------|
| `01_Tabelas_e_Relacionamentos.md` | Schema SQL, diagrama ER, relacionamentos |
| `02_Programacao_Orientada_a_Objetos.md` | Hierarquia de classes, diagramas UML |
| `03_Machine_Learning_e_Analise.md` | Algoritmo, pipeline, métricas, fórmulas |
| `04_Design_UX_UI.md` | Design system, acessibilidade, responsividade |
| `05_Manual_do_Desenvolvedor.md` | Setup, rotas API, tabela de endpoints, troubleshooting |

---

## ♿ Acessibilidade

- **VLibras** — Tradução automática para Língua Brasileira de Sinais (Gov Federal)
- **Alto Contraste** — Modo de cores para baixa visão
- **Ampliação de Fonte** — Até 3 níveis (normal, grande, extra-grande)
- **Redução de Animações** — Respeita `prefers-reduced-motion`
- **Navegação por Teclado** — Tab, Enter, Escape, Skip Links
- **ARIA Labels** — Compatível com leitores de tela (NVDA, JAWS)

---

## 👥 Equipe

**Desenvolvedor**  
Victor Corsini — UNIP ADS · PIM III

---

## 📄 Licença

Projeto acadêmico desenvolvido para o PIM III do curso de Análise e Desenvolvimento de Sistemas — UNIP.
