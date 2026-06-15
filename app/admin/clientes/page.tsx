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

type NuevoPedido = {
  cliente_id: string;
  formula_id: string;
  cantidad: number;
  dia_entrega: string;
  notas: string;
};

function getTipoPedido(diaEntrega: string): "normal" | "domingo" | "extra" {
  const hoy = new Date();
  const dow = hoy.getDay();
  if (dow === 0) return "domingo";
  if (dow === 6) return "normal";
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - dow + 1);
  const sabado = new Date(lunes);
  sabado.setDate(lunes.getDate() + 5);
  const lunesStr = lunes.toISOString().split("T")[0];
  const sabadoStr = sabado.toISOString().split("T")[0];
  if (diaEntrega >= lunesStr && diaEntrega <= sabadoStr) return "extra";
  return "normal";
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPedidoFor, setShowPedidoFor] = useState<string | null>(null);

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

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-inter text-xs uppercase tracking-widest mb-1" style={{ color: "#4A5E3A" }}>
            Clientes
          </p>
          <h1 className="font-cormorant font-light text-[#F5F0E8]" style={{ fontSize: "2rem" }}>
            {clientes.length} clientes registrados
          </h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-inter text-sm font-medium"
          style={{ background: "#F5F0E8", color: "#0D0D0D" }}
        >
          + Nuevo cliente
        </button>
      </div>

      {clientes.length === 0 ? (
        <EmptyState onAdd={() => setShowForm(true)} />
      ) : (
        <div className="flex flex-col gap-3">
          {clientes.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl p-5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                opacity: c.activo ? 1 : 0.5,
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-inter font-medium text-sm" style={{ color: "#F5F0E8" }}>{c.nombre}</p>
                  {c.telefono && (
                    <a href={`https://wa.me/${c.telefono.replace(/\D/g, "")}`} target="_blank" rel="noopener"
                      className="font-inter text-xs mt-0.5 block" style={{ color: "#4A5E3A" }}>
                      {c.telefono}
                    </a>
                  )}
                  {c.notas && (
                    <p className="font-inter text-xs mt-1.5" style={{ color: "#555" }}>{c.notas}</p>
                  )}
                </div>
                <button
                  onClick={() => setShowPedidoFor(c.id)}
                  className="rounded-lg px-3 py-1.5 font-inter text-xs"
                  style={{ background: "rgba(74,94,58,0.15)", color: "#4A5E3A" }}
                >
                  + Pedido
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <NuevoClienteModal
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
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

function NuevoClienteModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("clientes").insert({ nombre, telefono: telefono || null, notas: notas || null });
    onSaved();
  }

  return (
    <Modal title="Nuevo cliente" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Nombre" required>
          <Input value={nombre} onChange={setNombre} placeholder="Ej. María García" required />
        </Field>
        <Field label="Teléfono / WhatsApp">
          <Input value={telefono} onChange={setTelefono} placeholder="+52 55 1234 5678" />
        </Field>
        <Field label="Notas">
          <Input value={notas} onChange={setNotas} placeholder="Preferencias, alergias, etc." />
        </Field>
        <button type="submit" disabled={saving} className="w-full rounded-xl py-3 font-inter text-sm font-medium mt-2"
          style={{ background: "#F5F0E8", color: "#0D0D0D", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Guardando..." : "Guardar cliente"}
        </button>
      </form>
    </Modal>
  );
}

function NuevoPedidoModal({
  clienteId, clienteNombre, formulas, onClose, onSaved,
}: {
  clienteId: string;
  clienteNombre: string;
  formulas: Formula[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [formulaId, setFormulaId] = useState(formulas[0]?.id ?? "");
  const [cantidad, setCantidad] = useState("1");
  const [diaEntrega, setDiaEntrega] = useState(new Date().toISOString().split("T")[0]);
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("pedidos").insert({
      cliente_id: clienteId,
      formula_id: formulaId,
      cantidad: parseInt(cantidad),
      dia_entrega: diaEntrega,
      notas: notas || null,
      tipo_pedido: getTipoPedido(diaEntrega),
    });
    onSaved();
  }

  return (
    <Modal title={`Pedido para ${clienteNombre}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Fórmula">
          <select
            value={formulaId}
            onChange={(e) => setFormulaId(e.target.value)}
            className="w-full rounded-xl px-4 py-3 font-inter text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8" }}
          >
            {formulas.map((f) => (
              <option key={f.id} value={f.id} style={{ background: "#1a1a1a" }}>{f.nombre}</option>
            ))}
          </select>
        </Field>
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
          <Input value={notas} onChange={setNotas} placeholder="Ej. sin jengibre, doble betabel..." />
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
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#171717", border: "1px solid rgba(255,255,255,0.08)" }}>
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
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full rounded-xl px-4 py-3 font-inter text-sm outline-none"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8" }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "#4A5E3A")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
    />
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl p-10 text-center" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
      <p className="font-cormorant text-2xl mb-2" style={{ color: "#F5F0E8" }}>Sin clientes aún</p>
      <p className="font-inter text-sm mb-5" style={{ color: "#555" }}>Agrega tu primer cliente para empezar a gestionar pedidos.</p>
      <button onClick={onAdd} className="rounded-xl px-5 py-2.5 font-inter text-sm font-medium"
        style={{ background: "#F5F0E8", color: "#0D0D0D" }}>
        + Agregar cliente
      </button>
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
