<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\RestaurantTable;
use App\Models\User;
use App\Services\FiadoService;
use App\Services\SaleService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Auth;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ---------- Usuários ----------
        $admin = User::firstOrCreate(
            ['email' => 'admin@distribuidora.com.br'],
            [
                'name' => 'Administrador',
                'password' => 'admin1234',
                'role' => User::ROLE_ADMIN,
                'email_verified_at' => now(),
            ]
        );

        // ---------- Categorias ----------
        $categoryNames = ['Cervejas', 'Refrigerantes', 'Águas & Sucos', 'Destilados', 'Energéticos', 'Gelo & Conveniência'];
        $categories = collect($categoryNames)->mapWithKeys(fn ($name) => [
            $name => Category::firstOrCreate(['slug' => str()->slug($name)], ['name' => $name]),
        ]);

        // ---------- Produtos ----------
        $catalog = [
            // [sku, barcode, name, cat, cost, price, qty, min]
            ['CER-001', '7891991010001', 'Skol Lata 350ml',                 'Cervejas',       2.20,  3.99, 240, 48],
            ['CER-002', '7891991010002', 'Brahma Duplo Malte Lata 350ml',   'Cervejas',       2.60,  4.49, 180, 48],
            ['CER-003', '7896045506002', 'Heineken Long Neck 330ml',        'Cervejas',       4.20,  7.50, 120, 36],
            ['CER-004', '7891991010044', 'Antarctica Original 600ml',       'Cervejas',       5.50,  9.90,  60, 24],
            ['CER-005', '7891991010055', 'Budweiser Lata 350ml',            'Cervejas',       2.90,  4.99, 144, 36],
            ['REF-001', '7894900011517', 'Coca-Cola 2L',                    'Refrigerantes',  6.50, 10.90,  72, 18],
            ['REF-002', '7894900011524', 'Coca-Cola Lata 350ml',            'Refrigerantes',  2.10,  3.99, 200, 48],
            ['REF-003', '7891991011003', 'Guaraná Antarctica 2L',          'Refrigerantes',  5.20,  8.90,  60, 18],
            ['REF-004', '7894900700046', 'Fanta Laranja 2L',                'Refrigerantes',  5.00,  8.50,  48, 12],
            ['AGU-001', '7896079200012', 'Água Mineral 500ml',              'Águas & Sucos',  0.70,  2.00, 300, 60],
            ['AGU-002', '7896079200029', 'Água com Gás 500ml',              'Águas & Sucos',  0.90,  2.50, 120, 36],
            ['SUC-001', '7894900536001', 'Suco Del Valle Uva 1L',           'Águas & Sucos',  4.00,  7.90,  40, 12],
            ['DES-001', '7893218000016', 'Vodka Smirnoff 998ml',            'Destilados',    22.00, 36.90,  24,  6],
            ['DES-002', '5000267023656', 'Whisky Red Label 1L',             'Destilados',    65.00, 99.90,  12,  4],
            ['DES-003', '7896001500013', 'Cachaça 51 965ml',                'Destilados',     7.50, 13.90,  30,  8],
            ['ENE-001', '90162602',       'Red Bull 250ml',                  'Energéticos',    5.50,  9.90,  72, 24],
            ['ENE-002', '7898948713006', 'Monster Energy 473ml',            'Energéticos',    6.20, 11.50,  48, 12],
            ['GEL-001', '2000000000015', 'Gelo em Cubo 5kg',                'Gelo & Conveniência', 4.00, 9.00, 40, 10],
            ['CON-001', '2000000000022', 'Carvão 3kg',                       'Gelo & Conveniência', 7.00, 14.90,  8,  6], // baixo proposital
            ['CON-002', '2000000000039', 'Copo Descartável 200ml (50un)',   'Gelo & Conveniência', 3.50,  7.90,  5,  6], // baixo proposital
        ];

        foreach ($catalog as [$sku, $barcode, $name, $catName, $cost, $price, $qty, $min]) {
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
                    'warranty_days' => 0,
                    'active' => true,
                ]
            );
        }

        // ---------- Embalagens (caixa/fardo) ----------
        // [sku => [unit_label, pack_label, pack_size, pack_price (null = automático)]]
        $packs = [
            'CER-001' => ['lata', 'Fardo', 12, null],    // Skol — fardo de 12, preço automático
            'CER-002' => ['lata', 'Fardo', 12, 49.90],   // Brahma — fardo c/ preço de atacado
            'CER-003' => ['long neck', 'Caixa', 24, 160.00], // Heineken — caixa de 24
            'CER-005' => ['lata', 'Fardo', 12, null],    // Budweiser
            'REF-002' => ['lata', 'Fardo', 12, 42.00],   // Coca lata — fardo de 12
            'AGU-001' => ['un', 'Fardo', 12, 20.00],     // Água — fardo de 12
            'ENE-001' => ['un', 'Caixa', 24, null],      // Red Bull — caixa de 24
        ];
        foreach ($packs as $sku => [$unit, $label, $size, $packPrice]) {
            Product::where('sku', $sku)->update([
                'unit_label' => $unit,
                'pack_label' => $label,
                'pack_size' => $size,
                'pack_price' => $packPrice,
            ]);
        }

        // ---------- Clientes ----------
        $customers = [
            // [name, doc, phone, whatsapp, email, address, credit_limit]
            ['Bar do Zé',          '12.345.678/0001-90', '(61) 99111-2233', '(61) 99111-2233', 'bardoze@example.com', 'QD 10 Lote 5 - Ceilândia', 500.00],
            ['Mercearia da Maria',  '23.456.789/0001-01', '(61) 99222-3344', '(61) 99222-3344', null,                 'Av. Central, 200',         300.00],
            ['João da Esquina',     '111.222.333-44',     '(61) 99333-4455', '(61) 99333-4455', null,                 'Rua 3, Casa 12',            150.00],
            ['Lanchonete Sabor',    '34.567.890/0001-12', '(61) 99444-5566', null,              'sabor@example.com',  'Setor Comercial, Loja 8',     0.00],
            ['Consumidor Avulso',   null,                 '(61) 99555-6677', '(61) 99555-6677', null,                 null,                          0.00],
        ];
        $customerModels = [];
        foreach ($customers as [$name, $doc, $phone, $whats, $email, $addr, $limit]) {
            $customerModels[] = Customer::firstOrCreate(
                ['name' => $name],
                ['document' => $doc, 'phone' => $phone, 'whatsapp' => $whats, 'email' => $email, 'address' => $addr, 'credit_limit' => $limit]
            );
        }

        // ---------- Mesas ----------
        for ($i = 1; $i <= 8; $i++) {
            RestaurantTable::firstOrCreate(
                ['name' => "Mesa $i"],
                ['capacity' => 4, 'status' => RestaurantTable::STATUS_FREE]
            );
        }

        // ---------- Vendas demo ----------
        Auth::login($admin);
        $service = app(SaleService::class);
        $fiado = app(FiadoService::class);

        $skol = Product::where('sku', 'CER-001')->first();
        $coca = Product::where('sku', 'REF-001')->first();
        $heineken = Product::where('sku', 'CER-003')->first();
        $vodka = Product::where('sku', 'DES-001')->first();
        $agua = Product::where('sku', 'AGU-001')->first();

        // À vista (PIX)
        if ($skol && $coca) {
            $service->createSale(
                items: [
                    ['product_id' => $skol->id, 'qty' => 12],
                    ['product_id' => $coca->id, 'qty' => 2],
                ],
                customerId: $customerModels[4]->id,
                payment: ['method' => 'pix'],
            );
        }

        // À vista (dinheiro com troco)
        if ($heineken && $agua) {
            $service->createSale(
                items: [
                    ['product_id' => $heineken->id, 'qty' => 6],
                    ['product_id' => $agua->id, 'qty' => 6],
                ],
                customerId: $customerModels[2]->id,
                payment: ['method' => 'cash', 'amount_received' => 100],
            );
        }

        // Fiado — Bar do Zé (com vencimento e recebimento parcial)
        if ($skol && $vodka) {
            $fiadoSale = $service->createSale(
                items: [
                    ['product_id' => $skol->id, 'qty' => 24],
                    ['product_id' => $vodka->id, 'qty' => 2],
                ],
                customerId: $customerModels[0]->id,
                payment: ['method' => 'fiado', 'due_date' => now()->addDays(15)->toDateString()],
            );

            // Recebimento parcial do fiado
            $fiado->registerPayment(
                customer: $customerModels[0],
                amount: 50.00,
                method: 'pix',
                notes: 'Adiantamento',
            );
        }

        // Fiado vencido — Mercearia da Maria (para popular alertas/dashboard)
        if ($coca && $heineken) {
            $service->createSale(
                items: [
                    ['product_id' => $coca->id, 'qty' => 6],
                    ['product_id' => $heineken->id, 'qty' => 12],
                ],
                customerId: $customerModels[1]->id,
                payment: ['method' => 'fiado', 'due_date' => now()->subDays(5)->toDateString()],
            );
        }

        Auth::logout();
    }
}
