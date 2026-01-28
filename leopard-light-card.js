class LeopardLightCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isDragging = false;
    this._hasMoved = false;
  }

  static getConfigElement() {
    return document.createElement('leopard-light-card-editor');
  }

  static getStubConfig() {
    return { entity: '', icon: 'mdi:lightbulb', size: 1 };
  }

  setConfig(config) {
    if (!config.entity) throw new Error('Please define a light entity');
    this._config = { size: 1, ...config };
  }

  set hass(hass) {
    this._hass = hass;
    // Only update if not dragging to prevent UI jumping
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
    if (state.attributes.color_temp_kelvin) return '#fff7f0'; 
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
    
    this._updateBrightnessDisplay(this._currentBrightness);
    this._hasMoved = true;
    if (e.cancelable) e.preventDefault();
  }

  _updateBrightnessDisplay(value) {
    const fill = this.shadowRoot.querySelector('.slider-fill');
    const status = this.shadowRoot.querySelector('.status');
    if (fill) fill.style.width = `${value}%`;
    if (status) status.textContent = value > 0 ? `${Math.round(value)}%` : 'Off';
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

  disconnectedCallback() {
    window.removeEventListener('mousemove', this._onMove);
    window.removeEventListener('mouseup', this._onEnd);
  }

  /* ---------- RENDERING ---------- */
  render() {
    if (!this._hass || !this._config) return;
    const state = this._hass.states[this._config.entity];
    if (!state) return;

    const isOn = state.state === 'on';
    const percent = isOn ? Math.round(((state.attributes.brightness || 0) / 255) * 100) : 0;
    const activeColor = isOn ? this._getLightColor(state) : '#313131';
    const isDark = !isOn || this._isColorDark(activeColor);

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; width: 100%; padding: 4px 0; }
        .slider-container {
          position: relative; width: 100%; height: 56px;
          background: #1c1c1e; border-radius: 28px;
          overflow: hidden; cursor: pointer; touch-action: none;
          -webkit-tap-highlight-color: transparent;
        }
        .slider-fill {
          position: absolute; height: 100%; width: ${percent}%;
          background: ${activeColor}; transition: width 0.1s ease-out; z-index: 1;
        }
        .content {
          position: absolute; width: 100%; height: 100%;
          display: flex; align-items: center; padding: 0 20px;
          box-sizing: border-box; color: ${isDark ? '#fff' : '#000'};
          z-index: 2; pointer-events: none;
        }
        .icon-box {
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(128,128,128,0.2);
          display: flex; align-items: center; justify-content: center; margin-right: 12px;
        }
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

/* ---------- EDITOR ---------- */
class LeopardLightCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; }
  set hass(hass) { this._hass = hass; this.render(); }

  render() {
    if (!this._hass) return;
    this.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 16px; padding: 10px;">
        <ha-entity-picker .hass="${this._hass}" .value="${this._config.entity}" .configValue="${"entity"}" include-domains='["light"]' allow-custom-entity label="Entity"></ha-entity-picker>
        <ha-icon-picker .hass="${this._hass}" .value="${this._config.icon}" .configValue="${"icon"}" label="Icon"></ha-icon-picker>
        <div style="padding-top: 8px;">
            <label>Width Multiplier: ${this._config.size || 1}x</label>
            <ha-slider min="1" max="4" step="1" pin .value="${this._config.size || 1}" .configValue="${"size"}"></ha-slider>
        </div>
      </div>
    `;

    this.querySelectorAll('ha-entity-picker, ha-icon-picker, ha-slider').forEach(input => {
      input.addEventListener('value-changed', (ev) => {
        const config = { ...this._config, [ev.target.configValue]: ev.target.configValue === "size" ? Number(ev.detail.value) : ev.detail.value };
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
    });
  }
}

customElements.define('leopard-light-card', LeopardLightCard);
customElements.define('leopard-light-card-editor', LeopardLightCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "leopard-light-card", name: "Leopard HomeKit Light", preview: true });
