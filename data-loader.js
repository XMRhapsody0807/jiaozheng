const PROV_T2S = {
  "山東": "山东", "廣東": "广东", "廣西": "广西", "貴州": "贵州",
  "重慶": "重庆", "遼寧": "辽宁", "黑龍江": "黑龙江",
  "江蘇": "江苏", "陝西": "陕西", "內蒙古": "内蒙古",
  "寧夏": "宁夏", "臺灣": "台湾", "雲南": "云南", "歷城": "历城"
};

function toSimpProv(p) { return PROV_T2S[p] || p; }

async function loadArchive() {
  const res = await fetch("map-data.json", { cache: "force-cache" });
  const raw = await res.json();

  // 聚合:key = name|lat|lng
  const schoolMap = new Map();
  for (const row of raw.data || []) {
    if (row.lat == null || row.lng == null || isNaN(row.lat) || isNaN(row.lng)) continue;
    const key = `${row.name || "未命名"}|${row.lat.toFixed(4)}|${row.lng.toFixed(4)}`;
    let s = schoolMap.get(key);
    if (!s) {
      s = {
        id: "S" + String(schoolMap.size + 1).padStart(4, "0"),
        name: row.name || "未命名机构",
        addr: row.addr || "",
        province: toSimpProv(row.province || ""),
        prov: row.prov || row.city || row.county || "",
        else: row.else || "",
        lat: row.lat,
        lng: row.lng,
        testimonies: [],
      };
      schoolMap.set(key, s);
    }
    // 当前行作为一条讲述加入
    s.testimonies.push({
      inputType: row.inputType || "未注明",
      experience: row.experience || "",
      HMaster: row.HMaster || "",
      scandal: row.scandal || "",
      contact: row.contact || "",
      dateStart: row.dateStart || "",
      dateEnd: row.dateEnd || "",
    });
    // 取最先出现的负责人作为学校负责人兜底
    if (!s.HMaster && row.HMaster) s.HMaster = row.HMaster;
    if (!s.scandal && row.scandal) s.scandal = row.scandal;
  }

  const schools = Array.from(schoolMap.values());
  // 按讲述数降序
  schools.sort((a, b) => b.testimonies.length - a.testimonies.length);

  const statistics = (raw.statistics || [])
    .map((p) => ({ province: toSimpProv(p.province), count: p.count }))
    .sort((a, b) => b.count - a.count);

  return {
    avg_age: raw.avg_age,
    schoolNum: raw.schoolNum || schools.length,
    formNum: raw.formNum || 0,
    last_synced: raw.last_synced,
    statistics,
    data: schools,
  };
}

window.loadArchive = loadArchive;
