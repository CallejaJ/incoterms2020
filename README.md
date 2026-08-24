# Rumbo

<div align="left">
    <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Vitest-2.0-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest" />
    <img src="https://img.shields.io/badge/npm_workspaces-monorepo-CB3837?style=for-the-badge&logo=npm&logoColor=white" alt="npm workspaces" />
    <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
</div>

<p align="left">
    <i>Asistente y comparador de Incoterms® 2020 para transitarios y usuarios con poco dominio de los términos de comercio internacional.</i>
</p>

## Cadena de Costes

Todo envío internacional se modela como una cadena canónica de 11 tramos. Cada regla Incoterm asigna el pago de cada tramo al vendedor o al comprador.

| Tramo | Nombre | Descripción |
|---|---|---|
| **S1** | Embalaje | Embalaje y verificación de exportación |
| **S2** | Carga origen | Carga en las instalaciones del vendedor |
| **S3** | Interior origen | Transporte interior en origen (*pre-carriage*) |
| **S4** | Aduana export. | Despacho de exportación |
| **S5** | THC origen | Manipulación en terminal de origen / carga a bordo |
| **S6** | Flete | Flete principal (transporte internacional) |
| **S7** | Seguro | Seguro del transporte principal |
| **S8** | THC destino | Manipulación en terminal de destino |
| **S9** | Aduana import. | Despacho de importación + aranceles + IVA |
| **S10** | Interior destino | Transporte interior en destino (*on-carriage*) |
| **S11** | Descarga | Descarga en destino final |

## Reglas Incoterms 2020

Las 11 reglas oficiales de la ICC, de menor a mayor responsabilidad del vendedor.

| Regla | Modo | Transporte principal | Aduana de importación | Seguro obligatorio | El riesgo se transfiere en |
|---|---|---|---|---|---|
| **EXW** | Cualquiera | Comprador | Comprador | — | Instalaciones del vendedor (sin cargar) |
| **FCA** | Cualquiera | Comprador | Comprador | — | Entrega al transportista en origen |
| **FAS** | Marítimo | Comprador | Comprador | — | Costado del buque en origen |
| **FOB** | Marítimo | Comprador | Comprador | — | A bordo del buque en origen |
| **CFR** | Marítimo | Vendedor | Comprador | — | A bordo del buque en origen |
| **CIF** | Marítimo | Vendedor | Comprador | ICC C | A bordo del buque en origen |
| **CPT** | Cualquiera | Vendedor | Comprador | — | Entrega al primer transportista |
| **CIP** | Cualquiera | Vendedor | Comprador | ICC A | Entrega al primer transportista |
| **DAP** | Cualquiera | Vendedor | Comprador | — | Lugar de destino (sin descargar) |
| **DPU** | Cualquiera | Vendedor | Comprador | — | Lugar de destino, ya descargada |
| **DDP** | Cualquiera | Vendedor | Vendedor | — | Lugar de destino (sin descargar) |

## Asistente Guiado

Cuatro preguntas en lenguaje llano —modo de transporte, quién organiza el transporte principal, hasta dónde se quiere asumir responsabilidad y quién despacha la importación— alimentan un motor de puntuación que ordena las 11 reglas de mejor a peor ajuste. Pensado para usuarios que no dominan los Incoterms: no exige que el usuario ya sepa qué término elegir.

El motor de recomendación vive en `recommend()` (`packages/core/src/engine.ts`) y filtra primero las reglas válidas para el modo de transporte elegido (`availableRules`) antes de puntuarlas.

| Elemento | Detalle |
|---|---|
| **Entrada** | `WizardAnswers` — transporte, transporte principal, nivel de responsabilidad, importación |
| **Salida** | `ScoredRule[]` — reglas candidatas ordenadas por puntuación |
| **Resultado en UI** | Regla recomendada + dos alternativas, con opción de pasar directamente al comparador |

## Comparador

Calcula, para cualquier subconjunto de reglas, cuánto paga cada parte (vendedor/comprador), el coste total de la operación y el punto de transferencia del riesgo, a partir de un valor de mercancía y de los costes por tramo introducidos por el usuario. El despacho de importación (S9) incorpora arancel e IVA calculados sobre una base tipo CIF (valor + flete + seguro) configurable por país.

El coste total de la operación es invariante entre reglas: lo que cambia es el reparto entre las partes, no el total. La lógica vive en `computeRule()` / `computeAll()` (`packages/core/src/engine.ts`).

| Elemento | Detalle |
|---|---|
| **Entrada** | `ShipmentInput` — valor, arancel (%), IVA (%), costes por tramo |
| **Salida** | `RuleResult` — coste vendedor, coste comprador, total, regla |
| **Vista adicional** | Cadena de costes visual (S1–S11) coloreada por pagador, con el punto de riesgo señalado |

## System Architecture

| Component | Role |
|---|---|
| **`@incoterms/core`** | Motor de dominio en TypeScript puro: tipos, reglas Incoterms, cálculo de costes y motor de recomendación, sin dependencias de UI |
| **`@incoterms/web`** | Interfaz React (Vite) que consume `@incoterms/core` y expone el asistente, el comparador y la guía de reglas |
| **`prototipo/index.html`** | Prototipo HTML autónomo de referencia, sin dependencias ni build, usado para validar la experiencia antes del monorepo |
| **`docs/DISENO_TECNICO.md`** | Documento de diseño técnico con el dominio completo, casos de uso y hoja de ruta |

## Technology Stack

- **Frontend**: React 18.3, Vite 5.4, TypeScript 5.5
- **Domain engine**: TypeScript puro (`@incoterms/core`), sin dependencias de UI ni de framework
- **Testing**: Vitest 2.0
- **Monorepo**: npm workspaces

## Key Features

1. **Asistente guiado** — recomienda el Incoterm adecuado a partir de cuatro preguntas en lenguaje llano, sin requerir conocimiento previo.
2. **Comparador de reglas × costes** — calcula el reparto vendedor/comprador de cualquier subconjunto de las 11 reglas sobre un mismo envío.
3. **Cadena de costes visual** — descompone el envío en 11 tramos (S1–S11) coloreados por pagador, con el punto de transferencia del riesgo señalado.
4. **Aranceles e IVA configurables** — el despacho de importación (S9) calcula arancel e IVA sobre una base tipo CIF configurable por país.
5. **Motor de dominio desacoplado** — `@incoterms/core` es TypeScript puro sin dependencias de UI, reutilizable por otras interfaces o servicios.
6. **Modo Simple / Experto** — oculta o muestra el desglose completo vendedor/comprador según el nivel de detalle que necesite el usuario.
7. **Tema claro / oscuro** — con detección automática de la preferencia del sistema operativo.
8. **Prototipo de referencia** — versión HTML autónoma (`prototipo/index.html`) sin build ni instalación, útil para demos rápidas.

## Testing Strategy

El motor de dominio se testea con Vitest en `packages/core/test/engine.test.ts`: integridad de las 11 reglas (segmentos completos, seguro obligatorio solo en CIF/CIP, reglas marítimas correctas), motor de cálculo (reparto vendedor/comprador, coste total invariante entre reglas, sobrecoste del seguro en CIF) y motor de recomendación (respuestas del asistente mapeadas a la regla esperada). Se ejecuta con `npm test`. La interfaz web (`@incoterms/web`) no tiene tests automatizados todavía; se valida manualmente contra el comportamiento de referencia del prototipo HTML.

## Project Setup

1. Instalar dependencias del monorepo:

   ```bash
   npm install
   ```

2. Arrancar la web en modo desarrollo:

   ```bash
   npm run dev
   ```

3. Visitar `http://localhost:5173`

4. Otros comandos disponibles:

   ```bash
   npm test          # tests del motor (@incoterms/core)
   npm run build     # compila core + web para producción
   npm run typecheck # comprobación de tipos de todo el monorepo
   ```

---

Built for transitarios y equipos de comercio internacional.
