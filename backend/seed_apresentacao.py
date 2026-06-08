"""
Seed para Apresentacao - Sistema de Gestao de Frotas (PIM III)

Gera banco rico e realista:
  - 15 veiculos (8 carros + 7 caminhoes)
  - 10 motoristas com CNH variada
  - 3 usuarios prontos para login
  - Historico 12 meses de abastecimentos (~120 registros)
  - Manutencoes realistas para a IA (~150 registros)

Execute: python seed_apresentacao.py
"""

import psycopg2
import os
from dotenv import load_dotenv
from datetime import date, timedelta
from flask_bcrypt import Bcrypt
from flask import Flask
import random

# Bootstrap minimo para gerar hashes de senha
app = Flask(__name__)
bcrypt = Bcrypt(app)

load_dotenv()

conn = psycopg2.connect(
    host=os.getenv("DB_HOST", "localhost"),
    database=os.getenv("DB_NAME", "pim_trab"),
    user=os.getenv("DB_USER", "postgres"),
    password=os.getenv("DB_PASSWORD", "12345678"),
    port=os.getenv("DB_PORT", "5432"),
)
cursor = conn.cursor()

HOJE = date.today()

print("=" * 68)
print("  SEED APRESENTACAO - Sistema de Gestao de Frotas (PIM III)")
print("=" * 68)

# ─── LIMPEZA COMPLETA ──────────────────────────────────────────────────────
print("\n[0/5] Limpando banco de dados...")
cursor.execute("DELETE FROM abastecimentos;")
cursor.execute("DELETE FROM manutencoes;")
cursor.execute("DELETE FROM veiculos;")
cursor.execute("DELETE FROM motoristas;")
cursor.execute("DELETE FROM usuarios;")
cursor.execute("ALTER SEQUENCE veiculos_id_seq RESTART WITH 1;")
cursor.execute("ALTER SEQUENCE motoristas_id_seq RESTART WITH 1;")
cursor.execute("ALTER SEQUENCE usuarios_id_seq RESTART WITH 1;")
cursor.execute("ALTER SEQUENCE abastecimentos_id_seq RESTART WITH 1;")
cursor.execute("ALTER SEQUENCE manutencoes_id_seq RESTART WITH 1;")
conn.commit()
print("  [OK] Banco limpo e sequencias resetadas.")

# ─── 1. USUARIOS ──────────────────────────────────────────────────────────
print("\n[1/5] Criando usuarios...")

usuarios = [
    ("Victor Corsini",         "corsini",     "Pulga@2013", "admin",    "victorcorsini2@gmail.com"),

]

for nome, username, senha, role, email in usuarios:
    senha_hash = bcrypt.generate_password_hash(senha).decode("utf-8")
    cursor.execute(
        "INSERT INTO usuarios (nome, username, senha_hash, role, email) VALUES (%s,%s,%s,%s,%s)",
        (nome, username, senha_hash, role, email),
    )

conn.commit()
print(f"  [OK] {len(usuarios)} usuario criado:")
print("         -> corsini / Pulga@2013  (Administrador)")

# ─── 2. VEICULOS ──────────────────────────────────────────────────────────
print("\n[2/5] Inserindo veiculos...")

veiculos = [
    # (placa, modelo, marca, ano, quilometragem, tipo_veiculo, eixos)
    # CARROS
    ("ABC-1234", "Onix LTZ",            "Chevrolet",  2021, 52400,  "Carro",    0),
    ("DEF-5678", "HB20 Comfort",        "Hyundai",    2020, 71800,  "Carro",    0),
    ("GHI-9012", "Gol Track",           "Volkswagen", 2019, 98600,  "Carro",    0),
    ("JKL-3456", "Strada Freedom",      "Fiat",       2022, 34200,  "Carro",    0),
    ("MNO-7890", "Pulse Drive",         "Fiat",       2023, 18900,  "Carro",    0),
    ("PQR-1122", "Tracker Premier",     "Chevrolet",  2022, 47500,  "Carro",    0),
    ("STU-3344", "Kicks Advance",       "Nissan",     2021, 61300,  "Carro",    0),
    ("VVX-5566", "Cronos Drive",        "Fiat",       2020, 83100,  "Carro",    0),
    ("WXY-9988", "Mobi Like",           "Fiat",       2023, 12500,  "Carro",    0),
    ("ZAB-1122", "Kwid Zen",            "Renault",    2022, 38100,  "Carro",    0),
    ("CDE-3344", "Argo Drive",          "Fiat",       2021, 59200,  "Carro",    0),
    ("FGH-5566", "Polo Track",          "Volkswagen", 2024,  8400,  "Carro",    0),
    ("IJK-7788", "Yaris Hatch",         "Toyota",     2020, 76500,  "Carro",    0),
    ("LMN-9900", "208 Active",          "Peugeot",    2022, 41300,  "Carro",    0),
    ("OPQ-1133", "C3 Feel",             "Citroen",    2023, 22100,  "Carro",    0),
    # CAMINHOES (tipo_veiculo deve ser exatamente "Caminhão" para o app.py reconhecer)
    ("YZA-7788", "Scania T800",         "Scania",     2018, 318000, "Caminhão", 6),
    ("BCD-9900", "VM 270",              "Volvo",      2019, 204000, "Caminhão", 4),
    ("EFG-2233", "Delivery 9.170",      "Volkswagen", 2020, 149000, "Caminhão", 4),
    ("HIJ-4455", "FH 540 Globetrotter", "Volvo",      2021, 237000, "Caminhão", 6),
    ("WDS3442",  "Constellation 24280", "Volkswagen", 2017, 402000, "Caminhão", 6),
    ("ABC1230",  "Cargo 2430",          "Ford",       2019, 178000, "Caminhão", 4),
    ("ABC1238",  "R450",                "Scania",     2020, 261000, "Caminhão", 6),
]

for v in veiculos:
    cursor.execute(
        "INSERT INTO veiculos (placa, modelo, marca, ano, quilometragem, tipo_veiculo, eixos) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s)",
        v,
    )
conn.commit()
print(f"  [OK] {len(veiculos)} veiculos inseridos (8 carros + 7 caminhoes).")

# ─── 3. MOTORISTAS ────────────────────────────────────────────────────────
print("\n[3/5] Inserindo motoristas...")

motoristas = [
    ("Carlos Eduardo Silva",   "12345678901", "B"),
    ("Fernanda Costa Rocha",   "23456789012", "B"),
    ("Roberto Lima Pereira",   "34567890123", "B,C"),
    ("Ana Paula Martins",      "45678901234", "B"),
    ("Jose Antonio Ferreira",  "56789012345", "C,D"),
    ("Marcos Vinicius Santos", "67890123456", "D,E"),
    ("Luciana Oliveira Souza", "78901234567", "B"),
    ("Paulo Ricardo Mendes",   "89012345678", "C"),
    ("Tatiana Borges Alves",   "90123456789", "B"),
    ("Diego Henrique Castro",  "01234567890", "C,D,E"),
    ("Rafael Almeida Nunes",   "11223344556", "B"),
    ("Camila Fernandes Dias",  "22334455667", "B"),
    ("Bruno Oliveira Souza",   "33445566778", "B,C"),
    ("Amanda Ribeiro Costa",   "44556677889", "B"),
    ("Ricardo Gomes Moraes",   "55667788990", "C,D"),
    ("Juliana Castro Silva",   "66778899001", "B"),
    ("Fernando Henrique Lima", "77889900112", "C,E"),
    ("Vanessa Carvalho Neri",  "88990011223", "B"),
    ("Leonardo Marques P.",    "99001122334", "D"),
    ("Thiago Batista Lopes",   "00112233445", "B,C,D,E"),
]

for m in motoristas:
    cursor.execute(
        "INSERT INTO motoristas (nome, cnh, categoria_cnh) VALUES (%s,%s,%s)", m
    )
conn.commit()
print(f"  [OK] {len(motoristas)} motoristas inseridos.")

# Busca IDs reais do banco
cursor.execute("SELECT id, tipo_veiculo, quilometragem FROM veiculos ORDER BY id;")
veiculos_db = cursor.fetchall()

cursor.execute("SELECT id, categoria_cnh FROM motoristas ORDER BY id;")
motoristas_db = cursor.fetchall()

def motoristas_para(tipo):
    if tipo == "Carro":
        return [m[0] for m in motoristas_db if "B" in m[1]]
    return [m[0] for m in motoristas_db if any(c in m[1] for c in ["C", "D", "E"])]

# ─── 4. MANUTENCOES ───────────────────────────────────────────────────────
print("\n[4/5] Inserindo manutencoes...")

descricoes = {
    "Preventiva": [
        "Troca de oleo e filtro",
        "Revisao dos 30.000 km",
        "Alinhamento e balanceamento",
        "Revisao completa dos freios",
        "Troca de correia dentada e tensor",
        "Revisao dos 50.000 km completa",
        "Troca de filtro de ar e vela",
        "Lubrificacao geral e calibragem",
    ],
    "Corretiva": [
        "Troca do alternador",
        "Reparo no sistema de arrefecimento",
        "Substituicao do compressor de AC",
        "Troca de amortecedor dianteiro",
        "Reparo eletrico no painel",
        "Troca de embreagem completa",
        "Substituicao da bomba d agua",
        "Troca de semi-eixo esquerdo",
        "Reparo no injetor eletronico",
        "Substituicao da bateria",
    ],
    "Preditiva": [
        "Analise de oleo por espectroscopia",
        "Teste completo de bateria e eletrica",
        "Verificacao de vibracao nos eixos",
        "Inspecao termografica dos freios",
        "Diagnostico OBD-II leitura de falhas",
    ],
}

manutencoes_ok = 0

for v_id, v_tipo, v_km_atual in veiculos_db:
    n = random.randint(10, 16)
    km_base = max(v_km_atual - n * 11000, 5000)

    for i in range(n):
        tipo      = random.choices(["Preventiva", "Corretiva", "Preditiva"],
                                    weights=[40, 40, 20])[0]
        descricao = random.choice(descricoes[tipo])
        km_manut  = min(km_base + i * random.randint(8000, 13000), v_km_atual - 800)
        data_manut = HOJE - timedelta(days=(n - i) * random.randint(18, 40))

        if tipo == "Corretiva":
            if v_tipo == "Carro":
                custo = round(450 + km_manut * 0.022 + random.uniform(-120, 280), 2)
            else:  # Caminhão
                custo = round(1400 + km_manut * 0.040 + random.uniform(-350, 700), 2)
            custo = max(custo, 200.0)
        elif tipo == "Preventiva":
            base = (350, 950) if v_tipo == "Carro" else (600, 1800)
            custo = round(random.uniform(*base), 2)
        else:
            custo = round(random.uniform(180, 650), 2)

        cursor.execute(
            "INSERT INTO manutencoes (veiculo_id, data_manutencao, tipo, custo, "
            "descricao, quilometragem) VALUES (%s,%s,%s,%s,%s,%s)",
            (v_id, data_manut, tipo, custo, descricao, km_manut),
        )
        manutencoes_ok += 1

conn.commit()
print(f"  [OK] {manutencoes_ok} manutencoes inseridas.")

# ─── 5. ABASTECIMENTOS ────────────────────────────────────────────────────
print("\n[5/5] Inserindo abastecimentos...")

comb_carro   = ["Gasolina", "Etanol", "Flex (Gasolina)", "Flex (Etanol)"]
comb_caminho = ["Diesel S-10", "Diesel S-500"]

abastecimentos_ok = 0

for v_id, v_tipo, v_km_atual in veiculos_db:
    ids_mot = motoristas_para(v_tipo)
    if not ids_mot:
        continue

    n         = random.randint(7, 12)
    km_inicio = max(v_km_atual - n * random.randint(450, 750), 1000)
    km_loop   = km_inicio
    data_loop = HOJE - timedelta(days=365)

    for i in range(n):
        mot_id    = random.choice(ids_mot)
        km_loop  += random.randint(350, 750)
        data_loop += timedelta(days=random.randint(22, 35))

        if v_tipo == "Carro":
            combustivel = random.choice(comb_carro)
            litros      = round(random.uniform(32, 54), 2)
            preco_l     = round(random.uniform(5.49, 6.39), 3)
        else:  # Caminhão
            combustivel = random.choice(comb_caminho)
            litros      = round(random.uniform(90, 270), 2)
            preco_l     = round(random.uniform(5.89, 6.99), 3)

        valor_total = round(litros * preco_l, 2)
        odometro    = min(km_loop, v_km_atual - 50)

        cursor.execute(
            "INSERT INTO abastecimentos "
            "(veiculo_id, motorista_id, data_abastecimento, litros, "
            " valor_total, tipo_combustivel, odometro) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s)",
            (v_id, mot_id, data_loop, litros, valor_total, combustivel, odometro),
        )
        abastecimentos_ok += 1

conn.commit()
print(f"  [OK] {abastecimentos_ok} abastecimentos inseridos (12 meses de historico).")

# ─── RESUMO ───────────────────────────────────────────────────────────────
cursor.close()
conn.close()

carros    = len([v for v in veiculos if v[5] == "Carro"])
caminhoes = len([v for v in veiculos if v[5] == "Caminhão"])

print("\n" + "=" * 68)
print("  BANCO POPULADO COM SUCESSO PARA A APRESENTACAO!")
print("=" * 68)
print()
print("  DADOS INSERIDOS:")
print("  ----------------------------------------------------------------")
print(f"   Veiculos      : {len(veiculos):>4}  ({carros} carros + {caminhoes} caminhoes)")
print(f"   Motoristas    : {len(motoristas):>4}")
print(f"   Manutencoes   : {manutencoes_ok:>4}  (historico para IA de Regressao Linear)")
print(f"   Abastecimentos: {abastecimentos_ok:>4}  (12 meses de historico)")
print(f"   Usuarios      : {len(usuarios):>4}")
print()
print("  LOGINS PRONTOS:")
print("  ----------------------------------------------------------------")
print("   corsini / Pulga@2013  -> Victor Corsini (Administrador)")
print()
print("  Acesse: http://127.0.0.1:8000")
print()
