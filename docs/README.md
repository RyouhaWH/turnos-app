# 📚 Documentación del Sistema de Turnos

Bienvenido a la sección de documentación del sistema de turnos. Aquí encontrarás guías, referencias y documentación técnica sobre los endpoints y funcionalidades de la API.

---

## 📖 Documentos Disponibles

### 1. **API con Autenticación por API Key**
   - **Archivo**: [`API_KEY_EMPLOYEE_STATUS.md`](./API_KEY_EMPLOYEE_STATUS.md)
   - **Descripción**: Documentación completa del endpoint `/api/v1/employee-status-external` que permite acceder al estado de empleados usando una API Key
   - **Para quién es**: Desarrolladores de sistemas externos que necesitan integración sin autenticación de sesión
   - **Incluye**: 
     - Ejemplos de uso (cURL, JavaScript, Python, PHP)
     - Estructura de respuesta
     - Códigos de error
     - Parámetros de query

### 3. **Ejemplos de Integración**
   - **Archivo**: [`INTEGRATION_EXAMPLES.md`](./INTEGRATION_EXAMPLES.md)
   - **Descripción**: Ejemplos prácticos de integración en diversos lenguajes y frameworks
   - **Para quién es**: Desarrolladores que necesitan implementar integraciones
   - **Incluye**:
     - Ejemplos en JavaScript, Python, PHP, C#, Bash
     - Casos de uso comunes
     - Consideraciones de rendimiento
     - Configuración de variables de entorno

### 4. **Testing y Verificación**
   - **Archivo**: [`TESTING.md`](./TESTING.md)
   - **Descripción**: Guía completa para probar y verificar el endpoint
   - **Para quién es**: Administradores y desarrolladores QA
   - **Incluye**:
     - Checklist de verificación
     - Pruebas locales con cURL
     - Testing con Postman
     - Scripts de prueba automatizados
     - Testing de rendimiento
     - Troubleshooting

---

## 🚀 Inicio Rápido

### Para Usuarios Externos (Integraciones)

Si necesitas acceder a la información de turnos desde un sistema externo:

1. Lee [`API_KEY_EMPLOYEE_STATUS.md`](./API_KEY_EMPLOYEE_STATUS.md)
2. Solicita una API Key a tu administrador
3. Integra el endpoint en tu sistema usando los ejemplos proporcionados

### Para Administradores

Si necesitas administrar API Keys:

1. Lee [`MANAGING_API_KEYS.md`](./MANAGING_API_KEYS.md)
2. Crea las API Keys necesarias para tus sistemas externos
3. Monitoriza el uso periódicamente

---

## 🔗 Endpoints Disponibles

### Con Autenticación de Sesión (Sanctum)
- `GET /api/user` - Obtener usuario actual
- `GET /api/turnos/rango` - Obtener turnos por rango de fechas

### Con Autenticación por API Key
- `GET /api/v1/employee-status-external` - Obtener estado de empleados

---

## 🔐 Autenticación

El sistema soporta dos tipos de autenticación:

1. **Sanctum (Sesión)**: Para la aplicación web y usuarios autenticados
2. **API Key**: Para sistemas externos e integraciones

Ve a [`API_KEY_EMPLOYEE_STATUS.md`](./API_KEY_EMPLOYEE_STATUS.md) para más detalles sobre autenticación con API Key.

---

## 📊 Estructura de Datos

El endpoint devuelve información sobre el estado de los empleados:

- **Trabajando**: Empleados en turno activo
- **Descanso**: Empleados en franco o libre
- **Ausente**: Empleados en vacaciones, licencia médica, sindical, o administrativo
- **Sin Turno**: Empleados sin turno asignado para el día

---

## 🔧 Requisitos Técnicos

- **PHP**: 8.1 o superior
- **Laravel**: 11.x
- **Base de datos**: Compatible con Laravel (MySQL, PostgreSQL, SQLite)
- **HTTPS**: Recomendado para peticiones a la API

---

## 📝 Formato de Respuesta

Todos los endpoints devuelven JSON con la siguiente estructura:

```json
{
  "success": true/false,
  "data": { /* datos específicos */ },
  "message": "Mensaje descriptivo (si aplica)",
  "error": "Detalles del error (solo en caso de error)"
}
```

---

## 🐛 Reportar Problemas

Si encuentras algún problema o tienes preguntas:

1. Verifica la documentación relevante
2. Consulta la sección de "Solución de Problemas" en el documento específico
3. Contacta con el equipo de desarrollo

---

## 📞 Información de Contacto

- **Email**: [Tu email de soporte]
- **Teléfono**: [Tu teléfono de soporte]
- **Documentación Técnica**: Revisa los comentarios en el código fuente

---

## 🔄 Versionado de Documentación

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 11/03/2026 | Documentación inicial con endpoint de API Key |

---

## 📖 Recursos Adicionales

- [Laravel Documentation](https://laravel.com/docs)
- [API Key Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/API_Key_Cheat_Sheet.html)
- [REST API Design Guide](https://restfulapi.net/)

---

## ✅ Checklist de Implementación

Si estás integrando el endpoint de API Key en tu sistema:

- [ ] Obtuve la API Key de mi administrador
- [ ] He leído la documentación en [`API_KEY_EMPLOYEE_STATUS.md`](./API_KEY_EMPLOYEE_STATUS.md)
- [ ] He probado el endpoint con cURL o Postman
- [ ] He integrado el endpoint en mi código
- [ ] He configurado el almacenamiento seguro de la API Key (variables de entorno)
- [ ] He probado la integración en diferentes escenarios
- [ ] He implementado manejo de errores
- [ ] He configurado reintentos en caso de fallo

---

**Última actualización**: 11 de marzo de 2026

*Para información específica, consulta el documento correspondiente.*
