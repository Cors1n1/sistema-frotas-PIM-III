"""
SEED DE DADOS - Sistema de Gestao de Frotas (PIM III)

Popula o banco de dados com dados realistas para
demonstracao e apresentacao do sistema.

Execute: python seed_dados.py
"""

import psycopg2
import os
from dotenv import load_dotenv
from datetime import date, timedelta
import random

load_dotenv()

# ───────────────────────────────────────────────────────
# CONEXÃO
# ───────────────────────────────────────────────────────
conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD")
)
cursor = conn.cursor()

print("=" * 60)
print("  SEED DE DADOS - Sistema de Gestao de Frotas")
print("=" * 60)

# ───────────────────────────────────────────────────────
# 1. VEÍCULOS
# ───────────────────────────────────────────────────────
print("\n[1/4] Inserindo veículos...")

veiculos = [
    # (placa, modelo, marca, ano, quilometragem, tipo_veiculo, eixos)
    ("ABC-1234", "Onix",         "Chevrolet", 2021, 48200,  "Carro",    0),
    ("DEF-5678", "HB20",         "Hyundai",   2020, 63500,  "Carro",    0),
    ("GHI-9012", "Gol",          "Volkswagen",2019, 87300,  "Carro",    0),
    ("JKL-3456", "Strada",       "Fiat",      2022, 31000,  "Carro",    0),
    ("MNO-7890", "Pulse",        "Fiat",      2023, 15800,  "Carro",    0),
    ("PQR-1122", "Tracker",      "Chevrolet", 2022, 42700,  "Carro",    0),
    ("STU-3344", "Kicks",        "Nissan",    2021, 55100,  "Carro",    0),
    ("VWX-5566", "T800",         "Scania",    2018, 312000, "Caminhão", 6),
    ("YZA-7788", "Atego 1719",   "Mercedes",  2019, 195000, "Caminhão", 4),
    ("BCD-9900", "Accelo 815",   "Mercedes",  2020, 141000, "Caminhão", 4),
    ("EFG-2233", "FH 540",       "Volvo",     2021, 228000, "Caminhão", 6),
    ("HIJ-4455", "Constellation","Volkswagen",2017, 389000, "Caminhão", 6),
]

# Limpa tabela para re-seed seguro (sem duplicatas)
cursor.execute("DELETE FROM abastecimentos;")
cursor.execute("DELETE FROM manutencoes;")
cursor.execute("DELETE FROM veiculos;")
cursor.execute("ALTER SEQUENCE veiculos_id_seq RESTART WITH 1;")

for v in veiculos:
    cursor.execute(
        "INSERT INTO veiculos (placa, modelo, marca, ano, quilometragem, tipo_veiculo, eixos) VALUES (%s,%s,%s,%s,%s,%s,%s)",
        v
    )
print(f"  [OK] {len(veiculos)} veiculos inseridos.")

# ───────────────────────────────────────────────────────
# 2. MOTORISTAS
# ───────────────────────────────────────────────────────
print("\n[2/4] Inserindo motoristas...")

cursor.execute("DELETE FROM motoristas;")
cursor.execute("ALTER SEQUENCE motoristas_id_seq RESTART WITH 1;")

motoristas = [
    # (nome, cnh, categoria_cnh)
    ("Carlos Eduardo Silva",    "12345678901", "B"),
    ("Fernanda Costa Rocha",    "23456789012", "B"),
    ("Roberto Lima Pereira",    "34567890123", "B,C"),
    ("Ana Paula Martins",       "45678901234", "B"),
    ("José Antônio Ferreira",   "56789012345", "C,D"),
    ("Marcos Vinícius Santos",  "67890123456", "D,E"),
    ("Luciana Oliveira Souza",  "78901234567", "B"),
    ("Paulo Ricardo Mendes",    "89012345678", "C"),
    ("Tatiana Borges Alves",    "90123456789", "B"),
    ("Diego Henrique Castro",   "01234567890", "C,D,E"),
]

for m in motoristas:
    cursor.execute(
        "INSERT INTO motoristas (nome, cnh, categoria_cnh) VALUES (%s,%s,%s)",
        m
    )
print(f"  [OK] {len(motoristas)} motoristas inseridos.")

conn.commit()

# Busca IDs reais do banco
cursor.execute("SELECT id, tipo_veiculo, quilometragem FROM veiculos ORDER BY id;")
veiculos_db = cursor.fetchall()  # [(id, tipo, km_atual), ...]

cursor.execute("SELECT id, categoria_cnh FROM motoristas ORDER BY id;")
motoristas_db = cursor.fetchall()  # [(id, categoria), ...]

# Mapeia motoristas compatíveis por tipo de veículo
def motoristas_para(tipo):
    if tipo == "Carro":
        return [m[0] for m in motoristas_db if "B" in m[1]]
    else:  # Caminhão
        return [m[0] for m in motoristas_db if any(c in m[1] for c in ["C","D","E"])]

# ───────────────────────────────────────────────────────
# 3. MANUTENÇÕES
# ───────────────────────────────────────────────────────
print("\n[3/4] Inserindo manutenções...")

tipos_manutencao = ["Preventiva", "Corretiva", "Preditiva"]
descricoes = {
    "Preventiva": [
        "Troca de óleo e filtros", "Revisão dos 30.000 km", "Alinhamento e balanceamento",
        "Revisão dos freios", "Troca de correia dentada", "Revisão completa",
    ],
    "Corretiva": [
        "Troca do alternador", "Reparo no sistema de arrefecimento",
        "Substituição do compressor de ar-condicionado", "Troca de amortecedores",
        "Reparo elétrico geral", "Troca de embreagem",
    ],
    "Preditiva": [
        "Análise de óleo por espectroscopia", "Teste de bateria e sistema elétrico",
        "Verificação de vibração nos eixos", "Inspeção de desgaste de pneus",
    ],
}
custos = {
    "Preventiva": (300, 900),
    "Corretiva":  (800, 4500),
    "Preditiva":  (150, 600),
}

manutencoes_inseridas = 0
hoje = date.today()

for v_id, v_tipo, v_km_atual in veiculos_db:
    # Gera entre 8 e 15 manutenções por veículo para garantir um volume excelente para a IA
    n = random.randint(8, 15)
    km_base = max(v_km_atual - n * 12000, 5000)

    for i in range(n):
        # Garante uma proporção saudável (ex: 40% Preventiva, 40% Corretiva, 20% Preditiva)
        tipo = random.choices(tipos_manutencao, weights=[40, 40, 20])[0]
        descricao = random.choice(descricoes[tipo])
        
        km_manut = km_base + i * random.randint(8000, 14000)
        km_manut = min(km_manut, v_km_atual - 500)  # nunca supera o km atual
        data_manut = hoje - timedelta(days=(n - i) * random.randint(20, 45))

        # LÓGICA ORGÂNICA PARA MACHINE LEARNING
        if tipo == "Corretiva":
            # Criamos uma fórmula y = ax + b com ruído (noise) para que o Scikit-Learn
            # consiga achar um padrão realista e obter um bom score R² (ex: 70% a 90%).
            if v_tipo == "Carro":
                # Carro: desgaste mais brando. Custo fixo base ~R$ 500 + R$ 0.021 por Km
                ruido = random.uniform(-150, 300)
                custo = round(500 + (km_manut * 0.021) + ruido, 2)
            else:
                # Caminhão: desgaste pesado. Custo fixo base ~R$ 1500 + R$ 0.038 por Km
                ruido = random.uniform(-400, 800)
                custo = round(1500 + (km_manut * 0.038) + ruido, 2)
            
            # Limite mínimo de segurança
            custo = max(custo, 200.0)
        else:
            # Preventivas e Preditivas continuam com custo aleatório simples
            custo_min, custo_max = custos[tipo]
            custo = round(random.uniform(custo_min, custo_max), 2)

        cursor.execute(
            "INSERT INTO manutencoes (veiculo_id, data_manutencao, tipo, custo, descricao, quilometragem) VALUES (%s,%s,%s,%s,%s,%s)",
            (v_id, data_manut, tipo, custo, descricao, km_manut)
        )
        manutencoes_inseridas += 1

print(f"  [OK] {manutencoes_inseridas} manutencoes inseridas (IA altamente treinável agora).")

# ───────────────────────────────────────────────────────
# 4. ABASTECIMENTOS
# ───────────────────────────────────────────────────────
print("\n[4/4] Inserindo abastecimentos...")

combustiveis_carro   = ["Gasolina", "Etanol", "Flex (Gasolina)", "Flex (Etanol)"]
combustiveis_caminho = ["Diesel S-10", "Diesel S-500", "GNV"]

abastecimentos_inseridos = 0

for v_id, v_tipo, v_km_atual in veiculos_db:
    ids_mot = motoristas_para(v_tipo)
    if not ids_mot:
        continue

    # Gera entre 4 e 10 abastecimentos por veículo em ordem cronológica
    n = random.randint(4, 10)
    km_inicio = max(v_km_atual - n * 600, 1000)
    km_atual_loop = km_inicio
    data_loop = hoje - timedelta(days=n * 15)

    for i in range(n):
        mot_id = random.choice(ids_mot)
        km_atual_loop += random.randint(300, 800)
        data_loop += timedelta(days=random.randint(7, 18))

        if v_tipo == "Carro":
            combustivel = random.choice(combustiveis_carro)
            litros       = round(random.uniform(30, 55), 2)
            preco_litro  = round(random.uniform(5.40, 6.20), 3)
        else:
            combustivel = random.choice(combustiveis_caminho)
            litros       = round(random.uniform(80, 250), 2)
            preco_litro  = round(random.uniform(5.70, 6.80), 3)

        valor_total = round(litros * preco_litro, 2)
        odometro    = min(km_atual_loop, v_km_atual - 50)

        cursor.execute(
            """INSERT INTO abastecimentos
               (veiculo_id, motorista_id, data_abastecimento, litros, valor_total, tipo_combustivel, odometro)
               VALUES (%s,%s,%s,%s,%s,%s,%s)""",
            (v_id, mot_id, data_loop, litros, valor_total, combustivel, odometro)
        )
        abastecimentos_inseridos += 1

print(f"  [OK] {abastecimentos_inseridos} abastecimentos inseridos.")

# ───────────────────────────────────────────────────────
# FINALIZA
# ───────────────────────────────────────────────────────
conn.commit()
cursor.close()
conn.close()

print("\n" + "=" * 60)
print("  BANCO POPULADO COM SUCESSO!")
print(f"  - {len(veiculos)} veiculos")
print(f"  - {len(motoristas)} motoristas")
print(f"  - {manutencoes_inseridas} manutencoes")
print(f"  - {abastecimentos_inseridos} abastecimentos")
print("=" * 60)
print("\n  Inicie o servidor: python app.py")
print()
