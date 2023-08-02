import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../services/settings.service';
import { Setting } from '../models/settings';
import { SnackbarService } from '../services/snackbar.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.less']
})
export class SettingsComponent implements OnInit {
  settings: Setting[] = [];
  groupedSettings: { [key: string]: Setting[] } = {};

  constructor(
    private settingsService: SettingsService,
    private snackBar: SnackbarService,
  ) {}

  ngOnInit(): void {
    this.getSettings();
    this.settingsService.settingEdited.subscribe((isEdited: Boolean) => {
      if (isEdited) {
        this.getSettings();
      }
    });
  }

  objectKeys(obj: any) {
    return Object.keys(obj);
  }

  getSettings(): void {
    this.settingsService.getSettings().subscribe((settings: Setting[]) => {
      this.settings = settings;
      this.groupedSettings = this.groupSettingsByCategory(settings);
    });
  }

  groupSettingsByCategory(settings: Setting[]): { [key: string]: Setting[] } {
    return settings.reduce((grouped: { [key: string]: Setting[] }, setting: Setting) => {
      const key = setting.category;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(setting);
      return grouped;
    }, {});
  }

  updateSettings(id: string | undefined, setting: Setting) {
    if (!id) {
      console.error('ID is missing');
      return;
    }

    this.settingsService.updateSetting(id, setting).subscribe(
      updatedSetting => {
        const index = this.settings.findIndex(s => s._id === updatedSetting._id);
        if (index !== -1) {
          this.settings[index] = updatedSetting;
        }
        this.settingsService.settingEdited.emit(true);
        this.snackBar.info('Update successful for setting: ' + setting.name);
      },
      error => {
        console.error('Failed to update setting:', error);
        this.snackBar.error('Failed to update setting: ' + setting.name);
      }
    );
  }

  onValueChange(category: string, settingName: string, newValue: any) {
    const settingToUpdate = this.groupedSettings[category].find(setting => setting.name === settingName);
    if (settingToUpdate) {
      settingToUpdate.value = newValue;
    }
  }

  updateSettingsByCategory(category: string) {
    const settingsToUpdate = this.groupedSettings[category];
    if (!settingsToUpdate || settingsToUpdate.length === 0) {
      console.error('No settings to update for category:', category);
      return;
    }

    settingsToUpdate.forEach(setting => {
      if (setting._id) {
        this.updateSettings(setting._id, setting);
      } else {
        console.error('Setting ID is missing for setting:', setting);
      }
    });
  }

  // New method to update settings for all categories
  updateAllSettings() {
    for (const category of Object.keys(this.groupedSettings)) {
      const settingsToUpdate = this.groupedSettings[category];
      settingsToUpdate.forEach(setting => {
        this.updateSettings(setting._id, setting);
      });
    }
  }
}
