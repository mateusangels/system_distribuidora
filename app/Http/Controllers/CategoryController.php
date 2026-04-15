<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    /** Cria uma categoria via AJAX (usado pelo "+ nova categoria" no form de produto). */
    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403, 'Apenas administradores podem cadastrar categorias.');

        $data = $request->validate([
            'name' => [
                'required',
                'string',
                'max:80',
                Rule::unique('categories', 'name'),
            ],
        ]);

        $category = Category::create(['name' => $data['name']]);

        return response()->json([
            'id' => $category->id,
            'name' => $category->name,
        ], 201);
    }
}
