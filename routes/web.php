<?php

use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReceiptController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\WarrantyController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return Auth::check() ? redirect()->route('dashboard') : redirect()->route('login');
});

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    // Profile (Breeze)
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // PDV
    Route::get('/pdv', [SaleController::class, 'pdv'])->name('pdv');
    Route::post('/sales', [SaleController::class, 'store'])->name('sales.store');
    Route::get('/sales', [SaleController::class, 'index'])->name('sales.index');
    Route::get('/sales/{sale}', [SaleController::class, 'show'])->name('sales.show');
    Route::post('/sales/{sale}/cancel', [SaleController::class, 'cancel'])->name('sales.cancel');

    // Cupom
    Route::get('/sales/{sale}/receipt', [ReceiptController::class, 'show'])->name('receipts.show');

    // Customers
    Route::get('/customers/search', [CustomerController::class, 'search'])->name('customers.search');
    Route::resource('customers', CustomerController::class);

    // Products
    Route::get('/products/search', [ProductController::class, 'search'])->name('products.search');
    Route::post('/products/{product}/stock', [ProductController::class, 'adjustStock'])
        ->name('products.stock.adjust');
    Route::resource('products', ProductController::class);

    // Warranties
    Route::get('/warranties', [WarrantyController::class, 'index'])->name('warranties.index');
    Route::post('/warranties/{warranty}/used', [WarrantyController::class, 'markUsed'])
        ->name('warranties.used');
    Route::post('/warranties/{warranty}/notify', [WarrantyController::class, 'notify'])
        ->name('warranties.notify');
});

require __DIR__ . '/auth.php';
