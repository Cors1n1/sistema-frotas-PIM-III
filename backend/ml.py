"""
╔══════════════════════════════════════════════════════════════════════╗
║  MÓDULO DE MACHINE LEARNING — Sistema de Gestão de Frotas (PIM III) ║
Módulo de Machine Learning — Sistema de Gestão de Frotas (PIM III)

Responsabilidade: Análise preditiva de custos de manutenção
baseada em dados históricos de manutenções corretivas.

Algoritmo:  Regressão Linear (Método dos Mínimos Quadrados)
Bibliotecas: Scikit-Learn v1.x, Pandas v2.x, NumPy
Entrada:    Tabelas 'veiculos' + 'manutencoes' (via PostgreSQL)
Saída:      JSON com previsões, métricas e análise de tendência
"""

import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error


class AnalisadorFrotas:
    """
    Classe responsável pela inteligência analítica da frota.
    
    Implementa o pilar de ABSTRAÇÃO da POO: o chamador (app.py)
    não precisa conhecer a complexidade interna do ML.
    Basta chamar analisador.prever_custo_manutencao() e receber
    um dicionário pronto para o frontend.
    
    Attributes:
        conn: Conexão ativa com o PostgreSQL (via psycopg2).
        modelo: Instância treinada do LinearRegression (None até fit).
    """

    # ── Constantes do negócio ──
    MINIMO_AMOSTRAS = 3          # Mínimo de pontos para treinar o modelo
    KM_PREVISAO_PADRAO = 100000  # Marco de previsão padrão (100 mil km)
    FATOR_CO2_POR_LITRO = 2.3    # kg de CO₂ emitido por litro de gasolina

    def __init__(self, conexao_db):
        """
        Inicializa o analisador com uma conexão ativa ao banco de dados.
        
        Args:
            conexao_db: Objeto de conexão psycopg2 retornado por get_db_connection().
        """
        self.conn = conexao_db
        self.modelo = None  # Será populado após o treinamento

    def prever_custo_manutencao(self):
        """
        Pipeline completo de Machine Learning em 6 passos:
        
        1. EXTRAÇÃO:   SQL busca dados de manutenções corretivas
        2. VALIDAÇÃO:   Verifica se há dados mínimos para treinar
        3. PREPARAÇÃO:  Separa variáveis X (km) e y (custo)
        4. TREINAMENTO: Ajusta o modelo de Regressão Linear
        5. AVALIAÇÃO:   Calcula R², MAE, RMSE (métricas de qualidade)
        6. PREVISÃO:    Projeta custos para marcos de 50k, 100k e 150k km
        
        Returns:
            dict: Resultado estruturado com status, previsões e métricas.
                  Status pode ser 'sucesso' ou 'insuficiente'.
        
        Exemplo de retorno (sucesso):
            {
                "status": "sucesso",
                "previsao_100k": 3133.33,
                "tendencia_coeficiente": 0.0234,
                "r2_score": 0.87,
                "total_analisado": 5,
                ...
            }
        """

        # ═══════════════════════════════════════════════
        # PASSO 1 — EXTRAÇÃO DE DADOS (SQL → DataFrame)
        # ═══════════════════════════════════════════════
        # 
        # A query busca APENAS manutenções corretivas, pois são as que
        # representam desgaste real do veículo. Preventivas são programadas
        # e têm custo relativamente fixo, o que não ajuda na previsão.
        #
        # O JOIN é necessário porque a quilometragem está na tabela de
        # veículos, mas o custo está na tabela de manutenções.
        query = """
            SELECT v.quilometragem, m.custo 
            FROM veiculos v
            JOIN manutencoes m ON v.id = m.veiculo_id
            WHERE m.tipo = 'Corretiva'
        """
        df = pd.read_sql_query(query, self.conn)

        # Caso a amostragem seja insuficiente para uma regressão estável
        if len(df) < self.MINIMO_AMOSTRAS:
            return {
                "status": "insuficiente",
                "mensagem": (
                    f"São necessários pelo menos {self.MINIMO_AMOSTRAS} registros de "
                    f"manutenções corretivas para a IA gerar previsões. "
                    f"Atualmente existem {len(df)} registro(s)."
                )
            }

        # ═══════════════════════════════════════════════
        # PASSO 3 — PREPARAÇÃO DOS DADOS
        # ═══════════════════════════════════════════════
        #
        # X precisa ser um DataFrame 2D (formato que o Scikit-Learn exige)
        # y é uma Series 1D (o valor que queremos prever)
        X = df[['quilometragem']]  # Variável independente (features)
        y = df['custo']            # Variável dependente (target)

        # ═══════════════════════════════════════════════
        # PASSO 4 — TREINAMENTO DO MODELO
        # ═══════════════════════════════════════════════
        #
        # LinearRegression usa o Método dos Mínimos Quadrados (OLS)
        # para encontrar a reta que minimiza a soma dos quadrados
        # dos resíduos (diferença entre valor real e previsto).
        self.modelo = LinearRegression()
        self.modelo.fit(X, y)

        # Coeficientes aprendidos pelo modelo:
        # β₁ (coef_): quanto o custo AUMENTA a cada km rodado
        # β₀ (intercept_): custo base quando km = 0
        coeficiente = float(self.modelo.coef_[0])
        intercepto = float(self.modelo.intercept_)

        # ═══════════════════════════════════════════════
        # PASSO 5 — AVALIAÇÃO DO MODELO (Métricas)
        # ═══════════════════════════════════════════════
        #
        # R² (Coeficiente de Determinação):
        #   - Varia de 0 a 1 (1 = modelo perfeito)
        #   - Indica quanto da variação do custo é explicada pela km
        #
        # MAE (Mean Absolute Error):
        #   - Erro médio absoluto em Reais
        #   - Interpretação direta: "o modelo erra em média R$ X"
        #
        # RMSE (Root Mean Squared Error):
        #   - Penaliza mais erros grandes
        #   - Útil para detectar outliers
        y_previsto = self.modelo.predict(X)

        r2 = r2_score(y, y_previsto)
        mae = mean_absolute_error(y, y_previsto)
        rmse = np.sqrt(mean_squared_error(y, y_previsto))

        # Classificação da qualidade do modelo
        if r2 >= 0.8:
            qualidade = "excelente"
        elif r2 >= 0.5:
            qualidade = "bom"
        elif r2 >= 0.2:
            qualidade = "moderado"
        else:
            qualidade = "fraco"

        # ═══════════════════════════════════════════════
        # PASSO 6 — PREVISÕES PARA MARCOS ESTRATÉGICOS
        # ═══════════════════════════════════════════════
        #
        # Projeta o custo estimado de manutenção corretiva para
        # três marcos quilométricos estratégicos:
        marcos_km = [50000, 100000, 150000]
        previsoes = {}
        for km in marcos_km:
            X_pred = pd.DataFrame({'quilometragem': [km]})
            custo = float(self.modelo.predict(X_pred)[0])
            previsoes[f"previsao_{km // 1000}k"] = round(max(custo, 0), 2)

        # Tendência: se β₁ > 0, custos crescem com km (esperado)
        tendencia = "crescente" if coeficiente > 0 else "decrescente"

        # Estatísticas descritivas da amostra
        stats = {
            "custo_medio": round(float(y.mean()), 2),
            "custo_min": round(float(y.min()), 2),
            "custo_max": round(float(y.max()), 2),
            "km_medio": round(float(X['quilometragem'].mean()), 0),
            "km_min": round(float(X['quilometragem'].min()), 0),
            "km_max": round(float(X['quilometragem'].max()), 0),
        }

        # ═══════════════════════════════════════════════
        # RETORNO ESTRUTURADO PARA O FRONTEND
        # ═══════════════════════════════════════════════
        return {
            "status": "sucesso",

            # Previsão financeira estimada para o marco de 100k km
            "previsao_100k": previsoes.get("previsao_100k", 0),
            "tendencia_coeficiente": coeficiente,
            "total_analisado": len(df),

            # Previsões para múltiplos marcos
            "previsoes": previsoes,

            # Métricas de qualidade do modelo
            "metricas": {
                "r2_score": round(r2, 4),
                "mae": round(mae, 2),
                "rmse": round(rmse, 2),
                "qualidade": qualidade,
            },

            # Coeficientes da equação Y = β₀ + β₁·X
            "equacao": {
                "intercepto_b0": round(intercepto, 4),
                "coeficiente_b1": round(coeficiente, 6),
                "tendencia": tendencia,
                "formula": f"Y = {intercepto:.2f} + {coeficiente:.6f} × X",
            },

            # Estatísticas da amostra
            "estatisticas": stats,
        }