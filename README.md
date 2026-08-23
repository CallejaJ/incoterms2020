# Rumbo · Comparador de Incoterms 2020

Aplicación de ayuda a **transitarios** y a usuarios con poco dominio de los Incoterms para decidir **qué opción de entrega conviene** según precio, país y condiciones del término de comercio internacional. Basada en las **11 reglas oficiales Incoterms® 2020** de la ICC.

## Estructura del proyecto (monorepo)

```
incoterms2020/
├─ packages/
│  ├─ core/        # @incoterms/core — motor de dominio en TypeScript puro (sin UI)
│  │  ├─ src/      #   types · domain (reglas + segmentos) · engine (cálculo + recomendación)
│  │  └─ test/     #   tests del motor (vitest)
│  └─ web/         # @incoterms/web — interfaz React (Vite + TypeScript)
│     └─ src/      #   App.tsx (Asistente · Comparador · Guía) · styles.css
├─ prototipo/      # prototipo HTML autónomo inicial (referencia de la experiencia)
├─ docs/           # documento de diseño técnico
├─ package.json    # workspaces del monorepo
└─ tsconfig.base.json
```

El **motor** (`@incoterms/core`) está separado de la interfaz a propósito: es TypeScript puro, testeable al 100 %, y reutilizable por la web, una futura API o una app móvil. Es la decisión de arquitectura descrita en [`docs/DISENO_TECNICO.md`](docs/DISENO_TECNICO.md).

## Puesta en marcha

Requiere Node.js 18+.

```bash
npm install            # instala dependencias de todo el monorepo
npm test               # ejecuta los tests del motor (@incoterms/core)
npm run dev            # arranca la web en modo desarrollo (Vite)
npm run build          # compila core + web para producción
npm run typecheck      # comprobación de tipos de todo el monorepo
```

Tras `npm run dev`, abre la URL que indique Vite (por defecto http://localhost:5173).

## Qué incluye hoy

- **Asistente guiado** — cuatro preguntas en lenguaje sencillo que recomiendan el Incoterm adecuado (pensado para quien no domina los términos).
- **Comparador** — compara reglas × costes por rol (vendedor/comprador), con coste total, punto de transferencia del riesgo y aranceles/IVA configurables por país.
- **Las 11 reglas** — ficha de referencia de cada Incoterm en lenguaje llano.
- Modo **Simple / Experto**, tema **claro / oscuro** y visualización de la **cadena de costes** (11 tramos S1–S11) coloreada por pagador con el punto de riesgo.

## Próximos pasos (ver `docs/DISENO_TECNICO.md`)

Fase 2: comparación de varias rutas/países a la vez, integración de aranceles (TARIC/HS) y tarifas de flete, persistencia y cuentas de usuario, exportación de ofertas a PDF. Fase 3: capa blockchain opcional (trazabilidad de acuerdos y smart contracts por hitos).

## Aviso

Prototipo educativo y de asesoramiento. Las cifras de aranceles e impuestos son estimaciones configurables; la base imponible y los tipos varían por país y partida arancelaria. No sustituye el contrato de compraventa ni el asesoramiento profesional. «Incoterms» es marca registrada de la ICC.
