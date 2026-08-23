import { describe, it, expect } from "vitest";
import {
  RULES, SEGMENTS, DEFAULT_COSTS, RISK_LABEL,
  computeRule, computeAll, recommend, availableRules,
  type ShipmentInput,
} from "../src/index";

const input: ShipmentInput = { value: 20000, duty: 4, vat: 21, costs: { ...DEFAULT_COSTS } };

describe("integridad de las reglas", () => {
  it("hay exactamente 11 reglas", () => {
    expect(RULES).toHaveLength(11);
  });
  it("cada regla asigna pagador a los 11 tramos", () => {
    for (const r of RULES) expect(r.pay).toHaveLength(SEGMENTS.length);
  });
  it("solo CIF y CIP obligan a contratar seguro", () => {
    const mand = RULES.filter((r) => r.insMandatory).map((r) => r.code).sort();
    expect(mand).toEqual(["CIF", "CIP"]);
  });
  it("las reglas marítimas son FAS, FOB, CFR, CIF", () => {
    const sea = RULES.filter((r) => r.mode === "sea").map((r) => r.code).sort();
    expect(sea).toEqual(["CFR", "CIF", "FAS", "FOB"]);
  });
  it("cada regla tiene etiqueta de riesgo", () => {
    for (const r of RULES) expect(RISK_LABEL[r.code]).toBeTruthy();
  });
});

describe("motor de cálculo", () => {
  it("EXW deja casi todo al comprador (el vendedor solo paga el embalaje)", () => {
    const r = computeRule("EXW", input);
    expect(r.seller).toBe(DEFAULT_COSTS.S1);
  });
  it("DDP: el vendedor asume el despacho de importación (aranceles+IVA)", () => {
    const ddp = computeRule("DDP", input);
    const exw = computeRule("EXW", input);
    // En DDP el comprador solo paga la descarga final (S11)
    expect(ddp.buyer).toBe(DEFAULT_COSTS.S11);
    expect(ddp.seller).toBeGreaterThan(exw.seller);
  });
  it("el coste total de la operación es el mismo en todas las reglas", () => {
    const totals = computeAll(RULES.map((r) => r.code), input).map((x) => Math.round(x.total));
    const first = totals[0];
    for (const t of totals) expect(t).toBe(first);
  });
  it("CIF cuesta más al vendedor que CFR por el seguro obligatorio", () => {
    const cif = computeRule("CIF", input);
    const cfr = computeRule("CFR", input);
    expect(cif.seller).toBeCloseTo(cfr.seller + DEFAULT_COSTS.S7, 5);
  });
});

describe("motor de recomendación", () => {
  it("vendedor que paga el flete sin asumir riesgo en destino y con importación del comprador → grupo C", () => {
    const ranked = recommend({ transport: "sea", carriage: "seller", responsibility: "paidto", import: "buyer" });
    expect(["CFR", "CIF", "CPT", "CIP"]).toContain(ranked[0].rule.code);
  });
  it("responsabilidad mínima → EXW o FCA en cabeza", () => {
    const ranked = recommend({ transport: "road", carriage: "buyer", responsibility: "min", import: "buyer" });
    expect(["EXW", "FCA"]).toContain(ranked[0].rule.code);
  });
  it("todo incluido con importación del vendedor → DDP", () => {
    const ranked = recommend({ transport: "road", carriage: "seller", responsibility: "destination", import: "seller" });
    expect(ranked[0].rule.code).toBe("DDP");
  });
  it("en modo aéreo no se recomiendan reglas marítimas", () => {
    const codes = availableRules("air").map((r) => r.code);
    expect(codes).not.toContain("FOB");
    expect(codes).not.toContain("CIF");
  });
});
