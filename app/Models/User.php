<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /**
     * Check if user is admin
     *
     * @return bool
     */
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is regular user
     *
     * @return bool
     */
    public function isUser()
    {
        return $this->role === 'user';
    }

    /**
     * User permissions
     */
    public function permissions()
    {
        return $this->hasMany(UserPermission::class);
    }

    /**
     * Lấy permission cho một screen cụ thể
     */
    public function getPermissionForScreen($screenCode)
    {
        // Admin có tất cả quyền
        if ($this->isAdmin()) {
            return [
                'can_view' => true,
                'can_create' => true,
                'can_edit' => true,
                'can_delete' => true,
            ];
        }

        $screen = Screen::where('code', $screenCode)->first();
        
        if (!$screen) {
            return [
                'can_view' => false,
                'can_create' => false,
                'can_edit' => false,
                'can_delete' => false,
            ];
        }

        $permission = $this->permissions()
            ->where('screen_id', $screen->id)
            ->first();

        if (!$permission) {
            return [
                'can_view' => false,
                'can_create' => false,
                'can_edit' => false,
                'can_delete' => false,
            ];
        }

        return [
            'can_view' => $permission->can_view,
            'can_create' => $permission->can_create,
            'can_edit' => $permission->can_edit,
            'can_delete' => $permission->can_delete,
        ];
    }

    /**
     * Kiểm tra quyền cụ thể trên một screen
     */
    public function hasPermission($screenCode, $permission = 'can_view')
    {
        // Admin có tất cả quyền
        if ($this->isAdmin()) {
            return true;
        }

        $screen = Screen::where('code', $screenCode)->first();
        
        if (!$screen) {
            return false;
        }

        $userPermission = $this->permissions()
            ->where('screen_id', $screen->id)
            ->first();

        return $userPermission && $userPermission->{$permission};
    }

    /**
     * Kiểm tra có quyền xem màn hình không
     */
    public function canView($screenCode)
    {
        return $this->hasPermission($screenCode, 'can_view');
    }

    /**
     * Kiểm tra có quyền thêm không
     */
    public function canCreate($screenCode)
    {
        return $this->hasPermission($screenCode, 'can_create');
    }

    /**
     * Kiểm tra có quyền sửa không
     */
    public function canEdit($screenCode)
    {
        return $this->hasPermission($screenCode, 'can_edit');
    }

    /**
     * Kiểm tra có quyền xóa không
     */
    public function canDelete($screenCode)
    {
        return $this->hasPermission($screenCode, 'can_delete');
    }

    /**
     * Lấy danh sách các screen_id mà user có quyền xem
     */
    public function getViewableScreenIds()
    {
        if ($this->isAdmin()) {
            return Screen::where('is_active', true)->pluck('id')->toArray();
        }

        return $this->permissions()
            ->where('can_view', true)
            ->pluck('screen_id')
            ->toArray();
    }

    /**
     * Lấy tất cả permissions của user dạng array
     */
    public function getAllPermissions()
    {
        $permissions = [];
        
        foreach ($this->permissions as $permission) {
            $permissions[$permission->screen_id] = [
                'can_view' => $permission->can_view,
                'can_create' => $permission->can_create,
                'can_edit' => $permission->can_edit,
                'can_delete' => $permission->can_delete,
            ];
        }
        
        return $permissions;
    }
}
