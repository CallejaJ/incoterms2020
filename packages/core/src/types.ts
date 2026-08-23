/** Quién paga un tramo: S = vendedor, B = comprador. */
export type Payer = "S" | "B";

/** Modo de transporte para el que la regla es válida. */
export type RuleMode = "any" | "sea";

/** Un tramo de la cadena de costes (S1..S11). */
export interface Segment {
  id: string;
  short: string;
  full: string;
  def: string;
}

/** Una de las 11 reglas Incoterms 2020. */
export interface Rule {
  code: string;
  name: string;
  mode: RuleMode;
  /** Nivel de responsabilidad del vendedor, 0 (EXW) .. 8 (DDP). */
  level: number;
  /** Nº de tramos (por posición) tras los que el riesgo es del comprador. */
  risk: number;
  /** Pagador de cada tramo, alineado con SEGMENTS. */
  pay: Payer[];
  /** Explicación en lenguaje llano. */
  plain: string;
  mainCarriage: "seller" | "buyer";
  importer: "seller" | "buyer";
  insurer: "seller" | "buyer";
  /** Cobertura mínima obligatoria del seguro, si la regla lo exige (CIF/CIP). */
  insMandatory?: string;
}

/** Costes por tramo, indexados por id de segmento (S1..S11). */
export type Costs = Record<string, number>;

/** Datos de entrada del envío para el cálculo. */
export interface ShipmentInput {
  /** Valor de la mercancía (base para aranceles). */
  value: number;
  /** Tipo arancelario en destino (%). */
  duty: number;
  /** IVA / impuestos a la importación (%). */
  vat: number;
  /** Coste de cada tramo. */
  costs: Costs;
}

/** Resultado del cálculo para una regla. */
export interface RuleResult {
  code: string;
  seller: number;
  buyer: number;
  total: number;
  rule: Rule;
}

/** Respuestas del asistente guiado. */
export interface WizardAnswers {
  transport?: "sea" | "air" | "road" | "multi";
  carriage?: "seller" | "buyer" | "any";
  responsibility?: "min" | "onboard" | "paidto" | "destination";
  import?: "seller" | "buyer";
}

/** Regla puntuada por el motor de recomendación. */
export interface ScoredRule {
  rule: Rule;
  score: number;
}
