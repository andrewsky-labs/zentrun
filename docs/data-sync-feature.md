# 📁 Zentrun Data Sync Feature Documentation

## 🧩 Overview

The **Data Sync** feature allows users to back up application data (including chat records and configuration files) to a designated sync folder, and import that data on other devices. This is especially useful in the following scenarios:

1. **Data Backup**: Prevent data loss
2. **Cross-device Sync**: Share chat and config data between multiple devices
3. **Data Migration**: Move data when reinstalling or switching devices

---

## ⚙️ Technical Implementation

### 🔧 Core Components

1. **SyncPresenter**: Main class handling sync logic, including backup and import
2. **ConfigPresenter Extension**: Adds sync-related config options
3. **DataSettings.vue**: UI component for controlling sync settings

---

### 🔄 Data Flow

#### 🔐 Backup Process

1. User enables sync and selects a sync folder.
2. When data changes (e.g., adding/modifying messages or sessions), the system waits for a period of inactivity (default: 60 seconds) before triggering backup.
3. During backup, a temporary file is created first and then safely replaced to avoid conflicts.
4. The following files are backed up:
   - Database file (`chat.db`)
   - Config files (`xxx.json`, `provider-models/xxx.json`)

#### 📥 Import Process

1. User clicks "Import Data" in the settings UI.
2. The system checks for valid backup files in the selected folder.
3. Before import, current data is backed up to allow rollback in case of failure.
4. After import, the app must restart to apply changes.

---

### 🔒 Safety Measures

1. Uses temporary files during backup to avoid file conflicts during import.
2. Current data is backed up before import for recovery safety.
3. `syncFolderPath` is not included in synced data to avoid cross-device path issues.
4. Full error handling and status feedback is implemented for both backup and import.

---

## 🖥 User Interface

The Data Sync UI is located under the **"Data"** tab in Settings, and includes:

1. Sync toggle: Enable/disable sync feature
2. Sync folder selector: Choose destination folder for backups
3. Open sync folder: Opens the folder in system file explorer
4. Last sync time: Displays timestamp of the last successful backup
5. Manual backup: Trigger backup manually
6. Import data:
   - **Incremental import**: Only imports new data, avoiding duplication (e.g., importing Jan 1 and Jan 2 backups won’t result in duplicated Jan 1 messages)
   - **Overwrite import**: Replaces existing data with new backup content

---

## 📡 Event System

The system uses an event-based mechanism to notify sync status:

| Event Name             | Description              |
|------------------------|--------------------------|
| `sync:backup-started`  | Backup started           |
| `sync:backup-completed`| Backup completed         |
| `sync:backup-error`    | Backup failed            |
| `sync:import-started`  | Import started           |
| `sync:import-completed`| Import completed         |
| `sync:import-error`    | Import failed            |

These events are communicated between the main and renderer processes to reflect sync status in real time.

---

## 🛠 Config Options

Sync-related config fields include:

1. `syncEnabled`: Whether sync is enabled (boolean)
2. `syncFolderPath`: Path to sync folder (string)
3. `lastSyncTime`: Timestamp of last successful backup

These values are saved in the app config file. Note: `syncFolderPath` is excluded from backups to avoid cross-device issues.

---

## ✅ Best Practices

1. Choose a stable sync folder (e.g., inside a cloud storage directory)
2. Regularly check sync status to ensure proper backups
3. Before importing, make sure no unsaved data is pending
4. Restart the app after import to apply changes completely

---

## ⚠️ Limitations & Notes

1. Sync is not real-time — backup is delayed by a cooldown period (default 60 seconds). *(Currently disabled to reduce IO load.)*
2. Import will override all existing data including chat and config
3. Sync folder path is not synced — it must be set per device
4. Restart is required after import to finalize data update
