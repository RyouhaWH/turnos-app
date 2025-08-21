<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rols', function (Blueprint $table) {
            $table->string('color')->default('#3B82F6')->after('is_operational');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rols', function (Blueprint $table) {
            $table->dropColumn('color');
        });
    }
};
