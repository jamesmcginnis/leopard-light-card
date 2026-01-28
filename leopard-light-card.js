class LeopardLightCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isDragging = false;
  }

  static getConfigElement() {
    return document.createElement('leopard-light-card-editor');
  }

  static getStubConfig() {
    return {
      entity: '',
      icon: 'mdi:lightbulb',
      size: 1
    };
  }

  setConfig(config) {
    // Crucial: Create a deep copy and ensure defaults exist
    this._config = {
      icon: 'mdi:lightbulb',
      size: 1,
      ...config
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._isDragging) this.render();
  }

  // ... (Keep the Action and Drag logic from previous version) ...

  render() {
    if (!this._hass || !this._config) return;
    
    // Safety check if entity is missing
    if (!this._config.entity) {
      this.shadowRoot.innerHTML = `
        <style>:host { display: block; padding: 16px; background: rgba(255,0,0,0.1); border-radius: 12px; }</style>
        Please select a light entity in the editor.
      `;
      return;
    }

    const state = this._hass.states[this._config.entity];
    if (!state) return;

    // ... (Keep the rest of the Pill Card rendering logic) ...
    const isOn = state.state === 'on';
    const percent = isOn ? Math.round(((state.attributes.brightness || 0) / 255) * 100) : 0;
    
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; width: 100%; padding: 4px 0; }
        .slider-container {
          position: relative; width: 100%; height: 56px;
          background: #1c1c1e; border-radius: 28px;
          overflow: hidden; cursor: pointer; touch-action: none;
        }
        .slider-fill {
          position: absolute; height: 100%; width: ${percent}%;
          background: ${isOn ? '#F7D959' : '#313131'}; transition: width 0.1s ease-out; z-index: 1;
        }
        .content {
          position: absolute; width: 100%; height: 100%;
          display: flex; align-items: center; padding: 0 20px;
          box-sizing: border-box; color: ${isOn ? '#000' : '#fff'};
          z-index: 2; pointer-events: none;
        }
        .icon-box { width: 32px; height: 32px; border-radius: 50%; background: rgba(128,128,128,0.2); display: flex; align-items: center; justify-content: center; margin-right: 12px; }
        ha-icon { --mdc-icon-size: 20px; }
        .label-container { display: flex; flex-direction: column; line-height: 1.2; overflow: hidden; }
        .name { font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .status { font-size: 12px; opacity: 0.6; }
      </style>
      <div class="slider-container" id="card">
        <div class="slider-fill"></div>
        <div class="content">
          <div class="icon-box"><ha-icon icon="${this._config.icon || 'mdi:lightbulb'}"></ha-icon></div>
          <div class="label-container">
            <div class="name">${state.attributes.friendly_name}</div>
            <div class="status">${isOn ? percent + '%' : 'Off'}</div>
          </div>
        </div>
      </div>
    `;
  }
}

/* ---------- FIXED VISUAL EDITOR ---------- */
class LeopardLightCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config || {}; // Ensure it's never undefined
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  render() {
    if (!this._hass || !this._config) return;

    // Use a default icon if none exists yet
    const currentIcon = this._config.icon || 'mdi:lightbulb';
    const currentEntity = this._config.entity || '';

    this.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 16px; padding: 12px;">
        <div>
          <label style="display:block; padding-bottom: 8px;">Light Entity</label>
          <ha-entity-picker
            .hass="${this._hass}"
            .value="${currentEntity}"
            .configValue="${"entity"}"
            include-domains='["light"]'
            allow-custom-entity
          ></ha-entity-picker>
        </div>

        <div>
          <label style="display:block; padding-bottom: 8px;">Icon</label>
          <ha-icon-picker
            .hass="${this._hass}"
            .value="${currentIcon}"
            .configValue="${"icon"}"
          ></ha-icon-picker>
        </div>

        <div>
          <label style="display:block; padding-bottom: 8px;">Width Multiplier: ${this._config.size || 1}x</label>
          <ha-slider
            min="1" max="4" step="1" pin
            .value="${this._config.size || 1}"
            .configValue="${"size"}"
          ></ha-slider>
        </div>
      </div>
    `;

    this.querySelectorAll('ha-entity-picker, ha-icon-picker, ha-slider').forEach(input => {
      input.addEventListener('value-changed', (ev) => this._valueChanged(ev));
    });
  }

  _valueChanged(ev) {
    if (!this._config || !this._hass) return;
    const target = ev.target;
    const value = ev.detail.value;

    const newConfig = {
      ...this._config,
      [target.configValue]: target.configValue === "size" ? Number(value) : value,
    };

    // Dispatching the event is what saves the configuration
    const event = new CustomEvent("config-changed", {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }
}

customElements.define('leopard-light-card', LeopardLightCard);
customElements.define('leopard-light-card-editor', LeopardLightCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "leopard-light-card",
  name: "Leopard HomeKit Light",
  description: "Horizontal HomeKit-style pill slider.",
  preview: true
});
