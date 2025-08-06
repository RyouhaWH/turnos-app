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
        Schema::create('shift_change_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('employee_shift_id')->constrained('employee_shifts')->onDelete('cascade')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete(); // quien hizo el cambio
            $table->string('old_shift', 10)->nullable();
            $table->string('new_shift', 10);
            $table->text('comment')->nullable(); // motivo del cambio o nota adicional
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->timestamp('changed_at')->useCurrent();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shift_change_logs');
    }
};
