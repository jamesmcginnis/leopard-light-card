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

  render() {
    if (!this._hass || !this._config?.entity) {
      this.shadowRoot.innerHTML = `
        <div style="padding:16px;border-radius:12px;background:#1c1c1e;color:#fff">
          Select a light in the editor
        </div>
      `;
      return;
    }

    const state = this._hass.states[this._config.entity];
    if (!state) return;

    const icon =
      this._config.icon ||
      state.attributes.icon ||
      "mdi:lightbulb";

    const isOn = state.state === "on";
    const supportsBrightness =
      state.attributes.brightness !== undefined;

    const pct =
      supportsBrightness && isOn
        ? Math.round((state.attributes.brightness / 255) * 100)
        : 0;

    this.shadowRoot.innerHTML = `
      <style>
        .card {
          background:#1c1c1e;
          border-radius:28px;
          height:56px;
          padding:0 20px;
          display:flex;
          align-items:center;
          gap:12px;
          color:white;
          cursor:pointer;
          user-select:none;
        }
        .status {
          font-size:12px;
          opacity:.6;
        }
      </style>

      <div class="card">
        <ha-icon icon="${icon}"></ha-icon>
        <div>
          <div>${state.attributes.friendly_name}</div>
          <div class="status">
            ${
              supportsBrightness
                ? isOn ? `${pct}%` : "Off"
                : isOn ? "On" : "Off"
            }
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.querySelector(".card").onclick = () => {
      this._hass.callService("light", "toggle", {
        entity_id: this._config.entity
      });
    };
  }
}

customElements.define("leopard-light-card", LeopardLightCard);

/* ===================== EDITOR ===================== */

class LeopardLightCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // ✅ Correct fix: stop click propagation on host only
    // This prevents the HA dashboard from closing the dropdown
    this.addEventListener("click", (e) => e.stopPropagation());
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
    if (!this._hass || !this._config) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display:block;
          padding:16px;
        }
      </style>
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