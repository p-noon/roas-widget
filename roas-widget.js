// @ts-nocheck
class ROASWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        * { box-sizing:border-box; }
        :host { display:block; font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Roboto,Arial,sans-serif; }
        .roas-calculator { max-width:900px; margin:20px auto; background:#fff; border-radius:16px; padding:20px; color:#111; box-shadow:0 8px 20px rgba(0,0,0,0.06); }
        h2 { font-size:1.4rem; margin:0 0 8px; text-align:center; }
        .subtitle { color:#666; text-align:center; margin-bottom:14px; }
        .input-grid { display:flex; gap:16px; flex-wrap:wrap; }
        .column { flex:1; min-width:220px; }
        label { display:block; margin-top:10px; margin-bottom:6px; color:#444; font-size:0.9rem; }
        input { width:100%; padding:8px; border-radius:8px; border:1px solid #e0e0e6; background:#fafafa; font-size:1rem; }
        input[readonly] { background:#f0f0f0; }
        .button-main { margin-top:18px; width:100%; background:#0071e3; color:#fff; border:none; border-radius:10px; padding:10px; cursor:pointer; font-weight:600; }
        .results { margin-top:18px; display:none; }
        .result-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .result-card { background:#f7f8fb; padding:12px; border-radius:10px; text-align:center; }
        .result-card.highlight { background:#e8f0fe; border:1px solid rgba(0,113,227,0.12); }
        .field-live { margin-top:12px; }
        .field-live h3 { margin:6px 0 0; color:#0071e3; font-size:1rem; }
        @media (max-width:600px) { .result-grid{grid-template-columns:1fr;} .input-grid{flex-direction:column;} }
      </style>

      <div class="roas-calculator">
        <h2>Break-Even-ROAS-Rechner</h2>
        <p class="subtitle">Berechne deinen Break-even-ROAS inkl. CLV (optional)</p>

        <div class="input-grid">
          <div class="column">
            <label>Bruttoumsatz pro Bestellung (EUR)</label>
            <input id="revenueGross" type="text" placeholder="z. B. 59,50">
            <label>Nettoumsatz (automatisch)</label>
            <input id="revenueNet" type="text" readonly>
            <label>Herstellungskosten pro Bestellung (EUR)</label>
            <input id="cost" type="text" placeholder="z. B. 15">
            <label>Verpackung & Versand (EUR)</label>
            <input id="shipping" type="text" placeholder="z. B. 5">
            <div class="field-live">
              <h3>Ertrag pro Kunde</h3>
              <div id="liveProfit">–</div>
            </div>
          </div>

          <div class="column">
            <label>Brutto-Umsatz Stammkunde pro Jahr (EUR)</label>
            <input id="repeatRevGross" type="text" placeholder="z. B. 59,50">
            <label>Nettoumsatz Stammkunde (automatisch)</label>
            <input id="repeatRevNet" type="text" readonly>
            <label>Herstellungskosten pro Jahr (EUR)</label>
            <input id="repeatCost" type="text" placeholder="z. B. 15">
            <label>Versandkosten pro Jahr (EUR)</label>
            <input id="repeatShip" type="text" placeholder="z. B. 5">
            <label>Anteil Neukunden, die Stammkunden werden (%)</label>
            <input id="retention" type="text" placeholder="z. B. 50">
            <label>Betrachtungszeitraum CLV (Jahre)</label>
            <input id="years" type="text" placeholder="z. B. 1">
            <div class="field-live">
              <h3>Ertragserhöhung durch Stammkunden</h3>
              <div id="liveCLV">–</div>
            </div>
          </div>
        </div>

        <button class="button-main" id="calcBtn">Berechnen</button>

        <div class="results" id="results">
          <div class="result-grid">
            <div class="result-card highlight">
              <p><strong>Break-even ROAS (Erstkauf)</strong></p>
              <div id="roas1">–</div>
            </div>
            <div class="result-card">
              <p><strong>Break-even ROAS (mit CLV)</strong></p>
              <div id="roas2">–</div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.s = this.shadowRoot;
    this.calcBtn = this.s.getElementById('calcBtn');
    this.calc = this.calc.bind(this);
    this.onInput = this.onInput.bind(this);

    this.calcBtn.addEventListener('click', this.calc);

    const ids = ['revenueGross','cost','shipping','repeatRevGross','repeatCost','repeatShip','retention','years'];
    ids.forEach(id => {
      const el = this.s.getElementById(id);
      if (el) el.addEventListener('input', this.onInput);
      if (el) el.addEventListener('blur', () => {
        el.value = ROASWidget.fmtLocal(ROASWidget.parseLocal(el.value), 2).replace(',00','');
      });
    });
  }

  static parseLocal(v){ return parseFloat(String(v||'').replace(/\./g,'').replace(',','.')) || 0; }
  static fmtLocal(n,dec=2){ return isFinite(n) ? n.toLocaleString('de-DE',{minimumFractionDigits:dec,maximumFractionDigits:dec}) : '–'; }

  onInput(){
    const gross = ROASWidget.parseLocal(this.s.getElementById('revenueGross').value);
    const net = gross / 1.19;
    this.s.getElementById('revenueNet').value = net ? ROASWidget.fmtLocal(net,2) : '';

    const rGross = ROASWidget.parseLocal(this.s.getElementById('repeatRevGross').value);
    this.s.getElementById('repeatRevNet').value = rGross ? ROASWidget.fmtLocal(rGross/1.19,2) : '';

    const cost = ROASWidget.parseLocal(this.s.getElementById('cost').value);
    const ship = ROASWidget.parseLocal(this.s.getElementById('shipping').value);
    this.s.getElementById('liveProfit').innerText = isFinite(net-cost-ship)?ROASWidget.fmtLocal(net-cost-ship,2)+' €':'–';

    const retention = ROASWidget.parseLocal(this.s.getElementById('retention').value)/100;
    const repeatNet = rGross/1.19;
    const rCost = ROASWidget.parseLocal(this.s.getElementById('repeatCost').value);
    const rShip = ROASWidget.parseLocal(this.s.getElementById('repeatShip').value);
    const years = ROASWidget.parseLocal(this.s.getElementById('years').value);
    this.s.getElementById('liveCLV').innerText = isFinite((repeatNet-rCost-rShip)*retention*years)?ROASWidget.fmtLocal((repeatNet-rCost-rShip)*retention*years,2)+' €':'–';
  }

  calc(){
    const gross = ROASWidget.parseLocal(this.s.getElementById('revenueGross').value);
    const net = gross/1.19;
    const cost = ROASWidget.parseLocal(this.s.getElementById('cost').value);
    const ship = ROASWidget.parseLocal(this.s.getElementById('shipping').value);
    const profitFirst = net-cost-ship;

    const rGross = ROASWidget.parseLocal(this.s.getElementById('repeatRevGross').value);
    const rNet = rGross/1.19;
    const rCost = ROASWidget.parseLocal(this.s.getElementById('repeatCost').value);
    const rShip = ROASWidget.parseLocal(this.s.getElementById('repeatShip').value);
    const retention = ROASWidget.parseLocal(this.s.getElementById('retention').value)/100;
    const years = ROASWidget.parseLocal(this.s.getElementById('years').value);

    const clv = (rNet-rCost-rShip)*retention*years;
    const roas1 = profitFirst>0 ? 1/profitFirst : 0;
    const roas2 = (profitFirst+clv)>0 ? 1/(profitFirst+clv) : 0;

    this.s.getElementById('roas1').innerText = profitFirst>0?ROASWidget.fmtLocal(1/profitFirst,2):'–';
    this.s.getElementById('roas2').innerText = (profitFirst+clv)>0?ROASWidget.fmtLocal(1/(profitFirst+clv),2):'–';
    this.s.getElementById('results').style.display='block';
  }
}

customElements.define('roas-widget', ROASWidget);
