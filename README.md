# 🍺 Distribuidora — Sistema de Gestão (Bebidas)

Sistema completo de gestão para **distribuidora de bebidas**: PDV rápido, controle de
estoque, clientes, **fiado (vendas a prazo)** com **cobrança via WhatsApp** e dashboard animado.

> Stack: Laravel 11 + Inertia.js + React + TypeScript + MySQL · Preparado para deploy em **Hostinger**.

---

## ✨ Funcionalidades

### 🛒 PDV (Ponto de Venda)
- Interface estilo caixa, otimizada pra balcão
- Leitura de código de barras (scanner USB que emula teclado)
- Busca por nome / SKU / barcode com autocomplete
- Atalhos: `F1` PDV · `F2` Cliente · `F4` Finalizar · `F8` Limpar · `Esc` Limpar busca
- Pagamento: **Dinheiro / PIX / Crédito / Débito / Fiado** com cálculo de troco
- Cupom não-fiscal instantâneo (HTML + ESC/POS)

### 📓 Fiado (contas a receber) ⭐
- Venda no fiado exige cliente e respeita o **limite de crédito** dele
- Saldo devedor por cliente calculado em tempo real
- **Recebimentos** abatem o saldo com alocação **FIFO** (quita as vendas mais antigas primeiro)
- Painel `/fiado`: total a receber, valor vencido, ranking de devedores e últimos recebimentos
- **Cobrança via WhatsApp**: gera a mensagem pronta com o resumo da dívida e abre o
  `wa.me` com o texto preenchido (sem custo, sem API). Arquitetura preparada pra plugar
  envio automático (Evolution / Cloud API) depois.

### 📦 Estoque
- Cadastro de produtos: nome, SKU, código de barras, categoria, custo, preço
- Débito automático ao vender (com **lock pessimista** — sem overselling em concorrência)
- Histórico de movimentações (entradas, saídas, ajustes)
- Alerta de estoque baixo configurável por produto

### 👤 Clientes
- Cadastro completo (CPF/CNPJ, telefone, WhatsApp, email, endereço) + **limite de crédito**
- Perfil com saldo de fiado, vendas em aberto, histórico de compras e de recebimentos

### 📊 Dashboard (animado)
- Vendas do dia · faturamento do período · **a receber (fiado)** · estoque baixo
- Números com animação de contagem (count-up) e cards com fade-in
- Faturamento diário (área), vendas por categoria (donut), top 5 produtos (barras)
- Maiores devedores do fiado

### 🖨️ Cupom
- HTML imprimível (`@media print` em 80mm) + saída raw ESC/POS pra impressora térmica

---

## 🧱 Arquitetura

```
app/
├─ Http/
│  ├─ Controllers/   Dashboard, Product, Customer, Sale, Fiado, Receipt
│  ├─ Middleware/     HandleInertiaRequests (shared props: store, alerts)
│  └─ Requests/       Form requests (validação)
├─ Models/            User, Product, Customer, Sale, SaleItem, StockMovement, Payment, Category
└─ Services/          SaleService, FiadoService, WhatsappService, StockService, ReceiptPrinter, AlertService
config/store.php       Configs da loja (nome, endereço, vencimento padrão do fiado…)
database/
├─ migrations/         Domínio + fiado (credit_limit, sales.due_date/amount_paid, payments)
└─ seeders/            DatabaseSeeder (catálogo de bebidas, clientes, vendas demo + fiado)
resources/js/
├─ Components/ui/      Button, Input, Card, Table, Dialog, Badge, Select, BrandLogo, Chart
├─ Layouts/AppLayout   Sidebar + topbar (Dashboard, PDV, Vendas, Fiado, Produtos, Clientes)
├─ Pages/
│  ├─ Dashboard        Métricas animadas + gráficos + devedores
│  ├─ Sales/           Index, Show, PDV ⭐
│  ├─ Fiado/Index      Painel de contas a receber
│  ├─ Products/        Index (+ modal de cadastro)
│  └─ Customers/       Index (+ modal) + Show (saldo, recebimento, cobrança)
└─ types/              Tipagem compartilhada
routes/web.php         Rotas Inertia (auth-protected)
```

### Modelo do fiado

- Venda com `payment_method = 'fiado'` fica com `status = 'pending'` e um `due_date`.
- `customers.credit_limit` define o teto; `outstandingBalance()` = Σ(`total − amount_paid`)
  das vendas fiado pendentes; `availableCredit()` = limite − saldo.
- `payments` registra cada recebimento; o `FiadoService` aloca o valor FIFO nas vendas
  mais antigas, incrementando `sales.amount_paid` e marcando como `paid` quando quitada.
- `WhatsappService::buildCharge()` monta o texto da cobrança + link `wa.me`.

---

## 🚀 Setup local

### Pré-requisitos
PHP 8.2+ · Composer 2 · Node 20+ · MySQL/MariaDB 10+

```bash
git clone https://github.com/mateusangels/system_distribuidora.git
cd system_distribuidora

composer install
npm install

cp .env.example .env
php artisan key:generate
# ajuste o STORE_NAME e dados do banco no .env

mysql -uroot -e "CREATE DATABASE distribuidora_local CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
php artisan migrate --seed

npm run dev        # terminal 1 (hot reload)
php artisan serve  # terminal 2 (http://127.0.0.1:8000)
```

### Credenciais demo

| Perfil | Email | Senha |
|---|---|---|
| Admin | `admin@distribuidora.com.br` | `admin1234` |

Abra `/pdv` e bipe `7891991010001` (Skol Lata) pra testar. Pra testar o fiado, escolha um
cliente (F2) e a forma de pagamento **Fiado** no checkout.

---

## 🌐 Deploy na Hostinger

```bash
npm run build
composer install --no-dev --optimize-autoloader
php artisan config:cache && php artisan route:cache && php artisan view:cache
```

1. Crie o banco MySQL pelo painel e anote as credenciais
2. Suba o projeto (File Manager / SFTP) com a pasta `public` apontada pro `public_html`
3. Configure o `.env` de produção (incluindo `STORE_NAME`, `APP_URL`) e rode `php artisan key:generate`
4. Via SSH: `php artisan migrate --force` (e `db:seed --force` se quiser dados demo)

> O `.env.example` traz `STORE_NAME`, `STORE_TAGLINE` e `FIADO_DUE_DAYS_DEFAULT` (vencimento
> padrão do fiado, em dias).

---

## 🎹 Atalhos do PDV

| Tecla | Ação |
|---|---|
| `F1` | Ir pro PDV |
| `F2` | Buscar cliente |
| `F4` | Finalizar / pagamento |
| `F8` | Limpar carrinho |
| `Esc` | Limpar busca |

---

## 🗺️ Próximas iterações

- [ ] Envio automático de cobrança WhatsApp (Evolution API / Cloud API) — interface já preparada
- [ ] Controle de vasilhame/casco retornável
- [ ] Rotas de entrega / pedidos por telefone
- [ ] Relatório DRE mensal com margem
- [ ] PWA + cache offline do PDV
- [ ] Testes automatizados (Pest)

---

## 📄 Licença

Proprietário. Todos os direitos reservados.
