"""
╔══════════════════════════════════════════════════════════════╗
║  CRIAR PRIMEIRO ADMINISTRADOR — Sistema de Gestão de Frotas  ║
║                                                              ║
║  Execute este script UMA VEZ para criar o usuário admin      ║
║  inicial que dará acesso ao painel de usuários.              ║
║                                                              ║
║  Uso:                                                        ║
║    cd backend                                                ║
║    python criar_admin.py                                     ║
╚══════════════════════════════════════════════════════════════╝
"""

import sys
import getpass
import bcrypt
from database import get_db_connection


def criar_admin():
    print("\n🚀 Criação do Primeiro Administrador — TransLog Soluções")
    print("=" * 54)
    print("Preencha os dados do usuário administrador inicial.\n")

    nome = input("Nome completo: ").strip()
    if not nome:
        print("❌ Nome não pode ser vazio.")
        sys.exit(1)

    username = input("Username (login): ").strip().lower()
    if not username:
        print("❌ Username não pode ser vazio.")
        sys.exit(1)

    senha = getpass.getpass("Senha (oculta): ")
    if len(senha) < 6:
        print("❌ A senha deve ter pelo menos 6 caracteres.")
        sys.exit(1)

    senha_confirmada = getpass.getpass("Confirmar senha: ")
    if senha != senha_confirmada:
        print("❌ As senhas não coincidem.")
        sys.exit(1)

    # Gera o hash bcrypt (custo 12 rounds — seguro e performático)
    senha_hash = bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Verifica se a tabela existe
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'usuarios'
            )
        """)
        tabela_existe = cursor.fetchone()[0]

        if not tabela_existe:
            print("\n❌ A tabela 'usuarios' não existe no banco de dados.")
            print("   Execute primeiro o script SQL:")
            print("   psql -d pim_trab -f criar_tabela_usuarios.sql")
            sys.exit(1)

        cursor.execute(
            "INSERT INTO usuarios (nome, username, senha_hash, role) VALUES (%s, %s, %s, 'admin')",
            (nome, username, senha_hash)
        )
        conn.commit()

        print(f"\n✅ Administrador criado com sucesso!")
        print(f"   Nome    : {nome}")
        print(f"   Username: {username}")
        print(f"   Role    : admin")
        print(f"\n   Acesse: http://localhost:5000/login\n")

    except Exception as e:
        conn.rollback()
        if 'unique' in str(e).lower():
            print(f"\n❌ O username '{username}' já está em uso. Escolha outro.")
        else:
            print(f"\n❌ Erro ao criar administrador: {e}")
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()


if __name__ == '__main__':
    criar_admin()
