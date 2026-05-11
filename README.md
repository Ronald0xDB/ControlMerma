# ControlMerma: Sistema de Business Intelligence e Inventarios

**ControlMerma** es una plataforma Full Stack diseñada para transformar la gestión operativa y analítica de destilerías y comercios de licores. El sistema digitaliza el control de mermas, eliminando los registros en papel y proporcionando una capa de **Inteligencia de Negocios (BI)** para la toma de decisiones estratégicas.

---

## El Problema y la Solución

### El Problema
En la industria de licores local, el control de mermas (pérdidas de líquido o producto) se realiza tradicionalmente de forma manual. Esto conlleva:
* **Falta de Trazabilidad:** Imposibilidad de auditar quién y cuándo realizó un conteo.
* **Errores de Cálculo:** Inconsistencias matemáticas en el inventario inicial vs. final.
* **Punto Ciego Financiero:** Los propietarios no conocen el valor real de sus pérdidas hasta cierres mensuales.

### La Solución
**ControlMerma** centraliza la operación en un ecosistema digital robusto:
1.  **Captura Eficiente:** Los operadores registran inventarios físicos desde dispositivos móviles con validaciones inmediatas.
2.  **Motor de BI:** Transformación de datos crudos en indicadores visuales (KPIs) sobre el estado del inventario y mermas críticas.
3.  **Seguridad de Grado Profesional:** Gestión de roles y bitácora de actividades para auditoría constante.

---

## Stack Tecnológico

| Capa | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend** | **React.js + Vite** | SPA reactiva y de alto rendimiento. |
| **Estilos** | **Tailwind CSS** | Diseño "Mobile First" moderno y limpio. |
| **Backend** | **Node.js + Express** | API REST escalable con arquitectura limpia. |
| **ORM** | **Prisma** | Gestión de base de datos con tipado fuerte. |
| **Database** | **PostgreSQL** | Base de datos relacional en la nube (Render). |
| **UX/UI** | **Sonner** | Notificaciones tipo Toast en tiempo real. |

---

##  Capacidades de Business Intelligence (BI)

El sistema no solo guarda datos, los analiza. El Dashboard incluye:

* **KPIs Críticos:** Visualización inmediata de productos con mayor índice de merma.
* **Análisis por Categoría:** Desglose visual del rendimiento de cada línea de licores.
* **Detección de Anomalías:** Alertas de "Excedentes Atípicos" (mermas negativas) para identificar errores de ingreso.
* **Reportes de Inventario:** Estado actual de visibilidad de productos para la fuerza de ventas.

---

##  Instalación y Configuración

Si deseas ejecutar este proyecto localmente:

### 1. Clonar el repositorio
```bash
git clone [https://github.com/tu-usuario/ControlMerma.git](https://github.com/tu-usuario/ControlMerma.git)
```

### 2. Configurar Backend
```bash
cd backend
npm install
```
Crea un archivo `.env` en `/backend`:
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/merma?schema=public"
PORT=3001
```
Ejecuta las migraciones:
```bash
npx prisma migrate dev
```

### 3. Configurar Frontend
```bash
cd ../vite
npm install
```
Crea un archivo `.env` en `/vite`:
```env
VITE_API_URL=http://localhost:3001
```

### 4. Lanzar
```bash
# Terminal 1 (Backend)
npm start

# Terminal 2 (Frontend)
npm run dev
```

---

##  Arquitectura del Sistema

```mermaid
graph TD
    A[Cliente React] -->|Fetch API / PATCH| B[Servidor Express]
    B -->|Prisma ORM| C[(PostgreSQL en Render)]
    C -->|Datos de Auditoría| D[Dashboard Administrativo]
    D -->|Visualización de Datos| E[Propietario / Gerencia]
```

---

##  Autor

**Ronald Yair Ajcac López** 
---
*Este proyecto web representa la culminación de procesos de aprendizaje en arquitectura de software, bases de datos y diseño de experiencias de usuario.*
