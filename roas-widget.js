// @ts-nocheck
class ROASWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        * { box-sizing:border-box; font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Roboto,sans-serif; }
        :host { display:block; }
        .roas-calculator {
          max-width:900px; margin:40px auto; background:#fff; border-radius:24px; box-shadow:0 8px 20px rgba(0,0,0,0.08); padding:32px; color:#1c1c1e;
        }
        h2 { text-align:center; font-size:1.8rem; margin-bottom:6px; }
        .subtitle { text-align:center; color:#666; margin-bottom:24px; }
        .input-grid { display:flex; gap:24px; flex-wrap:wrap; }
        .column { flex:1; min-width:280px; }
        label { font-size:0.9rem; color:#444; display:block; margin-bottom:6px; margin-top:14px; }
        input { padding:10px; border:1px solid #d2d2d7; border-radius:10px; font-size:1rem; background:#f9f9f9; width:100%; box-sizing:border-box; transition: all 0.2s; }
        input:focus { outline:none; border-color:#0071e3; background:white; box-shadow:0 0 0 2px rgba(0,113,227,0.1); }
        .input-blue { border-color:#0071e3; box-shadow:0 0 0 2px rgba(0,113,227,0.15); }
        .button-main { margin-top:30px; width:100%; background:#0071e3; color:white; font-weight:600; border:none; border-radius:14px; padding:14px; font-size:1.1rem; cursor:pointer; transition: background 0.2s; }
        .button-main:hover { background:#0a84ff; }
        .results { margin-top:30px; text-align:center; animation: fadeIn 0.6s ease forwards; display:none; }
        .result-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .result-card { background:#f5f5f7; padding:16px; border-radius:16px; transition: transform 0.3s; }
        .result-card.highlight { background:#e8f0fe; box-shadow:0 0 0 2px #0071e3 inset; }
        .result-card h1 { margin:6px 0; font-size:1.8rem; }
        .field-live { margin-top:16px; }
        .field-live h2 { font-size:1.4rem; color:#0071e3; margin:6px 0 0 0; font-weight:600; }
        footer { text-align:center; margin-top:20px; font-size:13px; color:#999; }
        footer a { color:#0071e3; text-decoration:none; cursor:pointer; }
        footer a:hover { text-decoration:underline; }
        .overlay{
          position:fixed; top:0; left:0; width:100%; height:100%;
          background:rgba(0,0,0,0.5); display:none; justify-content:center; align-items:center; z-index:999;
          padding:20px; box-sizing:border-box; overflow:auto;
        }
        .overlay-content{
          background:#fff; padding:24px; border-radius:16px; width:100%; max-width:600px; max-height:90vh;
          box-shadow:0 10px 30px rgba(0,0,0,0.2); overflow:auto; box-sizing:border-box;
        }
        .overlay-content textarea{ width:100%; height:120px; font-family:monospace; border-radius:8px; border:1px solid #ccc; padding:8px; box-sizing:border-box; }
        .close-btn{ background:#0071e3; color:white; border:none; padding:8px 16px; border-radius:8px; margin-top:12px; cursor:pointer; }
        .close-btn:hover{background:#0a84ff;}
        @keyframes fadeIn { from {opacity:0;} to {opacity:1;} }
        @media (max-width:600px){
          .result-grid { grid-template-columns:1fr; }
          .input-grid { flex-direction:column; }
        }
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
            <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:0;">
              <div style="flex:1; min-width:120px;">
                <label>Anteil Neukunden, die Stammkunden werden (%)</label>
                <input id="retention" type="text" placeholder="z. B. 50" class="input-blue">
              </div>
              <div style="flex:1; min-width:120px;">
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

        <footer>
          <a id="embedLink"><strong>🔗 Rechner einbetten / teilen</strong></a> – entwickelt von 
          <a href="https://www.purple-noon.de" target="_blank">Purple Noon</a>
        </footer>
      </div>

      <div class="overlay" id="overlay">
        <div class="overlay-content">
          <h3>Einbettungscode:</h3>
          <textarea readonly><iframe src="https://p-noon.github.io/roas-widget" width="100%" height="950" style="border:none;"></iframe></textarea>
          <button class="close-btn" id="closeOverlay">Schließen</button>
        </div>
      </div>
    `;

    this.s = this.shadowRoot;

    this.calcBtn = this.s.getElementById('calcBtn');
    this.calcBtn.addEventListener('click', () => this.calcROAS());

    // Input Events
    const ids = ['revenueGross','cost','shipping','repeatRevGross','repeatCost','repeatShip','retention','years'];
    ids.forEach(id => {
      const el = this.s.getElementById(id);
      if(!el) return;
      el.addEventListener('input', () => this.updateLive());
      el.addEventListener('blur', () => { el.value = ROASWidget.fmtLocal(ROASWidget.parseLocal(el.value),2).replace(',00',''); });
    });

    // Overlay Events
    this.s.getElementById('embedLink').addEventListener('click', e => {
      e.preventDefault();
      this.s.getElementById('overlay').style.display='flex';
    });
    this.s.getElementById('closeOverlay').addEventListener('click', () => {
      this.s.getElementById('overlay').style.display='none';
    });
  }

  static parseLocal(v){ return parseFloat(String(v||'').replace(/\./g,'').replace(',','.')) || 0; }
  static fmtLocal(n,dec=2){ return isFinite(n) ? n.toLocaleString('de-DE',{minimumFractionDigits:dec,maximumFractionDigits:dec}) : '–'; }

  updateLive(){
    const gross = ROASWidget.parseLocal(this.s.getElementById('revenueGross').value);
    const net = gross/1.19;
    this.s.getElementById('revenueNet').value = net ? ROASWidget.fmtLocal(net,2) : '';

    const cost = ROASWidget.parseLocal(this.s.getElementById('cost').value);
    const ship = ROASWidget.parseLocal(this.s.getElementById('shipping').value);
    this.s.getElementById('liveProfit').innerText = fmt(net-cost-ship)+" €";

    const rGross = ROASWidget.parseLocal(this.s.getElementById('repeatRevGross').value);
    const rNet = rGross/1.19;
    this.s.getElementById('repeatRevNet').value = fmt(rNet,2);

    const rCost = ROASWidget.parseLocal(this.s.getElementById('repeatCost').value);
    const rShip = ROASWidget.parseLocal(this.s.getElementById('repeatShip').value);
    const retention = ROASWidget.parseLocal(this.s.getElementById('retention').value)/100;
    const years = ROASWidget.parseLocal(this.s.getElementById('years').value);

    this.s.getElementById('liveCLV').innerText = fmt((rNet-rCost-rShip)*retention*years)+" €";
  }

  calcROAS(){
    const revenueGross=parseNum(this.s.getElementById("revenueGross").value);
    const revenueNet=parseNum(this.s.getElementById("revenueNet").value);
    const cost=parseNum(this.s.getElementById("cost").value);
    const ship=parseNum(this.s.getElementById("shipping").value);
    const profitFirst = revenueNet - cost - ship;

    const retention=parseNum(this.s.getElementById("retention").value)/100;
    const repeatNet=parseNum(this.s.getElementById("repeatRevNet").value);
    const repeatCost=parseNum(this.s.getElementById("repeatCost").value);
    const repeatShip=parseNum(this.s.getElementById("repeatShip").value);
    const years=parseNum(this.s.getElementById("years").value);

    const profitPerRepeat = (repeatNet - repeatCost - repeatShip) * retention * years;
    const newProfit = profitFirst + profitPerRepeat;

    this.s.getElementById("results").style.display="grid";
    this.s.getElementById("roas1").innerText = (revenueGross/profitFirst).toFixed(2);
    this.s.getElementById("roas2").innerText = (revenueGross/newProfit).toFixed(2);
    this.s.getElementById("maxCostFirst").innerText = fmt(profitFirst)+" €";
    this.s.getElementById("maxCost").innerText = fmt(newProfit)+" €";
  }
}

customElements.define('roas-widget', ROASWidget);

// Zahl-Helper (global im ShadowRoot)
function parseNum(value){ return parseFloat(value.toString().replace(/\./g,"").replace(",","."))||0; }
function fmt(num,dec=2){ return isFinite(num)?num.toLocaleString("de-DE",{minimumFractionDigits:dec,maximumFractionDigits:dec}):"–"; }
