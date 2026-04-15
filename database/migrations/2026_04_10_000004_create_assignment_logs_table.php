<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignment_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('assignment_id')->nullable()->constrained('employee_assignments')->nullOnDelete();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('assignment_date');           // the date of the assignment being changed
            $table->unsignedBigInteger('old_sector_id')->nullable();
            $table->unsignedBigInteger('new_sector_id')->nullable();
            $table->unsignedBigInteger('old_vehicle_id')->nullable();
            $table->unsignedBigInteger('new_vehicle_id')->nullable();
            $table->string('comment')->nullable();
            $table->timestamp('changed_at')->useCurrent();
            $table->timestamps();

            $table->index(['employee_id', 'assignment_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignment_logs');
    }
};
