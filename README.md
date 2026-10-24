# MiPlata · Banca Digital (frontend)

Frontend del sistema bancario MiPlata, proyecto académico de CESDE (semestre 3). Hecho con React y Vite.

El backend (Spring Boot + MySQL) está en un repositorio aparte: [MacoulieD/BankingSystem](https://github.com/MacoulieD/BankingSystem).

## Funcionalidades

- **Registro e inicio de sesión.** La cuenta se bloquea después de 3 intentos fallidos.
- **Cuentas.** Hasta una de ahorros y una corriente por usuario. Se puede consultar el saldo de cada una, consignar, retirar y ver los movimientos filtrados por cuenta.
- **Transferencias:**
  - Por celular, a MiPlata, Nequi o Daviplata.
  - Por número de cuenta de ahorros o corriente, a MiPlata u otros bancos.
  - Entre las propias cuentas.
  - Siempre con un paso de confirmación.
- **Tarjeta de crédito:**
  - Se solicita eligiendo el cupo.
  - Compras de 1 a 36 cuotas: hasta 3 sin interés y desde 4 con 1,9% mensual.
  - Pago desde una cuenta, también de la cuota del mes.
  - Bloqueo y cancelación.
- **Perfil.** Cambio de celular, correo y clave.

## Requisitos

- Node.js 20.19 o superior (o 22.12 en adelante), que es lo que exige Vite 8

## Cómo ejecutarlo

```bash
npm install
npm run dev
```

La app queda en http://localhost:5173.

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run build` | Genera la versión de producción en `dist/` |
| `npm run preview` | Sirve la versión generada en `dist/` |
| `npm run lint` | Revisa el código con ESLint |

## Dónde se guardan los datos

En [src/modules/core/api/api.js](src/modules/core/api/api.js), la constante `USE_LOCAL_STORAGE` elige dónde se guardan los datos:

- **`true` (por defecto):** todo se guarda en el `localStorage` del navegador. No necesita el backend y sirve para probar la app completa.
- **`false`:** el registro, el login y el perfil van al backend (`http://localhost:8080/api`). La URL se puede cambiar con `VITE_API_URL` en un archivo `.env`.

Con el backend, todavía faltan endpoints para algunas funciones: movimientos, transferencias, abrir una segunda cuenta y la tarjeta de crédito. Mientras tanto, esas operaciones solo duran en memoria o muestran un aviso de que aún no están disponibles.

## Estructura de carpetas

El código está organizado por funcionalidad (*screaming architecture*):

```
src/
├── main.jsx            # punto de entrada
├── App.jsx             # rutas y estado global (usuarios, saldos, tarjeta)
├── index.css           # estilos globales
└── modules/
    ├── core/
    │   ├── api/        # api.js (interruptor), localApi.js, backendApi.js
    │   └── utils/      # filtros y formatos de los campos (dinero, cuentas, celular)
    ├── landing/        # página de inicio
    ├── auth/           # login y registro
    ├── dashboard/      # banca en línea: menú, saldo, consignar, retirar, movimientos, perfil
    ├── accounts/       # modelo de cuentas y selector de cuenta
    ├── transfers/      # transferencias
    └── credit-card/    # tarjeta de crédito y cálculo de cuotas
```

## Tecnologías

React 19 · React Router 7 · Vite 8 · ESLint

---

> Entorno de demostración: los datos no representan dinero real. No uses contraseñas reales.
