# Leopard Light Card

A sleek, HomeKit-inspired pill card for Home Assistant with a built-in brightness slider, long-press support, and dynamic color feedback.

![Preview](preview.png)

## Features

* **Pill Design:** Compact and modern HomeKit-style interface.
* **Integrated Slider:** Drag horizontally across the card to adjust brightness smoothly.
* **Icon Toggle:** Tap the icon specifically to turn the light on or off.
* **Long Press:** Hold the card to open the standard Home Assistant "More Info" dialog.
* **Dynamic Colors:** The icon and slider track reflect the current color (`rgb_color` or `hs_color`) of the light.
* **Performance Optimized:** Debounced service calls ensure smooth dragging without lagging your Home Assistant instance.
* **Visual Editor:** Fully compatible with the Home Assistant Dashboard editor.

## Installation

### Manual Installation

1.  Download the `leopard-light-card.js` file from this repository.
2.  Upload it to your Home Assistant `config/www/` directory.
3.  Add the resource reference in Home Assistant:
    * **Settings** > **Dashboards** > **Resources** (via the three-dot menu).
    * Add `/local/leopard-light-card.js` as a **JavaScript Module**.
4.  Refresh your browser.

## Configuration

You can configure the card via the UI editor or manually in YAML:

```yaml
type: custom:leopard-light-card
entity: light.living_room_main
icon: mdi:lightbulb-group  # Optional icon override
