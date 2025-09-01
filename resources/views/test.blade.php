<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Route</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .test-container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 2rem;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .success-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        .route-info {
            background: rgba(255, 255, 255, 0.1);
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            font-family: monospace;
        }
        .timestamp {
            font-size: 0.9rem;
            opacity: 0.8;
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <div class="test-container">
        <div class="success-icon">✅</div>
        <h1>¡Ruta de Test Funcionando!</h1>
        <p>La ruta <code>/test</code> está funcionando correctamente.</p>

        <div class="route-info">
            <strong>URL:</strong> {{ request()->url() }}<br>
            <strong>Método:</strong> {{ request()->method() }}<br>
            <strong>IP:</strong> {{ request()->ip() }}
        </div>

        <div class="timestamp">
            Generado el: {{ now()->format('d/m/Y H:i:s') }}
        </div>
    </div>
</body>
</html>
