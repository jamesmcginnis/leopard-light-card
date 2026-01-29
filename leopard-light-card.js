console.warn("LeopardLightCard loaded");

class LeopardLightCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._longPressTimeout = null;
    this._lastBrightness = null;
    this._debouncer = null;
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
    
    let iconColor = "white";
    if (isOn) {
      if (stateObj.attributes.hs_color) {
        const [h, s] = stateObj.attributes.hs_color;
        iconColor = `hsl(${h}, ${s}%, 50%)`;
      } else {
        iconColor = "#f1c40f";
      }
    }

    if (!this.shadowRoot.querySelector(".card")) {
      this.shadowRoot.innerHTML = `
        <style>
          :host { --pct: 0%; --rgb: 255, 255, 255; }
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
            background: rgba(var(--rgb), 0.2);
            width: var(--pct);
            transition: width 0.05s linear; /* Faster transition for better feedback */
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
            pointer-events: none;
          }
          .icon-container {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 5;
            pointer-events: auto;
          }
          .info { display: flex; flex-direction: column; }
          .name { font-size: 14px; font-weight: 500; }
          .status { font-size: 12px; opacity: 0.6; }
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

    const card = this.shadowRoot.querySelector(".card");
    card.style.setProperty("--pct", `${isOn ? pct : 0}%`);
    
    if (stateObj.attributes.rgb_color) {
      card.style.setProperty("--rgb", stateObj.attributes.rgb_color.join(','));
    }

    const haIcon = this.shadowRoot.querySelector("ha-icon");
    haIcon.icon = icon;
    haIcon.style.color = iconColor;
    
    this.shadowRoot.querySelector(".name").textContent = stateObj.attributes.friendly_name;
    this.shadowRoot.querySelector(".status").textContent = isOn ? `${pct}%` : "Off";
  }

  _setupEventListeners() {
    const card = this.shadowRoot.querySelector(".card");
    const iconBtn = this.shadowRoot.querySelector(".icon-container");

    iconBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this._hass.callService("light", "toggle", { entity_id: this._config.entity });
    });

    const handleMove = (e) => {
      clearTimeout(this._longPressTimeout);
      
      const rect = card.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const newPct = Math.round((x / rect.width) * 100);
      const newBrightness = Math.round((newPct / 100) * 255);

      // Update UI immediately for responsiveness
      card.style.setProperty("--pct", `${newPct}%`);
      this.shadowRoot.querySelector(".status").textContent = newPct > 0 ? `${newPct}%` : "Off";

      // Debounce the Service Call
      if (this._lastBrightness !== newBrightness) {
        this._lastBrightness = newBrightness;
        
        clearTimeout(this._debouncer);
        this._debouncer = setTimeout(() => {
          this._hass.callService("light", "turn_on", {
            entity_id: this._config.entity,
            brightness: newBrightness
          });
        }, 50); // 50ms delay significantly reduces lag
      }
    };

    const stopDrag = () => {
      clearTimeout(this._longPressTimeout);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchend", stopDrag);
    };

    const startDrag = (e) => {
      if (e.target.closest('.icon-container')) return;

      this._longPressTimeout = setTimeout(() => {
        stopDrag(); 
        const event = new CustomEvent("hass-more-info", {
          detail: { entityId: this._config.entity },
          bubbles: true,
          composed: true
        });
        this.dispatchEvent(event);
      }, 500);

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("touchmove", handleMove);
      window.addEventListener("mouseup", stopDrag);
      window.addEventListener("touchend", stopDrag);
    };

    card.addEventListener("mousedown", startDrag);
    card.addEventListener("touchstart", startDrag);
  }
}

customElements.define("leopard-light-card", LeopardLightCard);

/* ===================== EDITOR ===================== */

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
  description: "HomeKit-style pill light card",
  preview: true
});
