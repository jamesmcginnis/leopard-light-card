# Leopard Light Card 

A high-performance, HomeKit-inspired pill card for your Home Assistant dashboard.

### Why use Leopard Light Card?

Most light cards require you to tap once to open a sub-menu just to change brightness. **Leopard Light Card** turns the entire card into a responsive slider, allowing you to control your lighting with a single swipe.

### Key Features

* **Slide-to-Bright:** Drag anywhere on the card to adjust brightness levels instantly with real-time visual feedback.
* **Smart Icon Toggle:** A dedicated hit-zone on the icon allows for quick On/Off toggling without changing brightness.
* **Haptic UI:** Dynamic background fills and icon colors that match your light's current RGB or HS Color state.
* **Optimized Performance:** Built-in debouncing (50ms) ensures dragging is buttery smooth and won't flood your Home Assistant network.
* **Deep Press Support:** Long-press (500ms) the card to access the native "More Info" dialog for advanced settings like color pickers or effects.
* **Smart Touch Handling:** Automatically distinguishes between vertical scrolling and horizontal brightness control for seamless mobile use.
* **Custom Naming:** Override entity names with personalized labels for clearer dashboard organization.
* **Visual Editor:** Fully integrated with Home Assistant's dashboard editor—no manual YAML required.

### Preview

The card is designed to look best in a grid or as part of a sleek, minimalist mobile dashboard. Its compact 56px height and 28px border radius adapt perfectly to both Dark and Light modes.

![Preview](preview.png)

---

## Installation

### Via HACS (Recommended)

1. Open HACS in Home Assistant
2. Click the three dots in the top right corner
3. Select "Custom repositories"
4. Add this repository URL and select "Lovelace" as the category
5. Click "Install"
6. Refresh your browser

### Manual Installation

1. Download `leopard-light-card.js` from this repository
2. Upload it to your Home Assistant `config/www/` directory
3. Add the resource in **Settings** > **Dashboards** > **Resources**:
   * URL: `/local/leopard-light-card.js`
   * Type: **JavaScript Module**
4. Refresh your browser (Ctrl+F5 / Cmd+Shift+R)

---

## Configuration

### Quick Start

1. Add a **Custom: Leopard Light Card** to your dashboard via the UI editor
2. Select your light entity
3. (Optional) Customize the name and icon
4. Done!

### YAML Configuration
```yaml
type: custom:leopard-light-card
entity: light.living_room_main
name: Living Room         # Optional: Custom display name
icon: mdi:lightbulb-group # Optional: Icon override
```

### Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `entity` | string | ✅ Yes | The light entity ID (must support brightness) |
| `name` | string | ⬜ No | Custom display name (defaults to entity's friendly_name) |
| `icon` | string | ⬜ No | Custom icon (defaults to entity's icon or mdi:lightbulb) |

---

## How to Use

* **💡 Adjust Brightness:** Click and drag horizontally anywhere on the card
* **🔘 Toggle On/Off:** Tap the icon on the left side
* **ℹ️ More Options:** Long-press (500ms) to open entity details with color pickers and effects
* **📊 Status Display:** Real-time brightness percentage or "Off" status

---

## Visual Feedback

The card provides rich visual feedback that matches your light's state:

* **Slider Track:** Animated background bar showing current brightness level
* **Icon Color:**
  - 🔲 White when off
  - 🌈 Actual RGB/HS color when available
  - 🟡 Yellow (#f1c40f) as fallback for non-color lights
* **Live Updates:** Brightness percentage updates in real-time as you drag

---

## Troubleshooting

**Card not appearing?**
- Verify the resource is added in Dashboard Resources
- Check browser console for errors
- Clear cache and hard reload (Ctrl+F5)

**Slider not responding?**
- Ensure your light entity supports `brightness` attribute
- Verify the entity ID is correct

**Long-press opening immediately?**
- Don't drag during the press—hold still for 500ms
- Check if you're accidentally scrolling vertically

---

## Browser Compatibility

Works with modern browsers supporting:
- Custom Elements (Web Components)
- Shadow DOM  
- Touch Events
- CSS Custom Properties

Tested on Chrome, Firefox, Safari, and Home Assistant mobile apps.

---

## Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](#) or submit a pull request.

---

## License

MIT License - Free to use and modify.

---

## Support

If you find this card useful, consider ⭐ starring the repository!
