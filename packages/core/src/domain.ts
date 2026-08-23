import type { Rule, Segment, Costs } from "./types";

/** Cadena canónica de costes de un envío internacional. */
export const SEGMENTS: Segment[] = [
  { id: "S1", short: "Embalaje", full: "Embalaje y verificación de exportación", def: "Preparar, marcar y comprobar la mercancía para exportar." },
  { id: "S2", short: "Carga origen", full: "Carga en las instalaciones del vendedor", def: "Subir la mercancía al primer vehículo en origen." },
  { id: "S3", short: "Interior origen", full: "Transporte interior en origen (pre-carriage)", def: "Del almacén del vendedor a la terminal o puerto de salida." },
  { id: "S4", short: "Aduana export.", full: "Despacho de exportación", def: "Trámites y costes de aduana para sacar la mercancía del país." },
  { id: "S5", short: "THC origen", full: "Manipulación en terminal de origen / carga a bordo", def: "Manipulación en la terminal de salida y, en marítimo, carga al buque." },
  { id: "S6", short: "Flete", full: "Flete principal (transporte internacional)", def: "El transporte principal entre países (barco, avión, camión)." },
  { id: "S7", short: "Seguro", full: "Seguro del transporte principal", def: "Cubre pérdida o daño durante el transporte principal. Solo CIF y CIP lo obligan." },
  { id: "S8", short: "THC destino", full: "Manipulación en terminal de destino", def: "Descarga del medio principal y manipulación en la terminal de llegada." },
  { id: "S9", short: "Aduana import.", full: "Despacho de importación + aranceles + IVA", def: "Trámites de importación y pago de derechos e impuestos en destino." },
  { id: "S10", short: "Interior destino", full: "Transporte interior en destino (on-carriage)", def: "De la terminal de llegada al lugar final acordado." },
  { id: "S11", short: "Descarga", full: "Descarga en destino final", def: "Bajar la mercancía en el punto de entrega final." },
];

/** Las 11 reglas Incoterms 2020. `pay` alineado con SEGMENTS. */
export const RULES: Rule[] = [
  { code: "EXW", name: "Ex Works / En fábrica", mode: "any", level: 0, risk: 1,
    pay: ["S","B","B","B","B","B","B","B","B","B","B"],
    plain: "Entregas la mercancía en tu propia fábrica o almacén. A partir de ahí, todo (incluida la aduana de exportación) corre por cuenta del comprador.",
    mainCarriage: "buyer", importer: "buyer", insurer: "buyer" },
  { code: "FCA", name: "Free Carrier / Franco transportista", mode: "any", level: 1, risk: 4,
    pay: ["S","S","S","S","B","B","B","B","B","B","B"],
    plain: "Entregas la mercancía despachada de exportación al transportista que designa el comprador. El transporte principal ya es cosa suya.",
    mainCarriage: "buyer", importer: "buyer", insurer: "buyer" },
  { code: "FAS", name: "Free Alongside Ship / Franco al costado", mode: "sea", level: 2, risk: 4,
    pay: ["S","S","S","S","B","B","B","B","B","B","B"],
    plain: "Dejas la mercancía al costado del buque en el puerto de salida. La carga a bordo y todo lo demás es del comprador.",
    mainCarriage: "buyer", importer: "buyer", insurer: "buyer" },
  { code: "FOB", name: "Free On Board / Franco a bordo", mode: "sea", level: 3, risk: 5,
    pay: ["S","S","S","S","S","B","B","B","B","B","B"],
    plain: "Entregas la mercancía cargada a bordo del buque. Desde ese momento el flete, el seguro y el riesgo son del comprador.",
    mainCarriage: "buyer", importer: "buyer", insurer: "buyer" },
  { code: "CFR", name: "Cost and Freight / Coste y flete", mode: "sea", level: 4, risk: 5,
    pay: ["S","S","S","S","S","S","B","B","B","B","B"],
    plain: "Pagas el flete hasta el puerto de destino, pero el riesgo pasa al comprador al cargar en el barco en origen. (¡Ojo a este desfase!)",
    mainCarriage: "seller", importer: "buyer", insurer: "buyer" },
  { code: "CIF", name: "Cost, Insurance and Freight / Coste, seguro y flete", mode: "sea", level: 5, risk: 5,
    pay: ["S","S","S","S","S","S","S","B","B","B","B"], insMandatory: "ICC C",
    plain: "Como CFR pero además contratas un seguro (cobertura mínima ICC C). El riesgo igualmente pasa al comprador al cargar a bordo en origen.",
    mainCarriage: "seller", importer: "buyer", insurer: "seller" },
  { code: "CPT", name: "Carriage Paid To / Transporte pagado hasta", mode: "any", level: 4, risk: 4,
    pay: ["S","S","S","S","S","S","B","B","B","B","B"],
    plain: "Pagas el transporte hasta el destino acordado, pero el riesgo pasa al comprador al entregar la mercancía al primer transportista. (Desfase coste↔riesgo.)",
    mainCarriage: "seller", importer: "buyer", insurer: "buyer" },
  { code: "CIP", name: "Carriage and Insurance Paid To / Transporte y seguro pagados", mode: "any", level: 5, risk: 4,
    pay: ["S","S","S","S","S","S","S","B","B","B","B"], insMandatory: "ICC A",
    plain: "Como CPT pero además contratas un seguro con cobertura amplia (ICC A). El riesgo pasa al comprador al entregar al primer transportista.",
    mainCarriage: "seller", importer: "buyer", insurer: "seller" },
  { code: "DAP", name: "Delivered at Place / Entregada en lugar", mode: "any", level: 6, risk: 10,
    pay: ["S","S","S","S","S","S","S","S","B","S","B"],
    plain: "Llevas la mercancía hasta el lugar de destino, lista para descargar. El comprador solo se encarga de la aduana de importación y de descargar.",
    mainCarriage: "seller", importer: "buyer", insurer: "seller" },
  { code: "DPU", name: "Delivered at Place Unloaded / Entregada descargada", mode: "any", level: 7, risk: 11,
    pay: ["S","S","S","S","S","S","S","S","B","S","S"],
    plain: "Como DAP pero además descargas la mercancía en destino. Es la única regla en la que el vendedor descarga. La importación sigue siendo del comprador.",
    mainCarriage: "seller", importer: "buyer", insurer: "seller" },
  { code: "DDP", name: "Delivered Duty Paid / Entregada derechos pagados", mode: "any", level: 8, risk: 10,
    pay: ["S","S","S","S","S","S","S","S","S","S","B"],
    plain: "Máxima responsabilidad del vendedor: entregas en destino con todo pagado, incluidos los aranceles e impuestos de importación. El comprador solo descarga.",
    mainCarriage: "seller", importer: "seller", insurer: "seller" },
];

/** Punto de transferencia del riesgo, en lenguaje llano, por código de regla. */
export const RISK_LABEL: Record<string, string> = {
  EXW: "las instalaciones del vendedor (sin cargar)",
  FCA: "la entrega al transportista en origen",
  FAS: "el costado del buque en origen",
  FOB: "a bordo del buque en origen",
  CFR: "a bordo del buque en origen",
  CIF: "a bordo del buque en origen",
  CPT: "la entrega al primer transportista",
  CIP: "la entrega al primer transportista",
  DAP: "el lugar de destino (sin descargar)",
  DPU: "el lugar de destino, ya descargada",
  DDP: "el lugar de destino (sin descargar)",
};

/** Costes por defecto (€) para precargar el comparador con un ejemplo. */
export const DEFAULT_COSTS: Costs = {
  S1: 150, S2: 80, S3: 350, S4: 120, S5: 220, S6: 1400, S7: 90, S8: 240, S9: 160, S10: 400, S11: 90,
};

export function getRule(code: string): Rule {
  const r = RULES.find((x) => x.code === code);
  if (!r) throw new Error(`Regla desconocida: ${code}`);
  return r;
}
