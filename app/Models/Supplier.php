<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'contact_name', 'phone', 'email', 'address'];

    public function stockLogs(): HasMany
    {
        return $this->hasMany(StockLog::class);
    }
}
