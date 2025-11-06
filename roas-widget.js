class ROASWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode:'open'});
    this.shadowRoot.innerHTML = `
<style>
:host { all: initial; display:block; font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Roboto,sans-serif; }
.roas-calculator {
  max-width:900px; margin:40px auto; background:#fff; border-radius:24px; box-shadow:0 8px 20px rgba(0,0,0,0.08); padding:32px; color:#1c1c1e;
}
h2{text-align:center;font-size:1.8rem;margin-bottom:6px;}
.subtitle{text-align:center;color:#666;margin-bottom:24px;}
.input-grid{display:flex;gap:24px;flex-wrap:wrap;}
.column{flex:1;min-width:280px;}
label{font-size:0.9rem;color:#444;display:block;margin-bottom:6px;margin-top:14px;}
input{padding:10px;border:1px solid #d2d2d7;border-radius:10px;font-size:1rem;background:#f9f9f9;width:100%;box-sizing:border-box;transition: all 0.2s;}
input:focus{outline:none;border-color:#0071e3;background:white;box-shadow:0 0 0 2px rgba(0,113,227,0.1);}
.input-blue{border-color:#0071e3;box-shadow:0 0 0 2px rgba(0,113,227,0.15);}
.button-main{margin-top:30px;width:100%;background:#0071e3;color:white;font-weight:600;border:none;border-radius:14px;padding:14px;font-size:1.1rem;cursor:pointer;transition: background 0.2s;}
.button-main:hover{background:#0a84ff;}
.results{margin-top:30px;text-align:center;display:none;}
.result-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.result-card{background:#f5f5f7;padding:16px;border-radius:16px;transition: transform 0.3s;}
.result-card.highlight{background:#e8f0fe;box-shadow:0 0 0 2px #0071e3 inset;}
.result-card h1{margin:6px 0;font-size:1.8rem;}
.field-live{margin-top:16px;}
.field-live h2{font-size:1.4rem;color:#0071e3;margin:6px 0 0 0;font-weight:600;}
footer{text-align:center;margin-top:20px;font-size:13px;color:#999;}
footer a{color:#0071e3;text-decoration:none;}
footer a:hover{text-decoration:underline;}
</style>

<div class="roas-calculator">
  <h2>Break-Even-ROAS-Rechner</h2>
  <p class="subtitle">Berechne deinen Break-even-ROAS inkl. CLV über beliebig viele Jahre.</p>
  <div class="input-grid">
    <div class="column">
      <h3>Grunddaten Werbeaktion</h3>
      <label>Bruttoumsatz pro Bestellung (in EUR)</label>
      <input id="revenueGross" type="text" placeholder="z. B. 59,50">
      <label>Nettoumsatz (automatisch)</label>
      <input id="revenueNet" type="text" readonly>
      <label>Herstellungskosten pro Bestellung (in EUR)</label>
      <input id="cost" type="text" placeholder="z. B. 15">
      <label>Verpackung & Versand (in EUR)</label>
      <input id="shipping" type="text" placeholder="z. B. 5">
      <div class="field-live">
        <label>Ertrag pro Kunde</label>
        <h2 id="liveProfit">–</h2>
      </div>
    </div>
    <div class="column">
      <h3>CLV-Erweiterung</h3>
      <label>Brutto-Umsatz Stammkunde pro Jahr (in EUR)</label>
      <input id="repeatRevGross" type="text" placeholder="z. B. 59,50">
      <label>Nettoumsatz Stammkunde (automatisch)</label>
      <input id="repeatRevNet" type="text" readonly>
      <label>Herstellungskosten pro Jahr (in EUR)</label>
      <input id="repeatCost" type="text" placeholder="z. B. 15">
      <label>Versandkosten pro Jahr (in EUR)</label>
      <input id="repeatShip" type="text" placeholder="z. B. 5">
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:0;">
        <div style="flex:1;min-width:120px;">
          <label>Anteil Neukunden, die Stammkunden werden (%)</label>
          <input id="retention" type="text" placeholder="z. B. 50" class="input-blue">
        </div>
        <div style="flex:1;min-width:120px;">
          <label>Betrachtungszeitraum CLV (Jahre)</label>
          <input id="years" type="text" placeholder="z. B. 1" class="input-blue">
        </div>
      </div>
      <div class="field-live">
        <label>Ertragserhöhung (heute) durch neu-gewonnene Stammkunden</label>
        <h2 id="liveCLV">–</h2>
      </div>
    </div>
  </div>
  <button class="button-main" id="calcBtn">Berechnen</button>
  <div class="results" id="results">
    <div class="result-grid">
      <div class="result-card highlight">
        <p><strong>Break-even ROAS (Erstkauf)</strong></p>
        <h1 id="roas1">–</h1>
      </div>
      <div class="result-card">
        <p><strong>Break-even ROAS (mit CLV)</strong></p>
        <h1 id="roas2" style="color:#666;">–</h1>
      </div>
      <div class="result-card">
        <p><strong>Maximale Kosten pro Kunde (Erstkauf)</strong></p>
        <h1 id="maxCostFirst" style="color:#666;">–</h1>
      </div>
      <div class="result-card">
        <p><strong>Maximale Kosten pro Kunde (inkl. CLV)</strong></p>
        <h1 id="maxCost" style="color:#666;">–</h1>
      </div>
    </div>
  </div>
</div>
<script>
function parseNum(v){return parseFloat(String(v||'').replace(/\./g,'').replace(',','.'))||0;}
function fmt(v,d=2){return isFinite(v)?v.toLocaleString('de-DE',{minimumFractionDigits:d,maximumFractionDigits:d}):'–';}

function updateLive(){
  const gross=parseNum(shadow.getElementById('revenueGross').value);
  const net=gross/1.19;
  shadow.getElementById('revenueNet').value=net?fmt(net,2):'';

  const cost=parseNum(shadow.getElementById('cost').value);
  const ship=parseNum(shadow.getElementById('shipping').value);
  shadow.getElementById('liveProfit').innerText=fmt(net-cost-ship)+' €';

  const repeatGross=parseNum(shadow.getElementById('repeatRevGross').value);
  const repeatNet=repeatGross/1.19;
  shadow.getElementById('repeatRevNet').value=fmt(repeatNet,2);
  const repeatCost=parseNum(shadow.getElementById('repeatCost').value);
  const repeatShip=parseNum(shadow.getElementById('repeatShip').value);
  const retention=parseNum(shadow.getElementById('retention').value)/100;
  const years=parseNum(shadow.getElementById('years').value);
  shadow.getElementById('liveCLV').innerText=fmt((repeatNet-repeatCost-repeatShip)*retention*years)+' €';
}

function calcROAS(){
  const revenueGross=parseNum(shadow.getElementById('revenueGross').value);
  const revenueNet=parseNum(shadow.getElementById('revenueNet').value);
  const cost=parseNum(shadow.getElementById('cost').value);
  const ship=parseNum(shadow.getElementById('shipping').value);
  const profitFirst=revenueNet-cost-ship;

  const retention=parseNum(shadow.getElementById('retention').value)/100;
  const repeatNet=parseNum(shadow.getElementById('repeatRevNet').value);
  const repeatCost=parseNum(shadow.getElementById('repeatCost').value);
  const repeatShip=parseNum(shadow.getElementById('repeatShip').value);
  const years=parseNum(shadow.getElementById('years').value);
  const profitCLV=(repeatNet-repeatCost-repeatShip)*retention*years;

  shadow.getElementById('roas1').innerText=(revenueGross/profitFirst).toFixed(2);
  shadow.getElementById('roas2').innerText=(revenueGross/(profitFirst+profitCLV)).toFixed(2);
  shadow.getElementById('maxCostFirst').innerText=fmt(profitFirst)+' €';
  shadow.getElementById('maxCost').innerText=fmt(profitFirst+profitCLV)+' €';
  shadow.getElementById('results').style.display='grid';
}

const shadow = null;
const s = this.shadowRoot || this;
['revenueGross','cost','shipping','repeatRevGross','repeatCost','repeatShip','retention','years'].forEach(id=>{
  const el=s.getElementById(id);
  if(!el) return;
  el.addEventListener('input',updateLive);
  el.addEventListener('blur',()=>{ el.value=fmt(parseNum(el.value),2).replace(',00',''); });
});
s.getElementById('calcBtn').addEventListener('click',calcROAS);
}
customElements.define('roas-widget',ROASWidget);
