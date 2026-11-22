<?php

namespace App\Http\Middleware;

use App\Models\Screen;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ] : null,
            ],
            'userPermissions' => $user ? $this->getUserPermissions($user) : [],
            'menuScreens' => $user ? $this->getMenuScreens($user) : [],
            // Số thông báo chưa đọc cho chuông (1 truy vấn COUNT mỗi lần tải trang)
            'thongBaoChuaDoc' => fn () => $user ? $user->unreadNotifications()->count() : 0,
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'import_result' => $request->session()->get('import_result'),
            ],
        ]);
    }

    /**
     * Lấy permissions của user hiện tại
     */
    private function getUserPermissions($user)
    {
        if ($user->isAdmin()) {
            // Admin có tất cả quyền
            $screens = Screen::where('is_active', true)->get();
            $permissions = [];
            foreach ($screens as $screen) {
                $permissions[$screen->code] = [
                    'can_view' => true,
                    'can_create' => true,
                    'can_edit' => true,
                    'can_delete' => true,
                    'can_regenerate_qr' => true,
                    'can_import' => true,
                    'can_export' => true,
                ];
            }
            return $permissions;
        }

        // User thường - lấy từ database
        $permissions = [];
        foreach ($user->permissions as $permission) {
            $screen = $permission->screen;
            if ($screen) {
                $permissions[$screen->code] = [
                    'can_view' => $permission->can_view,
                    'can_create' => $permission->can_create,
                    'can_edit' => $permission->can_edit,
                    'can_delete' => $permission->can_delete,
                    'can_regenerate_qr' => $permission->can_regenerate_qr,
                    'can_import' => $permission->can_import,
                    'can_export' => $permission->can_export,
                ];
            }
        }
        return $permissions;
    }

    /**
     * Lấy menu screens mà user có quyền xem
     */
    private function getMenuScreens($user)
    {
        $viewableScreenCodes = [];

        if ($user->isAdmin()) {
            // Admin xem được tất cả
            $viewableScreenCodes = Screen::where('is_active', true)
                ->pluck('code')
                ->toArray();
        } else {
            // User thường - chỉ những màn hình có quyền view
            $viewableScreenCodes = $user->permissions()
                ->where('can_view', true)
                ->with('screen')
                ->get()
                ->pluck('screen.code')
                ->filter()
                ->toArray();
        }

        // Lấy tree screens và filter theo quyền
        $screens = Screen::whereNull('parent_id')
            ->where('is_active', true)
            ->where('is_menu', true)
            ->orderBy('order')
            ->with(['children' => function ($query) {
                $query->where('is_active', true)
                    ->where('is_menu', true)
                    ->orderBy('order');
            }])
            ->get();

        return $this->filterScreensByPermission($screens, $viewableScreenCodes);
    }

    /**
     * Filter screens theo quyền của user
     */
    private function filterScreensByPermission($screens, $viewableScreenCodes)
    {
        $result = [];

        foreach ($screens as $screen) {
            // Nếu màn hình có children
            if ($screen->children && $screen->children->count() > 0) {
                $filteredChildren = [];
                
                foreach ($screen->children as $child) {
                    if (in_array($child->code, $viewableScreenCodes)) {
                        $filteredChildren[] = [
                            'id' => $child->id,
                            'name' => $child->name,
                            'code' => $child->code,
                            'route' => $child->route,
                            'icon' => $child->icon,
                        ];
                    }
                }

                // Chỉ thêm parent nếu có ít nhất 1 child có quyền
                if (count($filteredChildren) > 0) {
                    $result[] = [
                        'id' => $screen->id,
                        'name' => $screen->name,
                        'code' => $screen->code,
                        'route' => $screen->route,
                        'icon' => $screen->icon,
                        'children' => $filteredChildren,
                    ];
                }
            } else {
                // Màn hình đơn (không có children) - kiểm tra quyền trực tiếp
                if (in_array($screen->code, $viewableScreenCodes)) {
                    $result[] = [
                        'id' => $screen->id,
                        'name' => $screen->name,
                        'code' => $screen->code,
                        'route' => $screen->route,
                        'icon' => $screen->icon,
                        'children' => [],
                    ];
                }
            }
        }

        return $result;
    }
}
