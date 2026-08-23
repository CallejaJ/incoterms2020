# Rumbo · Comparador de Incoterms 2020

Aplicación de ayuda a **transitarios** y a usuarios con poco dominio de los Incoterms para decidir **qué opción de entrega conviene** según precio, país y condiciones del término de comercio internacional.

Basado en las **11 reglas oficiales Incoterms® 2020** de la ICC.

## ¿Qué incluye este prototipo?

`index.html` es un **prototipo funcional autónomo** (se abre directamente en el navegador, sin instalar nada) con tres partes:

- **Asistente guiado** — cuatro preguntas en lenguaje sencillo que recomiendan el Incoterm adecuado. Pensado para quien no domina los términos.
- **Comparador** — compara reglas × costes, mostrando cuánto paga cada parte (vendedor/comprador), el coste total de la operación y el **punto de transferencia del riesgo**. Incluye aranceles e IVA configurables por país.
- **Las 11 reglas** — ficha de referencia de cada Incoterm en lenguaje llano.

Con modo **Simple / Experto**, tema **claro / oscuro** y una visualización de la **cadena de costes** (11 tramos S1–S11) coloreada por quién paga, con la "puerta" donde pasa el riesgo.

## Cómo usarlo

Abre `index.html` en cualquier navegador moderno. (Necesita conexión solo para cargar las tipografías de Google; sin ella usa fuentes del sistema.)

## Estado y siguientes pasos

Este es el **prototipo de la Fase 1** que valida la experiencia y el motor de cálculo. La arquitectura de producción (app React + paquete `@incoterms/core`, integraciones de aranceles/tarifas y capa blockchain opcional de Fase 2) está descrita en [`docs/DISENO_TECNICO.md`](docs/DISENO_TECNICO.md).

La lógica del motor (reglas, asignación de costes, puntos de riesgo) es directamente portable al paquete `@incoterms/core` de la versión React.

## Aviso

Prototipo educativo y de asesoramiento. Las cifras de aranceles e impuestos son estimaciones configurables; la base imponible y los tipos varían por país y partida arancelaria. No sustituye el contrato de compraventa ni el asesoramiento profesional. «Incoterms» es marca registrada de la ICC.
