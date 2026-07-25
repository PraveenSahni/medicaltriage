import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const catalogRoot = path.join(repoRoot, "docs", "protocol-review", "catalog", "open-source");
const outputPath = path.join(repoRoot, "docs", "protocol-review", "protocol-library.html");

const batchRoot = (batch) =>
  batch === 1 ? catalogRoot : path.join(catalogRoot, `batch-${String(batch).padStart(2, "0")}`);

const clinicalGroups = [
  ["Pregnancy and postpartum", /pregnan|postpartum|vaginal|pelvic|contraception|iud/i],
  ["Mental and behavioural health", /suicide|depression|anxiety|panic|hallucination|alcohol|eating disorder|insomnia/i],
  ["Allergy and immune reactions", /anaphylaxis|immunization|allerg/i],
  ["Cardiovascular", /chest pain|heart|blood pressure|fainting|pacemaker|cyanosis/i],
  ["Respiratory and infectious disease", /breathing|cough|common cold|influenza|covid|measles|\bfever\b/i],
  ["Neurological", /headache|confusion|delirium|coma|seizure|muscle jerk|tic|shudder|weakness|neurologic deficit|motion sickness/i],
  ["Eye", /\beye\b|vision/i],
  ["Ear, nose and throat", /\bear\b|earache|earwax|hearing|nosebleed|swallowing|sore throat|hoarseness/i],
  ["Gastrointestinal", /abdomen|abdominal|diarrhea|vomit|constipation|flank|hernia|nausea|stool|swallowed foreign body/i],
  ["Urinary and reproductive health", /urin|pubic lice|sexual assault/i],
  ["Skin, bites and stings", /skin|rash|hive|bite|sting|lice|wart|ringworm|blister|boil|abscess|tick|burn|sunburn|frostbite|hair loss|impetigo|shingles|zoster|\bsores?\b/i],
  ["Musculoskeletal and injury", /pain|injury|fall|swelling|laceration|\bcut\b|motor vehicle|puncture wound|scrapes/i],
  ["Endocrine and metabolic", /diabetes|blood sugar|sweating|heat exposure|weight loss/i],
  ["Dental and oral health", /tooth|dental|mouth/i],
  ["Environmental exposure and poisoning", /exposure|poison|hypothermia|carbon monoxide|altitude sickness/i],
];
const groupFor = (title) =>
  clinicalGroups.find(([, pattern]) => pattern.test(title))?.[0] ?? "General and other symptoms";

const records = [];
for (let batch = 1; batch <= 23; batch += 1) {
  const root = batchRoot(batch);
  const manifest = JSON.parse(
    fs.readFileSync(
      path.join(root, "manifests", `batch-${String(batch).padStart(2, "0")}-manifest.json`),
      "utf8",
    ),
  );
  for (const entry of manifest.entries) {
    const document = JSON.parse(fs.readFileSync(path.join(root, entry.file), "utf8"));
    records.push({ batch, group: groupFor(document.algorithm.Title), entry, document });
  }
}
records.sort((a, b) => a.entry.algorithmId - b.entry.algorithmId);

const safeJson = JSON.stringify(records).replaceAll("<", "\\u003c");
const generatedAt = new Date().toISOString();

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>UAT Protocol Library</title>
<style>
:root{--bg:#f7f6f3;--bg2:#f1efe9;--card:#fff;--ink:#1a1a19;--muted:#6b6a66;--line:#e0dfd9;--accent:#185fa5;--hdr1:#0b4f66;--hdr2:#0e6e8c;--ems:#a32d2d;--emsbg:#fcebeb;--urgent:#0b6b70;--urgentbg:#dff5f6;--review:#185fa5;--reviewbg:#e6f1fb;--self:#0f6e56;--selfbg:#e1f5ee}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.55 "Segoe UI",system-ui,sans-serif}.shell{max-width:1440px;margin:auto;padding:20px}.top{position:sticky;top:0;z-index:5;background:linear-gradient(135deg,var(--hdr1),var(--hdr2));color:#fff;border-radius:14px;padding:22px 26px;box-shadow:0 8px 24px #0002}.toprow{display:flex;gap:24px;align-items:end;justify-content:space-between}.top h1{margin:0;font-size:1.7rem}.top p{margin:4px 0 0;opacity:.85}.search{width:min(540px,100%)}.search label{display:block;font-size:.72rem;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:5px}.search input{width:100%;border:0;border-radius:9px;padding:12px 14px;font:inherit;box-shadow:0 1px 0 #fff4}.notice{margin:14px 0;padding:10px 14px;border:1px solid #ef9f27;background:#faeeda;color:#633806;border-radius:9px;font-weight:600}.layout{display:grid;grid-template-columns:330px 1fr;gap:18px}.index{background:var(--card);border:1px solid var(--line);border-radius:12px;max-height:calc(100vh - 190px);overflow:auto;position:sticky;top:150px}.count{padding:12px 15px;border-bottom:1px solid var(--line);color:var(--muted)}.item{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid var(--line);background:transparent;padding:11px 14px;cursor:pointer;color:inherit}.item:hover,.item.active{background:var(--bg2)}.item.active{box-shadow:inset 4px 0 var(--accent)}.pid{font-weight:750;color:var(--accent);font-variant-numeric:tabular-nums}.title{font-weight:600;margin-top:2px}.meta{font-size:.76rem;color:var(--muted)}.empty{padding:24px;text-align:center;color:var(--muted)}.dochead{background:linear-gradient(135deg,var(--hdr1),var(--hdr2));color:#fff;border-radius:12px;padding:24px 26px;margin-bottom:14px}.dochead h2{margin:0 0 5px;font-size:1.65rem}.docmeta{display:flex;gap:9px 20px;flex-wrap:wrap;opacity:.88}.toolbar{display:flex;gap:8px;margin-bottom:12px}.toolbar button{border:1px solid var(--line);background:var(--card);color:var(--accent);padding:7px 13px;border-radius:8px;font-weight:650;cursor:pointer}details{background:var(--card);border:1px solid var(--line);border-radius:10px;margin:10px 0;overflow:hidden}summary{cursor:pointer;padding:14px 18px;font-weight:700;font-size:1.02rem;list-style:none}summary:before{content:"▸";color:var(--accent);display:inline-block;width:18px}details[open]>summary:before{transform:rotate(90deg)}.body{border-top:1px solid var(--line);padding:14px 22px}.dispo{border-left:5px solid var(--dc)}.dispo summary{color:var(--dc)}.q,.advice{padding:10px 0;border-bottom:1px dashed var(--line)}.q:last-child,.advice:last-child{border:0}.question{font-weight:650}.why{color:var(--muted);font-style:italic;margin-top:3px}.chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.chip{background:var(--bg2);border:1px solid var(--line);border-radius:999px;padding:2px 8px;font-size:.73rem;color:var(--accent)}ul,ol{padding-left:22px}.words{display:flex;flex-wrap:wrap;gap:6px}.word{background:var(--bg2);border:1px solid var(--line);border-radius:999px;padding:2px 9px;color:var(--muted)}.placeholder{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:80px 20px;text-align:center;color:var(--muted)}@media(max-width:850px){.top{position:static}.toprow{display:block}.search{margin-top:15px}.layout{grid-template-columns:1fr}.index{position:static;max-height:280px}}@media print{.top,.notice,.index,.toolbar{display:none}.layout{display:block}.shell{padding:0}details{break-inside:avoid}details>.body{display:block}}
.search{width:min(650px,100%)}.searchrow{display:grid;grid-template-columns:1fr 240px;gap:8px}.search select{width:100%;border:0;border-radius:9px;padding:12px 10px;font:inherit;background:#fff;color:var(--ink);box-shadow:0 1px 0 #fff4}.layout{grid-template-columns:360px 1fr}.grouphead{position:sticky;top:0;z-index:1;background:var(--bg2);border-bottom:1px solid var(--line);padding:9px 14px;font-size:.74rem;font-weight:800;text-transform:uppercase;letter-spacing:.45px;color:var(--muted)}.grouphead span{float:right;color:var(--accent)}@media(max-width:850px){.searchrow{grid-template-columns:1fr}}
</style>
</head>
<body>
<main class="shell">
 <header class="top"><div class="toprow"><div><h1>UAT Protocol Library</h1><p>Consolidated adult clinical-content catalog</p></div><div class="search"><label for="search">Search protocol ID or title</label><div class="searchrow"><input id="search" autocomplete="off" placeholder="Example: 1001 or Anaphylaxis"><select id="group" aria-label="Clinical group"><option value="">All clinical groups</option></select></div></div></div></header>
 <div class="notice">UAT DATA ONLY — for system-structure validation. Not approved for production or real-patient care.</div>
 <div class="layout"><aside class="index"><div class="count" id="count"></div><div id="list"></div></aside><section id="viewer"><div class="placeholder"><h2>Select a protocol</h2><p>Search by Protocol ID or protocol name, then select a result.</p></div></section></div>
</main>
<script id="protocol-data" type="application/json">${safeJson}</script>
<script>
const records=JSON.parse(document.getElementById("protocol-data").textContent);
const $=s=>document.querySelector(s);let selected=null;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function matches(r,q){q=q.trim().toLowerCase();if(!q)return true;const a=r.document.algorithm;return [r.entry.algorithmId,a.Title,r.entry.protocolFamily,...(r.document.searchwords||[])].some(v=>String(v||"").toLowerCase().includes(q))}
function renderList(){const q=$("#search").value,chosen=$("#group").value;const filtered=records.filter(r=>matches(r,q)&&(!chosen||r.group===chosen));$("#count").textContent=filtered.length+" of "+records.length+" adult protocols";const grouped={};filtered.forEach(r=>(grouped[r.group]??=[]).push(r));$("#list").innerHTML=filtered.length?Object.keys(grouped).sort().map(group=>'<div class="grouphead">'+esc(group)+'<span>'+grouped[group].length+'</span></div>'+grouped[group].map(r=>'<button class="item '+(selected===r.entry.algorithmId?"active":"")+'" data-id="'+r.entry.algorithmId+'"><div class="pid">Protocol '+r.entry.algorithmId+'</div><div class="title">'+esc(r.document.algorithm.Title)+'</div><div class="meta">Batch '+String(r.batch).padStart(2,"0")+' · '+esc(r.document.algorithm.Age)+'</div></button>').join("")).join(""):'<div class="empty">No protocol found.</div>';document.querySelectorAll(".item").forEach(b=>b.onclick=()=>select(Number(b.dataset.id)))}
function colour(level){return level>=100?["var(--ems)","var(--emsbg)"]:level>=70?["var(--urgent)","var(--urgentbg)"]:level>=40?["var(--review)","var(--reviewbg)"]:["var(--self)","var(--selfbg)"]}
function select(id){selected=id;const r=records.find(x=>x.entry.algorithmId===id);const d=r.document,a=d.algorithm;const advice=new Map(d.advice.map(x=>[x.AdviceID,x]));const groups=d.dispositions.slice().sort((x,y)=>y.LevelID-x.LevelID);const redirects=d.questions.filter(q=>q.DispositionLevel==null);const section=(title,body,open=false)=>'<details '+(open?"open":"")+'><summary>'+title+'</summary><div class="body">'+body+'</div></details>';
const qs=groups.map(g=>{const c=colour(g.LevelID);const rows=d.questions.filter(q=>q.DispositionLevel===g.LevelID).map(q=>'<div class="q"><div class="question">'+esc(q.Question)+'</div><div class="why">'+esc(q.Information)+'</div><div class="chips">'+(q.AdviceIDs||[]).map(x=>'<span class="chip">Advice '+x+': '+esc(advice.get(x)?.Title||"")+'</span>').join("")+'</div></div>').join("");return '<details class="dispo" style="--dc:'+c[0]+';background:'+c[1]+'"><summary>'+esc(g.DispositionHeading)+' · Level '+g.LevelID+'</summary><div class="body">'+rows+'</div></details>'}).join("");
const redirectHtml=redirects.length?section("Guideline redirects",redirects.map(q=>'<div class="q"><div class="question">'+esc(q.Question)+'</div><div class="why">Go to: '+esc(q.GotoGuideline)+'</div></div>').join("")):"";
const iaq=section("Initial assessment",'<ol>'+d.initialAssessmentQuestions.map(x=>'<li><b>['+esc(x.Category)+']</b> '+esc(x.Question)+(x.Rationale?'<div class="why">'+esc(x.Rationale)+'</div>':"")+'</li>').join("")+'</ol>',true);
const adviceHtml=section("Care advice",d.advice.slice().sort((x,y)=>x.AlgorithmOrder-y.AlgorithmOrder).map(x=>'<div class="advice"><b>Advice '+x.AdviceID+' · '+esc(x.Title)+'</b><ul>'+x.Content.map(c=>'<li>'+esc(c)+'</li>').join("")+'</ul></div>').join(""));
const background=section("Clinical background",'<p><b>Definition</b></p><ul>'+(a.Definition||[]).map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>'+(a.Background?.KeyPoints?.length?'<p><b>Key points</b></p><ul>'+a.Background.KeyPoints.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>':""));
const refs=section("References",'<ol>'+(d.references||[]).map(x=>'<li>'+esc(typeof x==="string"?x:JSON.stringify(x))+'</li>').join("")+'</ol>');
const words=section("Search words",'<div class="words">'+(d.searchwords||[]).map(x=>'<span class="word">'+esc(x)+'</span>').join("")+'</div>');
$("#viewer").innerHTML='<header class="dochead"><h2>'+esc(a.Title)+'</h2><div class="docmeta"><span><b>Protocol ID:</b> '+a.AlgorithmID+'</span><span><b>Clinical group:</b> '+esc(r.group)+'</span><span><b>Batch:</b> '+String(r.batch).padStart(2,"0")+'</span><span><b>Age:</b> '+esc(a.Age)+'</span><span><b>Gender at birth:</b> '+esc(a.GenderAtBirth)+'</span></div></header><div class="toolbar"><button onclick="toggleAll(true)">Expand all</button><button onclick="toggleAll(false)">Collapse all</button><button onclick="print()">Print protocol</button></div>'+background+iaq+section("Triage assessment questions",redirectHtml+qs,true)+adviceHtml+refs+words;renderList();history.replaceState(null,"","#protocol-"+id);scrollTo({top:0,behavior:"smooth"})}
function toggleAll(open){document.querySelectorAll("#viewer details").forEach(x=>x.open=open)}
const groupNames=[...new Set(records.map(r=>r.group))].sort();$("#group").innerHTML+=groupNames.map(g=>'<option value="'+esc(g)+'">'+esc(g)+'</option>').join("");$("#search").addEventListener("input",renderList);$("#group").addEventListener("change",renderList);$("#search").addEventListener("keydown",e=>{if(e.key==="Enter"){const first=document.querySelector(".item");if(first)first.click()}});renderList();
const initial=Number(location.hash.replace("#protocol-",""));if(records.some(r=>r.entry.algorithmId===initial))select(initial);
</script>
<!-- Generated ${generatedAt} by scripts/generateProtocolLibrary.mjs -->
</body></html>`;

fs.writeFileSync(outputPath, html);
console.log(`Wrote ${records.length} protocols to ${outputPath}`);
