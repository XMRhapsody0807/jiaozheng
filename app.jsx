// 矫正学校讲述记录 · 主应用
const { useState, useEffect, useMemo, useRef, useCallback } = React;

function LoadingScreen({ error }) {
  return (
    <div style={{
      display:"grid",placeItems:"center",height:"100vh",
      fontFamily:"var(--serif)",color:"var(--ink-3)",
      textAlign:"center",padding:24,background:"var(--paper)"
    }}>
      <div>
        <div style={{fontFamily:"var(--mono)",fontSize:10,letterSpacing:".22em",color:"var(--accent-2)",marginBottom:14,textTransform:"uppercase"}}>
          {error ? "数据加载出现问题 请在github提issuse" : "正在打开…"}
        </div>
        <div style={{fontSize:18,color:"var(--ink-2)",lineHeight:1.6}}>
          {error ? error : "加载中......"}
        </div>
      </div>
    </div>
  );
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "dense": false,
  "redact": false,
  "showScandalOnly": false
}/*EDITMODE-END*/;

const CONTENT_WARNING_KEY = "jiaozheng-content-warning-v1";

function readContentWarningAccepted() {
  try {
    return window.localStorage.getItem(CONTENT_WARNING_KEY) === "accepted";
  } catch (_) {
    return false;
  }
}

function writeContentWarningAccepted() {
  try {
    window.localStorage.setItem(CONTENT_WARNING_KEY, "accepted");
  } catch (_) {
    // Ignore storage failures; the warning will appear again next visit.
  }
}

// ───── Helpers ─────
function formatDate(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function totalTestimonies(data) {
  return data.data.reduce((s, x) => s + (x.testimonies?.length || 0), 0);
}
function cnNum(n) {
  return String(n).replace(/\d/g, (d) => "〇一二三四五六七八九"[d]);
}

// ───── Markers ─────
function makeMarkerIcon(count, selected) {
  const size = Math.min(18 + count * 3, 36);
  const html = `<div class="mk ${selected ? "sel" : ""}" style="width:${size}px;height:${size}px;"><div class="count">${count}</div></div>`;
  return L.divIcon({ html, className: "mk-wrap", iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

// ───── Left list row ─────
function SchoolRow({ s, total, selected, onSelect }) {
  return (
    <div className={"row " + (selected ? "sel" : "")} onClick={() => onSelect(s.id)}>
      <div className="rid">{s.id} · {s.province} / {s.prov}</div>
      <div className="rname"><span className="redactable">{s.name}</span></div>
      <div className="raddr">{s.addr}</div>
      <div className="rmeta">
        <span className="t">{total} 条讲述</span>
        <span>负责人 <span className="redactable">{s.testimonies[0]?.HMaster || "—"}</span></span>
      </div>
    </div>
  );
}

// ───── Testimony item ─────
function TestimonyItem({ t, idx }) {
  return (
    <div className="t-item">
      <div className="t-head">
        <div className="num">{String(idx + 1).padStart(2, "0")}</div>
        <div className="who">
          — <b>{t.inputType}</b> 讲述
        </div>
      </div>
      <div className="t-facts">
        <span>入校年龄<b>{t.age_at}</b></span>
        <span>年份<b>{t.year}</b></span>
        <span>时长<b>{t.duration}</b></span>
      </div>
      <div className="t-quote">{t.experience}</div>
      {t.scandal && t.scandal !== "—" && (
        <div className="t-scandal">
          <div className="lbl">已知丑闻</div>
          <div>{t.scandal}</div>
        </div>
      )}
    </div>
  );
}

// ───── Content warning ─────
function ContentWarning({ onAccept }) {
  const leavePage = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = "about:blank";
  };

  return (
    <div className="cw-overlay" role="dialog" aria-modal="true" aria-labelledby="cw-title">
      <div className="cw-card">
        <div className="cw-k">CONTENT WARNING</div>
        <h2 id="cw-title">内容警告</h2>
        <p>
          本站内容可能涉及体罚、限制人身自由、性侵、精神控制、自伤或死亡的叙述,也可能包含未经司法确认的投稿内容。
        </p>
        <p>
          如果你未满 18 岁,或这些主题会造成明显不适,建议在可信任成年人陪同下阅读,或先离开页面。
        </p>
        <div className="cw-actions">
          <button className="cw-btn primary" onClick={onAccept}>我已知晓,继续查看</button>
          <button className="cw-btn" onClick={leavePage}>离开页面</button>
        </div>
      </div>
    </div>
  );
}

// ───── Drawer (right col) ─────
function Drawer({ school, total }) {
  if (!school) {
    return (
      <div className="drawer">
        <div className="dhd">
          <div className="eb">使用指南</div>
          <h2 style={{ fontSize: 20 }}>点击地图上的标记<br/>阅读该校全部讲述</h2>
        </div>
        <div className="empty">
          <h3>站点说明</h3>
          <p>这里收集了受害者本人、家属、朋友同学提交的亲历叙述。每一所学校的标记大小代表已收录的讲述数量,点击即可在此侧栏阅读全部讲述。</p>
          <ul>
            <li>左栏:按省份筛选 / 按学校名搜索</li>
            <li>中栏:按经纬度分布的学校标记</li>
            <li>右栏:选中学校后的全部讲述</li>
          </ul>
          <p style={{ color: "var(--warn)", marginTop: 18, fontSize: 12.5 }}>本页所有内容为设计稿用虚构示例,不指向任何现实机构或个人。</p>
        </div>
      </div>
    );
  }
  const testis = school.testimonies || [];
  return (
    <div className="drawer" key={school.id}>
      <div className="drawer-scroll">
        <div className="dhd">
          <div className="eb">编号 {school.id} · 共 {testis.length} 条讲述</div>
          <h2 className="redactable">{school.name}</h2>
          <dl className="meta">
            <dt>地址</dt><dd>{school.addr}</dd>
            <dt>行政区</dt><dd>{school.province} · {school.prov}</dd>
            <dt>负责人</dt><dd className="redactable">{testis[0]?.HMaster || "—"}</dd>
            <dt>联系方式</dt><dd className="redactable">{testis.map(x=>x.contact).filter(c=>c && c!=="—")[0] || "—"}</dd>
            <dt>坐标</dt><dd style={{fontFamily:"var(--mono)",fontSize:12}}>{school.lat.toFixed(4)}° N, {school.lng.toFixed(4)}° E</dd>
            {school.else && school.else !== "—" && <><dt>备注</dt><dd>{school.else}</dd></>}
          </dl>
        </div>
        <div className="dbody">
          <div className="t-idx">— 共 {testis.length} 条讲述 —</div>
          {testis.map((t, i) => <TestimonyItem key={i} t={t} idx={i} />)}
        </div>
      </div>
    </div>
  );
}

// ───── Map ─────
function MapView({ schools, selectedId, onSelect, dark, lastSynced }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markersRef = useRef({});
  const tileRef = useRef(null);

  // Init once
  useEffect(() => {
    const m = L.map(containerRef.current, {
      center: [33.5, 108],
      zoom: 4.4,
      zoomControl: true,
      attributionControl: true,
      zoomSnap: 0.25,
      worldCopyJump: false,
      minZoom: 3,
      maxZoom: 16,
    });
    mapRef.current = m;
    tileRef.current = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
      {
        attribution: '地图数据 © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · 样式 © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(m);

    // Labels on top (very subtle)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
      { subdomains: "abcd", maxZoom: 19, opacity: 0.8 }
    ).addTo(m);

    return () => { m.remove(); };
  }, []);

  // Markers
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    // Remove old
    Object.values(markersRef.current).forEach((mk) => m.removeLayer(mk));
    markersRef.current = {};

    schools.forEach((s) => {
      const count = s.testimonies?.length || 1;
      const mk = L.marker([s.lat, s.lng], {
        icon: makeMarkerIcon(count, s.id === selectedId),
      }).addTo(m);
      mk.on("click", () => onSelect(s.id));
      mk.bindTooltip(
        `<div style="font-family:var(--serif);font-size:13px;color:var(--ink);padding:2px 2px;">
          <div style="font-weight:500">${s.name}</div>
          <div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:.08em;margin-top:2px">${s.province} · ${count} 条讲述</div>
         </div>`,
        { direction: "top", offset: [0, -8], opacity: 1, className: "mk-tip" }
      );
      markersRef.current[s.id] = mk;
    });
  }, [schools, selectedId, onSelect]);

  // Pan to selected
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !selectedId) return;
    const s = schools.find((x) => x.id === selectedId);
    if (!s) return;
    m.flyTo([s.lat, s.lng], Math.max(m.getZoom(), 6), { duration: 0.6 });
  }, [selectedId, schools]);

  return (
    <div className="col mapcol">
      <div ref={containerRef} id="map"></div>
      <div className="map-legend">
        <div className="t">图例 · Legend</div>
        <div className="scale">
          <div className="c" style={{ width: 10, height: 10 }}></div>
          <div className="lbl">1 条讲述 <em>较少</em></div>
        </div>
        <div className="scale">
          <div className="c" style={{ width: 16, height: 16 }}></div>
          <div className="lbl">2–3 条</div>
        </div>
        <div className="scale">
          <div className="c" style={{ width: 24, height: 24 }}></div>
          <div className="lbl">4+ 条 <em>密集</em></div>
        </div>
      </div>
      <div className="map-ts">
        <span className="dot"></span>刚刚同步 {formatDate(lastSynced)}
      </div>
    </div>
  );
}

// ───── App ─────
function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [provFilter, setProvFilter] = useState(null);
  const [contentWarningAccepted, setContentWarningAccepted] = useState(readContentWarningAccepted);

  const [ARCHIVE, setARCHIVE] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    window.loadArchive()
      .then(setARCHIVE)
      .catch((e) => { console.error(e); setLoadError(String(e.message || e)); });
  }, []);

  // Apply theme + modes on <html>
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("dark", !!tweaks.dark);
    document.body.classList.toggle("redact", !!tweaks.redact);
    document.body.classList.toggle("dense", !!tweaks.dense);
  }, [tweaks.dark, tweaks.redact, tweaks.dense]);

  // Filter list
  const filtered = useMemo(() => {
    if (!ARCHIVE) return [];
    return ARCHIVE.data.filter((s) => {
      if (provFilter && s.province !== provFilter) return false;
      if (tweaks.showScandalOnly) {
        const has = (s.testimonies || []).some((t) => t.scandal && t.scandal !== "—");
        if (!has) return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hay = `${s.name} ${s.addr} ${s.province} ${s.prov} ${(s.testimonies || []).map(t=>t.experience).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [ARCHIVE, provFilter, query, tweaks.showScandalOnly]);

  const selectedSchool = useMemo(
    () => ARCHIVE?.data.find((s) => s.id === selectedId) || null,
    [selectedId, ARCHIVE]
  );

  const handleSelect = useCallback((id) => setSelectedId(id), []);

  // Mobile tab state
  const [mobTab, setMobTab] = useState("map");
  useEffect(() => {
    document.body.classList.remove("tab-list", "tab-map", "tab-detail");
    document.body.classList.add("tab-" + mobTab);
  }, [mobTab]);
  useEffect(() => {
    if (selectedId && window.matchMedia("(max-width: 820px)").matches) {
      setMobTab("detail");
    }
  }, [selectedId]);

  const acceptContentWarning = useCallback(() => {
    writeContentWarningAccepted();
    setContentWarningAccepted(true);
  }, []);

  const resetContentWarning = useCallback(() => {
    try {
      window.localStorage.removeItem(CONTENT_WARNING_KEY);
    } catch (_) {
      // Ignore storage failures.
    }
    setContentWarningAccepted(false);
  }, []);

  if (!ARCHIVE) return <LoadingScreen error={loadError} />;

  const totalSchools = ARCHIVE.data.length;
  const totalTestis = totalTestimonies(ARCHIVE);
  const totalProv = new Set(ARCHIVE.data.map((s) => s.province)).size;
  const provs = ARCHIVE.statistics;

  return (
    <>
      <div className="app">
        <header className="hdr">
          <div className="title-blk">
            <div className="eyebrow"><span className="dot"></span>A MAP OF WHAT HAPPENED</div>
            <h1>矫正学校分布</h1>
          </div>
          <div className="stats">
            <div className="stat accent">
              <div className="k">已经记下</div>
              <div className="v">{totalTestis}<span className="unit">段经历</span></div>
            </div>
            <div className="stat">
              <div className="k">来自</div>
              <div className="v">{totalSchools}<span className="unit">所学校</span></div>
            </div>
            <div className="stat">
              <div className="k">分布在</div>
              <div className="v">{totalProv}<span className="unit">个省</span></div>
            </div>
            <div className="stat">
              <div className="k">大家进去时</div>
              <div className="v">约 {ARCHIVE.avg_age}<span className="unit">岁</span></div>
            </div>
          </div>
        </header>

        <div className="banner">
          <span className="tag">内容警告</span>
          <span className="txt">本页含创伤、体罚、限制人身自由、性侵等相关叙述,部分内容来自投稿且可能尚未核验。</span>
          <button className="banner-link" onClick={resetContentWarning}>重新查看</button>
        </div>

        <div className="mob-tabs">
          <button className={"mob-tab " + (mobTab==="list"?"on":"")} onClick={()=>setMobTab("list")}>学校<span className="n">{totalSchools}</span></button>
          <button className={"mob-tab " + (mobTab==="map"?"on":"")} onClick={()=>setMobTab("map")}>地图</button>
          <button className={"mob-tab " + (mobTab==="detail"?"on":"")} onClick={()=>setMobTab("detail")} disabled={!selectedSchool}>讲述<span className="n">{selectedSchool?selectedSchool.testimonies.length:0}</span></button>
        </div>

        <main>
          {/* Left: search + list */}
          <aside className="col leftbar">
            <div className="search">
              <input
                placeholder="搜索 学校、地址、经历关键词…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="meta">
                <span>结果 · {filtered.length} / {totalSchools}</span>
                <span>按讲述数排序</span>
              </div>
            </div>
            <div className="prov-filter">
              <button
                className={"prov-chip " + (provFilter === null ? "on" : "")}
                onClick={() => setProvFilter(null)}
              >
                全部 <span className="n">{totalSchools}</span>
              </button>
              {provs.slice(0, 12).map((p) => (
                <button
                  key={p.province}
                  className={"prov-chip " + (provFilter === p.province ? "on" : "")}
                  onClick={() => setProvFilter(provFilter === p.province ? null : p.province)}
                >
                  {p.province} <span className="n">{p.count}</span>
                </button>
              ))}
            </div>
            <div className="list">
              {filtered.map((s) => (
                <SchoolRow
                  key={s.id}
                  s={s}
                  total={s.testimonies?.length || 0}
                  selected={s.id === selectedId}
                  onSelect={handleSelect}
                />
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: "30px 18px", color: "var(--ink-3)", fontFamily: "var(--serif)", fontStyle: "italic" }}>
                  无匹配结果
                </div>
              )}
            </div>
          </aside>

          {/* Center: map */}
          <MapView
            schools={filtered}
            selectedId={selectedId}
            onSelect={handleSelect}
            dark={tweaks.dark}
            lastSynced={ARCHIVE.last_synced}
          />

          {/* Right: drawer */}
          <Drawer school={selectedSchool} total={totalTestis} />
        </main>

        <footer>
          <div>
            <span>© 独立记录 · 非商业用途 · 内容为当事人所有</span>
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            <span>底图 OpenStreetMap / CARTO</span>
            <span>刚刚同步 {formatDate(ARCHIVE.last_synced)}</span>
          </div>
        </footer>
      </div>

      {!contentWarningAccepted && (
        <ContentWarning onAccept={acceptContentWarning} />
      )}

      <TweaksPanel>
        <TweakSection label="显示" />
        <TweakToggle label="深色主题 (夜间阅读)" value={tweaks.dark}
          onChange={(v) => setTweak("dark", v)} />
        <TweakToggle label="紧凑信息密度" value={tweaks.dense}
          onChange={(v) => setTweak("dense", v)} />
        <TweakSection label="隐私" />
        <TweakToggle label="脱敏模式 (遮蔽姓名/联系方式)" value={tweaks.redact}
          onChange={(v) => setTweak("redact", v)} />
        <TweakSection label="筛选" />
        <TweakToggle label="仅显示有已知丑闻的学校" value={tweaks.showScandalOnly}
          onChange={(v) => setTweak("showScandalOnly", v)} />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
