import { useEffect, useMemo, useState } from "react";
import {
  SEGMENTS, RULES, RISK_LABEL, DEFAULT_COSTS,
  computeAll, dutyAndVat, recommend, getRule,
  type Costs, type ShipmentInput, type WizardAnswers, type Rule,
} from "@incoterms/core";

const fmt = (n: number) => Math.round(n).toLocaleString("es-ES") + " €";
type Tab = "asistente" | "comparador" | "guia";
type Role = "seller" | "buyer";
type Detail = "simple" | "expert";
const MODE_LABEL: Record<string, string> = { sea: "Marítimo", air: "Aéreo", road: "Terrestre", multi: "Multimodal" };

/* ============================ App ============================ */
export function App() {
  const [tab, setTab] = useState<Tab>("asistente");
  const [detail, setDetail] = useState<Detail>("simple");
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  // Estado compartido del envío / comparación
  const [value, setValue] = useState(20000);
  const [duty, setDuty] = useState(4);
  const [vat, setVat] = useState(21);
  const [costs, setCosts] = useState<Costs>({ ...DEFAULT_COSTS });
  const [mode, setMode] = useState<NonNullable<WizardAnswers["transport"]>>("sea");
  const [role, setRole] = useState<Role>("seller");
  const [selected, setSelected] = useState<string[]>(["EXW", "FOB", "CIF", "DDP"]);
  const [chainRule, setChainRule] = useState<string>("CIF");

  const input: ShipmentInput = { value, duty, vat, costs };

  useEffect(() => {
    if (theme) document.documentElement.setAttribute("data-theme", theme);
    else document.documentElement.removeAttribute("data-theme");
  }, [theme]);

  function toggleTheme() {
    const dark = theme ? theme === "dark" : window.matchMedia("(prefers-color-scheme:dark)").matches;
    setTheme(dark ? "light" : "dark");
  }

  function goCompare(codes: string[]) {
    setSelected(codes);
    setChainRule(codes[0]);
    setTab("comparador");
  }

  return (
    <>
      <header>
        <div className="bar">
          <div className="brand">
            <div className="logo" aria-hidden>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2 L22 12 L12 22 L2 12 Z" stroke="currentColor" strokeWidth="1.7" />
                <path d="M8.5 15.5 L15.5 8.5 M15.5 8.5 L15.5 12.5 M15.5 8.5 L11.5 8.5"
                  stroke="var(--brand)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div><b>Rumbo</b><span>Incoterms 2020</span></div>
          </div>
          <div className="controls">
            <div className="seg" role="group" aria-label="Nivel de detalle">
              <button aria-pressed={detail === "simple"} onClick={() => setDetail("simple")}>Simple</button>
              <button aria-pressed={detail === "expert"} onClick={() => setDetail("expert")}>Experto</button>
            </div>
            <button className="icon-btn" title="Cambiar tema" aria-label="Cambiar tema" onClick={toggleTheme}>◐</button>
          </div>
        </div>
        <nav className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === "asistente"} onClick={() => setTab("asistente")}>Asistente guiado</button>
          <button role="tab" aria-selected={tab === "comparador"} onClick={() => setTab("comparador")}>Comparador</button>
          <button role="tab" aria-selected={tab === "guia"} onClick={() => setTab("guia")}>Las 11 reglas</button>
        </nav>
      </header>

      <main>
        {tab === "asistente" && <Wizard onCompare={goCompare} onMode={setMode} />}
        {tab === "comparador" && (
          <Comparator
            input={input} detail={detail} role={role} mode={mode}
            selected={selected} chainRule={chainRule}
            setValue={setValue} setDuty={setDuty} setVat={setVat} setCosts={setCosts}
            setRole={setRole} setSelected={setSelected} setChainRule={setChainRule}
          />
        )}
        {tab === "guia" && <Guide />}
      </main>

      <footer>
        <div className="disclaimer">
          <b>Rumbo</b> es un prototipo educativo y de asesoramiento basado en las reglas{" "}
          <span className="term" title="International Chamber of Commerce — quien publica las Incoterms">ICC</span>{" "}
          Incoterms® 2020. Las cifras de aranceles e impuestos son estimaciones configurables: la base imponible y los
          tipos varían por país y por partida arancelaria. No sustituye el contrato de compraventa ni el asesoramiento
          profesional. «Incoterms» es marca registrada de la ICC.
        </div>
      </footer>
    </>
  );
}

/* ============================ Asistente ============================ */
interface Question {
  key: keyof WizardAnswers;
  q: string; hint: string;
  opts: { v: string; b: string; s: string }[];
}
const QUESTIONS: Question[] = [
  { key: "transport", q: "¿Cómo viajará la mercancía?", hint: "Algunas reglas solo valen para transporte marítimo.",
    opts: [
      { v: "sea", b: "Barco (marítimo)", s: "Contenedor o carga por mar / vía navegable" },
      { v: "air", b: "Avión (aéreo)", s: "Carga aérea" },
      { v: "road", b: "Camión / tren (terrestre)", s: "Carretera o ferrocarril" },
      { v: "multi", b: "Combinado (multimodal)", s: "Varios modos, contenedor puerta a puerta" },
    ] },
  { key: "carriage", q: "¿Quién quieres que organice y pague el transporte internacional?", hint: "El trayecto principal entre países.",
    opts: [
      { v: "buyer", b: "El comprador", s: "Yo me desentiendo del transporte principal" },
      { v: "seller", b: "Yo (el vendedor)", s: "Lo contrato y lo pago yo" },
      { v: "any", b: "No lo tengo claro", s: "Muéstrame las dos opciones" },
    ] },
  { key: "responsibility", q: "¿Hasta dónde quieres asumir la responsabilidad y el riesgo?", hint: "Cuanto más lejos, más control pero más obligaciones.",
    opts: [
      { v: "min", b: "Lo mínimo, en mi país", s: "Que el comprador se ocupe cuanto antes" },
      { v: "onboard", b: "Hasta cargar el transporte", s: "Entrego cargado en el puerto/terminal" },
      { v: "paidto", b: "Pago el viaje, sin riesgo en destino", s: "Cubro flete (y quizá seguro) hasta destino" },
      { v: "destination", b: "Hasta el país de destino", s: "Entrego allí, listo para descargar" },
    ] },
  { key: "import", q: "¿Quién se encargará de la aduana de importación y de pagar los aranceles en destino?", hint: "Solo DDP pone esto del lado del vendedor.",
    opts: [
      { v: "buyer", b: "El comprador", s: "Lo normal en la mayoría de operaciones" },
      { v: "seller", b: "Yo, el vendedor (todo incluido)", s: "Entrega con derechos pagados (DDP)" },
    ] },
];

function Wizard({ onCompare, onMode }: { onCompare: (codes: string[]) => void; onMode: (m: NonNullable<WizardAnswers["transport"]>) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>({});
  const done = step >= QUESTIONS.length;

  function pick(q: Question, v: string) {
    setAnswers((a) => ({ ...a, [q.key]: v }));
    if (q.key === "transport") onMode(v as NonNullable<WizardAnswers["transport"]>);
  }

  const ranked = useMemo(() => (done ? recommend(answers) : []), [done, answers]);

  return (
    <section>
      <div className="wizard-head">
        <div>
          <div className="eyebrow">Asistente</div>
          <h1>¿Qué Incoterm te conviene?</h1>
          <p className="lead">Responde cuatro preguntas en lenguaje sencillo. No hace falta que conozcas los términos: al final te recomendamos la opción adecuada y te la explicamos.</p>
        </div>
      </div>
      <div className="progress" aria-hidden>
        {QUESTIONS.map((_, i) => <i key={i} className={i < step || done ? "on" : ""} />)}
      </div>

      <div className="panel pad">
        {!done ? (
          <div className="q">
            <h2>{QUESTIONS[step].q}</h2>
            <p className="hint">{QUESTIONS[step].hint}</p>
            <div className="options">
              {QUESTIONS[step].opts.map((o) => (
                <button key={o.v} className="opt" aria-pressed={answers[QUESTIONS[step].key] === o.v} onClick={() => pick(QUESTIONS[step], o.v)}>
                  <b>{o.b}</b><small>{o.s}</small>
                </button>
              ))}
            </div>
            <div className="wizard-nav">
              <button className="btn" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>← Atrás</button>
              <button className="btn primary" disabled={!answers[QUESTIONS[step].key]} onClick={() => setStep((s) => s + 1)}>
                {step === QUESTIONS.length - 1 ? "Ver recomendación" : "Siguiente →"}
              </button>
            </div>
          </div>
        ) : (
          <div className="q" style={{ marginTop: 0 }}>
            <div className="eyebrow">Resultado</div>
            <h2 style={{ fontSize: 22 }}>Tu mejor opción: <span className="mono">{ranked[0].rule.code}</span></h2>
            <p className="hint">Según tus respuestas. Puedes llevar estas reglas al comparador para ver los números.</p>
            <div className="reco-rules">
              {[ranked[0], ranked[1], ranked[2]].map((x, i) => (
                <div key={x.rule.code} className={"reco-card" + (i === 0 ? " best" : "")}>
                  <span className={"tag" + (i === 0 ? "" : " alt")}>{i === 0 ? "Recomendado" : "Alternativa"}</span>
                  <h3>{x.rule.code}</h3>
                  <div className="full">{x.rule.name}</div>
                  <div className="why">{x.rule.plain}</div>
                </div>
              ))}
            </div>
            <div className="wizard-nav">
              <button className="btn" onClick={() => { setStep(0); setAnswers({}); }}>↺ Empezar de nuevo</button>
              <button className="btn primary" onClick={() => onCompare([ranked[0].rule.code, ranked[1].rule.code, ranked[2].rule.code])}>
                Comparar estas reglas →
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================ Comparador ============================ */
interface CmpProps {
  input: ShipmentInput; detail: Detail; role: Role; mode: NonNullable<WizardAnswers["transport"]>;
  selected: string[]; chainRule: string;
  setValue: (n: number) => void; setDuty: (n: number) => void; setVat: (n: number) => void;
  setCosts: (c: Costs) => void; setRole: (r: Role) => void;
  setSelected: (s: string[]) => void; setChainRule: (c: string) => void;
}
function Comparator(p: CmpProps) {
  const rows = useMemo(() => computeAll(p.selected, p.input), [p.selected, p.input]);
  const yourKey = p.role === "seller" ? "seller" : "buyer";
  const sorted = [...rows].sort((a, b) => a[yourKey] - b[yourKey]);
  const bestVal = sorted.length ? sorted[0][yourKey] : 0;
  const who = p.role === "seller" ? "vendedor" : "comprador";
  const other = p.role === "seller" ? "comprador" : "vendedor";

  function toggleRule(code: string) {
    const next = p.selected.includes(code) ? p.selected.filter((c) => c !== code) : [...p.selected, code];
    p.setSelected(next);
    if (!next.includes(p.chainRule) && next.length) p.setChainRule(next[0]);
  }
  function setCost(id: string, v: number) { p.setCosts({ ...p.input.costs, [id]: v }); }

  return (
    <section>
      <div className="eyebrow">Comparador</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "2px 0 6px" }}>Compara costes y riesgo</h1>
      <p className="lead" style={{ marginBottom: 20 }}>Introduce los datos del envío y elige qué reglas comparar. Verás cuánto paga cada parte, quién asume qué y dónde se transfiere el riesgo.</p>

      <div className="cmp-grid">
        <div className="cmp-side panel pad">
          <div className="subhead" style={{ marginTop: 0 }}>Datos del envío</div>
          <div className="field"><label>Valor de la mercancía (€)</label>
            <input className="num" value={p.input.value} onChange={(e) => p.setValue(+e.target.value || 0)} /></div>
          <div className="grid2">
            <div className="field"><label>Arancel destino (%)</label>
              <input className="num" value={p.input.duty} onChange={(e) => p.setDuty(+e.target.value || 0)} /></div>
            <div className="field"><label>IVA import. (%)</label>
              <input className="num" value={p.input.vat} onChange={(e) => p.setVat(+e.target.value || 0)} /></div>
          </div>
          <div className="field"><label>Modo de transporte</label>
            <input value={MODE_LABEL[p.mode] ?? "Marítimo"} readOnly style={{ cursor: "default" }} /></div>
          <details className="seg-costs">
            <summary>Costes por tramo (avanzado)</summary>
            <div style={{ marginTop: 8 }}>
              {SEGMENTS.map((s) => (
                <div className="field" key={s.id} style={{ marginBottom: 8 }}>
                  <label>{s.id} · {s.short}</label>
                  <input className="num" value={p.input.costs[s.id]} onChange={(e) => setCost(s.id, +e.target.value || 0)} />
                </div>
              ))}
            </div>
          </details>
          <div className="callout" style={{ marginBottom: 0 }}>El <b>coste total</b> de la operación es casi el mismo con cualquier Incoterm. Lo que cambia es <b>quién lo paga</b> y <b>quién asume el riesgo</b>.</div>
        </div>

        <div>
          <div className="rolebar">
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)" }}>Analizo desde el lado del:</span>
            <div className="seg" role="group" aria-label="Rol">
              <button aria-pressed={p.role === "seller"} onClick={() => p.setRole("seller")}>Vendedor / Exportador</button>
              <button aria-pressed={p.role === "buyer"} onClick={() => p.setRole("buyer")}>Comprador / Importador</button>
            </div>
          </div>

          <div className="subhead" style={{ marginTop: 0 }}>Reglas a comparar</div>
          <div className="rulepick">
            {RULES.map((r) => {
              const disabled = r.mode === "sea" && p.mode !== "sea";
              return (
                <button key={r.code} aria-pressed={p.selected.includes(r.code)} disabled={disabled}
                  title={disabled ? "Solo transporte marítimo" : undefined} onClick={() => toggleRule(r.code)}>
                  {r.code}
                </button>
              );
            })}
          </div>

          <div className="panel" style={{ overflow: "hidden" }}>
            <div className="chain-scroll">
              <table className="cmp">
                <thead><tr>
                  <th>Regla</th><th className="yourcost">Tu coste</th>
                  {p.detail === "expert" && <th>Vendedor</th>}
                  {p.detail === "expert" && <th>Comprador</th>}
                  <th>Total oper.</th><th>Riesgo pasa en</th>
                </tr></thead>
                <tbody>
                  {sorted.map((row) => (
                    <tr key={row.code} className={row.code === p.chainRule ? "sel" : ""} onClick={() => p.setChainRule(row.code)}>
                      <td>
                        <div className="rulecell"><b>{row.code}</b>{row[yourKey] === bestVal && <span className="best-pill">Menor coste</span>}</div>
                        <small>{row.rule.name.split(" / ")[0]}</small>
                      </td>
                      <td className="yourcost num">{fmt(row[yourKey])}</td>
                      {p.detail === "expert" && <td className="num">{fmt(row.seller)}</td>}
                      {p.detail === "expert" && <td className="num">{fmt(row.buyer)}</td>}
                      <td className="num">{fmt(row.total)}</td>
                      <td className="riskcell">{RISK_LABEL[row.code]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {sorted.length > 0 && (
            <div className="callout">
              Para el <b>{who}</b>, la regla más económica de tu selección es <b className="mono">{sorted[0].code}</b> ({fmt(sorted[0][yourKey])}).
              Pero recuerda: lo que te ahorras suele trasladarse al <b>{other}</b> en coste, trabajo o riesgo. La decisión también depende de <b>quién controla mejor cada tramo</b>.
            </div>
          )}

          <div className="subhead">Cadena de costes · <span className="mono">{p.chainRule}</span></div>
          <CostChain code={p.chainRule} input={p.input} />
        </div>
      </div>
    </section>
  );
}

/* ============================ Cadena de costes ============================ */
function CostChain({ code, input }: { code: string; input: ShipmentInput }) {
  const rule = getRule(code);
  const { arancel, iva } = dutyAndVat(input);
  const nodes: JSX.Element[] = [];
  SEGMENTS.forEach((s, i) => {
    if (i === rule.risk) nodes.push(<div key={"gate" + i} className="gate" title="Aquí el riesgo pasa del vendedor al comprador" />);
    const payer = rule.pay[i];
    let cost = input.costs[s.id] ?? 0;
    if (s.id === "S9") cost += arancel + iva;
    nodes.push(
      <div key={s.id} className={"node " + (payer === "S" ? "seller" : "buyer")}>
        <div className="box">
          <span className="sid">{s.id}</span>
          <span className="lab">{s.short}</span>
          <span className="cost num">{fmt(cost)}</span>
        </div>
      </div>
    );
  });
  if (rule.risk >= SEGMENTS.length) nodes.push(<div key="gate-end" className="gate" title="El riesgo pasa al final, una vez descargada" />);

  return (
    <>
      <div className="chain-legend">
        <span className="chip"><span className="dot s" /> Paga el vendedor</span>
        <span className="chip"><span className="dot b" /> Paga el comprador</span>
        <span className="chip"><span className="flag-key" /> El riesgo pasa al comprador</span>
      </div>
      <div className="chain-scroll"><div className="chain">{nodes}</div></div>
      <p style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 12 }}>
        Con <b className="mono">{rule.code}</b>, el riesgo de pérdida o daño pasa al comprador en <b>{RISK_LABEL[rule.code]}</b>.
        {rule.insMandatory && ` El vendedor debe contratar seguro (cobertura ${rule.insMandatory}).`}
      </p>
    </>
  );
}

/* ============================ Guía ============================ */
function Guide() {
  const ordered: Rule[] = [...RULES].sort((a, b) => a.level - b.level);
  return (
    <section>
      <div className="eyebrow">Referencia</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "2px 0 6px" }}>Las 11 reglas Incoterms 2020</h1>
      <p className="lead" style={{ marginBottom: 20 }}>De menor a mayor responsabilidad del vendedor.</p>
      <div className="reco-rules">
        {ordered.map((r) => (
          <div className="reco-card" key={r.code}>
            <h3>{r.code}</h3>
            <div className="full">{r.name}</div>
            <div className="why">{r.plain}</div>
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-faint)" }}>
              <span className="mono">{r.mode === "sea" ? "Solo marítimo" : "Cualquier modo"}</span> ·{" "}
              Riesgo: <span style={{ color: "var(--risk)", fontWeight: 600 }}>{RISK_LABEL[r.code]}</span>
              {r.insMandatory && ` · Seguro oblig. (${r.insMandatory})`}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
