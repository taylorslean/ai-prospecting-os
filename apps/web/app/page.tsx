"use client";
import { useEffect, useMemo, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4009";

async function api(p: string, o: any = {}) {
  const t = localStorage.getItem("token");
  const r = await fetch(API + p, {
    ...o,
    headers: {
      "content-type": "application/json",
      ...(t ? { authorization: `Bearer ${t}` } : {}),
    },
  });
  if (!r.ok) throw new Error((await r.text()).slice(0, 200));
  return r.headers.get("content-type")?.includes("json") ? r.json() : r.text();
}

export default function Home() {
  const [e, setE] = useState("owner@example.com");
  const [pw, setPw] = useState("ChangeMe123!");
  const [ok, setOk] = useState(false);
  const [cs, setCs] = useState<any[]>([]);
  const [ls, setLs] = useState<any[]>([]);
  const [u, setU] = useState<any>();
  const [n, setN] = useState("Local Growth Leads");
  const [q, setQ] = useState("dentist");
  const [loc, setLoc] = useState("Jakarta");
  const [offer, setOffer] = useState("Website + AI lead generation");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [msg, setMsg] = useState("");

  const refresh = async () => {
    try {
      const [x, y, z] = await Promise.all([
        api("/api/campaigns"),
        api("/api/leads"),
        api("/api/usage"),
      ]);
      setCs(x);
      setLs(y);
      setU(z);
      setOk(true);
    } catch (x: any) {
      setMsg(x.message);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) refresh();
  }, []);

  const filtered = useMemo(
    () =>
      ls.filter(
        (l) =>
          (!search ||
            l.name.toLowerCase().includes(search.toLowerCase()) ||
            String(l.domain || "").includes(search.toLowerCase())) &&
          (!status || l.status === status)
      ),
    [ls, search, status]
  );

  const login = async () => {
    try {
      const r = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: e, password: pw }),
      });
      localStorage.setItem("token", r.token);
      refresh();
    } catch (x: any) {
      setMsg(x.message);
    }
  };

  const create = async () => {
    try {
      await api("/api/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name: n,
          query: q,
          location: loc,
          offer,
          maxResults: 100,
        }),
      });
      refresh();
    } catch (x: any) {
      setMsg(x.message);
    }
  };

  const run = async (id: string) => {
    try {
      await api(`/api/campaigns/${id}/run`, { method: "POST" });
      setMsg("Campaign queued.");
      setTimeout(refresh, 3000);
    } catch (x: any) {
      setMsg(x.message);
    }
  };

  if (!ok)
    return (
      <main className="center">
        <div className="card auth">
          <h1>
            AI Prospecting OS <span>V0.4</span>
          </h1>
          <p>Discovery → enrichment → research → scoring.</p>
          <input value={e} onChange={(x) => setE(x.target.value)} />
          <input
            type="password"
            value={pw}
            onChange={(x) => setPw(x.target.value)}
          />
          <button onClick={login}>Sign in</button>
          <small>{msg}</small>
        </div>
      </main>
    );

  return (
    <main>
      <header>
        <div>
          <h1>AI Prospecting OS</h1>
          <p>V0.4 • multi-tenant prospecting pipeline</p>
        </div>
        <div className="pill">
          {u?.plan} · {u?.used}/{u?.limit}
        </div>
      </header>

      <section className="grid stats">
        {(
          [
            [cs.length, "Campaigns"],
            [ls.length, "Leads"],
            [
              ls.filter((l) => (l.leadScore?.score || 0) >= 70).length,
              "High intent",
            ],
            [
              ls.reduce((a, l) => a + l.opportunities.length, 0),
              "Opportunities",
            ],
          ] as [number, string][]
        ).map(([a, b]) => (
          <div className="card" key={String(b)}>
            <b>{a}</b>
            <span>{b}</span>
          </div>
        ))}
      </section>

      <section className="grid two">
        <div className="card">
          <h2>New campaign</h2>
          <input
            value={n}
            onChange={(x) => setN(x.target.value)}
            placeholder="Campaign name"
          />
          <input
            value={q}
            onChange={(x) => setQ(x.target.value)}
            placeholder="Business query"
          />
          <input
            value={loc}
            onChange={(x) => setLoc(x.target.value)}
            placeholder="Location"
          />
          <textarea
            value={offer}
            onChange={(x) => setOffer(x.target.value)}
          />
          <button onClick={create}>Create campaign</button>
        </div>
        <div className="card">
          <h2>Campaigns</h2>
          {cs.map((c) => (
            <div className="row" key={c.id}>
              <div>
                <b>{c.name}</b>
                <small>
                  {c.query} · {c.location} · {c.status}
                </small>
              </div>
              {c.status !== "RUNNING" && (
                <button onClick={() => run(c.id)}>Run</button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="toolbar">
          <h2>Leads</h2>
          <input
            value={search}
            onChange={(x) => setSearch(x.target.value)}
            placeholder="Search"
          />
          <select
            value={status}
            onChange={(x) => setStatus(x.target.value)}
          >
            <option value="">All</option>
            {["NEW", "QUALIFIED", "CONTACTED", "REPLIED", "WON", "LOST"].map(
              (s) => (
                <option key={s}>{s}</option>
              )
            )}
          </select>
          <a href={API + "/api/leads/export.csv"}>Export CSV</a>
        </div>
        {filtered.map((l) => (
          <div className="lead" key={l.id}>
            <div>
              <b>{l.name}</b>
              <small>
                {l.domain || "no website"} ·{" "}
                {l.contacts?.[0]?.email || "no email"}
              </small>
            </div>
            <strong>{l.leadScore?.score ?? 0}</strong>
            <span>{l.status}</span>
            <em>{l.opportunities?.length || 0} opps</em>
          </div>
        ))}
      </section>

      <p>{msg}</p>
    </main>
  );
}