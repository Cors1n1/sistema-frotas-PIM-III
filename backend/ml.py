"""
Modulo de Machine Learning - Sistema de Gestao de Frotas (PIM III)

Responsabilidade: Analise preditiva de custos de manutencao
baseada em dados historicos de manutencoes corretivas.

Algoritmo:  Regressao Linear (Metodo dos Minimos Quadrados - OLS)
Bibliotecas: Scikit-Learn v1.x, Pandas v2.x, NumPy
Entrada:    Tabela 'manutencoes' com quilometragem no momento do servico
Saida:      JSON com previsoes por tipo de veiculo, metricas e tendencia

Correcoes aplicadas:
  - Query corrigida: usa m.quilometragem (km no momento da manutencao)
    em vez de v.quilometragem (km atual do veiculo, repetido para todas
    as manutencoes — o que tornava o treinamento invalido).
  - Predicao separada por tipo de veiculo (Carro / Caminhao), pois os
    padroes de custo sao muito diferentes entre as categorias.
  - Previsao em lote com np.array (sem criar DataFrames em loop).
  - Logging substituiu warnings.filterwarnings('ignore').
  - MINIMO_AMOSTRAS elevado de 3 para 5 para maior estabilidade do R2.
"""

import logging
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

# Logging configurado no nivel WARNING — nao polui o terminal em producao,
# mas registra problemas reais (ao contrario de suprimir todos os avisos).
logging.basicConfig(
    level=logging.WARNING,
    format="%(asctime)s [ML] %(levelname)s: %(message)s"
)
logger = logging.getLogger(__name__)


class AnalisadorFrotas:
    """
    Classe responsavel pela inteligencia analitica da frota.

    Implementa o pilar de ABSTRACAO da POO: o chamador (app.py)
    nao precisa conhecer a complexidade interna do ML.
    Basta chamar analisador.prever_custo_manutencao() e receber
    um dicionario pronto para o frontend.

    Attributes:
        conn:   Conexao ativa com o PostgreSQL (via psycopg2).
        modelo: Instancia treinada do LinearRegression (None ate fit()).
    """

    # Constantes do negocio
    MINIMO_AMOSTRAS   = 5        # Minimo de pontos para regressao estavel
    MARCOS_KM         = [50_000, 100_000, 150_000]   # Marcos de previsao
    TIPOS_VEICULO     = ["Carro", "Caminhao"]         # Categorias da frota

    def __init__(self, conexao_db):
        """
        Inicializa o analisador com uma conexao ativa ao banco de dados.

        Args:
            conexao_db: Objeto de conexao psycopg2 retornado por get_db_connection().
        """
        self.conn  = conexao_db
        self.modelo = None

    # ------------------------------------------------------------------
    # METODO PUBLICO PRINCIPAL
    # ------------------------------------------------------------------

    def prever_custo_manutencao(self):
        """
        Pipeline completo de Machine Learning em 5 passos:

        1. EXTRACAO:    SQL busca manutencoes corretivas com a quilometragem
                        registrada NO MOMENTO DO SERVICO (m.quilometragem),
                        nao a quilometragem atual do veiculo.
        2. VALIDACAO:   Verifica se ha dados minimos para treinar.
        3. PREPARACAO:  Separa X (km) e y (custo); divide por tipo de veiculo.
        4. TREINAMENTO: Ajusta Regressao Linear por categoria de veiculo.
        5. AVALIACAO E PREVISAO: Calcula R2, MAE, RMSE e projeta marcos.

        Returns:
            dict: Resultado estruturado com status, previsoes e metricas.

        Exemplo de retorno (sucesso):
            {
                "status": "sucesso",
                "total_analisado": 57,
                "previsao_geral": {
                    "previsao_100k": 2150.40,
                    "tendencia": "crescente",
                    "coeficiente": 0.0231,
                    "formula": "Y = 800.00 + 0.023100 x X",
                    "metricas": { "r2_score": 0.82, "mae": 310.50, ... }
                },
                "previsoes_por_tipo": {
                    "Carro":    { ... },
                    "Caminhao": { ... }
                },
                "estatisticas": { ... }
            }
        """

        # ═══════════════════════════════════════════════════════
        # PASSO 1 — EXTRACAO DE DADOS (SQL -> DataFrame)
        # ═══════════════════════════════════════════════════════
        #
        # CORRECAO CRITICA:
        #   Versao anterior usava v.quilometragem (km atual do veiculo),
        #   que e o mesmo valor repetido para TODAS as manutencoes do
        #   mesmo veiculo. Isso faz X ter variacao zero por veiculo,
        #   tornando a regressao estatisticamente invalida.
        #
        #   A versao correta usa m.quilometragem: o odometro registrado
        #   NO DIA da manutencao, que varia a cada registro e representa
        #   o desgaste real no momento do servico.
        #
        # A query tambem traz o tipo_veiculo para permitir previsoes
        # segmentadas — carros e caminhoes tem perfis de custo muito
        # diferentes e nao devem ser misturados na mesma regressao.
        query = """
            SELECT
                m.quilometragem   AS km_manutencao,
                m.custo,
                v.tipo_veiculo
            FROM manutencoes m
            JOIN veiculos    v ON v.id = m.veiculo_id
            WHERE m.tipo = 'Corretiva'
              AND m.quilometragem IS NOT NULL
              AND m.quilometragem > 0
              AND m.custo > 0
            ORDER BY m.quilometragem ASC
        """
        # pd.read_sql_query exige SQLAlchemy quando usado com psycopg2 puro;
        # a forma correta e usar o cursor nativo e construir o DataFrame manualmente,
        # eliminando o UserWarning: "pandas only supports SQLAlchemy connectable".
        try:
            cursor = self.conn.cursor()
            cursor.execute(query)
            linhas = cursor.fetchall()
            colunas = [desc[0] for desc in cursor.description]
            cursor.close()
            df = pd.DataFrame(linhas, columns=colunas)
        except Exception as exc:
            logger.error("Falha ao buscar dados de manutencoes: %s", exc)
            return {"status": "erro", "mensagem": "Erro ao acessar o banco de dados."}

        # ═══════════════════════════════════════════════════════
        # PASSO 2 — VALIDACAO DO VOLUME DE DADOS
        # ═══════════════════════════════════════════════════════
        if len(df) < self.MINIMO_AMOSTRAS:
            return {
                "status": "insuficiente",
                "mensagem": (
                    f"Sao necessarios pelo menos {self.MINIMO_AMOSTRAS} registros de "
                    f"manutencoes corretivas com quilometragem para a IA gerar previsoes. "
                    f"Atualmente existem {len(df)} registro(s)."
                )
            }

        # ═══════════════════════════════════════════════════════
        # PASSO 3 — PREPARACAO DOS DADOS
        # ═══════════════════════════════════════════════════════
        #
        # X: variavel independente — quilometragem no momento da manutencao
        # y: variavel dependente   — custo do servico corretivo (R$)
        X_geral = df[['km_manutencao']]
        y_geral = df['custo']

        # ═══════════════════════════════════════════════════════
        # PASSO 4 — TREINAMENTO DO MODELO GERAL
        # ═══════════════════════════════════════════════════════
        #
        # LinearRegression usa OLS para encontrar a reta que minimiza
        # a soma dos quadrados dos residuos.
        # Coeficientes aprendidos:
        #   b1 (coef_):      quanto o custo aumenta a cada km rodado
        #   b0 (intercept_): custo base estimado quando km = 0
        modelo_geral = LinearRegression()
        modelo_geral.fit(X_geral, y_geral)

        coef_geral  = float(modelo_geral.coef_[0])
        inter_geral = float(modelo_geral.intercept_)

        # ═══════════════════════════════════════════════════════
        # PASSO 5 — AVALIACAO E PREVISAO
        # ═══════════════════════════════════════════════════════

        resultado_geral = self._avaliar_e_prever(
            modelo_geral, X_geral, y_geral, coef_geral, inter_geral
        )

        # --- Previsoes segmentadas por tipo de veiculo ---
        # Carros e caminhoes tem padroes de desgaste muito distintos.
        # Mistura-los na mesma regressao enviesa os coeficientes e
        # produz previsoes imprecisas para ambas as categorias.
        previsoes_por_tipo = {}
        for tipo in self.TIPOS_VEICULO:
            df_tipo = df[df['tipo_veiculo'] == tipo]

            if len(df_tipo) < self.MINIMO_AMOSTRAS:
                previsoes_por_tipo[tipo] = {
                    "status": "insuficiente",
                    "amostras": len(df_tipo),
                    "mensagem": f"Menos de {self.MINIMO_AMOSTRAS} amostras para '{tipo}'."
                }
                continue

            X_t = df_tipo[['km_manutencao']]
            y_t = df_tipo['custo']

            modelo_tipo = LinearRegression()
            modelo_tipo.fit(X_t, y_t)

            coef_t  = float(modelo_tipo.coef_[0])
            inter_t = float(modelo_tipo.intercept_)

            previsoes_por_tipo[tipo] = self._avaliar_e_prever(
                modelo_tipo, X_t, y_t, coef_t, inter_t
            )
            previsoes_por_tipo[tipo]["amostras"] = len(df_tipo)

        # --- Estatisticas descritivas globais ---
        stats = {
            "custo_medio":  round(float(y_geral.mean()), 2),
            "custo_min":    round(float(y_geral.min()),  2),
            "custo_max":    round(float(y_geral.max()),  2),
            "km_medio":     round(float(X_geral['km_manutencao'].mean()), 0),
            "km_min":       round(float(X_geral['km_manutencao'].min()),  0),
            "km_max":       round(float(X_geral['km_manutencao'].max()),  0),
        }

        # Retorno compativel com o frontend existente
        return {
            "status":           "sucesso",
            "total_analisado":  len(df),

            # Previsao geral (compatibilidade com frontend anterior)
            "previsao_100k":           resultado_geral.get("previsao_100k", 0),
            "tendencia_coeficiente":   coef_geral,

            # Bloco detalhado da previsao geral
            "previsao_geral":          resultado_geral,

            # Previsoes por categoria de veiculo (nova funcionalidade)
            "previsoes_por_tipo":      previsoes_por_tipo,

            # Estatisticas da amostra
            "estatisticas":            stats,
        }

    # ------------------------------------------------------------------
    # METODO PRIVADO — avaliacao e previsao reutilizavel
    # ------------------------------------------------------------------

    def _avaliar_e_prever(self, modelo, X, y, coeficiente, intercepto):
        """
        Calcula as metricas de qualidade e as previsoes para os marcos de km.

        Recebe um modelo ja treinado e retorna um dicionario padronizado
        com metricas (R2, MAE, RMSE), equacao da reta e previsoes.

        Melhoria de performance:
            A versao anterior criava um pd.DataFrame novo a cada marco km
            dentro de um loop (3 alocacoes desnecessarias).
            Esta versao usa np.array para previsao em lote de uma so vez.

        Args:
            modelo:      Instancia de LinearRegression ja treinada.
            X:           DataFrame com coluna 'km_manutencao' (features).
            y:           Series com os custos reais (target).
            coeficiente: Valor de modelo.coef_[0] (float).
            intercepto:  Valor de modelo.intercept_ (float).

        Returns:
            dict com chaves: previsao_100k, metricas, equacao, previsoes.
        """
        # Avaliacao — predicoes sobre os dados de treino
        y_previsto = modelo.predict(X)

        r2   = r2_score(y, y_previsto)
        mae  = mean_absolute_error(y, y_previsto)
        rmse = float(np.sqrt(mean_squared_error(y, y_previsto)))

        # Classificacao qualitativa do R2 para o frontend
        if   r2 >= 0.8: qualidade = "excelente"
        elif r2 >= 0.5: qualidade = "bom"
        elif r2 >= 0.2: qualidade = "moderado"
        else:           qualidade = "fraco"

        # Previsao em lote com pd.DataFrame nomeado:
        # o modelo foi treinado com coluna 'km_manutencao'; passar np.array
        # sem nome de feature gera UserWarning do scikit-learn.
        # pd.DataFrame preserva o nome da coluna e elimina o aviso.
        X_marcos = pd.DataFrame({'km_manutencao': self.MARCOS_KM})
        custos_previstos = modelo.predict(X_marcos)

        previsoes = {}
        for km, custo in zip(self.MARCOS_KM, custos_previstos):
            chave = f"previsao_{km // 1000}k"
            previsoes[chave] = round(max(float(custo), 0), 2)

        tendencia = "crescente" if coeficiente > 0 else "decrescente"

        return {
            "previsao_100k": previsoes.get("previsao_100k", 0),
            "tendencia":     tendencia,
            "coeficiente":   round(coeficiente, 6),

            "previsoes": previsoes,

            "metricas": {
                "r2_score":  round(r2,   4),
                "mae":       round(mae,  2),
                "rmse":      round(rmse, 2),
                "qualidade": qualidade,
            },

            "equacao": {
                "intercepto_b0":  round(intercepto,  4),
                "coeficiente_b1": round(coeficiente, 6),
                "tendencia":      tendencia,
                "formula":        f"Y = {intercepto:.2f} + {coeficiente:.6f} x X",
            },
        }