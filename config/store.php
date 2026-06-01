<?php

return [
    'name' => env('STORE_NAME', 'Adega Responsa'),
    'tagline' => env('STORE_TAGLINE', 'Distribuidora de Bebidas · GO'),
    'owner' => env('STORE_OWNER', ''),
    'doc' => env('STORE_DOC', ''),
    'address' => env('STORE_ADDRESS', ''),
    'phone' => env('STORE_PHONE', ''),
    'footer' => env('STORE_FOOTER', 'Obrigado pela preferência!'),

    'stock_low_threshold_default' => (int) env('STOCK_LOW_THRESHOLD_DEFAULT', 5),

    // Fiado / contas a receber
    'fiado_due_days_default' => (int) env('FIADO_DUE_DAYS_DEFAULT', 30),
];
