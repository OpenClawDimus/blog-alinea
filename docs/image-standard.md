# Padrão de Imagem — Blog Monumental Contabilidade
> Versão 1.0 — 2026-07-30
> Aplica-se a: coverImage (listagem + post header) e ogImage (Open Graph / compartilhamento social)

---

## 1. Filosofia Visual

**Posicionamento**: Escritório tributário de referência para médias empresas — CFO para CFO.
**Tom visual**: Autoridade sem arrogância. Expertise sem burocracia. Confiança sem frieza.
**Referências de mercado**: Big 4 (PwC, EY, Deloitte) — precisão técnica + limpeza visual — mas com calor humano e contexto brasileiro.
**Anti-referências**: Bancos brasileiros (impessoal, comercial demais), stock photos genéricos de "calculadora + dinheiro", verde-amarelo patriótico, clip art jurídico.

---

## 2. Sistema de Cores

| Token | Hex | Uso |
|---|---|---|
| `navy-deep` | `#1A3C5E` | Background principal, textos sobre claro, bordas |
| `navy-mid` | `#2C5F8A` | Gradientes, elementos secundários |
| `navy-light` | `#4A7FAA` | Hover states, separadores |
| `gold-accent` | `#C49A2A` | Barra de acento, badges, destaque de keyword |
| `gold-soft` | `#E8C97A` | Gold suave para elementos secundários |
| `off-white` | `#F4F7FA` | Background variante clara (navy-tinted) |
| `charcoal` | `#0D2137` | Texto sobre claro, máximo contraste |
| `white` | `#FFFFFF` | Texto sobre fundo escuro |
| `slate-100` | `#E9EFF5` | Separadores, backgrounds sutis |

**Regra dos 60-30-10:**
- 60% navy-deep ou off-white (fundo dominante)
- 30% branco ou charcoal (conteúdo principal)
- 10% gold-accent (elemento de destaque — UMA ocorrência por imagem)

---

## 3. Tipografia

**Fontes aprovadas** (por ordem de preferência):
1. **Inter** (Google Fonts): headline Bold 700-800, body Regular 400
2. **Montserrat**: headline ExtraBold 800, fallback aceitável
3. **Helvetica Neue** (system font): fallback de última instância

**Hierarquia tipográfica nas imagens:**

| Elemento | Fonte | Peso | Tamanho (1200px base) | Tracking |
|---|---|---|---|---|
| Categoria/Tag | Inter | 600 | 14-16px | +2px (UPPERCASE) |
| Título principal | Inter | 800 | 40-52px | -0.5px |
| Subtítulo/eyebrow | Inter | 400 | 18-22px | 0 |
| Crédito autor | Inter | 400 | 14px | 0 |
| Logotipo Monumental | Inter | 700 | 20px | +1px |

**Regras de texto:**
- Máximo 8 palavras no título da imagem (pode diferir do título do post)
- Nunca copiar o title completo — criar versão comprimida
- Sempre incluir a credencial: "Jocivane Brito, CRC-DF" ou "Monumental Contabilidade"
- Títulos com wrap: máximo 2 linhas (3 em casos excepcionais)

---

## 4. Layouts Aprovados

### Layout A — Dark Authority (padrão para advertoriais e posts de alta urgência)
```
┌─────────────────────────────────────┐
│ [FUNDO: navy-deep #1A3C5E]          │
│                                     │
│  ░░░░░░░░░░ [PADRÃO SUTIL]         │
│                                     │
│  [GOLD BAR horizontal 4px]          │
│                                     │
│  [TAG: REFORMA TRIBUTÁRIA]          │
│  [TÍTULO PRINCIPAL                  │
│   em white 800 48px]                │
│                                     │
│  [subtítulo cinza claro 18px]       │
│                                     │
│  ─────────────────────────────────  │
│  [Jocivane Brito · CRC-DF]  [LOGO] │
└─────────────────────────────────────┘
```
**Quando usar**: ADVs, posts de compliance, alertas fiscais, urgência regulatória
**Emoção**: Autoridade, urgência contida, seriedade

### Layout B — Light Professional (padrão para posts informativos/educativos)
```
┌─────────────────────────────────────┐
│ [FUNDO: off-white #F4F7FA]          │
│                                     │
│  [LINHA GOLD TOP 6px]               │
│                                     │
│  [TAG em navy pill]                 │
│                                     │
│  [TÍTULO PRINCIPAL                  │
│   em navy 800 44px]                 │
│                                     │
│  [subtítulo navy-mid 400 20px]      │
│                                     │
│  [ELEMENTO GRÁFICO direita:         │
│   barras verticais estilizadas      │
│   em navy 10% opacity]              │
│                                     │
│  ─────────────────────────────────  │
│  [Monumental Contabilidade] [LOGO]  │
└─────────────────────────────────────┘
```
**Quando usar**: Posts informativos, guias, comparativos, posts de SEO educativo
**Emoção**: Clareza, expertise acessível, confiança

### Layout C — Split Panel (posts de alto valor percebido / destaque editorial)
```
┌─────────────────────────────────────┐
│ [PAINEL LEFT 42%] [PAINEL RIGHT 58%]│
│ [navy-deep]       [off-white]       │
│                                     │
│  [GOLD    │  [TAG em navy]          │
│   BAR     │                         │
│   vert.]  │  [TÍTULO em            │
│           │   navy 800 40px]        │
│  [LOGO    │                         │
│   white]  │  [ELEMENTO: gráfico    │
│           │   de barras simples    │
│  [autor   │   em slate-100]        │
│   white   │                         │
│   14px]   │  [dados numéricos      │
│           │   em gold-accent]      │
└─────────────────────────────────────┘
```
**Quando usar**: Posts com dados numéricos, comparativos (LR vs. LP, JCP vs. dividendo), análises
**Emoção**: Sofisticação analítica, expertise financeira

---

## 5. Elementos Gráficos Permitidos

### Texturas e Padrões
- **Grid sutil**: linhas finas (1px, 6% opacity) em formato de gráfico financeiro — evoca planilha/análise
- **Barras verticais**: silhueta de gráfico de barras, 8-12% opacity, decorativo apenas
- **Linha de tendência**: curva suave ascendente em gold-soft, 40% opacity, no fundo
- **Pontilhado**: grid de pontos em 5% opacity — alternativa ao grid de linhas

### Proibido
- ❌ Fotos de stock (calculator, money, handshake, silhouettes)
- ❌ Ícones de moeda (R$, $, €) como elemento decorativo principal
- ❌ Clip art jurídico (martelo, balança, código)
- ❌ Gradientes sintéticos (roxo→rosa, laranja→amarelo) — não é identidade Monumental
- ❌ Mais de 2 elementos gráficos decorativos por imagem
- ❌ Texto menor que 14px em qualquer elemento
- ❌ Mais de 3 pesos tipográficos por imagem

### Elementos Opcionais (usar com moderação)
- Ícone minimalista de documento/NF (apenas Layout B)
- Número grande em gold-accent como âncora visual (ex: "34%" para JCP, "2026" para datas)
- Sublinhado gold em keyword do título (máximo 1 palavra)

---

## 6. Especificações Técnicas

| Tipo | Tamanho | Formato | Máximo |
|---|---|---|---|
| `coverImage` (header + listagem) | 1200×800px | JPG 85% | 400KB |
| `ogImage` (Open Graph / social) | 1200×630px | JPG 85% | 300KB |

**Naming:**
- Cover: `covers/cover-{slug}.jpg`
- OG: `/og/{slug}.png` (PNG para OG — melhor qualidade em compartilhamento)

**Regras gate-covers.mjs:**
- `coverImage` ≠ `ogImage` — cada post DEVE ter dois arquivos distintos
- `ogImage` DEVE estar em `/og/` — nunca em `covers/`
- Filename da cover NÃO começa com `og-`
- Nenhum dois posts com a mesma `coverImage`

---

## 7. Variação por Categoria de Post

| Categoria | Layout preferido | Cor dominante | Elemento gráfico |
|---|---|---|---|
| Advertorial (ADV) | A — Dark Authority | navy-deep | Grid sutil |
| Reforma Tributária | A — Dark Authority | navy-deep | Linha de tendência gold |
| Planejamento Tributário | B — Light Professional | off-white | Barras verticais |
| Compliance / Risco Fiscal | A — Dark Authority | navy-deep | Nenhum (minimalismo) |
| Comparativo (LP vs. LR, JCP vs. dividendo) | C — Split Panel | navy + off-white | Gráfico de barras |
| Internacional (Transfer Pricing, Lucros Exterior) | C — Split Panel | navy + off-white | Grid sutil |
| Holding / Patrimonial | B — Light Professional | off-white | Pontilhado |
| Operacional (NF-e, NFS-e, ERP) | B — Light Professional | off-white | Ícone documento (opcional) |

---

## 8. Tag de Categoria nas Imagens

Cores dos pills/badges por categoria:

| Categoria | Background | Texto |
|---|---|---|
| `REFORMA TRIBUTÁRIA` | gold-accent #C49A2A | navy-deep #1A3C5E |
| `PLANEJAMENTO TRIBUTÁRIO` | navy-mid #2C5F8A | white |
| `COMPLIANCE FISCAL` | charcoal #0D2137 | white |
| `HOLDING FAMILIAR` | navy-light #4A7FAA | white |
| `INTERNACIONAL` | navy-deep #1A3C5E | gold-soft #E8C97A |
| `OPERACIONAL` | slate-100 #E9EFF5 | charcoal #0D2137 |
| `GUIA COMPLETO` | gold-accent #C49A2A | charcoal #0D2137 |

---

## 9. Checklist antes de aprovar qualquer cover

- [ ] Layout pertence a A, B ou C (não improvisado)
- [ ] Paleta usa apenas tokens definidos na seção 2
- [ ] Máximo 10% de gold-accent na composição total
- [ ] Título com ≤8 palavras e ≤2 linhas
- [ ] Autor credenciado visível (Jocivane Brito, CRC-DF ou Monumental Contabilidade)
- [ ] Sem fotos de stock ou clip art
- [ ] Arquivos distintos para cover e OG
- [ ] Cover: `covers/cover-{slug}.jpg`, OG: `/og/{slug}.png`
- [ ] Tamanho: cover ≤400KB, OG ≤300KB
- [ ] Passou em `gate-covers.mjs` (0 violations)

---

## 10. Exemplos de Títulos de Imagem por Post

| Post | Título completo | Título da imagem (≤8 palavras) |
|---|---|---|
| `ibs-cbs-nota-fiscal` | "IBS e CBS nas Notas Fiscais: O Que Muda a Partir de Agosto de 2026" | **IBS e CBS nas Notas Fiscais: Agosto 2026** |
| `lucro-real-quando-migrar` | "Lucro Real ou Lucro Presumido: Quando Vale Migrar de Regime?" | **Lucro Real ou Presumido: Quando Migrar?** |
| `transfer-pricing-nova-metodologia` | "Transfer Pricing no Brasil: A Nova Metodologia OCDE desde 2024" | **Transfer Pricing: Nova Metodologia OCDE** |
| `holding-familiar-receita-2026` | "Holding Familiar em 2026: O Que a Receita Federal Está Monitorando" | **Holding: O Que a Receita Monitora em 2026** |
| `split-payment-fluxo-caixa` | "Split Payment em 2026: Prepare o Fluxo de Caixa da Sua Empresa" | **Split Payment: Prepare seu Caixa para 2027** |
| `juros-sobre-capital-proprio` | "Juros sobre Capital Próprio em 2026: O Que Mudou com a Lei 14.789" | **JCP em 2026: O Que Mudou com a Lei 14.789** |

---

## Próximos Passos

1. **Implementar covers físicas** para os 20 posts (atualmente todos são placeholders `.jpg`)
2. **Ferramenta recomendada**: Remotion (já disponível na stack Dimus) para geração programática — templates A, B, C como componentes React
3. **Alternativa manual**: Figma template com as 3 variantes + auto-layout
4. **Prioridade**: Wave 2 (8 posts novos) e os 3 ADVs — esses têm mais tráfego potencial
