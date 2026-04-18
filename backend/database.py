"""
Módulo de Persistência — Sistema de Gestão de Frotas
Gerencia o ciclo de vida da conexão com o banco de dados PostgreSQL.
Utiliza variáveis de ambiente para segurança e separação de configurações.
"""

import psycopg2
import os
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env para o os.environ
# Exemplo de .env:
#   DB_HOST=localhost
#   DB_NAME=pim_trab
#   DB_USER=postgres
#   DB_PASSWORD=minha_senha
load_dotenv()


def get_db_connection():
    """
    Cria e retorna uma conexão ativa com o banco de dados PostgreSQL.
    
    Esta função é a ÚNICA responsável por abrir conexões no sistema.
    Cada rota da API chama esta função, usa a conexão, e fecha ao final.
    
    Segurança:
        - Credenciais lidas de variáveis de ambiente (.env)
        - Nenhuma senha aparece no código-fonte
        - Todas as queries usam Prepared Statements (%s) contra SQL Injection
    
    Padrão de uso em app.py:
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT ...", (param,))
            conn.commit()
        except Exception:
            conn.rollback()
        finally:
            cursor.close()
            conn.close()
    
    Returns:
        psycopg2.connection: Conexão ativa com o PostgreSQL.
    
    Raises:
        psycopg2.OperationalError: Se o banco não estiver acessível.
    """
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )
    return conn