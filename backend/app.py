"""
╔══════════════════════════════════════════════════════════════════════════╗
║  CONTROLADOR PRINCIPAL (app.py) — Sistema de Gestão de Frotas (PIM III)  ║
║                                                                          ║
║  Papel no MVC: CONTROLLER                                                ║
║  - Recebe requisições HTTP do frontend (View)                            ║
║  - Aplica regras de negócio e validações                                 ║
║  - Interage com o banco de dados via Models (models.py)                  ║
║  - Retorna respostas JSON para a API REST                                ║
║                                                                          ║
║  Arquitetura REST:                                                       ║
║  - GET /api/{recurso}  → Listar todos                                    ║
║  - POST /api/{recurso} → Criar novo registro                             ║
║                                                                          ║
║  Segurança Implementada:                                                 ║
║  - Autenticação com Flask-Login (sessões server-side)                    ║
║  - Senhas armazenadas como hash bcrypt (Flask-Bcrypt)                    ║
║  - Prepared Statements (%s) contra SQL Injection                         ║
║  - Validação de CNH por tipo de veículo                                  ║
║  - Validação anti-fraude de odômetro                                     ║
║  - try/except com rollback para integridade transacional                 ║
║  - Variáveis de ambiente para credenciais (.env)                         ║
║                                                                          ║
║  APIs Externas Integradas:                                               ║
║  - OSRM (roteamento GPS via satélite)                                    ║
║  - Nominatim (geocodificação de endereços)                               ║
║  - Fallback: cálculo offline via Teorema de Pitágoras Geográfico         ║
╚══════════════════════════════════════════════════════════════════════════╝
"""

from flask import Flask, jsonify, request, render_template, redirect, url_for, flash
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_bcrypt import Bcrypt
from database import get_db_connection
from models import Veiculo, Manutencao, Motorista, Abastecimento, CarroPasseio, Caminhao, Usuario
from ml import AnalisadorFrotas
import os
import urllib.request
import json
import math
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature


# ═══════════════════════════════════════════════════════════════
# CONFIGURAÇÃO DO FLASK
# ═══════════════════════════════════════════════════════════════
#
# template_folder: onde o Jinja2 procura os .html
# static_folder:   onde o Flask serve CSS/JS/imagens
# static_url_path: URL base para os estáticos ('' = raiz)
# secret_key:      obrigatória para sessions e Flask-Login (lida do .env)
pasta_frontend = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))
app = Flask(__name__, template_folder=pasta_frontend, static_folder=pasta_frontend, static_url_path='')
app.secret_key = os.getenv('SECRET_KEY', 'dev-fallback-key-change-in-production')
CORS(app)

# ─── Flask-Bcrypt (hash de senhas) ───
bcrypt = Bcrypt(app)

# ─── Flask-Login ───
login_manager = LoginManager(app)
login_manager.login_view = 'pagina_login'          # Rota de redirecionamento quando não autenticado
login_manager.login_message = 'Faça login para acessar o sistema.'
login_manager.login_message_category = 'info'


@login_manager.user_loader
def carregar_usuario(user_id):
    """
    Callback obrigatório do Flask-Login.
    Chamado a cada requisição para recarregar o usuário da sessão.
    Busca o usuário pelo ID armazenado no cookie de sessão.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, nome, username, senha_hash, role, email FROM usuarios WHERE id = %s",
        (int(user_id),)
    )
    linha = cursor.fetchone()
    cursor.close()
    conn.close()
    if linha:
        return Usuario(*linha)
    return None


@login_manager.unauthorized_handler
def acesso_nao_autorizado():
    """
    Redireciona para login quando a rota exige autenticação.
    Requisições de API (Accept: application/json) recebem 401 em vez de redirect.
    """
    if request.is_json or 'application/json' in request.headers.get('Accept', ''):
        return jsonify({"erro": "Autenticação necessária."}), 401
    return redirect(url_for('pagina_login'))

# ==========================================
# ROTAS DE AUTENTICAÇÃO
# ==========================================

@app.route('/login', methods=['GET', 'POST'])
def pagina_login():
    """
    GET  /login  → Exibe o formulário de login.
    POST /login  → Valida credenciais e cria sessão autenticada.

    Fluxo de autenticação:
    1. Busca usuário pelo username no banco de dados.
    2. Compara a senha digitada com o hash bcrypt armazenado.
    3. Se válido, chama login_user() que gera o cookie de sessão.
    4. Redireciona para o destino original (next) ou para a raiz.
    """
    # Se já autenticado, redireciona direto para o sistema
    if current_user.is_authenticated:
        return redirect(url_for('index'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        senha    = request.form.get('senha', '')

        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, nome, username, senha_hash, role, email FROM usuarios WHERE username = %s OR email = %s",
                (username, username)
            )
            linha = cursor.fetchone()
            cursor.close()
            conn.close()

            if linha:
                usuario = Usuario(*linha)
                # bcrypt.check_password_hash é resistente a timing attacks
                if bcrypt.check_password_hash(usuario.senha_hash, senha):
                    login_user(usuario, remember=True)
                    destino = request.args.get('next') or url_for('index')
                    return redirect(destino)

            # Credenciais inválidas — não revela se username ou senha estão errados
            flash('Usuário ou senha inválidos.', 'error')

        except Exception as e:
            # Captura exceções (ex: banco offline, tabela inexistente)
            # para não dar erro 500 e mostrar a causa do problema
            flash(f'Erro interno no servidor: {str(e)}', 'error')
            print(f"Erro no login (VPS): {str(e)}")

    return render_template('login.html')


@app.route('/logout')
@login_required
def logout():
    """Encerra a sessão do usuário e redireciona para o login."""
    logout_user()
    return redirect(url_for('pagina_login'))


# ==========================================
# ROTAS DE RECUPERAÇÃO DE SENHA
# ==========================================

def get_serializer():
    return URLSafeTimedSerializer(app.secret_key)

def send_reset_email(to_email, reset_link):
    smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    smtp_user = os.getenv('SMTP_USER', '')
    smtp_password = os.getenv('SMTP_PASSWORD', '')

    msg = MIMEMultipart('alternative')
    msg['From'] = smtp_user
    msg['To'] = to_email
    msg['Subject'] = 'Redefinição de Senha - UniLog'

    body_plain = f"""
    Olá,

    Você solicitou a redefinição de sua senha. Copie e cole o link abaixo no seu navegador para criar uma nova senha:
    {reset_link}
    
    Este link é válido por 30 minutos. Se você não solicitou, pode ignorar este e-mail.

    Atenciosamente,
    Equipe UniLog
    """
    
    body_html = f"""
    <html>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; padding: 40px 0; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);">

          <!-- HEADER COM LOGO -->
          <div style="background-color: #000000; padding: 30px 20px; text-align: center; border-bottom: 4px solid #facc15;">
            <img
              src="https://frotas.corsini.inf.br/imagens/logo.jpg"
              alt="UniLog Solucoes Logisticas"
              style="display: block; margin: 0 auto; max-width: 100%; height: auto; width: 180px; border: 0;"
            />
          </div>

          <!-- CORPO DO EMAIL -->
          <div style="padding: 40px 40px 30px; color: #334155; background-color: #ffffff;">
            <h2 style="margin-top: 0; font-size: 22px; color: #1e3a8a; text-align: center; letter-spacing: 0.5px;">
              Redefini&ccedil;&atilde;o de Senha
            </h2>
            <p style="font-size: 16px; line-height: 1.6; margin-top: 25px; margin-bottom: 20px; color: #334155;">
              Ol&aacute;,
            </p>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 35px; color: #475569;">
              Recebemos uma solicita&ccedil;&atilde;o para redefinir a senha da sua conta na <strong style="color: #2563eb;">UniLog</strong>.
              Se foi voc&ecirc; quem fez este pedido, clique no bot&atilde;o abaixo para criar uma nova senha de acesso:
            </p>
            
            <div style="text-align: center; margin-bottom: 40px;">
              <a href="{reset_link}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">
                Redefinir Minha Senha
              </a>
            </div>
            
            <p style="font-size: 14px; color: #64748b; line-height: 1.6; border-top: 1px solid #e2e8f0; padding-top: 25px; text-align: center;">
              <strong style="color: #d97706;">Aten&ccedil;&atilde;o:</strong> Por seguran&ccedil;a, este link expira em <strong>30 minutos</strong>.<br><br>
              Se voc&ecirc; n&atilde;o fez essa solicita&ccedil;&atilde;o, pode ignorar este e-mail tranquilamente.
              Sua senha permanecer&aacute; a mesma.
            </p>
          </div>

          <!-- RODAPE -->
          <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 13px; color: #64748b; letter-spacing: 0.5px;">
              <strong style="color: #2563eb;">UniLog</strong> Solu&ccedil;&otilde;es Log&iacute;sticas &bull; PIM III
            </p>
            <p style="margin: 8px 0 0 0; font-size: 11px; color: #94a3b8;">
              UNIP &mdash; An&aacute;lise e Desenvolvimento de Sistemas
            </p>
          </div>

        </div>
      </body>
    </html>
    """

    msg.attach(MIMEText(body_plain, 'plain'))
    msg.attach(MIMEText(body_html, 'html'))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Erro SMTP: {e}")
        return False

@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    dados = request.get_json()
    email = dados.get('email', '').strip()
    
    if not email:
        return jsonify({"erro": "E-mail obrigatório."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username FROM usuarios WHERE email = %s", (email,))
    linha = cursor.fetchone()
    cursor.close()
    conn.close()

    if not linha:
        return jsonify({"mensagem": "Se este e-mail estiver cadastrado, um link foi enviado."}), 200

    s = get_serializer()
    token = s.dumps(linha[0], salt='recover-password')
    reset_link = f"{request.host_url}login?token={token}"
    print(f"Link: {reset_link}")
    
    sucesso = send_reset_email(email, reset_link)
    if sucesso:
        return jsonify({"mensagem": "E-mail de recuperação enviado."}), 200
    return jsonify({"erro": "Erro ao enviar e-mail. Verifique o .env."}), 500

@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    dados = request.get_json()
    token = dados.get('token', '')
    nova_senha = dados.get('senha', '')

    if not token or not nova_senha:
        return jsonify({"erro": "Dados incompletos."}), 400

    if len(nova_senha) < 6:
        return jsonify({"erro": "Mínimo de 6 caracteres."}), 400

    s = get_serializer()
    try:
        user_id = s.loads(token, salt='recover-password', max_age=1800)
    except SignatureExpired:
        return jsonify({"erro": "Link expirado."}), 400
    except BadSignature:
        return jsonify({"erro": "Link inválido."}), 400

    senha_hash = bcrypt.generate_password_hash(nova_senha).decode('utf-8')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE usuarios SET senha_hash = %s WHERE id = %s", (senha_hash, user_id))
        conn.commit()
        return jsonify({"mensagem": "Senha atualizada! Faça o login."}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"erro": "Erro banco de dados."}), 500
    finally:
        cursor.close()
        conn.close()


# ==========================================
# ROTAS DO FRONTEND (protegidas por login)
# ==========================================

@app.route('/')
@login_required
def index():
    return render_template('index.html')

@app.route('/manutencoes.html')
@login_required
def manutencoes_page():
    return render_template('manutencoes.html')

@app.route('/dashboard.html')
@login_required
def dashboard_page():
    return render_template('dashboard.html')

@app.route('/analise.html')
@login_required
def analise_page():
    return render_template('analise.html')

@app.route('/motoristas.html')
@login_required
def motoristas_page():
    return render_template('motoristas.html')

@app.route('/abastecimentos.html')
@login_required
def abastecimentos_page():
    return render_template('abastecimentos.html')

@app.route('/usuarios.html')
@login_required
def usuarios_page():
    """Painel de gerenciamento de usuários — acessível apenas por admins."""
    if not current_user.is_admin():
        flash('Acesso restrito a administradores.', 'error')
        return redirect(url_for('index'))
    return render_template('usuarios.html')


# ==========================================
# ROTAS DA API (Backend)
# ==========================================

@app.route('/api/veiculos', methods=['GET', 'POST'])
@login_required
def gerenciar_veiculos():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # No ficheiro backend/app.py, dentro de gerenciar_veiculos():

    if request.method == 'GET':
        cursor.execute("SELECT id, placa, modelo, marca, ano, quilometragem, tipo_veiculo, eixos FROM veiculos ORDER BY id ASC;")
        linhas = cursor.fetchall()
        
        lista_veiculos = []
        for linha in linhas:
            # linha[0]=id, [1]=placa, [2]=modelo, [3]=marca, [4]=ano, [5]=km, [6]=tipo, [7]=eixos
            
            if linha[6] == 'Caminhão':
                # e pegando o índice 7 para os eixos.
                veiculo_obj = Caminhao(linha[0], linha[1], linha[2], linha[3], linha[4], linha[5], linha[7])
                lista_veiculos.append(veiculo_obj.to_dict())
            else:
                veiculo_obj = CarroPasseio(linha[0], linha[1], linha[2], linha[3], linha[4], linha[5])
                lista_veiculos.append(veiculo_obj.to_dict())
        
        cursor.close()
        conn.close()
        return jsonify(lista_veiculos)
    
    elif request.method == 'POST':
        dados = request.get_json()
        try:
            cursor.execute(
                "INSERT INTO veiculos (placa, modelo, marca, ano, quilometragem, tipo_veiculo, eixos) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (dados['placa'], dados['modelo'], dados['marca'], int(dados['ano']), int(dados['quilometragem']), dados['tipo'], int(dados.get('eixos', 0)))
            )
            conn.commit()
            return jsonify({"mensagem": "Veículo adicionado"}), 201
        except Exception as e:
            conn.rollback()
            return jsonify({"erro": str(e)}), 400
        finally:
            cursor.close()
            conn.close()


@app.route('/api/manutencoes', methods=['GET', 'POST'])
@login_required
def gerenciar_manutencoes():
    conn = get_db_connection()
    cursor = conn.cursor()
    if request.method == 'GET':
        cursor.execute("SELECT id, veiculo_id, data_manutencao, tipo, custo, descricao, quilometragem FROM manutencoes;")
        linhas = cursor.fetchall()
        lista = [Manutencao(*linha).to_dict() for linha in linhas]
        cursor.close()
        conn.close()
        return jsonify(lista)
    elif request.method == 'POST':
        dados = request.get_json()
        try:
            veiculo_id = int(dados['veiculo_id'])
            nova_quilometragem = int(dados['quilometragem'])

            cursor.execute("SELECT quilometragem FROM veiculos WHERE id = %s", (veiculo_id,))
            v_info = cursor.fetchone()
            
            if not v_info:
                return jsonify({"erro": "Veículo não encontrado."}), 404

            km_atual_v = v_info[0]
            if nova_quilometragem < km_atual_v:
                return jsonify({"erro": f"Odômetro inválido! O valor não pode ser menor que o atual ({km_atual_v} km)."}), 400

            cursor.execute(
                "INSERT INTO manutencoes (veiculo_id, data_manutencao, tipo, custo, descricao, quilometragem) VALUES (%s, %s, %s, %s, %s, %s)",
                (veiculo_id, dados['data_manutencao'], dados['tipo'], dados['custo'], dados['descricao'], nova_quilometragem)
            )
            cursor.execute("UPDATE veiculos SET quilometragem = %s WHERE id = %s", (nova_quilometragem, veiculo_id))
            conn.commit()
            return jsonify({"mensagem": "Sucesso"}), 201
        except Exception as e:
            conn.rollback()
            return jsonify({"erro": str(e)}), 400
        finally:
            cursor.close()
            conn.close()

@app.route('/api/dashboard/previsao', methods=['GET'])
@login_required
def obter_previsao():
    conn = get_db_connection()
    try:
        analisador = AnalisadorFrotas(conn)
        resultado = analisador.prever_custo_manutencao()
        return jsonify(resultado)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/motoristas', methods=['GET', 'POST'])
@login_required
def gerenciar_motoristas():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if request.method == 'GET':
        # Garantir a ordem: id, nome, cnh, categoria_cnh
        cursor.execute("SELECT id, nome, cnh, categoria_cnh FROM motoristas ORDER BY id ASC;")
        linhas = cursor.fetchall()
        lista_motoristas = [Motorista(*linha).to_dict() for linha in linhas]
        cursor.close()
        conn.close()
        return jsonify(lista_motoristas)
        
    elif request.method == 'POST':
        dados = request.get_json()
        try:
            cursor.execute(
                "INSERT INTO motoristas (nome, cnh, categoria_cnh) VALUES (%s, %s, %s)",
                (dados['nome'], dados['cnh'], dados['categoria_cnh'])
            )
            conn.commit()
            return jsonify({"mensagem": "Motorista adicionado com sucesso"}), 201
        except Exception as e:
            conn.rollback()
            return jsonify({"erro": str(e)}), 400
        finally:
            cursor.close()
            conn.close()

    # Rota para registro de novos abastecimentos com atualização de odômetro

@app.route('/api/abastecimentos', methods=['GET', 'POST'])
@login_required
def gerenciar_abastecimentos():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if request.method == 'GET':
        cursor.execute("SELECT id, veiculo_id, motorista_id, data_abastecimento, litros, valor_total, tipo_combustivel, odometro FROM abastecimentos;")
        linhas = cursor.fetchall()
        lista_abastecimentos = [Abastecimento(*linha).to_dict() for linha in linhas]
        cursor.close()
        conn.close()
        return jsonify(lista_abastecimentos)
        
    # No ficheiro backend/app.py, dentro da rota POST de abastecimentos:

    elif request.method == 'POST':
        dados = request.get_json()
        try:
            veiculo_id = int(dados['veiculo_id'])
            motorista_id = int(dados['motorista_id'])
            novo_odometro = int(dados['odometro'])

            # 1. BUSCA DADOS DO VEÍCULO E DO MOTORISTA
            cursor.execute("SELECT tipo_veiculo, quilometragem FROM veiculos WHERE id = %s", (veiculo_id,))
            v_info = cursor.fetchone()
            
            cursor.execute("SELECT categoria_cnh FROM motoristas WHERE id = %s", (motorista_id,))
            m_info = cursor.fetchone()

            if not v_info or not m_info:
                return jsonify({"erro": "Veículo ou Motorista não encontrado."}), 404

            tipo_v = v_info[0]
            km_atual_v = v_info[1]
            cat_cnh = m_info[0]

            # 2. VALIDAÇÃO DE CATEGORIA DE CNH (REGRA DE NEGÓCIO)
            autorizado = False
            if tipo_v == 'Carro':
                # Exige que o motorista tenha a categoria 'B' marcada
                if 'B' in cat_cnh:
                    autorizado = True
            elif tipo_v == 'Caminhão':
                # Para caminhão, aceita C, D ou E
                if any(x in cat_cnh for x in ['C', 'D', 'E']):
                    autorizado = True
            
            if not autorizado:
                return jsonify({
                    "erro": f"Bloqueio de Segurança: O motorista não possui a categoria específica para {tipo_v}. (CNH atual: {cat_cnh})"
                }), 403

            # 3. VALIDAÇÃO DE ODÔMETRO (JÁ EXISTENTE)
            if novo_odometro <= km_atual_v:
                return jsonify({"erro": f"Odômetro inválido! O valor deve ser maior que o atual ({km_atual_v} km)."}), 400

            # 4. INSERE O ABASTECIMENTO SE TUDO ESTIVER OK
            cursor.execute(
                "INSERT INTO abastecimentos (veiculo_id, motorista_id, data_abastecimento, litros, valor_total, tipo_combustivel, odometro) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (veiculo_id, motorista_id, dados['data_abastecimento'], float(dados['litros']), float(dados['valor_total']), dados['tipo_combustivel'], novo_odometro)
            )
            cursor.execute("UPDATE veiculos SET quilometragem = %s WHERE id = %s", (novo_odometro, veiculo_id))
            
            conn.commit()
            return jsonify({"mensagem": "Abastecimento autorizado e registrado!"}), 201
            
        except Exception as e:
            conn.rollback()
            return jsonify({"erro": str(e)}), 400
        finally:
            cursor.close()
            conn.close()

@app.route('/api/dashboard/alertas', methods=['GET'])
@login_required
def obter_alertas_revisao():
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
        SELECT v.id, v.placa, v.modelo, v.marca, v.quilometragem,
        (SELECT MAX(m.quilometragem) FROM manutencoes m WHERE m.veiculo_id = v.id AND m.tipo = 'Preventiva') as ultima_preventiva
        FROM veiculos v;
    """
    cursor.execute(query)
    linhas = cursor.fetchall()
    cursor.close()
    conn.close()

    alertas = []
    for linha in linhas:
        id_veiculo, placa, modelo, marca, km_atual, ultima_preventiva = linha
        ultima_revisao = ultima_preventiva if ultima_preventiva else 0
        
        # Se a diferença entre o km atual e a última revisão for 10.000 ou mais
        if (km_atual - ultima_revisao) >= 10000:
            alertas.append({
                "veiculo_id": id_veiculo,
                "veiculo": f"{marca} {modelo} ({placa})",
                "mensagem": f"Revisão vencida! Última: {ultima_revisao} km. Atual: {km_atual} km.",
                "status": "urgente",
                "km_atual": km_atual  
            })
    return jsonify(alertas)

@app.route('/api/dashboard/consumo', methods=['GET'])
@login_required
def obter_relatorio_consumo():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Junção externa para garantir que todos os veículos sejam contabilizados no resumo
    query = """
        SELECT v.placa, v.modelo, 
               SUM(a.litros) as total_litros, 
               SUM(a.valor_total) as total_gasto,
               (MAX(a.odometro) - MIN(a.odometro)) as km_rodados,
               SUM(a.litros * 2.3) as total_co2
        FROM veiculos v
        LEFT JOIN abastecimentos a ON v.id = a.veiculo_id
        GROUP BY v.id, v.placa, v.modelo
    """
    cursor.execute(query)
    linhas = cursor.fetchall()
    cursor.close()
    conn.close()

    consumo_lista = []
    for linha in linhas:
        placa, modelo, litros, gasto, km_rodados, co2 = linha
        
        if litros and litros > 0 and km_rodados and km_rodados > 0:
            km_por_litro = round(km_rodados / litros, 2)
            custo_por_km = round(float(gasto) / km_rodados, 2)
            
            consumo_lista.append({
                "veiculo": f"{modelo} ({placa})",
                "eficiencia": f"{km_por_litro} Km/L",
                "custo_km": f"R$ {custo_por_km:.2f}",
                "co2_total": f"{round(co2, 2)} kg",
                "total_gasto": f"R$ {float(gasto):.2f}"
            })
        else:
            consumo_lista.append({
                "veiculo": f"{modelo} ({placa})",
                "eficiencia": "Aguardando dados...",
                "custo_km": "---",
                "co2_total": f"{round(co2, 2)} kg" if co2 else "0 kg",
                "total_gasto": f"R$ {float(gasto):.2f}" if gasto else "R$ 0.00"
            })

    return jsonify(consumo_lista)

# Adicione esta rota no backend/app.py

@app.route('/api/dashboard/ranking', methods=['GET'])
@login_required
def obter_ranking_motoristas():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Agrupa por motorista, calcula o preço médio pago pelo litro e a pegada de CO2
    query = """
        SELECT m.nome,
               SUM(a.valor_total) / SUM(a.litros) as preco_medio_litro,
               SUM(a.litros * 2.3) as pegada_co2,
               SUM(a.valor_total) as gasto_total
        FROM motoristas m
        JOIN abastecimentos a ON m.id = a.motorista_id
        GROUP BY m.id, m.nome
        HAVING SUM(a.litros) > 0
        ORDER BY preco_medio_litro ASC
        LIMIT 5;
    """
    cursor.execute(query)
    linhas = cursor.fetchall()
    cursor.close()
    conn.close()

    ranking = []
    for index, linha in enumerate(linhas):
        nome, preco_medio, co2, gasto = linha
        
        # Atribuição de medalhas para o Top 3
        medalha = "🏅"
        if index == 0: medalha = "🥇"
        elif index == 1: medalha = "🥈"
        elif index == 2: medalha = "🥉"

        ranking.append({
            "posicao": medalha,
            "nome": nome,
            "preco_medio": f"R$ {float(preco_medio):.2f}/L",
            "co2": f"{float(co2):.1f} kg",
            "gasto": f"R$ {float(gasto):.2f}"
        })
    return jsonify(ranking)

@app.route('/api/dashboard/simular_viagem', methods=['POST'])
@login_required
def simular_viagem():
    dados = request.get_json()
    origem = dados.get('origem')   # dict com lat, lng
    destino = dados.get('destino') # dict com lat, lng

    if not origem or not destino:
        return jsonify({"erro": "Origem ou destino ausente"}), 400

    distancia_km = 0
    horas = 0
    minutos = 0
    coordenadas_rota = []
    modo_contingencia = False

    # 1. PYTHON CONSULTA O SATÉLITE (Servidor-a-Servidor, sem bloqueios de navegador)
    url_osrm = f"http://router.project-osrm.org/route/v1/driving/{origem['lng']},{origem['lat']};{destino['lng']},{destino['lat']}?overview=full&geometries=geojson"
    
    try:
        # Finge ser um sistema robusto para o servidor OSRM não rejeitar
        req = urllib.request.Request(url_osrm, headers={'User-Agent': 'GestaoFrotasPIM/1.0'})
        with urllib.request.urlopen(req, timeout=5) as resposta:
            osrm_data = json.loads(resposta.read().decode())
            
        if osrm_data.get('code') == 'Ok':
            rota = osrm_data['routes'][0]
            distancia_km = rota['distance'] / 1000
            
            # Formata o Tempo
            tempo_segundos = rota['duration']
            horas = int(tempo_segundos // 3600)
            minutos = int((tempo_segundos % 3600) // 60)
            
            # OSRM retorna [lng, lat], o mapa do frontend precisa de [lat, lng]
            coordenadas_rota = [[p[1], p[0]] for p in rota['geometry']['coordinates']]
        else:
            raise Exception("API OSRM falhou")
            
    except Exception as e:
        # 1.1 SE A INTERNET CAIR: Fallback Matemático Nativo do Python
        modo_contingencia = True
  
        # Cálculo simples da distância entre dois pontos (Teorema de Pitágoras geográfico com acréscimo de 20%)
        dist_x = (destino['lng'] - origem['lng']) * 111.32 * math.cos(math.radians(origem['lat']))
        dist_y = (destino['lat'] - origem['lat']) * 111.32
        distancia_km = (math.sqrt(dist_x**2 + dist_y**2)) * 1.2
        
        tempo_horas_dec = distancia_km / 70.0 # Média 70km/h
        horas = int(tempo_horas_dec)
        minutos = int((tempo_horas_dec - horas) * 60)
        coordenadas_rota = [[origem['lat'], origem['lng']], [destino['lat'], destino['lng']]]

    # 2. PYTHON CONSULTA O BANCO DE DADOS (Consumo Real da Frota)
    # ─────────────────────────────────────────────────────────────
    # Cálculo da média de consumo utilizando a variação do odômetro entre abastecimentos sucessivos.
    # Esta abordagem elimina distorções causadas pelo odômetro absoluto total.
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
        WITH abastecimentos_ordenados AS (
            SELECT 
                veiculo_id,
                litros,
                valor_total,
                odometro,
                LAG(odometro) OVER (PARTITION BY veiculo_id ORDER BY data_abastecimento, id) as odometro_anterior
            FROM abastecimentos
        )
        SELECT 
            COALESCE(SUM(valor_total) / NULLIF(SUM(litros), 0), 5.80) as preco_medio,
            COALESCE(
                SUM(odometro - odometro_anterior) / NULLIF(SUM(CASE WHEN odometro_anterior IS NOT NULL THEN litros END), 0),
                10.0
            ) as media_km_litro
        FROM abastecimentos_ordenados
        WHERE odometro_anterior IS NOT NULL 
          AND odometro > odometro_anterior
    """
    cursor.execute(query)
    resultado = cursor.fetchone()
    cursor.close()
    conn.close()

    preco_medio = float(resultado[0]) if resultado and resultado[0] else 5.80
    media_km_l = float(resultado[1]) if resultado and resultado[1] and float(resultado[1]) > 0 else 10.0

    # Validação de sanidade: consumo urbano BR fica entre 5 e 18 km/L
    if media_km_l > 18: media_km_l = 10.0
    if media_km_l < 3: media_km_l = 10.0

    # 3. CÁLCULOS LOGÍSTICOS FINAIS
    litros = distancia_km / media_km_l
    custo = litros * preco_medio
    co2 = litros * 2.3

    return jsonify({
        "status": "contingencia" if modo_contingencia else "sucesso",
        "distancia_km": round(distancia_km, 1),
        "tempo": f"{horas}h {minutos}m",
        "litros": round(litros, 1),
        "custo": round(custo, 2),
        "co2": round(co2, 1),
        "media_km_l": round(media_km_l, 1),
        "preco_litro": round(preco_medio, 2),
        "rota_gps": coordenadas_rota
    })

# ==========================================
# API DE USUÁRIOS (somente admin)
# ==========================================

@app.route('/api/usuarios', methods=['GET'])
@login_required
def listar_usuarios():
    """Retorna todos os usuários. Requer admin."""
    if not current_user.is_admin():
        return jsonify({"erro": "Acesso negado."}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome, username, senha_hash, role, email FROM usuarios ORDER BY id ASC")
    linhas = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify([Usuario(*l).to_dict() for l in linhas])


@app.route('/api/usuarios', methods=['POST'])
@login_required
def criar_usuario():
    """
    POST /api/usuarios → Cria um novo usuário com senha hashed.
    Acessível apenas por administradores.

    Corpo JSON esperado:
        nome (str)     : Nome de exibição
        username (str) : Login único
        senha (str)    : Senha em texto puro (será hasheada aqui)
        role (str)     : 'admin' ou 'operador'
    """
    if not current_user.is_admin():
        return jsonify({"erro": "Acesso negado."}), 403

    dados = request.get_json()
    nome     = dados.get('nome', '').strip()
    username = dados.get('username', '').strip()
    email    = dados.get('email', '').strip()
    senha    = dados.get('senha', '')
    role     = dados.get('role', 'operador')

    if not nome or not username or not senha:
        return jsonify({"erro": "Nome, username e senha são obrigatórios."}), 400

    if role not in ('admin', 'operador'):
        return jsonify({"erro": "Role inválido. Use 'admin' ou 'operador'."}), 400

    # Gera o hash bcrypt — custo padrão 12 rounds
    senha_hash = bcrypt.generate_password_hash(senha).decode('utf-8')

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO usuarios (nome, username, email, senha_hash, role) VALUES (%s, %s, %s, %s, %s)",
            (nome, username, email if email else None, senha_hash, role)
        )
        conn.commit()
        return jsonify({"mensagem": f"Usuário '{username}' criado com sucesso!"}), 201
    except Exception as e:
        conn.rollback()
        # psycopg2 retorna IntegrityError quando o username já existe (UNIQUE)
        if 'unique' in str(e).lower() or 'duplicado' in str(e).lower():
            return jsonify({"erro": f"Username '{username}' já está em uso."}), 409
        return jsonify({"erro": str(e)}), 400
    finally:
        cursor.close()
        conn.close()


@app.route('/api/usuarios/<int:usuario_id>', methods=['DELETE'])
@login_required
def excluir_usuario(usuario_id):
    """
    DELETE /api/usuarios/<id> → Remove um usuário.
    - Apenas admins podem excluir usuários.
    - Um admin não pode excluir a si mesmo.
    """
    if not current_user.is_admin():
        return jsonify({"erro": "Acesso negado."}), 403

    if usuario_id == current_user.id:
        return jsonify({"erro": "Você não pode excluir sua própria conta."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM usuarios WHERE id = %s RETURNING id", (usuario_id,))
        deletado = cursor.fetchone()
        if not deletado:
            return jsonify({"erro": "Usuário não encontrado."}), 404
        conn.commit()
        return jsonify({"mensagem": "Usuário excluído com sucesso."}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"erro": str(e)}), 400
    finally:
        cursor.close()
        conn.close()


@app.route('/api/me', methods=['GET'])
@login_required
def obter_usuario_atual():
    """Retorna os dados do usuário logado (usado pelo frontend)."""
    return jsonify(current_user.to_dict())


if __name__ == '__main__':
    app.run(debug=True, port=5000)