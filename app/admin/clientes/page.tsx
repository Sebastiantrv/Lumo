"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
};

type Formula = { id: string; nombre: string; slug: string; color_acento: string };

const SORPRESA_ID = "__sorpresa__";

function getTipoPedido(diaEntrega: string): "normal" | "domingo" | "extra" {
  const hoy = new Date();
  const dow = hoy.getDay();
  if (dow === 0) return "domingo";
  if (dow === 6) return "normal";
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - dow + 1);
  const sabado = new Date(lunes);
  sabado.setDate(lunes.getDate() + 5);
  const lunesStr = `${lunes.getFullYear()}-${String(lunes.getMonth()+1).padStart(2,"0")}-${String(lunes.getDate()).padStart(2,"0")}`;
  const sabadoStr = `${sabado.getFullYear()}-${String(sabado.getMonth()+1).padStart(2,"0")}-${String(sabado.getDate()).padStart(2,"0")}`;
  if (diaEntrega >= lunesStr && diaEntrega <= sabadoStr) return "extra";
  return "normal";
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPedidoFor, setShowPedidoFor] = useState<string | null>(null);
  const [editandoCliente, setEditandoCliente] = useState<Cliente | null>(null);
  const [showInactivos, setShowInactivos] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);

  async function load() {
    const [{ data: c }, { data: f }] = await Promise.all([
      supabase.from("clientes").select("*").order("nombre"),
      supabase.from("formulas").select("*").order("nombre"),
    ]);
    setClientes(c ?? []);
    setFormulas(f ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  if (loading) return <Loader />;

  const activos = clientes.filter((c) => c.activo);
  const inactivos = clientes.filter((c) => !c.activo);

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-inter text-xs uppercase tracking-widest mb-1" style={{ color: "#4A5E3A" }}>
            Clientes
          </p>
          <h1 className="font-cormorant font-light text-[#F5F0E8]" style={{ fontSize: "2rem" }}>
            {activos.length} activos
          </h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-xl px-4 py-2.5 font-inter text-sm font-medium"
          style={{ background: "#F5F0E8", color: "#0D0D0D" }}
        >
          + Nuevo cliente
        </button>
      </div>

      {activos.length === 0 && inactivos.length === 0 ? (
        <EmptyState onAdd={() => setShowForm(true)} />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Tabla de activos */}
          {activos.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
              {/* Encabezado de columnas */}
              <div className="grid px-4 py-2.5" style={{
                gridTemplateColumns: "1fr 130px 1fr auto",
                background: "rgba(255,255,255,0.02)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <span className="font-inter text-xs uppercase tracking-widest" style={{ color: "#555" }}>Nombre</span>
                <span className="font-inter text-xs uppercase tracking-widest" style={{ color: "#555" }}>WhatsApp</span>
                <span className="font-inter text-xs uppercase tracking-widest" style={{ color: "#555" }}>Notas</span>
                <span />
              </div>

              {activos.map((c, i) => (
                <ClienteRow
                  key={c.id}
                  cliente={c}
                  isLast={i === activos.length - 1}
                  expanded={expandido === c.id}
                  onToggleExpand={() => setExpandido(expandido === c.id ? null : c.id)}
                  onPedido={() => setShowPedidoFor(c.id)}
                  onEditar={() => setEditandoCliente(c)}
                  onReload={load}
                />
              ))}
            </div>
          )}

          {/* Inactivos colapsables */}
          {inactivos.length > 0 && (
            <div>
              <button
                onClick={() => setShowInactivos((v) => !v)}
                className="font-inter text-xs mb-3"
                style={{ color: "#555" }}
              >
                {showInactivos ? "▲ Ocultar inactivos" : `▼ Ver inactivos (${inactivos.length})`}
              </button>
              {showInactivos && (
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.05)", opacity: 0.6 }}>
                  {inactivos.map((c, i) => (
                    <ClienteRow
                      key={c.id}
                      cliente={c}
                      isLast={i === inactivos.length - 1}
                      expanded={expandido === c.id}
                      onToggleExpand={() => setExpandido(expandido === c.id ? null : c.id)}
                      onPedido={() => {}}
                      onEditar={() => setEditandoCliente(c)}
                      onReload={load}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <NuevoClienteModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
      {editandoCliente && (
        <EditarClienteModal cliente={editandoCliente} onClose={() => setEditandoCliente(null)} onSaved={() => { setEditandoCliente(null); load(); }} />
      )}
      {showPedidoFor && (
        <NuevoPedidoModal
          clienteId={showPedidoFor}
          clienteNombre={clientes.find((c) => c.id === showPedidoFor)?.nombre ?? ""}
          formulas={formulas}
          onClose={() => setShowPedidoFor(null)}
          onSaved={() => { setShowPedidoFor(null); load(); }}
        />
      )}
    </div>
  );
}

function ClienteRow({ cliente, isLast, expanded, onToggleExpand, onPedido, onEditar, onReload }: {
  cliente: Cliente;
  isLast: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onPedido: () => void;
  onEditar: () => void;
  onReload: () => void;
}) {
  const [toggling, setToggling] = useState(false);

  async function handleToggleActivo() {
    setToggling(true);
    await supabase.from("clientes").update({ activo: !cliente.activo }).eq("id", cliente.id);
    onReload();
    setToggling(false);
  }

  async function handleEliminar() {
    if (!window.confirm(`¿Eliminar a ${cliente.nombre}? Esta acción no se puede deshacer.`)) return;
    await supabase.from("clientes").delete().eq("id", cliente.id);
    onReload();
  }

  return (
    <div style={{ borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
      {/* Fila principal */}
      <div
        className="grid px-4 py-3 cursor-pointer transition-colors"
        style={{
          gridTemplateColumns: "1fr 130px 1fr auto",
          background: expanded ? "rgba(255,255,255,0.04)" : "transparent",
          gap: "12px",
          alignItems: "center",
        }}
        onClick={onToggleExpand}
      >
        <span className="font-inter text-sm font-medium truncate" style={{ color: "#F5F0E8" }}>
          {cliente.nombre}
        </span>
        <span className="font-inter text-xs truncate" style={{ color: "#4A5E3A" }}>
          {cliente.telefono ?? "—"}
        </span>
        <span className="font-inter text-xs truncate" style={{ color: "#555" }}>
          {cliente.notas ?? "—"}
        </span>
        <span className="font-inter text-xs" style={{ color: "#444" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Panel expandido */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 flex items-center gap-2 flex-wrap"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          {cliente.email && (
            <span className="font-inter text-xs mr-3" style={{ color: "#555" }}>{cliente.email}</span>
          )}
          {cliente.activo && (
            <button onClick={(e) => { e.stopPropagation(); onPedido(); }}
              className="rounded-lg px-3 py-1.5 font-inter text-xs"
              style={{ background: "rgba(74,94,58,0.2)", color: "#6DBF67", border: "1px solid rgba(74,94,58,0.3)" }}>
              + Pedido
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onEditar(); }}
            className="rounded-lg px-3 py-1.5 font-inter text-xs"
            style={{ background: "rgba(255,255,255,0.05)", color: "#8A8A8A", border: "1px solid rgba(255,255,255,0.08)" }}>
            Editar
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleToggleActivo(); }}
            disabled={toggling}
            className="rounded-lg px-3 py-1.5 font-inter text-xs"
            style={{ background: "rgba(255,255,255,0.05)", color: "#8A8A8A", border: "1px solid rgba(255,255,255,0.08)" }}>
            {cliente.activo ? "Desactivar" : "Reactivar"}
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleEliminar(); }}
            className="rounded-lg px-3 py-1.5 font-inter text-xs"
            style={{ background: "rgba(122,32,48,0.12)", color: "#7A2030", border: "1px solid rgba(122,32,48,0.2)" }}>
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

function NuevoClienteModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("clientes").insert({ nombre, telefono: telefono || null, email: email || null, notas: notas || null, activo: true });
    onSaved();
  }

  return (
    <Modal title="Nuevo cliente" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Nombre" required><Input value={nombre} onChange={setNombre} placeholder="Ej. María García" required /></Field>
        <Field label="Teléfono / WhatsApp"><Input value={telefono} onChange={setTelefono} placeholder="+52 55 1234 5678" /></Field>
        <Field label="Email"><Input value={email} onChange={setEmail} placeholder="correo@ejemplo.com" /></Field>
        <Field label="Notas"><Input value={notas} onChange={setNotas} placeholder="Empresa, preferencias, alergias..." /></Field>
        <button type="submit" disabled={saving} className="w-full rounded-xl py-3 font-inter text-sm font-medium mt-2"
          style={{ background: "#F5F0E8", color: "#0D0D0D", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Guardando..." : "Guardar cliente"}
        </button>
      </form>
    </Modal>
  );
}

function EditarClienteModal({ cliente, onClose, onSaved }: { cliente: Cliente; onClose: () => void; onSaved: () => void }) {
  const [nombre, setNombre] = useState(cliente.nombre);
  const [telefono, setTelefono] = useState(cliente.telefono ?? "");
  const [email, setEmail] = useState(cliente.email ?? "");
  const [notas, setNotas] = useState(cliente.notas ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("clientes").update({ nombre, telefono: telefono || null, email: email || null, notas: notas || null }).eq("id", cliente.id);
    onSaved();
  }

  return (
    <Modal title="Editar cliente" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Nombre" required><Input value={nombre} onChange={setNombre} placeholder="Ej. María García" required /></Field>
        <Field label="Teléfono / WhatsApp"><Input value={telefono} onChange={setTelefono} placeholder="+52 55 1234 5678" /></Field>
        <Field label="Email"><Input value={email} onChange={setEmail} placeholder="correo@ejemplo.com" /></Field>
        <Field label="Notas"><Input value={notas} onChange={setNotas} placeholder="Empresa, preferencias, alergias..." /></Field>
        <button type="submit" disabled={saving} className="w-full rounded-xl py-3 font-inter text-sm font-medium mt-2"
          style={{ background: "#F5F0E8", color: "#0D0D0D", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </Modal>
  );
}

function NuevoPedidoModal({ clienteId, clienteNombre, formulas, onClose, onSaved }: {
  clienteId: string; clienteNombre: string; formulas: Formula[]; onClose: () => void; onSaved: () => void;
}) {
  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const [formulaId, setFormulaId] = useState(formulas[0]?.id ?? "");
  const [cantidad, setCantidad] = useState("1");
  const [diaEntrega, setDiaEntrega] = useState(todayStr);
  const [notas, setNotas] = useState("");
  const [excluidos, setExcluidos] = useState<string[]>([]);
  const [ingredientes, setIngredientes] = useState<{ nombre: string }[]>([]);
  const [preferencia, setPreferencia] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (formulaId && formulaId !== SORPRESA_ID) {
      supabase.from("recetas").select("ingredientes(nombre)").eq("formula_id", formulaId)
        .then(({ data }) => {
          const ings = (data ?? []).map((r: any) => r.ingredientes as { nombre: string } | null).filter(Boolean) as { nombre: string }[];
          setIngredientes(ings);
          setExcluidos([]);
        });
    } else {
      setIngredientes([]);
      setExcluidos([]);
    }
  }, [formulaId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    let realFormulaId = formulaId;
    let esSorpresa = false;
    if (formulaId === SORPRESA_ID) {
      realFormulaId = formulas[Math.floor(Math.random() * formulas.length)]?.id ?? formulas[0]?.id ?? "";
      esSorpresa = true;
    }
    await supabase.from("pedidos").insert({
      cliente_id: clienteId, formula_id: realFormulaId, cantidad: parseInt(cantidad),
      dia_entrega: diaEntrega, notas: notas || null, tipo_pedido: getTipoPedido(diaEntrega),
      es_sorpresa: esSorpresa, ingredientes_excluidos: excluidos.length > 0 ? excluidos : null,
      preferencia_sorpresa: preferencia || null,
    });
    onSaved();
  }

  return (
    <Modal title={`Pedido — ${clienteNombre}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Fórmula">
          <select value={formulaId} onChange={(e) => setFormulaId(e.target.value)}
            className="w-full rounded-xl px-4 py-3 font-inter text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8" }}>
            {formulas.map((f) => <option key={f.id} value={f.id} style={{ background: "#1a1a1a" }}>{f.nombre}</option>)}
            <option value={SORPRESA_ID} style={{ background: "#1a1a1a" }}>🎲 Sorpresa</option>
          </select>
        </Field>

        {formulaId === SORPRESA_ID && (
          <div className="rounded-xl px-4 py-3" style={{ background: "rgba(184,134,11,0.12)", border: "1px solid rgba(184,134,11,0.25)" }}>
            <p className="font-inter text-xs" style={{ color: "#E6A800" }}>🎲 Se asignará una fórmula al azar al guardar.</p>
          </div>
        )}

        {formulaId !== SORPRESA_ID && ingredientes.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>Excluir ingredientes</label>
            <div className="flex flex-wrap gap-2">
              {ingredientes.map((ing) => {
                const excluido = excluidos.includes(ing.nombre);
                return (
                  <button key={ing.nombre} type="button" onClick={() => setExcluidos((prev) => excluido ? prev.filter((n) => n !== ing.nombre) : [...prev, ing.nombre])}
                    className="rounded-lg px-3 py-1.5 font-inter text-xs transition-all"
                    style={{ background: excluido ? "rgba(224,80,112,0.12)" : "rgba(255,255,255,0.06)", color: excluido ? "#E05070" : "#8A8A8A", border: excluido ? "1px solid rgba(224,80,112,0.3)" : "1px solid rgba(255,255,255,0.08)", textDecoration: excluido ? "line-through" : "none" }}>
                    {ing.nombre}
                  </button>
                );
              })}
            </div>
            {excluidos.length > 0 && <p className="font-inter text-xs" style={{ color: "#E05070" }}>Sin: {excluidos.join(", ")}</p>}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>Preferencia de sabor</label>
          <div className="flex gap-2">
            {["Dulce", "Fresco", "Balanceado"].map((p) => (
              <button key={p} type="button" onClick={() => setPreferencia((prev) => prev === p ? "" : p)}
                className="rounded-lg px-3 py-1.5 font-inter text-xs transition-all"
                style={{ background: preferencia === p ? "rgba(74,94,58,0.25)" : "rgba(255,255,255,0.06)", color: preferencia === p ? "#6DBF67" : "#8A8A8A", border: preferencia === p ? "1px solid rgba(74,94,58,0.4)" : "1px solid rgba(255,255,255,0.08)" }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <Field label="Cantidad">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setCantidad((v) => String(Math.max(1, parseInt(v) - 1)))}
              className="w-10 h-10 rounded-xl font-inter text-lg" style={{ background: "rgba(255,255,255,0.06)", color: "#F5F0E8" }}>−</button>
            <span className="font-cormorant text-2xl flex-1 text-center" style={{ color: "#F5F0E8" }}>{cantidad}</span>
            <button type="button" onClick={() => setCantidad((v) => String(parseInt(v) + 1))}
              className="w-10 h-10 rounded-xl font-inter text-lg" style={{ background: "rgba(255,255,255,0.06)", color: "#F5F0E8" }}>+</button>
          </div>
        </Field>

        <Field label="Día de entrega">
          <input type="date" value={diaEntrega} onChange={(e) => setDiaEntrega(e.target.value)}
            className="w-full rounded-xl px-4 py-3 font-inter text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8", colorScheme: "dark" }} />
        </Field>

        <Field label="Notas (opcional)">
          <Input value={notas} onChange={setNotas} placeholder="Ej. doble betabel..." />
        </Field>

        <button type="submit" disabled={saving} className="w-full rounded-xl py-3 font-inter text-sm font-medium mt-2"
          style={{ background: "#F5F0E8", color: "#0D0D0D", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Guardando..." : "Guardar pedido"}
        </button>
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "#171717", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-cormorant text-xl font-light" style={{ color: "#F5F0E8" }}>{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)", color: "#8A8A8A" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>
        {label}{required && <span style={{ color: "#7A2030" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, required }: { value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required}
      className="w-full rounded-xl px-4 py-3 font-inter text-sm outline-none"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8" }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "#4A5E3A")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")} />
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl p-10 text-center" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
      <p className="font-cormorant text-2xl mb-2" style={{ color: "#F5F0E8" }}>Sin clientes aún</p>
      <p className="font-inter text-sm mb-5" style={{ color: "#555" }}>Agrega tu primer cliente para empezar.</p>
      <button onClick={onAdd} className="rounded-xl px-5 py-2.5 font-inter text-sm font-medium"
        style={{ background: "#F5F0E8", color: "#0D0D0D" }}>+ Agregar cliente</button>
    </div>
  );
}

function Loader() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#4A5E3A", borderTopColor: "transparent" }} />
    </div>
  );
}
