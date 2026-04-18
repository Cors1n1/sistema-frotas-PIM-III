# Documentação Técnica — Machine Learning e Análise de Dados

## 7.1 Introdução

A análise de dados e o Machine Learning (ML) representam a camada de inteligência do **Sistema de Gestão de Frotas Integrado**. Enquanto as demais funcionalidades do sistema tratam do registro e visualização de informações operacionais, o módulo de ML vai além: ele transforma dados históricos em **previsões e indicadores estratégicos** que auxiliam na tomada de decisão gerencial.

O sistema implementa técnicas de **Regressão Linear**, **Análise Estatística Descritiva** e **Indicadores de Sustentabilidade Ambiental**, utilizando as bibliotecas Python **Scikit-Learn** e **Pandas** — amplamente reconhecidas na indústria e na academia como ferramentas padrão para ciência de dados.

---

## 7.2 Tipos de Dados Relevantes para Análise

O sistema coleta e armazena quatro categorias de dados relevantes para análise:

### 7.2.1 Dados de Consumo Energético

| Dado                  | Origem              | Tipo      | Uso na Análise                          |
|-----------------------|----------------------|-----------|------------------------------------------|
| Litros abastecidos    | Tabela `abastecimentos` | Numérico  | Cálculo de eficiência (Km/L)            |
| Valor total (R$)      | Tabela `abastecimentos` | Monetário | Custo operacional por veículo            |
| Odômetro              | Tabela `abastecimentos` | Numérico  | Distância percorrida entre abastecimentos |
| Tipo de combustível   | Tabela `abastecimentos` | Categórico | Segmentação de consumo por combustível   |

### 7.2.2 Dados de Manutenção

| Dado              | Origem           | Tipo      | Uso na Análise                              |
|-------------------|-------------------|-----------|----------------------------------------------|
| Custo (R$)        | Tabela `manutencoes` | Monetário | Variável dependente (Y) na Regressão Linear |
| Quilometragem     | Tabela `veiculos`    | Numérico  | Variável independente (X) na Regressão      |
| Tipo de manutenção| Tabela `manutencoes` | Categórico | Filtro: apenas corretivas para o modelo ML  |

### 7.2.3 Dados de Impacto Ambiental (Calculados)

| Indicador         | Fórmula                        | Unidade | Significado                                |
|-------------------|---------------------------------|---------|---------------------------------------------|
| Emissão de CO₂    | `litros × 2.3`                 | kg      | Pegada de carbono por abastecimento         |
| CO₂ total da frota| `SUM(litros × 2.3)`            | kg      | Impacto ambiental acumulado total           |
| Pegada por motorista | `SUM(litros × 2.3) por motorista` | kg   | Comparação entre condutores               |

### 7.2.4 Dados de Eficiência Operacional

| Indicador       | Fórmula                                   | Unidade | Ideal            |
|-----------------|-------------------------------------------|---------|-------------------|
| Km por Litro    | `(MAX(odômetro) - MIN(odômetro)) / SUM(litros)` | Km/L    | Quanto maior, melhor |
| Custo por Km    | `SUM(valor_total) / km_rodados`           | R$/Km   | Quanto menor, melhor |
| Preço médio/litro | `SUM(valor_total) / SUM(litros)`        | R$/L    | Ranking de economia  |

---

## 7.3 Modelo de Machine Learning: Regressão Linear

### 7.3.1 O que é Regressão Linear

A **Regressão Linear** é uma técnica estatística supervisionada que modela a relação entre uma variável dependente (Y) e uma ou mais variáveis independentes (X). A equação fundamental é:

```
Y = β₀ + β₁·X + ε

Onde:
  Y  = Custo de manutenção corretiva (R$) — o que queremos PREVER
  X  = Quilometragem do veículo (Km) — o dado que já temos
  β₀ = Intercepto (custo base mesmo sem quilometragem)
  β₁ = Coeficiente angular (taxa de crescimento do custo por km)
  ε  = Erro residual (variação não explicada pelo modelo)
```

### 7.3.2 Representação Gráfica do Modelo

```
    Custo
    (R$)
     │
  800│                                          ●  ← Previsão aos 100.000 km
     │                                      ╱
  600│                                  ╱
     │                              ╱
  400│              ●           ╱     ← Reta de Regressão (tendência)
     │          ●      ╱   ●
  200│      ●      ╱
     │  ●      ╱       ← Dados reais (pontos)
     │     ╱
   0 ├──────────────────────────────────────── Quilometragem (Km)
     0    20.000   40.000   60.000   80.000   100.000
```

**Interpretação:** O gráfico mostra que, à medida que a quilometragem aumenta, o custo de manutenção corretiva também tende a crescer. O modelo de ML identifica essa tendência e projeta o custo esperado para marcos futuros (como 100.000 km).

---

### 7.3.3 Implementação Completa do Modelo (ml.py)

```python
import warnings
warnings.filterwarnings('ignore')  # Silencia avisos técnicos do terminal

import pandas as pd                      # Manipulação de dados tabulares
import numpy as np                       # Operações matemáticas avançadas
from sklearn.linear_model import LinearRegression  # Algoritmo de ML
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

class AnalisadorFrotas:
    """Módulo de Inteligência Artificial para análise preditiva da frota."""

    MINIMO_AMOSTRAS = 3          # Mínimo de pontos para treinar o modelo
    KM_PREVISAO_PADRAO = 100000  # Marco de previsão padrão (100 mil km)
    FATOR_CO2_POR_LITRO = 2.3    # kg de CO₂ por litro de gasolina

    def __init__(self, conexao_db):
        self.conn = conexao_db  # Recebe a conexão com o PostgreSQL
        self.modelo = None       # Será populado após o treinamento

    def prever_custo_manutencao(self):
        """Pipeline completo de ML em 6 passos."""

        # PASSO 1: Extração de dados do banco
        query = """
            SELECT v.quilometragem, m.custo
            FROM veiculos v
            JOIN manutencoes m ON v.id = m.veiculo_id
            WHERE m.tipo = 'Corretiva'
        """
        df = pd.read_sql_query(query, self.conn)

        # PASSO 2: Validação de dados mínimos
        if len(df) < self.MINIMO_AMOSTRAS:
            return {
                "status": "insuficiente",
                "mensagem": f"São necessários pelo menos {self.MINIMO_AMOSTRAS} registros."
            }

        # PASSO 3: Preparação dos dados
        X = df[['quilometragem']]  # Variável independente (DataFrame 2D)
        y = df['custo']            # Variável dependente (Series 1D)

        # PASSO 4: Treinamento do modelo
        self.modelo = LinearRegression()
        self.modelo.fit(X, y)

        # PASSO 5: Avaliação com métricas estatísticas
        y_previsto = self.modelo.predict(X)
        r2 = r2_score(y, y_previsto)              # Coeficiente de Determinação
        mae = mean_absolute_error(y, y_previsto)   # Erro Médio Absoluto
        rmse = np.sqrt(mean_squared_error(y, y_previsto))  # Raiz do Erro Quadrático

        # PASSO 6: Previsões para múltiplos marcos estratégicos
        marcos_km = [50000, 100000, 150000]
        previsoes = {}
        for km in marcos_km:
            X_pred = pd.DataFrame({'quilometragem': [km]})
            custo = float(self.modelo.predict(X_pred)[0])
            previsoes[f"previsao_{km // 1000}k"] = round(max(custo, 0), 2)

        return {
            "status": "sucesso",
            "previsao_100k": previsoes["previsao_100k"],
            "tendencia_coeficiente": float(self.modelo.coef_[0]),
            "total_analisado": len(df),
            "previsoes": previsoes,
            "metricas": {
                "r2_score": round(r2, 4),
                "mae": round(mae, 2),
                "rmse": round(rmse, 2),
            },
            "equacao": {
                "formula": f"Y = {self.modelo.intercept_:.2f} + "
                           f"{self.modelo.coef_[0]:.6f} × X",
            },
        }
```

---

### 7.3.4 Fluxo Completo do Pipeline de Machine Learning

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │   Pandas     │    │ Scikit-Learn │    │   Flask      │
│              │    │              │    │              │    │              │
│  SELECT      │───▶│  DataFrame   │───▶│ LinearRegres │───▶│ jsonify()   │
│  km, custo   │    │  X, y        │    │ .fit()       │    │ → Frontend  │
│  FROM ...    │    │              │    │ .predict()   │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
    EXTRAÇÃO           PREPARAÇÃO          TREINAMENTO         ENTREGA
```

**Detalhamento do pipeline:**

1. **Extração (SQL):** A query busca apenas manutenções do tipo `'Corretiva'` com JOIN entre `veiculos` e `manutencoes`.
2. **Preparação (Pandas):** O `pd.read_sql_query()` converte o resultado SQL em um DataFrame — estrutura tabular otimizada para ML.
3. **Treinamento (Scikit-Learn):** O `LinearRegression().fit(X, y)` calcula os coeficientes β₀ e β₁ usando o **Método dos Mínimos Quadrados**.
4. **Avaliação:** O R², MAE e RMSE medem a qualidade do modelo treinado.
5. **Previsão:** O `.predict()` aplica a equação `Y = β₀ + β₁ × km` para estimar custos em 3 marcos (50k, 100k, 150k).
6. **Entrega (Flask):** O resultado é serializado como JSON e enviado ao frontend para exibição visual.

---

### 7.3.5 Métricas de Avaliação do Modelo

O sistema calcula automaticamente três métricas estatísticas para avaliar a qualidade do modelo treinado:

| Métrica | Nome Completo | Fórmula Simplificada | Interpretação |
|---------|--------------|---------------------|---------------|
| **R²** | Coeficiente de Determinação | `1 - (SS_res / SS_tot)` | Quanto da variação do custo é explicada pela quilometragem (0 a 1, quanto maior melhor) |
| **MAE** | Mean Absolute Error | `Σ|real - previsto| / n` | Erro médio em Reais — "o modelo erra em média R$ X" |
| **RMSE** | Root Mean Squared Error | `√(Σ(real - previsto)² / n)` | Penaliza erros grandes — útil para detectar outliers |

### Classificação Automática de Qualidade

```
R² ≥ 0.80  →  EXCELENTE  (modelo muito confiável)
R² ≥ 0.50  →  BOM        (modelo aceitável para decisões)
R² ≥ 0.20  →  MODERADO   (tendência identificada, mas com variância alta)
R² < 0.20  →  FRACO      (dados insuficientes ou sem padrão linear)
```

### Previsões para Múltiplos Marcos Estratégicos

O modelo gera previsões para três marcos quilométricos:

| Marco | Uso Estratégico |
|-------|-----------------|
| **50.000 km** | Primeira revisão geral — planejamento de orçamento |
| **100.000 km** | Meia-vida do veículo — decisão de manter ou substituir |
| **150.000 km** | Fim de vida útil estimado — cálculo de depreciação |

---

## 7.4 Indicadores e Relatórios Gerados pelo Sistema

### 7.4.1 Dashboard de KPIs em Tempo Real

O sistema gera automaticamente três indicadores-chave de performance (KPIs) no dashboard:

```
┌──────────────────────────────────────────────────────────────────┐
│                    DASHBOARD — KPIs em Tempo Real                │
│                                                                  │
│  ┌────────────┐    ┌────────────────┐    ┌─────────────────┐    │
│  │  🚚 FROTA  │    │  💰 CUSTOS     │    │  🌱 CO₂ TOTAL   │    │
│  │  ATIVA     │    │  OPERACIONAIS  │    │  EMISSÕES       │    │
│  │            │    │                │    │                 │    │
│  │    5       │    │  R$ 3.420,50   │    │  198.32 kg      │    │
│  │  ● ONLINE  │    │  Acumulado     │    │  Acumulado      │    │
│  └────────────┘    └────────────────┘    └─────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

**Cálculos por trás dos KPIs:**

```python
# Frontend: charts.js
custos = dados.map(d => parseFloat(d.total_gasto.replace('R$ ', '')));
co2 = dados.map(d => parseFloat(d.co2_total.replace(' kg', '')));

custoTotalAcumulado = custos.reduce((acc, curr) => acc + curr, 0);
co2TotalAcumulado = co2.reduce((acc, curr) => acc + curr, 0);
```

### 7.4.2 Relatório de Eficiência Energética por Veículo

A tabela de eficiência combina dados de múltiplas fontes para gerar métricas consolidadas:

```
┌────────────────────────────────────────────────────────────────┐
│              RELATÓRIO DE EFICIÊNCIA ENERGÉTICA                │
├──────────────────┬──────────┬──────────┬──────────────────────┤
│ Ativo Operacional│ Km/L     │ R$/Km    │ Pegada CO₂           │
├──────────────────┼──────────┼──────────┼──────────────────────┤
│ Clio (ABC1D23)   │ 12.4 Km/L│ R$ 0.48  │ 97.75 kg             │
│ FH 540 (XYZ9W87) │  4.2 Km/L│ R$ 1.52  │ 345.00 kg            │
│ Onix (DEF3G45)   │ 13.8 Km/L│ R$ 0.42  │ 52.90 kg             │
└──────────────────┴──────────┴──────────┴──────────────────────┘
```

### 7.4.3 Ranking de Eco-Drivers (Gamificação)

O sistema utiliza a análise de dados para classificar motoristas pela eficiência econômica:

```
┌────────────────────────────────────────────────────┐
│              TOP ECO-DRIVERS                       │
│                                                    │
│  🥇  VICTOR CORSINI                               │
│      Média: R$ 5.42/L  │  Gasto: R$ 1.200,00     │
│                         │  CO₂: 230.0 kg          │
│                                                    │
│  🥈  JOÃO SILVA                                   │
│      Média: R$ 5.65/L  │  Gasto: R$ 890,00       │
│                         │  CO₂: 178.5 kg          │
│                                                    │
│  🥉  MARIA SANTOS                                 │
│      Média: R$ 5.78/L  │  Gasto: R$ 1.450,00     │
│                         │  CO₂: 312.0 kg          │
└────────────────────────────────────────────────────┘
```

**Query SQL do ranking:**

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

### 7.4.4 Alertas Inteligentes de Manutenção Preventiva

O sistema monitora a quilometragem de cada veículo e alerta quando a diferença desde a última manutenção preventiva ultrapassa 10.000 km:

```
┌──────────────────────────────────────────────────────┐
│                GESTÃO DE RISCOS                      │
│                                                      │
│  ⚠️ Renault Clio (ABC1D23)                          │
│  ████████████████████████████████████░░░░ 85%        │
│  Revisão vencida! Última: 25.000 km. Atual: 35.420 km│
│                              [✔ Feito]               │
│                                                      │
│  ⚠️ Volvo FH 540 (XYZ9W87)                          │
│  ██████████████████████████████████████████ 100%     │
│  Revisão vencida! Última: 60.000 km. Atual: 80.200 km│
│                              [✔ Feito]               │
└──────────────────────────────────────────────────────┘
```

**Lógica da regra de negócio:**

```python
# app.py — Alerta de revisão
for linha in linhas:
    id_veiculo, placa, modelo, marca, km_atual, ultima_preventiva = linha
    ultima_revisao = ultima_preventiva if ultima_preventiva else 0

    if (km_atual - ultima_revisao) >= 10000:  # Regra: a cada 10.000 km
        alertas.append({
            "veiculo": f"{marca} {modelo} ({placa})",
            "mensagem": f"Revisão vencida! Última: {ultima_revisao} km. "
                        f"Atual: {km_atual} km.",
            "status": "urgente"
        })
```

---

## 7.5 Gráficos de Business Intelligence (Chart.js)

O sistema gera dois gráficos interativos no Dashboard utilizando a biblioteca **Chart.js**:

### 7.5.1 Gráfico de Barras — Investimento Operacional por Veículo

```
    R$
  3000 │  ████
       │  ████
  2000 │  ████  ████
       │  ████  ████
  1000 │  ████  ████  ████
       │  ████  ████  ████  ████
     0 ├──────┴──────┴──────┴──────
         Clio    FH540  Onix   Gol
```

**Código responsável:**

```javascript
new Chart(canvasCustos, {
    type: 'bar',
    data: {
        labels: labels,           // Nomes dos veículos
        datasets: [{
            label: 'Investimento em Abastecimento (R$)',
            data: custos,          // Array de valores monetários
            backgroundColor: '#1e3a8a',
            borderRadius: 8,       // Cantos arredondados
            hoverBackgroundColor: '#facc15'  // Cor ao passar o mouse
        }]
    }
});
```

### 7.5.2 Gráfico Doughnut — Distribuição de Emissões CO₂

```
            ┌─────────────┐
           ╱    45.2%      ╲
         ╱   Clio (ABC1D23)  ╲
        │                     │
        │    ┌──────────┐     │
        │    │  CENTRO  │     │  ◄── Cutout: 70%
        │    │  VAZIO   │     │
        │    └──────────┘     │
         ╲                   ╱
          ╲    30.1%       ╱
           ╲  FH 540     ╱
            └────────────┘
              24.7% Onix
```

---

## 7.6 Simulador de Rotas com Dados Reais da Frota

O módulo de análise inclui um **simulador de viagem** que combina APIs externas com dados internos do banco para calcular custos logísticos:

### 7.6.1 Arquitetura do Simulador

```
┌──────────────────┐
│ Frontend (Leaflet)│─── Usuário digita Origem e Destino
└────────┬─────────┘
         │ POST /api/dashboard/simular_viagem
         ▼
┌──────────────────┐     ┌─────────────────────────┐
│ Backend (Python) │────▶│ API OSRM (Satélite)     │
│                  │     │ Distância, tempo, rota   │
│                  │◀────│ Coordenadas GPS          │
│                  │     └─────────────────────────┘
│                  │
│                  │     ┌─────────────────────────┐
│                  │────▶│ PostgreSQL               │
│                  │     │ Preço médio combustível  │
│                  │◀────│ Média Km/L da frota      │
│                  │     └─────────────────────────┘
│                  │
│  CÁLCULOS:       │
│  Litros = dist/Km/L │
│  Custo = litros × preço │
│  CO₂ = litros × 2.3   │
└──────────────────┘
```

### 7.6.2 Modo de Contingência (Offline)

Caso a API OSRM não esteja disponível, o sistema calcula a distância usando o **Teorema de Pitágoras Geográfico**:

```python
# Cálculo offline da distância
dist_x = (destino['lng'] - origem['lng']) * 111.32 * math.cos(math.radians(origem['lat']))
dist_y = (destino['lat'] - origem['lat']) * 111.32
distancia_km = (math.sqrt(dist_x**2 + dist_y**2)) * 1.2  # +20% (fator de rodovia)
```

**Explicação:** O fator `111.32` converte graus em quilômetros (1° de latitude ≈ 111,32 km). O acréscimo de 20% compensa o fato de estradas reais não serem linhas retas.

---

## 7.7 Interpretação dos Resultados no Contexto do Negócio

### 7.7.1 Para o Gestor de Frotas

A previsão de custo de manutenção permite ao gestor **planejar orçamentos** e **priorizar substituições de veículos** que estejam próximos do ponto de inflexão onde manutenção se torna mais cara que a aquisição de um novo veículo.

### 7.7.2 Para o Setor Financeiro

Os indicadores de custo por quilômetro e gasto acumulado permitem **precificar fretes** com base em dados reais, não em estimativas.

### 7.7.3 Para a Sustentabilidade

O cálculo automático de emissões de CO₂ permite que a empresa:
- Emita **relatórios de pegada de carbono** para conformidade ambiental.
- Identifique veículos com alto impacto ambiental para substituição por modelos mais eficientes.
- Premie motoristas com menor pegada (incentivo ESG).

---

## 7.8 Bibliotecas Utilizadas

| Biblioteca       | Versão | Função no Projeto                                    |
|------------------|--------|------------------------------------------------------|
| **Pandas**       | 2.x    | Manipulação de DataFrames e integração com SQL       |
| **Scikit-Learn** | 1.x    | Algoritmo de Regressão Linear (`LinearRegression`)   |
| **Chart.js**     | 4.x    | Gráficos interativos de barras e doughnut (frontend) |
| **Leaflet.js**   | 1.x    | Mapas interativos e visualização de rotas GPS        |
