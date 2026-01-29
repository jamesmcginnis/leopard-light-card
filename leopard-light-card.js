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

    const icon = this._config.icon || state.attributes.icon || "mdi:lightbulb";
    const isOn = state.state === "on";
    const supportsBrightness = state.attributes.brightness !== undefined;
    const pct = supportsBrightness && isOn ? Math.round((state.attributes.brightness / 255) * 100) : 0;
    const statusText = supportsBrightness ? (isOn ? `${pct}%` : "Off") : (isOn ? "On" : "Off");

    // Using a template literal for the structure, but we could optimize 
    // further by updating individual elements if performance becomes an issue.
    this.shadowRoot.innerHTML = `
      <style>
        .card {
          background: #1c1c1e;
          border-radius: 28px;
          height: 56px;
          padding: 0 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
          cursor: pointer;
          user-select: none;
          transition: background 0.2s ease;
        }
        .card:active {
          background: #2c2c2e;
        }
        .status {
          font-size: 12px;
          opacity: .6;
        }
        ha-icon {
          color: ${isOn ? '#f1c40f' : '#ffffff'};
        }
      </style>

      <div class="card">
        <ha-icon icon="${icon}"></ha-icon>
        <div>
          <div>${state.attributes.friendly_name || this._config.entity}</div>
          <div class="status">${statusText}</div>
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

/* ===================== EDITOR (FIXED) ===================== */

class LeopardLightCardEditor extends HTMLElement {
  constructor() {
    super();
    this._initialized = false;
  }

  setConfig(config) {
    this._config = config;
    this._updateForm();
  }

  set hass(hass) {
    this._hass = hass;
    this._updateForm();
  }

  _updateForm() {
    if (!this._hass || !this._config) return;

    // The fix: We only set innerHTML once. 
    // Re-rendering innerHTML every time HASS updates is what broke the dropdowns.
    if (!this._initialized) {
      this.innerHTML = `<ha-form></ha-form>`;
      const form = this.querySelector("ha-form");

      form.schema = [
        {
          name: "entity",
          label: "Light Entity",
          selector: { entity: { domain: "light" } }
        },
        {
          name: "icon",
          label: "Icon Override",
          selector: { icon: {} }
        }
      ];

      form.addEventListener("value-changed", (e) => {
        const event = new CustomEvent("config-changed", {
          detail: { config: e.detail.value },
          bubbles: true,
          composed: true
        });
        this.dispatchEvent(event);
      });

      this._initialized = true;
    }

    // Just update the properties of the existing form element
    const form = this.querySelector("ha-form");
    if (form) {
      form.hass = this._hass;
      form.data = this._config;
    }
  }
}

customElements.define("leopard-light-card-editor", LeopardLightCardEditor);

/* ===================== REGISTER ===================== */

window.customCards = window.customCards || [];
window.customCards.push({
  type: "leopard-light-card",
  name: "Leopard HomeKit Light",
  description: "HomeKit-style pill light card",
  preview: true
});
