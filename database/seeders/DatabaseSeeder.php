<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use App\Services\SaleService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Auth;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ---------- Usuários ----------
        $admin = User::firstOrCreate(
            ['email' => 'admin@duasrodas.local'],
            [
                'name' => 'Administrador',
                'password' => 'admin123',
                'role' => User::ROLE_ADMIN,
                'email_verified_at' => now(),
            ]
        );

        User::firstOrCreate(
            ['email' => 'caixa@duasrodas.local'],
            [
                'name' => 'Caixa Diogo',
                'password' => 'caixa123',
                'role' => User::ROLE_CASHIER,
                'email_verified_at' => now(),
            ]
        );

        // ---------- Categorias ----------
        $categoryNames = ['Lubrificantes', 'Freios', 'Elétrica', 'Filtros', 'Pneus & Câmaras', 'Acessórios'];
        $categories = collect($categoryNames)->mapWithKeys(fn ($name) => [
            $name => Category::firstOrCreate(['slug' => str()->slug($name)], ['name' => $name]),
        ]);

        // ---------- Produtos ----------
        $catalog = [
            // [sku, barcode, name, cat, cost, price, qty, min, warranty_days]
            ['LUB-001', '7891000100011', 'Óleo Motul 5100 4T 10W40 1L', 'Lubrificantes',  28.00, 49.90, 24,  5,  90],
            ['LUB-002', '7891000100028', 'Óleo Mobil Super Moto 20W50 1L', 'Lubrificantes', 22.00, 39.90, 30, 8,  90],
            ['LUB-003', '7891000100035', 'Aditivo Radiador Bardahl 1L', 'Lubrificantes',   18.00, 32.00, 12,  4,  60],
            ['FRE-010', '7891000200011', 'Pastilha Freio Diant. CG 150', 'Freios',         18.00, 39.90, 20,  6, 180],
            ['FRE-011', '7891000200028', 'Pastilha Freio Tras. Fan 125', 'Freios',         16.00, 34.90, 15,  6, 180],
            ['FRE-012', '7891000200035', 'Disco Freio Diant. XRE 300',   'Freios',         95.00, 189.00, 6,  2, 365],
            ['ELE-020', '7891000300018', 'Vela NGK CR8E',                 'Elétrica',        9.00, 18.50, 50, 12,  60],
            ['ELE-021', '7891000300025', 'Bateria Moura 6Ah CG/Fan',      'Elétrica',      130.00, 219.00, 5,  2, 365],
            ['ELE-022', '7891000300032', 'Lâmpada Farol H4 Philips',      'Elétrica',       14.00, 28.90, 18,  6,  90],
            ['ELE-023', '7891000300049', 'Relé Partida Universal',        'Elétrica',       22.00, 49.90,  9,  3,  90],
            ['FIL-030', '7891000400015', 'Filtro Óleo CG 150/Fan',        'Filtros',         8.00, 17.90, 40, 10,  30],
            ['FIL-031', '7891000400022', 'Filtro Ar XRE 300',             'Filtros',        18.00, 37.50,  8,  3,  30],
            ['FIL-032', '7891000400039', 'Filtro Combustível Universal',  'Filtros',         5.00, 12.90, 25,  8,  30],
            ['PNE-040', '7891000500012', 'Pneu Pirelli MT60 90/90-19',    'Pneus & Câmaras',180.00, 329.00, 4,  2, 180],
            ['PNE-041', '7891000500029', 'Câmara Ar 18" Maggion',         'Pneus & Câmaras', 22.00, 39.90, 10,  4,  60],
            ['ACE-050', '7891000600019', 'Capacete Pro Tork Evolution G4', 'Acessórios',    140.00, 249.00, 3,  1, 365],
            ['ACE-051', '7891000600026', 'Luva Texx X11 Tam M',           'Acessórios',     65.00, 119.00,  6,  2,  90],
            ['ACE-052', '7891000600033', 'Capa Cobrir Moto Impermeável',  'Acessórios',     35.00,  79.90,  2,  3,  60],  // baixo estoque proposital
            ['ACE-053', '7891000600040', 'Cadeado Disco Freio',           'Acessórios',     28.00,  59.90,  1,  3,  90],  // baixo estoque proposital
            ['ACE-054', '7891000600057', 'Bagageiro Universal Inox',      'Acessórios',     85.00, 159.00,  4,  2, 180],
        ];

        foreach ($catalog as [$sku, $barcode, $name, $catName, $cost, $price, $qty, $min, $warr]) {
            Product::firstOrCreate(
                ['sku' => $sku],
                [
                    'barcode' => $barcode,
                    'name' => $name,
                    'category_id' => $categories[$catName]->id,
                    'cost_price' => $cost,
                    'sale_price' => $price,
                    'stock_qty' => $qty,
                    'min_stock_qty' => $min,
                    'warranty_days' => $warr,
                    'active' => true,
                ]
            );
        }

        // ---------- Clientes ----------
        $customers = [
            ['João da Silva',     '111.222.333-44', '(11) 91234-5678', '(11) 91234-5678', 'joao@example.com',     'Rua A, 100 - SP'],
            ['Maria Oliveira',    '222.333.444-55', '(11) 99876-5432', '(11) 99876-5432', 'maria@example.com',    'Av. B, 200 - SP'],
            ['Carlos Mecânico',   null,             '(11) 98765-4321', '(11) 98765-4321', null,                   'Rua C, 300 - SP'],
            ['Ana Couriers',      '333.444.555-66', '(11) 97654-3210', null,              'ana@example.com',      'Rua D, 400 - SP'],
            ['Pedro Motoboy',     null,             '(11) 96543-2109', '(11) 96543-2109', null,                   'Rua E, 500 - SP'],
        ];
        $customerModels = [];
        foreach ($customers as [$name, $doc, $phone, $whats, $email, $addr]) {
            $customerModels[] = Customer::firstOrCreate(
                ['name' => $name],
                ['document' => $doc, 'phone' => $phone, 'whatsapp' => $whats, 'email' => $email, 'address' => $addr]
            );
        }

        // ---------- Vendas demo ----------
        // Autentica como admin pra que SaleService capture user_id
        Auth::login($admin);
        $service = app(SaleService::class);

        $velas = Product::where('sku', 'ELE-020')->first();
        $oleo = Product::where('sku', 'LUB-001')->first();
        $past = Product::where('sku', 'FRE-010')->first();
        $bat = Product::where('sku', 'ELE-021')->first();
        $cap = Product::where('sku', 'ACE-050')->first();

        if ($velas && $oleo) {
            $service->createSale(
                items: [
                    ['product_id' => $velas->id, 'qty' => 2],
                    ['product_id' => $oleo->id, 'qty' => 1],
                ],
                customerId: $customerModels[0]->id,
                payment: ['method' => 'pix'],
            );
        }

        if ($past && $bat) {
            $service->createSale(
                items: [
                    ['product_id' => $past->id, 'qty' => 1],
                    ['product_id' => $bat->id, 'qty' => 1],
                ],
                customerId: $customerModels[1]->id,
                payment: ['method' => 'cash', 'amount_received' => 300],
            );
        }

        if ($cap) {
            $service->createSale(
                items: [['product_id' => $cap->id, 'qty' => 1]],
                customerId: $customerModels[2]->id,
                payment: ['method' => 'credit'],
            );
        }

        Auth::logout();
    }
}
