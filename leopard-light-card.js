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
    return { entity: '', icon: 'mdi:lightbulb', size: 1 };
  }

  setConfig(config) {
    this._config = { icon: 'mdi:lightbulb', size: 1, ...config };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._isDragging) this.render();
  }

  /* ---------- ACTIONS ---------- */
  _setBrightness(value) {
    this._hass.callService('light', 'turn_on', {
      entity_id: this._config.entity,
      brightness_pct: Math.round(value)
    });
  }

  _toggleLight() {
    this._hass.callService('light', 'toggle', { entity_id: this._config.entity });
  }

  /* ---------- UTILS ---------- */
  _getLightColor(state) {
    if (state.attributes.rgb_color) return `rgb(${state.attributes.rgb_color.join(',')})`;
    return '#F7D959'; 
  }

  _isColorDark(color) {
    if (!color || !color.includes('rgb')) return true;
    const rgb = color.match(/\d+/g).map(Number);
    const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    return luminance < 0.6; 
  }

  /* ---------- DRAG HANDLERS ---------- */
  _handleDragStart(e) {
    this._isDragging = true;
    this._hasMoved = false;
    const rect = this.shadowRoot.getElementById('card').getBoundingClientRect();
    this._cardLeft = rect.left;
    this._cardWidth = rect.width;
    this._onMove = (ev) => this._handleDragMove(ev);
    this._onEnd = () => this._handleDragEnd();
    window.addEventListener('mousemove', this._onMove);
    window.addEventListener('mouseup', this._onEnd);
    window.addEventListener('touchmove', this._onMove, { passive: false });
    window.addEventListener('touchend', this._onEnd);
  }

  _handleDragMove(e) {
    if (!this._isDragging) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const position = Math.max(0, Math.min(1, (x - this._cardLeft) / this._cardWidth));
    this._currentBrightness = position * 100;
    const fill = this.shadowRoot.querySelector('.slider-fill');
    const status = this.shadowRoot.querySelector('.status');
    if (fill) fill.style.width = `${this._currentBrightness}%`;
    if (status) status.textContent = `${Math.round(this._currentBrightness)}%`;
    this._hasMoved = true;
  }

  _handleDragEnd() {
    if (!this._isDragging) return;
    if (this._hasMoved) this._setBrightness(this._currentBrightness);
    this._isDragging = false;
    window.removeEventListener('mousemove', this._onMove);
    window.removeEventListener('mouseup', this._onEnd);
    window.removeEventListener('touchmove', this._onMove);
    window.removeEventListener('touchend', this._onEnd);
  }

  /* ---------- PILL RENDER (NO CHANGES) ---------- */
  render() {
    if (!this._hass || !this._config || !this._config.entity) return;
    const state = this._hass.states[this._config.entity];
    if (!state) return;

    const isOn = state.state === 'on';
    const brightness = state.attributes.brightness || 0;
    const percent = isOn ? Math.round((brightness / 255) * 100) : 0;
    const activeColor = isOn ? this._getLightColor(state) : '#313131';
    const isDark = !isOn || this._isColorDark(activeColor);

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
          background: ${activeColor}; transition: width 0.15s ease-out; z-index: 1;
        }
        .content {
          position: absolute; width: 100%; height: 100%;
          display: flex; align-items: center; padding: 0 20px;
          box-sizing: border-box; color: ${isDark ? '#fff' : '#000'};
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

    const card = this.shadowRoot.getElementById('card');
    card.onclick = () => { if (!this._hasMoved) this._toggleLight(); };
    card.addEventListener('mousedown', (e) => this._handleDragStart(e));
    card.addEventListener('touchstart', (e) => this._handleDragStart(e), { passive: false });
  }
}

/* ---------- FIXED VISUAL EDITOR ---------- */
class LeopardLightCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config || {};
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  render() {
    if (!this._hass) return;

    // Use placeholder if no config yet
    const entity = this._config.entity || '';
    const icon = this._config.icon || 'mdi:lightbulb';

    this.innerHTML = `
      <div class="card-config" style="display: flex; flex-direction: column; gap: 20px; padding: 10px;">
        <div class="config-item">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Light Entity</label>
          <ha-entity-picker
            .hass="${this._hass}"
            .value="${entity}"
            .configValue="${'entity'}"
            include-domains='["light"]'
            allow-custom-entity
          ></ha-entity-picker>
        </div>

        <div class="config-item">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Icon</label>
          <ha-icon-picker
            .hass="${this._hass}"
            .value="${icon}"
            .configValue="${'icon'}"
          ></ha-icon-picker>
        </div>

        <div class="config-item">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Width Scale: ${this._config.size || 1}x</label>
          <ha-slider
            min="1" max="4" step="1" pin
            .value="${this._config.size || 1}"
            .configValue="${'size'}"
            style="width: 100%;"
          ></ha-slider>
        </div>
      </div>
    `;

    // CRITICAL FIX: Prevent click events from closing the picker immediately
    const pickers = this.querySelectorAll('ha-entity-picker, ha-icon-picker, ha-slider');
    pickers.forEach(picker => {
      // 1. Ensure pickers stay open by stopping event propagation
      picker.addEventListener('click', (ev) => ev.stopPropagation());
      
      // 2. Standard value change listener
      picker.addEventListener('value-changed', (ev) => {
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

customElements.define('leopard-light-card', LeopardLightCard);
customElements.define('leopard-light-card-editor', LeopardLightCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "leopard-light-card",
  name: "Leopard HomeKit Light",
  preview: true
});
