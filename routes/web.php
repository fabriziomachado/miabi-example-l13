<?php

declare(strict_types=1);

use App\Support\SwarmRuntime;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return inertia('Welcome', [
        'app' => config('app.name'),
        'runtime' => SwarmRuntime::identity(),
    ]);
});
