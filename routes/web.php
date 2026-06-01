<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FiadoController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReceiptController;
use App\Http\Controllers\SaleController;
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

    // Fiado / contas a receber
    Route::get('/fiado', [FiadoController::class, 'index'])->name('fiado.index');
    Route::post('/customers/{customer}/payments', [FiadoController::class, 'storePayment'])
        ->name('fiado.payment');

    // Customers
    Route::get('/customers/search', [CustomerController::class, 'search'])->name('customers.search');
    Route::resource('customers', CustomerController::class);

    // Categories (criação rápida via AJAX no form de produto)
    Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');

    // Products
    Route::get('/products/search', [ProductController::class, 'search'])->name('products.search');
    Route::post('/products/{product}/stock', [ProductController::class, 'adjustStock'])
        ->name('products.stock.adjust');
    Route::resource('products', ProductController::class);
});

require __DIR__ . '/auth.php';
