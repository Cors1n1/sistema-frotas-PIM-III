# Documentação Técnica — Design UX/UI e Acessibilidade Digital

## 6.1 Introdução

O design de Experiência do Usuário (UX) e Interface do Usuário (UI) é o pilar que determina como o sistema é percebido, compreendido e utilizado pelos seus usuários finais. No **Sistema de Gestão de Frotas Integrado**, o design foi concebido seguindo os princípios do **Design System Enterprise** — uma abordagem que prioriza clareza, consistência visual e eficiência operacional.

A interface foi construída com **HTML5**, **CSS3** e **JavaScript vanilla**, utilizando o framework de templates **Jinja2** (integrado ao Flask) para garantir a reutilização de componentes visuais. Todo o design suporta nativamente **Dark Mode** e foi validado para **responsividade** em diferentes dispositivos.

---

## 6.2 Definição de Personas

### Persona 1: Carlos Mendes — Gestor de Frotas

```
┌──────────────────────────────────────────────────────────────┐
│  👤 CARLOS MENDES — Gestor de Frotas                         │
│  Idade: 42 anos  │  Cargo: Diretor de Operações              │
├──────────────────────────────────────────────────────────────┤
│  CONTEXTO:                                                   │
│  Carlos gerencia uma frota de 15 veículos e 8 motoristas.    │
│  Precisa de visão rápida dos custos, alertas de manutenção   │
│  e indicadores de sustentabilidade para relatórios mensais.  │
│                                                              │
│  OBJETIVOS:                                                  │
│  • Visualizar KPIs operacionais em tempo real                │
│  • Receber alertas automáticos de revisão vencida            │
│  • Comparar eficiência entre veículos e motoristas           │
│  • Gerar dados para relatórios ESG da empresa                │
│                                                              │
│  FRUSTRAÇÕES:                                                │
│  • Sistemas com muitos cliques para tarefas simples          │
│  • Interfaces que exigem treinamento extenso                 │
│  • Falta de alertas proativos (precisa lembrar de tudo)      │
│                                                              │
│  CENÁRIO DE USO:                                             │
│  Carlos acessa o Dashboard às 8h da manhã para ver o status  │
│  geral da frota. Verifica alertas de manutenção e consulta   │
│  a análise de IA antes da reunião semanal com a diretoria.   │
└──────────────────────────────────────────────────────────────┘
```

### Persona 2: Ana Paula — Operadora de Logística

```
┌──────────────────────────────────────────────────────────────┐
│  👤 ANA PAULA — Operadora de Logística                       │
│  Idade: 28 anos  │  Cargo: Assistente Operacional            │
├──────────────────────────────────────────────────────────────┤
│  CONTEXTO:                                                   │
│  Ana Paula registra abastecimentos, cadastra motoristas e    │
│  gerencia manutenções diariamente. Trabalha em ritmo         │
│  acelerado e precisa de formulários rápidos e intuitivos.    │
│                                                              │
│  OBJETIVOS:                                                  │
│  • Cadastrar veículos com validação automática (API FIPE)    │
│  • Registrar abastecimentos sem erros (validação de CNH)     │
│  • Receber feedback visual imediato (toasts de sucesso/erro) │
│                                                              │
│  FRUSTRAÇÕES:                                                │
│  • Formulários que perdem dados ao dar erro                  │
│  • Falta de preenchimento automático                         │
│  • Mensagens de erro genéricas ("Erro desconhecido")         │
│                                                              │
│  CENÁRIO DE USO:                                             │
│  Ana acessa a aba "Abastecimentos", seleciona o veículo      │
│  (o sistema preenche automaticamente o odômetro), escolhe    │
│  o motorista (filtrado pela CNH compatível) e registra.      │
└──────────────────────────────────────────────────────────────┘
```

---

## 6.3 Fluxos de Navegação

### 6.3.1 Mapa Geral de Navegação

```
                    ┌─────────────────┐
                    │    SIDEBAR      │
                    │   (Navegação)   │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
    ┌───────────┐    ┌──────────────┐    ┌──────────────┐
    │ 🚗 Veículos│   │ 🧑‍✈️ Motoristas│   │ ⛽ Abastecim. │
    │ (index)   │    │              │    │              │
    │           │    │              │    │              │
    │ • Mapa    │    │ • Formulário │    │ • Formulário │
    │ • Cadastro│    │ • Tabela     │    │   inteligente│
    │ • Tabela  │    │              │    │ • Histórico  │
    └───────────┘    └──────────────┘    └──────────────┘
          │
          ├──────────────────┬──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
    ┌───────────┐    ┌──────────────┐    ┌──────────────┐
    │ 🔧 Manut. │    │ 📊 Dashboard │    │ 🧠 Análise IA│
    │           │    │              │    │              │
    │ • O.S.    │    │ • KPIs       │    │ • Predição   │
    │ • Histórico│   │ • Gráficos   │    │ • Ranking    │
    │           │    │              │    │ • Alertas    │
    └───────────┘    └──────────────┘    │ • Simulador  │
                                         │ • Eficiência │
                                         └──────────────┘
```

### 6.3.2 Fluxo de Abastecimento (Caso de Uso Crítico)

```
    INÍCIO
      │
      ▼
    Seleciona Veículo ──────────────────────────┐
      │                                         │
      │ (Automático: preenche odômetro,         │
      │  filtra motoristas por CNH compatível)  │
      ▼                                         │
    Seleciona Motorista ◄───────────────────────┘
      │                           ▲
      │ (Se nenhum habilitado:    │
      │  "Nenhum motorista        │
      │   habilitado encontrado") │
      ▼                           │
    Preenche dados ───────────────┘
    (Data, Litros, Valor, Combustível)
      │
      ▼
    Clica "VALIDAR TICKET"
      │
      ├─── [CNH inválida] ──▶ Toast ERRO: "Bloqueio de Segurança"
      │
      ├─── [Odômetro < atual] ──▶ Toast ERRO: "Odômetro inválido!"
      │
      └─── [Sucesso] ──▶ Toast SUCESSO: "Abastecimento autorizado!"
                          │
                          ▼
                    Atualiza tabela + Reseta formulário
```

---

## 6.4 Design System — Tokens Visuais

### 6.4.1 Paleta de Cores

O sistema utiliza uma paleta cuidadosamente selecionada com variantes para Light e Dark Mode:

```
LIGHT MODE                          DARK MODE
─────────────                       ─────────────
┌──────┐ #1e3a8a                    ┌──────┐ #3b82f6
│██████│ Primary Blue               │██████│ Primary Blue (Brilhante)
└──────┘                            └──────┘

┌──────┐ #facc15                    ┌──────┐ #fde047
│██████│ Secondary Yellow           │██████│ Secondary Yellow (Vibrante)
└──────┘                            └──────┘

┌──────┐ #111827                    ┌──────┐ #f8fafc
│██████│ Dark Black                 │██████│ Dark Black → White (Invertido)
└──────┘                            └──────┘

┌──────┐ #f8fafc                    ┌──────┐ #0f172a
│░░░░░░│ Light BG                   │██████│ Light BG → Deep Navy
└──────┘                            └──────┘

┌──────┐ #10b981                    Cores semânticas (fixas):
│██████│ Success Green              #ef4444 → Erro/Urgente
└──────┘                            #10b981 → Sucesso/Online
```

### 6.4.2 Implementação CSS das Variáveis

```css
/* Light Mode (padrão) */
:root {
    --primary-blue: #1e3a8a;
    --secondary-yellow: #facc15;
    --dark-black: #111827;
    --light-bg: #f8fafc;
    --white: #ffffff;
    --text-main: #334155;
    --text-muted: #64748b;
    --border-color: #e2e8f0;
}

/* Dark Mode */
[data-theme="dark"] {
    --primary-blue: #3b82f6;
    --secondary-yellow: #fde047;
    --dark-black: #f8fafc;     /* Inversão intencional */
    --light-bg: #0f172a;
    --white: #1e293b;
    --text-main: #f1f5f9;
    --text-muted: #94a3b8;
    --border-color: #334155;
}
```

### 6.4.3 Tipografia

| Elemento       | Fonte          | Peso    | Tamanho  |
|----------------|----------------|---------|----------|
| Títulos (H1)   | Inter          | 800     | 1.8rem   |
| Subtítulos (H2)| Inter          | 600     | 1.0rem   |
| Corpo do texto | Inter          | 400     | 0.95rem  |
| Labels          | Inter          | 700     | 0.7rem   |
| KPI Values     | Inter          | 800     | 2.0rem   |

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

* { font-family: 'Inter', sans-serif; }
```

---

## 6.5 Componentes de Interface

### 6.5.1 Sidebar Retrátil

A sidebar é o componente de navegação principal, com suporte a retração:

```
EXPANDIDA (250px)              RETRAÍDA (80px)
┌──────────────────┐           ┌────────┐
│ [F] Gestão Frotas│           │  [F]   │
│──────────────────│           │────────│
│ 🚗 Veículos      │           │  🚗    │
│ 🧑‍✈️ Motoristas    │           │  🧑‍✈️    │
│ ⛽ Abastecimentos │           │  ⛽    │
│ 🔧 Manutenções   │           │  🔧    │
│ 📊 Dashboard     │           │  📊    │
│ 🧠 Análise (IA)  │           │  🧠    │
└──────────────────┘           └────────┘
```

**Interação:** O botão ☰ alterna entre os estados. Os textos são ocultados com `display: none` e a sidebar reduz para 80px.

### 6.5.2 Cards Profissionais (pro-card)

Todos os blocos de conteúdo utilizam o componente `.pro-card` com:
- **Bordas arredondadas** (12px)
- **Sombra sutil** para elevação
- **Efeito 3D** via VanillaTilt.js
- **Animação de entrada** (fade-in de baixo para cima)

```css
.pro-card {
    background: var(--pro-card-bg);
    border: 1px solid var(--pro-border);
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    transform-style: preserve-3d;
}

@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(40px); }
    to   { opacity: 1; transform: translateY(0); }
}
```

### 6.5.3 Sistema de Toast Notifications

Substituição do `alert()` nativo por notificações visuais modernas:

```
                          ┌───────────────────────────────┐
                          │ ✅ Veículo registado com      │
                          │    sucesso!                   │
                          └───────────────────────────────┘
                                   └── Desaparece após 4.5s

                          ┌───────────────────────────────┐
                          │ ⚠️ Erro: Odômetro inválido!  │
                          │    O atual é 35.000 km.       │
                          └───────────────────────────────┘
```

**Implementação:**

```javascript
window.alert = function(msg) {
    const type = msg.toLowerCase().includes('erro') ? 'error' : 'success';
    showToast(msg, type);
};
```

---

## 6.6 Wireframes e Protótipos das Telas

### 6.6.1 Tela Principal — Controle de Ativos & Frota

```
┌────────────────────────────────────────────────────────────────────────┐
│ ☰                                                                  🌙 │
├────────┬───────────────────────────────────────────────────────────────┤
│        │  CONTROLO DE ATIVOS & FROTA                                  │
│  🚗    │  Monitorização georreferenciada e gestão técnica de...       │
│Veículos│  ─────────────────────────────────────────────────────       │
│        │                                                              │
│  🧑‍✈️    │  ┌──────────────────────────────────────────────────┐       │
│Motorist│  │  🛰️ CENTRO DE COMANDO / TELEMETRIA ATIVA          │       │
│        │  │  ┌──────────────────────────────────────────────┐ │       │
│  ⛽    │  │  │                                              │ │       │
│Abastec.│  │  │            MAPA LEAFLET.JS                   │ │       │
│        │  │  │        🏢 Sede  🚗🚗 Veículos em operação   │ │       │
│  🔧    │  │  │                 🚛                           │ │       │
│Manut.  │  │  └──────────────────────────────────────────────┘ │       │
│        │  └──────────────────────────────────────────────────┘       │
│  📊    │                                                              │
│Dashb.  │  ┌──────────────────────────────────────────────────┐       │
│        │  │  🚗 INVENTÁRIO / INTEGRAR NOVO VEÍCULO            │       │
│  🧠    │  │                                                  │       │
│Análise │  │  [Categoria ▼] [Placa    ] [Fabricante (FIPE)]   │       │
│        │  │  [Modelo     ] [Ano      ] [Odômetro (Km)    ]   │       │
│        │  │                           [💾 EFETIVAR CADASTRO] │       │
│        │  │                                                  │       │
│        │  │  ┌─────────────────────────────────────────────┐ │       │
│        │  │  │ 🖼️ Renault │ Dados integrados via API FIPE  │ │       │
│        │  │  └─────────────────────────────────────────────┘ │       │
│        │  └──────────────────────────────────────────────────┘       │
│        │                                                              │
│        │  ┌──────────────────────────────────────────────────┐       │
│        │  │  📋 FROTA ATIVA / REGISTO CONSOLIDADO             │       │
│        │  │  ┌─────┬─────┬──────┬────────┬──────┬──────┐    │       │
│        │  │  │Marca│Categ│Placa │Modelo  │Ano   │Pedág.│    │       │
│        │  │  ├─────┼─────┼──────┼────────┼──────┼──────┤    │       │
│        │  │  │ 🖼️  │Carro│ABC1D2│Renault │2022  │R$12,5│    │       │
│        │  │  │ 🖼️  │Cam. │XYZ9W8│Volvo FH│6 Eix.│R$58,8│    │       │
│        │  │  └─────┴─────┴──────┴────────┴──────┴──────┘    │       │
│        │  └──────────────────────────────────────────────────┘       │
└────────┴──────────────────────────────────────────────────────────────┘
```

### 6.6.2 Dashboard Executivo

```
┌────────────────────────────────────────────────────────────────────────┐
│  VISÃO GERAL DA OPERAÇÃO                                              │
│  Monitorização de KPIs em tempo real e indicadores de sustentabilidade│
│  ─────────────────────────────────────────────────────────────────    │
│                                                                       │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────┐       │
│  │ 🚚 Frota Ativa│  │ 💰 Custos Operac. │  │ 🌱 Impacto Ambie. │       │
│  │      5       │  │  R$ 3.420,50     │  │    198.32 kg     │       │
│  │  ● ONLINE    │  │  Acumulado       │  │  Emissões CO₂    │       │
│  └──────────────┘  └──────────────────┘  └───────────────────┘       │
│                                                                       │
│  ┌────────────────────────┐  ┌────────────────────────┐              │
│  │ Investimento por Veíc. │  │  Distribuição CO₂      │              │
│  │                        │  │                        │              │
│  │  ████                  │  │       ┌──────┐         │              │
│  │  ████  ████            │  │      ╱  45%   ╲        │              │
│  │  ████  ████  ████      │  │     │  ┌────┐  │       │              │
│  │  Clio  FH540 Onix      │  │      ╲ └────┘ ╱        │              │
│  │                        │  │       └──────┘         │              │
│  └────────────────────────┘  └────────────────────────┘              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6.7 Recursos de Acessibilidade

### 6.7.1 Integração com VLibras (LIBRAS)

O sistema integra o **VLibras** — ferramenta oficial do Governo Federal Brasileiro para tradução de conteúdo web em Língua Brasileira de Sinais (LIBRAS):

```html
<!-- Widget VLibras integrado no base.html -->
<div vw class="enabled">
    <div vw-access-button class="active"></div>
    <div vw-plugin-wrapper>
        <div class="vw-plugin-top-wrapper"></div>
    </div>
</div>
<script src="https://vlibras.gov.br/app/vlibras-plugin.js"></script>
<script>new window.VLibras.Widget('https://vlibras.gov.br/app');</script>
```

**Funcionalidade:** O ícone do VLibras aparece em todas as páginas. Ao clicar, um avatar 3D traduz o conteúdo textual da tela para LIBRAS em tempo real.

### 6.7.2 Dark Mode para Conforto Visual

O alternador de tema reduz a fadiga ocular em ambientes com pouca luz:

```javascript
function toggleTheme() {
    const html = document.documentElement;
    const newTheme = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);  // Persiste a preferência
}
```

### 6.7.3 Empty States com Feedback Visual

Quando uma tabela não possui dados, o sistema exibe ilustrações informativas ao invés de tabelas vazias:

```
┌─────────────────────────────────────┐
│              🚗                     │
│  Nenhum veículo cadastrado          │
│  na frota.                          │
└─────────────────────────────────────┘
```

---

## 6.8 Micro-Interações e Animações

| Elemento            | Animação                       | Propósito UX                         |
|---------------------|--------------------------------|--------------------------------------|
| Cards (pro-card)    | `fadeInUp` (cascata)           | Hierarquia visual de carregamento    |
| Efeito 3D (VanillaTilt) | Inclinação sutil (3°)     | Sensação de profundidade e premium   |
| Botões (hover)      | `translateY(-2px)` + cor       | Feedback tátil visual                |
| Sidebar links       | `translateX(5px)` + cor ativa  | Indicação de interatividade          |
| Toasts              | `slideIn` + `fadeOut`          | Notificação sem interrupção          |
| Dark Mode BG        | `gradientBG` (15s loop)        | Fundo animado vivo e moderno         |
| KPI cards           | `translateY(-5px)` on hover   | Destaque ao inspecionar              |

### Animação do Fundo do Dark Mode

```css
[data-theme="dark"] body {
    background: linear-gradient(-45deg, #0f172a, #1e1b4b, #020617, #082f49);
    background-size: 400% 400%;
    animation: gradientBG 15s ease infinite;
}

@keyframes gradientBG {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}
```

---

## 6.9 Análise de Usabilidade — Heurísticas de Nielsen

| # | Heurística                          | Implementação no Sistema                                        |
|---|-------------------------------------|-----------------------------------------------------------------|
| 1 | Visibilidade do Status              | Toast notifications, spinner de loading, status "● ONLINE"     |
| 2 | Compatibilidade com o Mundo Real    | Terminologia logística (Frota, O.S., Odômetro, CNH)            |
| 3 | Controle e Liberdade do Usuário     | Reset de formulário após sucesso, sidebar retrátil             |
| 4 | Consistência e Padrões              | Design tokens globais (CSS Variables), componentes reutilizáveis|
| 5 | Prevenção de Erros                  | Validação de CNH automática, filtro de motoristas por categoria |
| 6 | Reconhecimento ao invés de Memória  | Datalists com autocomplete (API FIPE), selects pré-filtrados   |
| 7 | Flexibilidade e Eficiência          | Dark mode, preenchimento automático de data e odômetro         |
| 8 | Estética e Design Minimalista       | Cards com espaçamento generoso, hierarquia tipográfica clara   |
| 9 | Ajudar a Reconhecer e Recuperar     | Mensagens de erro descritivas ("CNH atual: B, necessária: C")  |
|10 | Ajuda e Documentação                | Labels descritivas, placeholders com exemplos, VLibras         |

---

## 6.10 Responsividade (Telas Menores)

O sistema utiliza `grid-template-columns: repeat(auto-fit, minmax(...))` para reorganizar formulários automaticamente em dispositivos menores:

```css
/* Formulários: de 4 colunas (desktop) para 1 coluna (mobile) */
.grid-form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 20px;
}

/* Mapa responsivo: painel overlay vira bloco empilhado */
@media (max-width: 768px) {
    .control-panel-overlay {
        position: relative;
        width: 100%;
    }
    .map-container-pro {
        display: flex;
        flex-direction: column-reverse;
    }
    #mapa-simulador { height: 400px; }
}
```
