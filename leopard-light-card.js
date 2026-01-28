/* ---------- STABLE VISUAL EDITOR ---------- */
class LeopardLightCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    this._config = config || {};
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._hass) return;

    // We use a template to ensure the pickers have room to breathe
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 8px;
        }
        .container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        label {
          font-weight: 500;
          color: var(--primary-text-color);
        }
        /* Fix for disappearing dropdowns */
        ha-entity-picker, ha-icon-picker {
          display: block;
          width: 100%;
        }
      </style>
      <div class="container">
        <div class="row">
          <label>Light Entity</label>
          <ha-entity-picker
            .hass="${this._hass}"
            .value="${this._config.entity || ''}"
            .configValue="${'entity'}"
            .includeDomains='${JSON.stringify(["light"])}'
            allow-custom-entity
          ></ha-entity-picker>
        </div>
        <div class="row">
          <label>Icon Override</label>
          <ha-icon-picker
            .hass="${this._hass}"
            .value="${this._config.icon || 'mdi:lightbulb'}"
            .configValue="${'icon'}"
          ></ha-icon-picker>
        </div>
        <div class="row">
          <label>Width Scaling: ${this._config.size || 1}x</label>
          <ha-slider
            min="1" max="4" step="1" pin
            .value="${this._config.size || 1}"
            .configValue="${'size'}"
          ></ha-slider>
        </div>
      </div>
    `;

    this._attachListeners();
  }

  _attachListeners() {
    const elements = this.shadowRoot.querySelectorAll('ha-entity-picker, ha-icon-picker, ha-slider');
    elements.forEach(el => {
      // FIX: Stop propagation on ALL pointer events to prevent HA Dialog from intercepting
      el.addEventListener('click', (ev) => ev.stopPropagation());
      el.addEventListener('mousedown', (ev) => ev.stopPropagation());
      
      el.addEventListener('value-changed', (ev) => {
        if (!this._config || !this._hass) return;
        const target = ev.target;
        const value = ev.detail.value;

        const newConfig = {
          ...this._config,
          [target.configValue]: target.configValue === 'size' ? Number(value) : value
        };

        this.dispatchEvent(new CustomEvent("config-changed", {
          detail: { config: newConfig },
          bubbles: true,
          composed: true
        }));
      });
    });
  }
}
