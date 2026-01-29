console.warn("LeopardLightCard loaded");

class LeopardLightCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._longPressTimeout = null;
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
      this.shadowRoot.innerHTML = `<div style="padding:16px;background:#1c1c1e;color:#fff;border-radius:12px;">Select a light</div>`;
      return;
    }

    const stateObj = this._hass.states[this._config.entity];
    if (!stateObj) return;

    const isOn = stateObj.state === "on";
    const brightness = stateObj.attributes.brightness || 0;
    const pct = Math.round((brightness / 255) * 100);
    const icon = this._config.icon || stateObj.attributes.icon || "mdi:lightbulb";

    // Only update innerHTML if it hasn't been created to prevent flickering during drag
    if (!this.shadowRoot.querySelector(".card")) {
      this.shadowRoot.innerHTML = `
        <style>
          :host { --pct: 0%; }
          .card {
            background: #1c1c1e;
            border-radius: 28px;
            height: 56px;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            color: white;
            font-family: sans-serif;
            user-select: none;
            cursor: pointer;
            touch-action: none;
          }
          .slider-bar {
            position: absolute;
            top: 0; left: 0; bottom: 0;
            background: rgba(255, 255, 255, 0.15);
            width: var(--pct);
            transition: width 0.1s ease-out;
            pointer-events: none;
          }
          .content {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0 20px;
            width: 100%;
          }
          .icon-container {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 2;
          }
          .info { display: flex; flex-direction: column; pointer-events: none; }
          .name { font-size: 14px; font-weight: 500; }
          .status { font-size: 12px; opacity: 0.6; }
          ha-icon.on { color: #f1c40f; }
        </style>
        <div class="card">
          <div class="slider-bar"></div>
          <div class="content">
            <div class="icon-container">
              <ha-icon></ha-icon>
            </div>
            <div class="info">
              <div class="name"></div>
              <div class="status"></div>
            </div>
          </div>
        </div>
      `;
      this._setupEventListeners();
    }

    // Update dynamic values
    const card = this.shadowRoot.querySelector(".card");
    card.style.setProperty("--pct", `${isOn ? pct : 0}%`);
    this.shadowRoot.querySelector("ha-icon").icon = icon;
    this.shadowRoot.querySelector("ha-icon").className = isOn ? "on" : "";
    this.shadowRoot.querySelector(".name").textContent = stateObj.attributes.friendly_name;
    this.shadowRoot.querySelector(".status").textContent = isOn ? `${pct}%` : "Off";
  }

  _setupEventListeners() {
    const card = this.shadowRoot.querySelector(".card");
    const iconBtn = this.shadowRoot.querySelector(".icon-container");

    // Toggle on Icon Click
    iconBtn.onclick = (e) => {
      e.stopPropagation();
      this._hass.callService("light", "toggle", { entity_id: this._config.entity });
    };

    // Slider Logic
    const handleMove = (e) => {
      const rect = card.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const newPct = Math.round((x / rect.width) * 100);
      const newBrightness = Math.round((newPct / 100) * 255);

      card.style.setProperty("--pct", `${newPct}%`);
      
      this._hass.callService("light", "turn_on", {
        entity_id: this._config.entity,
        brightness: newBrightness
      });
    };

    const startDrag = (e) => {
      // Long Press Logic
      this._longPressTimeout = setTimeout(() => {
        const event = new CustomEvent("hass-more-info", {
          detail: { entityId: this._config.entity },
          bubbles: true,
          composed: true
        });
        this.dispatchEvent(event);
        stopDrag();
      }, 500);

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("touchmove", handleMove);
      window.addEventListener("mouseup", stopDrag);
      window.addEventListener("touchend", stopDrag);
    };

    const stopDrag = () => {
      clearTimeout(this._longPressTimeout);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchend", stopDrag);
    };

    card.addEventListener("mousedown", startDrag);
    card.addEventListener("touchstart", startDrag);
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
    if (!this._initialized) {
      this.innerHTML = `<ha-form></ha-form>`;
      const form = this.querySelector("ha-form");
      form.schema = [
        { name: "entity", label: "Light", selector: { entity: { domain: "light" } } },
        { name: "icon", label: "Icon override", selector: { icon: {} } }
      ];
      form.addEventListener("value-changed", e => {
        this.dispatchEvent(new CustomEvent("config-changed", {
          detail: { config: e.detail.value },
          bubbles: true,
          composed: true
        }));
      });
      this._initialized = true;
    }
    const form = this.querySelector("ha-form");
    if (form) {
      form.hass = this._hass;
      form.data = this._config;
    }
  }
}
customElements.define("leopard-light-card-editor", LeopardLightCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "leopard-light-card",
  name: "Leopard HomeKit Light",
  description: "HomeKit-style pill light card with brightness drag",
  preview: true
});
