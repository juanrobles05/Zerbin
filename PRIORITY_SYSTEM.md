# Sistema de Priorización por Tiempo de Descomposición

Este documento describe la implementación del sistema de priorización automática de residuos basado en su tiempo estimado de descomposición para el proyecto Zerbin.

## Funcionalidad Implementada

### 1. Identificación de Residuos de Descomposición Rápida ✅

- **Clasificaciones por defecto**: El sistema incluye tiempos de descomposición para tipos comunes de residuos:
  - Orgánicos: 7 días (Prioridad ALTA)
  - Alimentos: 14 días (Prioridad ALTA)
  - Papel: 90 días (Prioridad MEDIA)
  - Cartón: 60 días (Prioridad MEDIA)
  - Plástico: ~5 años (Prioridad BAJA)
  - Vidrio: ~1000 años (Prioridad BAJA)
  - Metal: ~50 años (Prioridad BAJA)

- **Detección automática**: El sistema analiza el tipo de residuo clasificado por IA y asigna automáticamente la prioridad correspondiente.

### 2. Asignación Automática de Prioridad ✅

- **Niveles de prioridad**:
  - **ALTA (3)**: ≤ 7 días de descomposición
  - **MEDIA (2)**: 8-365 días de descomposición  
  - **BAJA (1)**: > 365 días de descomposición

- **Criterios de asignación**:
  - Se basa en el tiempo estimado de descomposición del material
  - Los residuos orgánicos y alimentarios reciben automáticamente alta prioridad
  - El sistema incluye fallbacks para tipos no reconocidos

### 3. Generación de Alertas para Casos Urgentes ✅

- **Criterios para alertas**:
  - Prioridad ALTA (nivel 3)
  - Confianza de IA ≥ 70% (configurable)

- **Tipos de alerta implementados**:
  - Logs críticos en el servidor
  - Marcadores visuales en la interfaz de usuario
  - Preparado para integración con sistemas de notificación externos

## Componentes Técnicos

### Backend

#### Modelos de Datos
- **`WasteClassification`**: Almacena tipos de residuos con sus tiempos de descomposición
- **`Report`**: Campo `priority` actualizado para almacenar nivel de prioridad

#### Servicios
- **`PriorityService`**: Lógica central de priorización
- **`ReportService`**: Actualizado para integrar priorización automática

#### APIs
- **`/api/v1/reports/urgent`**: Obtener reportes de alta prioridad
- **`/api/v1/reports/priority/{level}`**: Filtrar reportes por nivel de prioridad
- **`/api/v1/priority/classifications`**: Gestionar clasificaciones de residuos
- **`/api/v1/priority/priority-stats`**: Estadísticas de priorización

### Frontend

#### Componentes
- **`PriorityIndicator`**: Componente reutilizable para mostrar niveles de prioridad
- **`DecompositionTime`**: Muestra tiempo estimado de descomposición
- **`ReportScreen`**: Actualizada para mostrar información de prioridad automática

#### Funcionalidades
- Indicadores visuales de prioridad con código de colores
- Alertas visuales para residuos urgentes
- Información de tiempo de descomposición

## Configuración

### Variables de Entorno
```env
CONFIDENCE_THRESHOLD=0.7  # Umbral mínimo de confianza para generar alertas
```

### Inicialización
```bash
# Ejecutar script de inicialización de base de datos
cd backend
python init_db.py
```

## Uso

### Para Usuarios
1. **Reportar residuo**: Tomar foto y enviar reporte como siempre
2. **Ver prioridad**: El sistema automáticamente muestra:
   - Nivel de prioridad (ALTA/MEDIA/BAJA)
   - Tiempo estimado de descomposición
   - Alerta visual si es urgente

### Para Administradores
1. **Ver reportes urgentes**: `GET /api/v1/reports/urgent`
2. **Filtrar por prioridad**: `GET /api/v1/reports/priority/3`
3. **Estadísticas**: `GET /api/v1/priority/priority-stats`

## Criterios de Aceptación

### ✅ Identificar residuos de descomposición rápida
- El sistema identifica automáticamente residuos orgánicos y alimentarios
- Detección por palabras clave para casos no clasificados
- Base de datos con tiempos de descomposición precargados

### ✅ Asignación automática de alta prioridad
- Algoritmo automático basado en tiempo de descomposición
- Tres niveles de prioridad bien definidos
- Integración con el proceso de creación de reportes

### ✅ Generación de alertas para casos urgentes
- Sistema de logs para alertas críticas
- Indicadores visuales en la interfaz
- Configuración de umbral de confianza
- Preparado para notificaciones externas

## Próximas Mejoras

1. **Integración con servicios de notificación**:
   - Email automático a empresas recolectoras
   - Notificaciones push a administradores
   - Integración con sistemas municipales

2. **Machine Learning avanzado**:
   - Refinamiento de tiempos de descomposición basado en datos reales
   - Consideración de factores ambientales (clima, ubicación)

3. **Dashboard administrativo**:
   - Panel de control para gestionar alertas
   - Métricas y estadísticas de priorización
   - Gestión de clasificaciones de residuos

## Pruebas

El sistema incluye pruebas unitarias para:
- Cálculo de prioridades
- Detección de palabras clave
- Generación de alertas
- Fallbacks para casos no reconocidos

```bash
# Ejecutar pruebas
cd backend
python -m pytest app/tests/services/test_priority_service.py -v
```