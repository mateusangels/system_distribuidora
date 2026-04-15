<?php

namespace App\Http\Middleware;

use App\Services\AlertService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'is_admin' => $user->isAdmin(),
                    'avatar_url' => $user->avatar_url,
                ] : null,
            ],
            'store' => fn () => [
                'name' => config('store.name'),
                'tagline' => config('store.tagline'),
            ],
            'alerts' => fn () => $user
                ? app(AlertService::class)->summary()
                : ['low_stock' => 0, 'warranties_near_expiry' => 0],
            'flash' => fn () => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ];
    }
}
