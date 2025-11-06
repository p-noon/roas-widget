// ROAS Widget Custom Element
class ROASWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <div style="padding:20px; border:2px solid #0071e3; border-radius:10px; text-align:center;">
        <h2>ROAS Rechner</h2>
        <label>Umsatz:</label>
        <input id="revenue" type="text" placeholder="EUR">
        <button id="calcBtn">Berechnen</button>
        <div id="result" style="margin-top:10px;color:green;"></div>
      </div>
    `;
  }

  connectedCallback() {
    const btn = this.shadowRoot.getElementById('calcBtn');
    btn.addEventListener('click', () => {
      const rev = parseFloat(this.shadowRoot.getElementById('revenue').value) || 0;
      const roas = (rev / 1.19).toFixed(2);
      this.shadowRoot.getElementById('result').innerText = `Break-even ROAS: ${roas}`;
    });
  }
}

customElements.define('roas-widget', ROASWidget);
