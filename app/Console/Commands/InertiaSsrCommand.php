<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Symfony\Component\Process\Process;

class InertiaSsrCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inertia:ssr {--build}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Build and start Inertia SSR server';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if ($this->option('build')) {
            $this->buildSsr();
        } else {
            $this->startSsr();
        }
    }

    /**
     * Build the SSR bundle.
     */
    protected function buildSsr()
    {
        $this->info('Building SSR bundle...');

        $process = new Process(['npm', 'run', 'build:ssr']);
        $process->setWorkingDirectory(base_path());
        $process->run();

        if ($process->isSuccessful()) {
            $this->info('SSR bundle built successfully!');
        } else {
            $this->error('Failed to build SSR bundle: ' . $process->getErrorOutput());
        }
    }

    /**
     * Start the SSR server.
     */
    protected function startSsr()
    {
        $this->info('Starting Inertia SSR server...');

        $process = new Process(['node', 'bootstrap/ssr/ssr.mjs']);
        $process->setWorkingDirectory(base_path());
        $process->run();

        if (!$process->isSuccessful()) {
            $this->error('Failed to start SSR server: ' . $process->getErrorOutput());
        }
    }
}
