import type { ShipmentInput, RuleResult, WizardAnswers, ScoredRule } from "./types";
import { SEGMENTS, RULES, getRule } from "./domain";

/**
 * Arancel e IVA a la importación.
 * Base tipo CIF (valor + flete + seguro). Simplificación configurable:
 * la base y los tipos reales varían por país y partida arancelaria.
 */
export function dutyAndVat(input: ShipmentInput): { arancel: number; iva: number } {
  const base = input.value + (input.costs.S6 ?? 0) + (input.costs.S7 ?? 0);
  const arancel = (base * input.duty) / 100;
  const iva = ((base + arancel) * input.vat) / 100;
  return { arancel, iva };
}

/** Calcula el reparto de costes para una regla concreta. */
export function computeRule(code: string, input: ShipmentInput): RuleResult {
  const rule = getRule(code);
  const { arancel, iva } = dutyAndVat(input);
  let seller = 0;
  let buyer = 0;
  SEGMENTS.forEach((seg, i) => {
    let cost = input.costs[seg.id] ?? 0;
    if (seg.id === "S9") cost += arancel + iva; // la aduana de importación incluye aranceles + IVA
    if (rule.pay[i] === "S") seller += cost;
    else buyer += cost;
  });
  return { code, seller, buyer, total: seller + buyer, rule };
}

/** Calcula varias reglas de una vez. */
export function computeAll(codes: string[], input: ShipmentInput): RuleResult[] {
  return codes.map((c) => computeRule(c, input));
}

/** Reglas válidas para un modo de transporte ("sea" habilita también las marítimas). */
export function availableRules(mode: WizardAnswers["transport"]) {
  return RULES.filter((r) => r.mode === "any" || (r.mode === "sea" && mode === "sea"));
}

/**
 * Motor de recomendación: puntúa las reglas candidatas según las respuestas
 * del asistente y las devuelve ordenadas de mejor a peor.
 */
export function recommend(a: WizardAnswers): ScoredRule[] {
  const candidates = availableRules(a.transport);
  return candidates
    .map((r): ScoredRule => {
      let score = 0;
      // Quién organiza el transporte principal
      if (a.carriage === "seller" && r.mainCarriage === "seller") score += 3;
      if (a.carriage === "buyer" && r.mainCarriage === "buyer") score += 3;
      if (a.carriage === "any") score += 1;
      // Nivel de responsabilidad
      const lv = r.level;
      if (a.responsibility === "min") score += lv <= 1 ? 3 : lv <= 2 ? 1 : -2;
      if (a.responsibility === "onboard") score += lv >= 1 && lv <= 3 ? 3 : lv === 0 ? 0 : -1;
      if (a.responsibility === "paidto") score += lv >= 4 && lv <= 5 ? 3 : -1;
      if (a.responsibility === "destination") score += lv >= 6 && lv <= 7 ? 3 : lv === 8 ? 2 : -2;
      // Despacho de importación
      if (a.import === "seller") score += r.code === "DDP" ? 4 : -3;
      if (a.import === "buyer") score += r.code === "DDP" ? -3 : 1;
      // Preferencia marítima concreta
      if (a.transport === "sea" && r.mode === "sea") score += 0.5;
      return { rule: r, score };
    })
    .sort((x, y) => y.score - x.score);
}
