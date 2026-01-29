console.warn("LeopardLightCard loaded");

/* ===================== CARD ===================== */

class LeopardLightCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static getConfigElement() {
    return document.createElement("leopard-light-card-editor");
  }

  static getStubConfig() {
    return { entity: "", icon: "" };
  }

  setConfig(config) {
    this._config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  _toggleLight() {
    if (!this._config?.entity) return;
    this._hass.callService("light", "toggle", {
      entity_id: this._config.entity,
    });
  }

  _getLightColor(state) {
    if (state.attributes.rgb_color)
      return `rgb(${state.attributes.rgb_color.join(",")})`;
    return "#F7D959";
  }

  _isColorDark(color) {
    if (!color || !color.includes("rgb")) return true;
    const rgb = color.match(/\d+/g).map(Number);
    const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    return luminance < 0.6;
  }

  render() {
    if (!this._hass || !this._config?.entity) {
      this.shadowRoot.innerHTML = `
        <div style="padding:16px;border-radius:12px;background:#1c1c1e;color:#fff">
          Select a light entity in YAML
        </div>
      `;
      return;
    }

    const state = this._hass.states[this._config.entity];
    if (!state) return;

    const icon = this._config.icon || state.attributes.icon || "mdi:lightbulb";
    const isOn = state.state === "on";
    const supportsBrightness = state.attributes.brightness !== undefined;
    const pct =
      supportsBrightness && isOn
        ? Math.round((state.attributes.brightness / 255) * 100)
        : 0;
    const activeColor = isOn ? this._getLightColor(state) : "#313131";
    const isDark = !isOn || this._isColorDark(activeColor);

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; width:100%; padding:4px 0; }
        .card {
          position:relative;
          height:56px;
          background:#1c1c1e;
          border-radius:28px;
          display:flex;
          align-items:center;
          padding:0 20px;
          gap:12px;
          cursor:pointer;
          user-select:none;
        }
        .status { font-size:12px; opacity:.6; }
        ha-icon { --mdc-icon-size:20px; }
        .name { font-weight:600; font-size:14px; }
      </style>

      <div class="card">
        <ha-icon icon="${icon}"></ha-icon>
        <div>
          <div class="name">${state.attributes.friendly_name}</div>
          <div class="status">${
            supportsBrightness ? (isOn ? pct + "%" : "Off") : isOn ? "On" : "Off"
          }</div>
        </div>
      </div>
    `;

    this.shadowRoot.querySelector(".card").onclick = () => this._toggleLight();
  }
}

customElements.define("leopard-light-card", LeopardLightCard);

/* ===================== EDITOR (LIGHT DOM PLACEHOLDER) ===================== */

class LeopardLightCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  render() {
    if (!this._hass || !this._config) return;

    // Light DOM placeholder — stable in visual editor
    this.innerHTML = `
      <div style="padding:16px; font-size:14px; background:#f0f0f0; border-radius:8px;">
        <strong>Selected entity:</strong> ${this._config.entity || "None"}<br>
        <strong>Icon override:</strong> ${this._config.icon || "None"}<br>
        ⚠️ To change these values, edit YAML directly.
      </div>
    `;
  }
}

customElements.define("leopard-light-card-editor", LeopardLightCardEditor);

/* ===================== REGISTER ===================== */

window.customCards = window.customCards || [];
window.customCards.push({
  type: "leopard-light-card",
  name: "Leopard HomeKit Light",
  description: "HomeKit-style pill light card",
  preview: true,
});