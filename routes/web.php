<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FiadoController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReceiptController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\TableController;
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

    // Mesas / comandas
    Route::get('/tables', [TableController::class, 'index'])->name('tables.index');
    Route::post('/tables', [TableController::class, 'store'])->name('tables.store');
    Route::get('/tables/{table}', [TableController::class, 'show'])->name('tables.show');
    Route::patch('/tables/{table}', [TableController::class, 'update'])->name('tables.update');
    Route::delete('/tables/{table}', [TableController::class, 'destroy'])->name('tables.destroy');
    Route::post('/tables/{table}/items', [TableController::class, 'addItem'])->name('tables.items.add');
    Route::post('/tables/{table}/customer', [TableController::class, 'setCustomer'])->name('tables.customer');
    Route::post('/tables/{table}/finalize', [TableController::class, 'finalize'])->name('tables.finalize');
    Route::post('/tables/{table}/cancel', [TableController::class, 'cancel'])->name('tables.cancel');
    Route::patch('/table-items/{item}', [TableController::class, 'updateItem'])->name('tables.items.update');
    Route::delete('/table-items/{item}', [TableController::class, 'removeItem'])->name('tables.items.remove');

    // Fiado / contas a receber
    Route::get('/fiado', [FiadoController::class, 'index'])->name('fiado.index');
    Route::post('/fiado', [FiadoController::class, 'storeDebt'])->name('fiado.store');
    Route::post('/customers/{customer}/payments', [FiadoController::class, 'storePayment'])
        ->name('fiado.payment');

    // Customers
    Route::get('/customers/search', [CustomerController::class, 'search'])->name('customers.search');
    Route::post('/customers/quick', [CustomerController::class, 'quickStore'])->name('customers.quick');
    Route::resource('customers', CustomerController::class);

    // Categories (criação rápida via AJAX no form de produto)
    Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');

    // Products
    Route::get('/products/search', [ProductController::class, 'search'])->name('products.search');
    Route::get('/products/{product}/movements', [ProductController::class, 'movements'])
        ->name('products.movements');
    Route::post('/products/{product}/stock', [ProductController::class, 'adjustStock'])
        ->name('products.stock.adjust');
    Route::resource('products', ProductController::class);
});

require __DIR__ . '/auth.php';
