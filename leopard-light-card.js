console.warn("LeopardLightCard loaded");

/* ===================== CARD ===================== */

class LeopardLightCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._isDragging = false;
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
    if (!this._isDragging) this.render();
  }

  _supportsBrightness(state) {
    return state?.attributes?.brightness !== undefined;
  }

  _toggle() {
    this._hass.callService("light", "toggle", {
      entity_id: this._config.entity
    });
  }

  _setBrightness(pct) {
    this._hass.callService("light", "turn_on", {
      entity_id: this._config.entity,
      brightness_pct: Math.round(pct)
    });
  }

  render() {
    if (!this._hass || !this._config) return;

    const state = this._hass.states[this._config.entity];
    if (!state) {
      this.shadowRoot.innerHTML = `<div>Select a light</div>`;
      return;
    }

    const supportsBrightness = this._supportsBrightness(state);
    const isOn = state.state === "on";
    const pct = supportsBrightness && isOn
      ? Math.round((state.attributes.brightness / 255) * 100)
      : 0;

    const icon =
      this._config.icon ||
      state.attributes.icon ||
      "mdi:lightbulb";

    this.shadowRoot.innerHTML = `
      <style>
        .card {
          background:#1c1c1e;
          border-radius:28px;
          height:56px;
          display:flex;
          align-items:center;
          padding:0 20px;
          color:white;
          cursor:pointer;
        }
        .fill {
          position:absolute;
          inset:0;
          width:${pct}%;
          background:#f7d959;
          z-index:0;
        }
        .content {
          position:relative;
          display:flex;
          align-items:center;
          gap:12px;
        }
      </style>

      <div class="card">
        <div class="content">
          <ha-icon icon="${icon}"></ha-icon>
          <div>
            <div>${state.attributes.friendly_name}</div>
            <div style="font-size:12px;opacity:.6">
              ${
                supportsBrightness
                  ? isOn ? pct + "%" : "Off"
                  : isOn ? "On" : "Off"
              }
            </div>
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.querySelector(".card").onclick = () => {
      this._toggle();
    };
  }
}

customElements.define("leopard-light-card", LeopardLightCard);

/* ===================== EDITOR (FIXED) ===================== */

class LeopardLightCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  render() {
    if (!this._hass || !this._config) return;

    this.innerHTML = `
      <ha-form
        .hass=${this._hass}
        .data=${this._config}
        .schema=${[
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
        ]}
      ></ha-form>
    `;

    this.querySelector("ha-form").addEventListener(
      "value-changed",
      (e) => {
        this.dispatchEvent(
          new CustomEvent("config-changed", {
            detail: { config: e.detail.value },
            bubbles: true,
            composed: true
          })
        );
      }
    );
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
  description: "HomeKit-style pill slider for lights",
  preview: true
});