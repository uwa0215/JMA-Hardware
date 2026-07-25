<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (config('app.env') !== 'local') {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        Vite::prefetch(concurrency: 3);

        // Auto-initialize SQLite database in /tmp if running on Vercel
        try {
            if (config('database.default') === 'sqlite') {
                $dbPath = config('database.connections.sqlite.database');
                if (is_string($dbPath) && str_starts_with($dbPath, '/tmp/') && !file_exists($dbPath)) {
                    $dir = dirname($dbPath);
                    if (!file_exists($dir)) {
                        mkdir($dir, 0755, true);
                    }
                    touch($dbPath);
                    
                    \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
                    \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
                }
            }
        } catch (\Throwable $e) {
            error_log('SQLite auto-initialization failed: ' . $e->getMessage());
        }
    }
}
