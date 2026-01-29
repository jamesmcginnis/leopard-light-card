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
    return { entity: '', icon: '', size: 1 };
  }

  setConfig(config) {
    this._config = Object.assign({ icon: '', size: 1 }, config);
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._isDragging) this.render();
  }

  _supportsBrightness(state) {
    return (
      state &&
      state.attributes &&
      typeof state.attributes.brightness === 'number'
    );
  }

  _setBrightness(value) {
    this._hass.callService('light', 'turn_on', {
      entity_id: this._config.entity,
      brightness_pct: Math.round(value)
    });
  }

  _toggleLight() {
    this._hass.callService('light', 'toggle', {
      entity_id: this._config.entity
    });
  }

  _getLightColor(state) {
    if (state.attributes && state.attributes.rgb_color) {
      return 'rgb(' + state.attributes.rgb_color.join(',') + ')';
    }
    return '#F7D959';
  }

  _isColorDark(color) {
    if (!color || color.indexOf('rgb') === -1) return true;
    const rgb = color.match(/\d+/g).map(Number);
    const luminance =
      (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    return luminance < 0.6;
  }

  _handleDragStart(e) {
    if (!this._supportsBrightness(this._state)) return;

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
    const pos = Math.max(
      0,
      Math.min(1, (x - this._cardLeft) / this._cardWidth)
    );

    this._currentBrightness = pos * 100;

    const fill = this.shadowRoot.querySelector('.slider-fill');
    const status = this.shadowRoot.querySelector('.status');
    if (fill) fill.style.width = this._currentBrightness + '%';
    if (status) status.textContent = Math.round(this._currentBrightness) + '%';

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

    this.render();
  }

  render() {
    if (!this._hass || !this._config) return;

    const state = this._hass.states[this._config.entity];
    this._state = state;

    if (!state) {
      this.shadowRoot.innerHTML = `
        <div style="background:#1c1c1e;color:white;padding:20px;border-radius:28px;text-align:center">
          Select a light entity in editor
        </div>`;
      return;
    }

    const supportsBrightness = this._supportsBrightness(state);
    const isOn = state.state === 'on';
    const brightness = state.attributes.brightness || 0;
    const percent =
      supportsBrightness && isOn
        ? Math.round((brightness / 255) * 100)
        : 0;

    const activeColor = isOn ? this._getLightColor(state) : '#313131';
    const isDark = !isOn || this._isColorDark(activeColor);

    const icon =
      this._config.icon ||
      state.attributes.icon ||
      'mdi:lightbulb';

    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;padding:4px 0}
        .slider-container{position:relative;height:56px;background:#1c1c1e;border-radius:28px;overflow:hidden;cursor:pointer}
        .slider-fill{position:absolute;height:100%;width:${percent}%;background:${activeColor};transition:width .15s;z-index:1}
        .content{position:absolute;inset:0;display:flex;align-items:center;padding:0 20px;color:${isDark ? '#fff' : '#000'};z-index:2;pointer-events:none}
        .icon-box{width:32px;height:32px;border-radius:50%;background:rgba(128,128,128,.2);display:flex;align-items:center;justify-content:center;margin-right:12px}
        ha-icon{--mdc-icon-size:20px}
        .status{font-size:12px;opacity:.6}
      </style>

      <div class="slider-container" id="card">
        <div class="slider-fill"></div>
        <div class="content">
          <div class="icon-box"><ha-icon icon="${icon}"></ha-icon></div>
          <div>
            <div>${state.attributes.friendly_name}</div>
            <div class="status">
              ${
                supportsBrightness
                  ? isOn ? percent + '%' : 'Off'
                  : isOn ? 'On' : 'Off'
              }
            </div>
          </div>
        </div>
      </div>
    `;

    const card = this.shadowRoot.getElementById('card');
    card.onclick = () => {
      if (!this._hasMoved) this._toggleLight();
    };

    if (supportsBrightness) {
      card.addEventListener('mousedown', (e) => this._handleDragStart(e));
      card.addEventListener(
        'touchstart',
        (e) => this._handleDragStart(e),
        { passive: false }
      );
    }
  }
}

/* ---------- EDITOR ---------- */

class LeopardLightCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    this._config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  render() {
    if (!this._hass || !this._config) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;padding:16px;--mdc-menu-z-index:9999}
        .item{margin-bottom:20px}
      </style>

      <div class="item">
        <label>Select Light</label>
        <ha-entity-picker
          .hass="${this._hass}"
          .value="${this._config.entity}"
          .configValue="${'entity'}"
          .includeDomains="${['light']}">
        </ha-entity-picker>
      </div>

      <div class="item">
        <label>Icon Override</label>
        <ha-icon-picker
          .hass="${this._hass}"
          .value="${this._config.icon}"
          .configValue="${'icon'}">
        </ha-icon-picker>
      </div>
    `;

    this.shadowRoot.querySelectorAll('ha-entity-picker, ha-icon-picker')
      .forEach((el) => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());

        el.addEventListener('value-changed', (e) => {
          this.dispatchEvent(
            new CustomEvent('config-changed', {
              detail: {
                config: Object.assign({}, this._config, {
                  [e.target.configValue]: e.detail.value
                })
              },
              bubbles: true,
              composed: true
            })
          );
        });
      });
  }
}

customElements.define('leopard-light-card', LeopardLightCard);
customElements.define('leopard-light-card-editor', LeopardLightCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'leopard-light-card',
  name: 'Leopard HomeKit Light',
  description: 'A horizontal HomeKit-style pill slider for lights.',
  preview: true
});