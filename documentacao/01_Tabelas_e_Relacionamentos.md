# Documentação Técnica — Tabelas e Relacionamentos do Banco de Dados

## 3.1 Introdução à Modelagem de Dados

A modelagem de dados constitui a espinha dorsal de qualquer sistema de informação robusto. No projeto **Sistema de Gestão de Frotas Integrado**, a base de dados foi projetada para suportar as operações diárias de uma empresa de transporte e logística, abrangendo o controle de veículos, motoristas, abastecimentos e manutenções. A escolha por uma modelagem relacional se fundamenta na natureza altamente estruturada e inter-relacionada dos dados envolvidos na gestão de frotas.

O banco de dados foi implementado utilizando **PostgreSQL**, um Sistema Gerenciador de Banco de Dados Relacional (SGBDR) de código aberto, reconhecido pela sua robustez, conformidade com o padrão SQL ANSI e capacidades avançadas de concorrência e integridade transacional.

---

## 3.2 Identificação das Informações Essenciais ao Negócio

A partir da análise dos processos operacionais da empresa fictícia **TransLog Soluções Logísticas**, foram identificadas as seguintes entidades de dados essenciais:

| Entidade         | Descrição Funcional                                                        |
|------------------|----------------------------------------------------------------------------|
| **Veículos**     | Unidades da frota (carros de passeio e caminhões) com dados técnicos       |
| **Motoristas**   | Colaboradores habilitados para conduzir os veículos da empresa             |
| **Abastecimentos** | Registros de cada operação de abastecimento, vinculados a veículo e motorista |
| **Manutenções**  | Ordens de serviço (preventivas e corretivas) associadas aos veículos       |

Essas entidades refletem os quatro pilares operacionais da logística de transporte: **ativos (veículos)**, **recursos humanos (motoristas)**, **consumo energético (abastecimentos)** e **engenharia de manutenção (manutenções)**.

---

## 3.3 Modelo Conceitual de Dados

O modelo conceitual representa a visão de alto nível das entidades e seus relacionamentos, independente de tecnologia. O diagrama abaixo utiliza a notação Entidade-Relacionamento (ER):

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MODELO CONCEITUAL (ER)                          │
│                                                                        │
│   ┌────────────┐          ┌─────────────────┐         ┌──────────────┐ │
│   │  MOTORISTA │──────┐   │  ABASTECIMENTO  │   ┌─────│   VEÍCULO    │ │
│   │            │  N:1 │   │                 │   │ 1:N │              │ │
│   │ • id (PK)  │      └──▶│ • id (PK)       │◀──┘     │ • id (PK)    │ │
│   │ • nome     │          │ • veiculo_id(FK) │        │ • placa      │ │
│   │ • cnh      │          │ • motorista_id(FK│        │ • modelo     │ │
│   │ • categ_cnh│          │ • data           │        │ • marca      │ │
│   └────────────┘          │ • litros         │        │ • ano        │ │
│                           │ • valor_total    │        │ • quilometr. │ │
│                           │ • tipo_combust.  │        │ • tipo_veic. │ │
│                           │ • odometro       │        │ • eixos      │ │
│                           └─────────────────┘         │              │ │
│                                                       │      │       │ │
│                                                       │      │ 1:N   │ │
│                           ┌─────────────────┐         │      │       │ │
│                           │   MANUTENÇÃO    │◀────────┘      │       │ │
│                           │                 │                        │ │
│                           │ • id (PK)       │                        │ │
│                           │ • veiculo_id(FK)│                        │ │
│                           │ • data_manut.   │                        │ │
│                           │ • tipo          │                        │ │
│                           │ • custo         │                        │ │
│                           │ • descricao     │                        │ │
│                           │ • quilometragem │                        │ │
│                           └─────────────────┘                        │ │
└────────────────────────────────────────────────────────────────────────┘
```

### Descrição dos Relacionamentos Conceituais

| Relacionamento               | Cardinalidade | Descrição                                             |
|------------------------------|:------------:|-------------------------------------------------------|
| Veículo ↔ Abastecimento     |     1 : N    | Um veículo pode ter muitos abastecimentos registrados  |
| Motorista ↔ Abastecimento   |     1 : N    | Um motorista pode realizar muitos abastecimentos       |
| Veículo ↔ Manutenção        |     1 : N    | Um veículo pode ter muitas manutenções no histórico    |

---

## 3.4 Modelo Lógico de Dados

O modelo lógico detalha a estrutura de cada tabela com tipos de dados, restrições, chaves primárias (PK) e chaves estrangeiras (FK), pronto para implementação no PostgreSQL.

### 3.4.1 Tabela `veiculos`

Armazena os dados técnicos de cada unidade da frota. Suporta dois tipos de veículos (Carro de Passeio e Caminhão) através do campo discriminador `tipo_veiculo`.

| Coluna           | Tipo de Dado      | Restrição     | Descrição                                 |
|------------------|-------------------|---------------|-------------------------------------------|
| `id`             | `SERIAL`          | **PK**, NOT NULL | Identificador único auto-incrementado    |
| `placa`          | `VARCHAR(10)`     | UNIQUE, NOT NULL | Placa no padrão Mercosul (ABC1D23)       |
| `modelo`         | `VARCHAR(100)`    | NOT NULL      | Modelo do veículo (validado via API FIPE)  |
| `marca`          | `VARCHAR(100)`    | NOT NULL      | Fabricante do veículo                      |
| `ano`            | `INTEGER`         | NOT NULL      | Ano de fabricação                          |
| `quilometragem`  | `INTEGER`         | NOT NULL, DEFAULT 0 | Odômetro atual (atualizado automaticamente) |
| `tipo_veiculo`   | `VARCHAR(20)`     | NOT NULL, DEFAULT 'Carro' | Discriminador: 'Carro' ou 'Caminhão' |
| `eixos`          | `INTEGER`         | DEFAULT 0     | Número de eixos (apenas para caminhões)    |

**Script DDL:**

```sql
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
```

---

### 3.4.2 Tabela `motoristas`

Registra os condutores da empresa com suas habilitações de condução.

| Coluna         | Tipo de Dado    | Restrição     | Descrição                                     |
|----------------|-----------------|---------------|-----------------------------------------------|
| `id`           | `SERIAL`        | **PK**, NOT NULL | Identificador único auto-incrementado        |
| `nome`         | `VARCHAR(150)`  | NOT NULL      | Nome completo do motorista                     |
| `cnh`          | `VARCHAR(20)`   | UNIQUE, NOT NULL | Número do registro da CNH                    |
| `categoria_cnh`| `VARCHAR(20)`   | NOT NULL      | Categorias (ex: "B", "B, C", "C, D, E")       |

**Script DDL:**

```sql
CREATE TABLE motoristas (
    id            SERIAL       PRIMARY KEY,
    nome          VARCHAR(150) NOT NULL,
    cnh           VARCHAR(20)  UNIQUE NOT NULL,
    categoria_cnh VARCHAR(20)  NOT NULL
);
```

---

### 3.4.3 Tabela `abastecimentos`

Registra cada operação de abastecimento, vinculando veículo e motorista responsável.

| Coluna               | Tipo de Dado   | Restrição     | Descrição                                 |
|----------------------|----------------|---------------|-------------------------------------------|
| `id`                 | `SERIAL`       | **PK**, NOT NULL | Identificador único auto-incrementado    |
| `veiculo_id`         | `INTEGER`      | **FK** → veiculos(id), NOT NULL | Veículo abastecido   |
| `motorista_id`       | `INTEGER`      | **FK** → motoristas(id), NOT NULL | Motorista responsável |
| `data_abastecimento` | `DATE`         | NOT NULL      | Data da operação de abastecimento          |
| `litros`             | `DECIMAL(10,2)`| NOT NULL      | Volume de combustível em litros            |
| `valor_total`        | `DECIMAL(10,2)`| NOT NULL      | Valor total pago (R$)                      |
| `tipo_combustivel`   | `VARCHAR(20)`  | NOT NULL      | Tipo: Gasolina, Diesel ou Etanol           |
| `odometro`           | `INTEGER`      | NOT NULL      | Leitura do odômetro no momento             |

**Script DDL:**

```sql
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
```

---

### 3.4.4 Tabela `manutencoes`

Registra as ordens de serviço de manutenção (preventiva ou corretiva) realizadas nos veículos.

| Coluna           | Tipo de Dado    | Restrição     | Descrição                                 |
|------------------|-----------------|---------------|-------------------------------------------|
| `id`             | `SERIAL`        | **PK**, NOT NULL | Identificador único auto-incrementado    |
| `veiculo_id`     | `INTEGER`       | **FK** → veiculos(id), NOT NULL | Veículo que recebeu manutenção |
| `data_manutencao`| `DATE`          | NOT NULL      | Data da intervenção técnica                |
| `tipo`           | `VARCHAR(20)`   | NOT NULL      | Natureza: 'Preventiva' ou 'Corretiva'     |
| `custo`          | `DECIMAL(10,2)` | NOT NULL      | Valor total do serviço (R$)                |
| `descricao`      | `TEXT`          | NOT NULL      | Descrição dos serviços realizados          |
| `quilometragem`  | `INTEGER`       | NOT NULL      | Odômetro no momento da manutenção          |

**Script DDL:**

```sql
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

## 3.5 Diagrama de Relacionamento (ER Completo)

O diagrama abaixo resume todas as tabelas, suas colunas e os relacionamentos entre elas com as cardinalidades:

```
    ┌─────────────────────────┐
    │       motoristas        │
    ├─────────────────────────┤
    │ PK  id          SERIAL  │
    │     nome        VARCHAR │
    │ UQ  cnh         VARCHAR │
    │     categoria   VARCHAR │
    └──────────┬──────────────┘
               │
               │ 1:N (um motorista → N abastecimentos)
               │
               ▼
    ┌─────────────────────────────────┐
    │         abastecimentos          │
    ├─────────────────────────────────┤
    │ PK  id                  SERIAL  │
    │ FK  veiculo_id          INTEGER │──────┐
    │ FK  motorista_id        INTEGER │      │
    │     data_abastecimento  DATE    │      │
    │     litros              DECIMAL │      │
    │     valor_total         DECIMAL │      │
    │     tipo_combustivel    VARCHAR │      │
    │     odometro            INTEGER │      │
    └─────────────────────────────────┘      │
                                              │ N:1 (N abastecimentos → 1 veículo)
    ┌─────────────────────────┐              │
    │        veiculos         │◀─────────────┘
    ├─────────────────────────┤
    │ PK  id          SERIAL  │
    │ UQ  placa       VARCHAR │
    │     modelo      VARCHAR │
    │     marca       VARCHAR │
    │     ano         INTEGER │
    │     quilometr.  INTEGER │
    │     tipo_veic.  VARCHAR │
    │     eixos       INTEGER │
    └──────────┬──────────────┘
               │
               │ 1:N (um veículo → N manutenções)
               ▼
    ┌─────────────────────────────┐
    │        manutencoes          │
    ├─────────────────────────────┤
    │ PK  id              SERIAL  │
    │ FK  veiculo_id      INTEGER │
    │     data_manutencao DATE    │
    │     tipo            VARCHAR │
    │     custo           DECIMAL │
    │     descricao       TEXT    │
    │     quilometragem   INTEGER │
    └─────────────────────────────┘
```

---

## 3.6 Justificativa Técnica para a Adoção de Banco de Dados Relacional

A escolha pelo **PostgreSQL** como SGBD relacional é justificada pelos seguintes fatores técnicos e operacionais:

### 3.6.1 Integridade Referencial e Consistência Transacional

Os dados de frotas possuem forte interdependência: um abastecimento precisa obrigatoriamente estar vinculado a um veículo e a um motorista válidos. O modelo relacional garante essa consistência através de **chaves estrangeiras (FK)**, impedindo inserções órfãs. Além disso, o PostgreSQL implementa o padrão **ACID** (Atomicidade, Consistência, Isolamento, Durabilidade), essencial para operações financeiras como o registro de custos de abastecimento e manutenção.

### 3.6.2 Estrutura Altamente Normalizada dos Dados

Os dados do sistema seguem um padrão tabular bem definido — cada entidade possui atributos fixos com tipos claros. Não há necessidade de esquemas flexíveis (como documentos JSON aninhados), o que tornaria um banco NoSQL desnecessariamente complexo para este domínio.

### 3.6.3 Consultas Analíticas Complexas com SQL

O sistema requer consultas com **JOINs múltiplos**, **agregações (SUM, AVG, MAX, MIN)**, **subqueries** e **GROUP BY** para gerar relatórios de consumo, rankings de motoristas e alertas de manutenção. O SQL do PostgreSQL oferece suporte nativo e otimizado para todas essas operações.

### 3.6.4 Por que NÃO escolhemos NoSQL?

| Critério                 | Relacional (PostgreSQL)  | NoSQL (MongoDB)          |
|--------------------------|:------------------------:|:------------------------:|
| Integridade Referencial  | ✅ Nativo com FK          | ❌ Não possui FK nativas  |
| Transações ACID          | ✅ Completo               | ⚠️ Limitado              |
| JOINs Complexos          | ✅ Otimizado               | ❌ Não recomendado        |
| Esquema Fixo e Validado  | ✅ Sim, com DDL           | ⚠️ Schema-less           |
| Escalabilidade Horizontal| ⚠️ Limitada               | ✅ Nativa (Sharding)      |

**Conclusão:** Para um sistema de gestão de frotas com dados altamente estruturados e interdependentes, o banco relacional é a escolha tecnicamente superior.

---

## 3.7 Descrição das Principais Operações e Consultas Previstas

### 3.7.1 Operações CRUD Básicas

```sql
-- INSERIR um novo veículo na frota
INSERT INTO veiculos (placa, modelo, marca, ano, quilometragem, tipo_veiculo, eixos)
VALUES ('ABC1D23', 'Clio', 'Renault', 2022, 35000, 'Carro', 0);

-- CONSULTAR todos os veículos ordenados por ID
SELECT id, placa, modelo, marca, ano, quilometragem, tipo_veiculo, eixos
FROM veiculos ORDER BY id ASC;

-- INSERIR um novo motorista
INSERT INTO motoristas (nome, cnh, categoria_cnh)
VALUES ('Victor Corsini', '12345678900', 'B, C');

-- INSERIR um abastecimento com atualização automática do odômetro
INSERT INTO abastecimentos (veiculo_id, motorista_id, data_abastecimento,
       litros, valor_total, tipo_combustivel, odometro)
VALUES (1, 1, '2026-04-15', 42.5, 267.75, 'Gasolina', 35420);

UPDATE veiculos SET quilometragem = 35420 WHERE id = 1;
```

### 3.7.2 Consulta de Alertas de Revisão (Subquery Correlacionada)

Esta consulta identifica veículos que precisam de manutenção preventiva (a cada 10.000 km):

```sql
SELECT v.id, v.placa, v.modelo, v.marca, v.quilometragem,
    (SELECT MAX(m.quilometragem)
     FROM manutencoes m
     WHERE m.veiculo_id = v.id AND m.tipo = 'Preventiva'
    ) AS ultima_preventiva
FROM veiculos v;
```

**Lógica:** Se `(km_atual - ultima_preventiva) >= 10.000`, o sistema gera um alerta visual na tela de análise.

### 3.7.3 Relatório de Consumo e Eficiência Energética (JOIN + Agregação)

```sql
SELECT v.placa, v.modelo,
       SUM(a.litros)                          AS total_litros,
       SUM(a.valor_total)                     AS total_gasto,
       (MAX(a.odometro) - MIN(a.odometro))    AS km_rodados,
       SUM(a.litros * 2.3)                    AS total_co2_kg
FROM veiculos v
LEFT JOIN abastecimentos a ON v.id = a.veiculo_id
GROUP BY v.id, v.placa, v.modelo;
```

**Cálculos derivados no Python:**
- **Eficiência (Km/L):** `km_rodados / total_litros`
- **Custo por Km (R$/Km):** `total_gasto / km_rodados`
- **Emissões CO₂ (kg):** `total_litros × 2.3` (fator de emissão padrão da gasolina)

### 3.7.4 Ranking de Eco-Drivers (JOIN + HAVING + ORDER BY)

```sql
SELECT m.nome,
       SUM(a.valor_total) / SUM(a.litros)  AS preco_medio_litro,
       SUM(a.litros * 2.3)                 AS pegada_co2,
       SUM(a.valor_total)                  AS gasto_total
FROM motoristas m
JOIN abastecimentos a ON m.id = a.motorista_id
GROUP BY m.id, m.nome
HAVING SUM(a.litros) > 0
ORDER BY preco_medio_litro ASC
LIMIT 5;
```

### 3.7.5 Dados para Modelo de Machine Learning (JOIN para Regressão Linear)

```sql
SELECT v.quilometragem, m.custo
FROM veiculos v
JOIN manutencoes m ON v.id = m.veiculo_id
WHERE m.tipo = 'Corretiva';
```

Esta consulta alimenta o modelo de **Regressão Linear** do Scikit-Learn, que prevê o custo de manutenção corretiva ao atingir 100.000 km.

### 3.7.6 Simulação de Viagem (Agregação com COALESCE e NULLIF)

```sql
SELECT
    COALESCE(SUM(valor_total) / NULLIF(SUM(litros), 0), 5.80) AS preco_medio,
    COALESCE(SUM(odometro) / NULLIF(SUM(litros), 0), 8.5)     AS media_km_litro
FROM abastecimentos
HAVING SUM(litros) > 0;
```

**Explicação:** Utiliza `COALESCE` para fornecer valores padrão caso não haja dados suficientes, e `NULLIF` para evitar divisão por zero — garantindo que o simulador de rotas funcione mesmo em bases de dados vazias.

---

## 3.8 Fluxo de Dados no Sistema

O diagrama abaixo ilustra como os dados fluem entre as camadas da aplicação e o banco de dados:

```
          ┌───────────────────────────────────────────────────┐
          │              FRONTEND (HTML/JS)                    │
          │  Formulários → fetch('/api/...') → Exibe dados    │
          └────────────────────┬──────────────────────────────┘
                               │ HTTP (JSON)
                               ▼
          ┌───────────────────────────────────────────────────┐
          │           BACKEND (Flask/Python)                   │
          │   app.py → Recebe request → Valida regras de      │
          │   negócio → Executa SQL → Retorna JSON            │
          └────────────────────┬──────────────────────────────┘
                               │ psycopg2
                               ▼
          ┌───────────────────────────────────────────────────┐
          │           PostgreSQL (pim_trab)                   │
          │   veiculos │ motoristas │ abastecimentos │ manut. │
          └───────────────────────────────────────────────────┘
```

---

## 3.9 Considerações sobre Segurança do Banco de Dados

- **Variáveis de ambiente:** As credenciais de acesso ao banco estão armazenadas no arquivo `.env`, fora do controle de versão, utilizando a biblioteca `python-dotenv`.
- **Prepared Statements:** Todas as queries utilizam **parâmetros posicionais** (`%s`) do `psycopg2`, prevenindo ataques de **SQL Injection**.
- **Gerenciamento de conexões:** Cada requisição abre e fecha sua própria conexão (`conn.close()`), evitando vazamentos de conexão.
- **Rollback em caso de erro:** Todas as operações de escrita implementam `try/except` com `conn.rollback()` para garantir a integridade transacional.
