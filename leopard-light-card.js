console.warn("LeopardLightCard loaded");

/* ===================== CARD (UNCHANGED LOGIC) ===================== */

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

  render() {
    if (!this._hass || !this._config?.entity) {
      this.shadowRoot.innerHTML = `<div>Select a light</div>`;
      return;
    }

    const state = this._hass.states[this._config.entity];
    if (!state) return;

    const icon =
      this._config.icon ||
      state.attributes.icon ||
      "mdi:lightbulb";

    this.shadowRoot.innerHTML = `
      <style>
        .card {
          background:#1c1c1e;
          color:white;
          border-radius:28px;
          padding:16px;
          cursor:pointer;
          display:flex;
          align-items:center;
          gap:12px;
        }
      </style>
      <div class="card">
        <ha-icon icon="${icon}"></ha-icon>
        <div>
          <div>${state.attributes.friendly_name}</div>
          <div style="font-size:12px;opacity:.6">${state.state}</div>
        </div>
      </div>
    `;
  }
}

customElements.define("leopard-light-card", LeopardLightCard);

/* ===================== EDITOR (THIS IS THE FIX) ===================== */

class LeopardLightCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  render() {
    if (!this.shadowRoot || !this._hass || !this._config) return;

    this.shadowRoot.innerHTML = `
      <ha-form></ha-form>
    `;

    const form = this.shadowRoot.querySelector("ha-form");

    form.hass = this._hass;
    form.data = this._config;
    form.schema = [
      {
        name: "entity",
        label: "Light",
        selector: {
          entity: { domain: "light" }
        }
      },
      {
        name: "icon",
        label: "Icon override",
        selector: {
          icon: {}
        }
      }
    ];

    form.addEventListener("value-changed", (e) => {
      this.dispatchEvent(
        new CustomEvent("config-changed", {
          detail: { config: e.detail.value },
          bubbles: true,
          composed: true
        })
      );
    });
  }
}

customElements.define(
  "leopard-light-card-editor",
  LeopardLightCardEditor
);

/* ===================== REGISTER ===================== */

window.customCards = window.customCards || [];
window.customCards.push({
  type: "leopard-light-card",
  name: "Leopard HomeKit Light",
  description: "HomeKit-style pill light card",
  preview: true
});