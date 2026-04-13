# 🏍️ DUAS RODAS — Sistema de Gestão (Moto Peças)

Sistema completo de gestão para loja de autopeças de motos do cliente **Diogo**.
Foco em PDV rápido, controle de estoque, clientes e garantias.

> Projeto desenvolvido por **Angels** · Stack: Laravel 11 + Inertia.js + React + TypeScript + MySQL · Preparado para deploy em **Hostinger**.

---

## ✨ Funcionalidades

### 🛒 PDV (Ponto de Venda)
- Interface estilo caixa de mercado, otimizada pra uso rápido no balcão
- Leitura de código de barras (scanner USB que emula teclado)
- Busca por nome / SKU / barcode com autocomplete
- Atalhos de teclado: `F1` PDV · `F2` Cliente · `F4` Finalizar · `F8` Limpar · `Esc` Limpar busca
- Carrinho com ajuste de quantidade inline
- Modal de pagamento (Dinheiro / PIX / Crédito / Débito) com cálculo de troco
- Geração instantânea de cupom não-fiscal (HTML + ESC/POS)

### 📦 Estoque
- Cadastro de produtos: nome, SKU, código de barras, categoria, custo, preço, garantia
- Débito automático de estoque ao vender (com **lock pessimista** — sem overselling em concorrência)
- Histórico completo de movimentações (entradas, saídas, ajustes)
- Alerta visual de estoque baixo configurável por produto

### 👤 Clientes
- Cadastro completo (CPF/CNPJ, telefone, WhatsApp, email, endereço)
- Histórico de compras por cliente
- Busca rápida para identificar no PDV

### 🛡️ Garantias
- Criação automática ao vender produtos com garantia configurada
- Vínculo automático cliente ↔ produto ↔ venda
- Alerta de garantias vencendo em ≤ 7 dias (configurável)
- Notificação simulada via WhatsApp

### 📊 Dashboard
- Vendas do dia · acumulado do mês · contador de alertas
- Top 5 produtos mais vendidos (últimos 30 dias)
- Lista de estoque baixo e garantias vencendo

### 🖨️ Cupom fiscal
- HTML imprimível (`@media print` em 80mm)
- Saída raw ESC/POS pra impressora térmica (init · center · bold · cut)
- Compatível com daemons locais tipo PrintNode

---

## 🧱 Arquitetura

```
Moto_Pecas/
├─ app/
│  ├─ Http/
│  │  ├─ Controllers/       Dashboard, Product, Customer, Sale, Warranty, Receipt
│  │  ├─ Middleware/        HandleInertiaRequests (shared props)
│  │  └─ Requests/          Form requests (validação)
│  ├─ Models/               User, Product, Customer, Sale, SaleItem, StockMovement, Warranty, Category
│  └─ Services/             SaleService, StockService, ReceiptPrinter, AlertService
├─ config/store.php         Configs da loja (nome, CNPJ, endereço…)
├─ database/
│  ├─ migrations/           7 migrations de domínio (2026_04_13_*)
│  └─ seeders/              DatabaseSeeder (2 users, 20 produtos, 5 clientes, 3 vendas demo)
├─ resources/
│  ├─ js/
│  │  ├─ Components/ui/     Button, Input, Card, Table, Dialog, Badge, Toast
│  │  ├─ hooks/             use-shortcut, use-flash
│  │  ├─ Layouts/           AppLayout (sidebar + topbar dark)
│  │  ├─ lib/format.ts      brl(), dateBr(), cn() etc
│  │  ├─ Pages/
│  │  │  ├─ Auth/Login      Tema dark customizado
│  │  │  ├─ Dashboard       Métricas + top produtos + alertas
│  │  │  ├─ Products/       Index + Form (admin)
│  │  │  ├─ Customers/      Index + Form + Show (histórico)
│  │  │  ├─ Sales/          Index, Show, PDV ⭐
│  │  │  └─ Warranties/     Index + notificar + marcar usada
│  │  └─ types/             Tipagem compartilhada (Product, Sale, etc.)
│  ├─ css/app.css           Tailwind + Inter + dark theme
│  └─ views/
│     ├─ app.blade.php      Root Inertia
│     └─ receipts/show      Cupom HTML imprimível
├─ routes/web.php           Rotas Inertia (tudo auth-protected)
└─ .env.example             Template de configuração
```

### Fluxo de uma venda

```
[Scanner bipa código] → POST /sales (JSON)
   └─ StoreSaleRequest (valida)
       └─ SaleService::createSale() em transação
           ├─ cria sale (status open)
           ├─ pra cada item:
           │    ├─ lockForUpdate no product
           │    ├─ cria sale_item (snapshot de nome/sku/preço)
           │    ├─ StockService::move(OUT) + balance_after
           │    └─ cria warranty (se warranty_days > 0)
           └─ atualiza sale (total, paid, change_due, status=paid)
   └─ Resposta JSON ao frontend
   └─ Modal de troco + botão "Imprimir cupom"
```

---

## 🚀 Setup local (XAMPP Windows)

### Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| PHP | 8.2 |
| Composer | 2.x |
| Node | 20+ |
| MySQL / MariaDB | 10.x (vem com XAMPP) |

### Passos

```bash
# 1. Clonar
git clone https://github.com/mateusangels/Moto_Pe-as.git
cd Moto_Pe-as

# 2. Dependências
composer install
npm install --legacy-peer-deps

# 3. Env
cp .env.example .env
php artisan key:generate
# edite .env se precisar (DB, dados da loja, etc)

# 4. Database
# Inicie o MySQL do XAMPP (Control Panel ou C:\xampp\mysql_start.bat)
mysql -uroot -e "CREATE DATABASE moto_pecas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
php artisan migrate --seed

# 5. Assets + servidor
npm run dev      # terminal 1 (hot reload)
php artisan serve  # terminal 2 (http://127.0.0.1:8000)
```

### Credenciais demo

| Perfil | Email | Senha |
|---|---|---|
| Admin | `admin@duasrodas.local` | `admin123` |
| Caixa | `caixa@duasrodas.local` | `caixa123` |

Depois de logar, abra `http://127.0.0.1:8000/pdv` e bipe o código `7891000300018` pra testar.

---

## 🌐 Deploy na Hostinger (compartilhada)

### 1. Preparar pacote local

```bash
npm run build
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 2. No painel Hostinger

1. Criar banco MySQL (ex: `u123_motopecas`) pelo painel
2. Criar usuário MySQL e anotar credenciais
3. Subir todos os arquivos via **File Manager** ou **FTP/SFTP** pra `domains/seudominio/` (fora do public_html)

### 3. Apontar `public_html`

**Opção A — renomear `public/` pra `public_html/`** (método clássico):
```bash
# Na Hostinger, sua árvore deve ficar assim:
/home/u123/
├── domains/seudominio.com/
│   └── laravel/       <-- TODO o projeto menos a pasta public
└── public_html/       <-- conteúdo da pasta public do Laravel
```

No `public_html/index.php`, ajuste os 2 `require`s pra apontar pro `laravel/`:
```php
require __DIR__.'/../domains/seudominio.com/laravel/vendor/autoload.php';
$app = require_once __DIR__.'/../domains/seudominio.com/laravel/bootstrap/app.php';
```

**Opção B — .htaccess na raiz** (mais simples):
Coloque tudo em `public_html/` e crie um `.htaccess` na raiz:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
```

### 4. `.env` de produção

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://seudominio.com

DB_HOST=localhost
DB_DATABASE=u123_motopecas
DB_USERNAME=u123_diogo
DB_PASSWORD=***

SESSION_DRIVER=database
```

### 5. Rodar migrations em produção (uma vez)

Via **SSH** no painel Hostinger:
```bash
php artisan migrate --force
php artisan db:seed --force   # se quiser dados demo
```

### 6. Cron (opcional)

Se quiser agendamento automático de expiração de garantias etc:
```
* * * * * cd /home/u123/domains/seudominio.com/laravel && php artisan schedule:run >> /dev/null 2>&1
```

---

## 🎹 Atalhos do PDV

| Tecla | Ação |
|---|---|
| `F1` | Ir pro PDV |
| `F2` | Abrir busca de cliente |
| `F4` | Finalizar / abrir pagamento |
| `F8` | Limpar carrinho |
| `Esc` | Limpar campo de busca |
| `Enter` no campo busca | Buscar exato (ideal pra scanner) |
| `+` / `−` no item | Ajustar quantidade |

---

## 🔒 Segurança

- Auth via sessões Laravel (CSRF + SameSite cookies)
- Bcrypt 12 rounds (configurável em `.env`)
- Form Requests validam TODO input de usuário
- Transações DB + lock pessimista previnem overselling
- Role-based (admin vs caixa): caixa só vê PDV/listagens, admin gerencia produtos
- Inertia preserva CSRF automaticamente via `XSRF-TOKEN` cookie

---

## 🗺️ Próximas iterações

- [ ] Multi-loja (adicionar `tenant_id` nas tabelas principais)
- [ ] Integração real WhatsApp Business API / Twilio
- [ ] PWA + cache offline do PDV
- [ ] Cupom fiscal (SAT / NFC-e) via integração certificada
- [ ] Cron pra marcar garantias como `expired` automaticamente
- [ ] Dashboard com gráficos (Recharts)
- [ ] Relatório DRE mensal com margem bruta
- [ ] Importação CSV de produtos (migração inicial de planilha Excel)
- [ ] Testes automatizados (PHPUnit + Pest)

---

## 📄 Licença

Proprietário. Todos os direitos reservados a **Angels** e cliente **Diogo (DUAS RODAS)**.
