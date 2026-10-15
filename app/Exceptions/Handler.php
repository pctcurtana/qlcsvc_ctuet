<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\QueryException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;
use Illuminate\Support\Facades\Log;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that are not reported.
     *
     * @var array
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed for validation exceptions.
     *
     * @var array
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     *
     * @return void
     */
    public function register()
    {
        // Handle ResourceNotFoundException
        $this->renderable(function (ResourceNotFoundException $e, $request) {
            Log::warning('Resource not found: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => $e->getMessage(),
                    'error' => 'ResourceNotFound'
                ], 404);
            }
            
            return redirect()->back()->with('error', $e->getMessage());
        });

        // Handle RepositoryException
        $this->renderable(function (RepositoryException $e, $request) {
            Log::error('Repository error: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => $e->getMessage(),
                    'error' => 'RepositoryError'
                ], 500);
            }
            
            return redirect()->back()->with('error', $e->getMessage());
        });

        // Handle ServiceException
        $this->renderable(function (ServiceException $e, $request) {
            Log::error('Service error: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => $e->getMessage(),
                    'error' => 'ServiceError'
                ], 500);
            }
            
            return redirect()->back()->with('error', $e->getMessage());
        });

        // Handle ModelNotFoundException
        $this->renderable(function (ModelNotFoundException $e, $request) {
            Log::warning('Model not found: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Không tìm thấy dữ liệu',
                    'error' => 'ModelNotFound'
                ], 404);
            }
            
            return redirect()->back()->with('error', 'Không tìm thấy dữ liệu');
        });

        // Handle QueryException (Database errors)
        $this->renderable(function (QueryException $e, $request) {
            Log::error('Database query error: ' . $e->getMessage(), [
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings()
            ]);

            $message = 'Lỗi khi thao tác với cơ sở dữ liệu';
            
            // Check for specific database errors
            if (strpos($e->getMessage(), 'foreign key constraint') !== false) {
                $message = 'Không thể xóa vì dữ liệu đang được sử dụng ở nơi khác';
            } elseif (strpos($e->getMessage(), 'Duplicate entry') !== false) {
                $message = 'Dữ liệu đã tồn tại trong hệ thống';
            }
            
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => $message,
                    'error' => 'DatabaseError'
                ], 500);
            }
            
            return redirect()->back()->withInput()->with('error', $message);
        });

        // Handle general exceptions
        $this->reportable(function (Throwable $e) {
            Log::error('Unhandled exception: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
        });

        // Handle ThrottleRequestsException (Rate Limit)
        // Handle ThrottleRequestsException (Rate Limit)
        $this->renderable(function (ThrottleRequestsException $e, $request) {
            // Login
            if ($request->is('login') || $request->routeIs('login')) {
                return redirect()
                    ->route('login')
                    ->with('error', 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.');
            }

            // AI insight
            if ($request->is('ai/insight') || $request->routeIs('ai.insight')) {
                return response()->json([
                    'message' => 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.',
                ], 429);
            }
        });
    }
}
