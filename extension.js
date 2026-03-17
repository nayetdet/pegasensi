/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import St from 'gi://St';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Slider from 'resource:///org/gnome/shell/ui/slider.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const PRESET_ACTIVE_CLASS = 'pegasensi-preset-label-active';
const PRESETS = {
    a: {
        key: 'preset-a',
        label: 'Preset A',
    },
    b: {
        key: 'preset-b',
        label: 'Preset B',
    },
};

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init(extension) {
        super._init(0.0, _('pegasensi'));

        this.settings = new Gio.Settings({ schema_id: 'org.gnome.desktop.peripherals.mouse' });
        this.ext = extension.getSettings('org.gnome.shell.extensions.pegasensi');

        this._presets = {};
        this._activePreset = null;

        this._addIcon();
        this._addPresetSliders();
        this._addPresetToggle();

        this._signalIds = [];

        this._connectSignals();
        this._updateActivePreset();
        this.connect('destroy', () => this._disconnectSignals());
    }

    _addIcon() {
        this.add_child(new St.Icon({
            icon_name: 'input-mouse-symbolic',
            style_class: 'system-status-icon',
        }));
    }

    _addPresetSliders() {
        for (const { key, label } of Object.values(PRESETS)) {
            const sliderItem = new PopupMenu.PopupBaseMenuItem({ activate: false });
            const sliderBox = new St.BoxLayout({ vertical: true, x_expand: true });
            const sliderBoxLabel = new St.Label({ text: label });
            sliderBox.add_child(sliderBoxLabel);

            const slider = new Slider.Slider(this._toSliderSpeedFromMouse(this.ext.get_double(key)));
            slider.connect('notify::value', () => {
                const speed = this._toMouseSpeedFromSlider(slider.value);
                if (this.ext.get_double(key) !== speed) {
                    this.ext.set_double(key, speed);
                }
            });

            sliderBox.add_child(slider);
            sliderItem.add_child(sliderBox);
            this.menu.addMenuItem(sliderItem);
            this._presets[key] = {
                label: sliderBoxLabel,
                slider: slider,
            };
        }
    }

    _addPresetToggle() {
        const toggleItem = new PopupMenu.PopupMenuItem('Toggle');
        toggleItem.connect('activate', () => {
            this._updateActivePreset();
            const speed = this._activePreset === PRESETS.a.key
                ? PRESETS.b.key
                : PRESETS.a.key;

            this.settings.set_double('speed', this.ext.get_double(speed));
        });

        this.menu.addMenuItem(toggleItem);
    }

    _updateActivePreset() {
        const a = this.ext.get_double(PRESETS.a.key);
        const b = this.ext.get_double(PRESETS.b.key);
        const speed = this.settings.get_double('speed');

        this._activePreset = Math.abs(speed - a) < Math.abs(speed - b)
            ? PRESETS.a.key
            : PRESETS.b.key;

        for (const {key} of Object.values(PRESETS)) {
            if (!this._presets[key]) {
                continue;
            }

            if (key === this._activePreset) {
                this._presets[key].label.add_style_class_name(PRESET_ACTIVE_CLASS);
            } else {
                this._presets[key].label.remove_style_class_name(PRESET_ACTIVE_CLASS);
            }
        }
    }

    _connectSignals() {
        this._signalIds.push([
            this.settings,
            this.settings.connect('changed::speed', () => this._updateActivePreset()),
        ]);

        for (const {key} of Object.values(PRESETS)) {
            this._signalIds.push([
                this.ext,
                this.ext.connect(`changed::${key}`, () => {
                    const sliderSpeed = this._toSliderSpeedFromMouse(this.ext.get_double(key));
                    if (this._presets[key].slider.value !== sliderSpeed) {
                        this._presets[key].slider.value = sliderSpeed;
                    }

                    this._updateActivePreset();
                    if (this._activePreset === key) {
                        this.settings.set_double('speed', this.ext.get_double(key));
                    }
                }),
            ]);
        }
    }

    _disconnectSignals() {
        for (const [object, id] of this._signalIds) {
            object.disconnect(id);
        }

        this._signalIds = [];
    }

    _toMouseSpeedFromSlider(value) {
        return value * 2 - 1;
    }

    _toSliderSpeedFromMouse(value) {
        return (value + 1) / 2;
    }
});

export default class PegasensiExtension extends Extension {
    enable() {
        this._indicator = new Indicator(this);
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
    }
}
