<?php

return [
    'name' => env('STORE_NAME', 'DUAS RODAS'),
    'tagline' => env('STORE_TAGLINE', 'Autopeças para Motos'),
    'owner' => env('STORE_OWNER', ''),
    'doc' => env('STORE_DOC', ''),
    'address' => env('STORE_ADDRESS', ''),
    'phone' => env('STORE_PHONE', ''),
    'footer' => env('STORE_FOOTER', 'Obrigado pela preferência!'),

    'stock_low_threshold_default' => (int) env('STOCK_LOW_THRESHOLD_DEFAULT', 5),
    'warranty_near_expiry_days' => (int) env('WARRANTY_NEAR_EXPIRY_DAYS', 7),
];
