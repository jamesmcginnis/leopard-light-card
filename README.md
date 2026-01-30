# Leopard Light Card

A sleek, HomeKit-inspired pill card for Home Assistant with a built-in brightness slider, long-press support, and dynamic color feedback.

![Preview](preview.png)

## Features

* **Pill Design:** Compact and modern HomeKit-style interface with a 56px height and 28px border radius.
* **Integrated Slider:** Drag horizontally across the card to adjust brightness smoothly with real-time visual feedback.
* **Icon Toggle:** Tap the icon specifically to turn the light on or off without adjusting brightness.
* **Long Press:** Hold the card for 500ms to open the standard Home Assistant "More Info" dialog.
* **Dynamic Colors:** The icon and slider track reflect the current color (`rgb_color` or `hs_color`) of the light, defaulting to yellow when on without color support.
* **Smart Touch Handling:** Distinguishes between vertical scrolling and horizontal dragging for optimal mobile experience.
* **Performance Optimized:** Debounced service calls (50ms) ensure smooth dragging without overwhelming your Home Assistant instance.
* **Visual Editor:** Fully compatible with the Home Assistant Dashboard editor with support for entity selection, custom name, and icon override.
* **Custom Naming:** Override the entity's friendly name with a custom display name.

## Installation

### Manual Installation

1. Download the `leopard-light-card.js` file from this repository.
2. Upload it to your Home Assistant `config/www/` directory.
3. Add the resource reference in Home Assistant:
   * **Settings** > **Dashboards** > **Resources** (via the three-dot menu).
   * Add `/local/leopard-light-card.js` as a **JavaScript Module**.
4. Refresh your browser (clear cache if needed: Ctrl+F5 or Cmd+Shift+R).

## Configuration

You can configure the card via the UI editor or manually in YAML:

### Basic Configuration
```yaml
type: custom:leopard-light-card
entity: light.living_room_main
```

### Full Configuration
```yaml
type: custom:leopard-light-card
entity: light.living_room_main
name: Living Room         # Optional: Custom display name
icon: mdi:lightbulb-group # Optional: Icon override
```

### Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `entity` | string | Yes | The light entity ID |
| `name` | string | No | Custom display name (defaults to entity's friendly_name) |
| `icon` | string | No | Custom icon (defaults to entity's icon or mdi:lightbulb) |

## Usage

* **Adjust Brightness:** Click and drag horizontally anywhere on the card (except the icon area)
* **Toggle Light:** Click the icon on the left side
* **More Info:** Long-press the card for 500ms to open the entity details dialog
* **Status Display:** Shows current brightness percentage when on, or "Off" when off

## Visual Feedback

* **Slider Track:** Shows a colored bar representing the current brightness level
* **Icon Color:** 
  - White when off
  - Uses the light's actual color when on (if available)
  - Yellow (#f1c40f) when on without color support
* **Real-time Updates:** Brightness percentage updates as you drag

## Browser Compatibility

Works with modern browsers that support:
- Custom Elements (Web Components)
- Shadow DOM
- Touch Events
- CSS Custom Properties

## Troubleshooting

**Card not appearing:**
- Verify the resource is added correctly in Dashboard Resources
- Check browser console for JavaScript errors
- Clear browser cache and reload

**Slider not responding:**
- Ensure the light entity supports brightness control
- Check that the entity ID is correct in the configuration

**Long press not working:**
- The 500ms delay is intentional for touch devices
- Make sure you're not dragging the slider during the press

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - feel free to use and modify as needed.
