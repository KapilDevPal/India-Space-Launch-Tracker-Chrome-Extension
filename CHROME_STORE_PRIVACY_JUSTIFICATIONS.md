# Chrome Web Store Privacy Justifications

Here are the justifications for your extension to copy-paste into the Chrome Web Store Privacy practices tab:

## Single purpose description
The single purpose of this extension is to track and notify users about upcoming Indian space launches from ISRO and private Indian space companies, providing real-time countdowns and launch alerts.

## Permission Justifications

### Alarms
**Justification:** The `alarms` permission is required to schedule background tasks that fetch the latest launch data periodically without keeping a background script constantly running, ensuring minimal resource consumption.

### Host Permissions (https://space.veerexa.com/*)
**Justification:** Host permissions for `https://space.veerexa.com/*` are required to fetch real-time launch data, mission details, and updates from our dedicated API server which powers the extension's tracking features.

### Notifications
**Justification:** The `notifications` permission is required to alert users when a tracked space launch is about to happen or when there are critical updates to the launch schedule.

### Storage
**Justification:** The `storage` permission is required to save user preferences, such as selected notification settings, UI themes (light/dark mode), and cached launch data to provide a seamless offline experience and reduce unnecessary network requests.

### Remote Code Use
*Note: Manifest V3 generally disallows remote hosted code. If you are not actually executing remote JS, you should select "No, I am not using remote code". If you are forced to provide a justification because of some other setting, here is one:*
**Justification:** The extension only fetches JSON data from our API to display launch schedules. We do not execute any remote code or scripts.

## Data Usage Policy Certification
You must check the box to certify that your data usage complies with the developer program policies. Your provided privacy policy URL (https://space.veerexa.com/extension-privacy) covers this requirement.
