# Order Management

A simple mobile-first order entry app for a single user. It includes:

- static login screen with 7-day browser cookie
- parse input from free-form order text into ordered form fields
- editable field form with default field order
- optional delivery charge toggle and accessory checkboxes
- Google Apps Script integration to append rows to a Google Sheet
- GitHub Pages deployment target

## Default credentials

- Username: `admin`
- Password: `order123`

## Local run

```bash
cd /workspaces/order-management
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000
```

## Deployment paths

- Local source path: `/workspaces/order-management`
- Main frontend: `/workspaces/order-management/index.html`
- Frontend logic: `/workspaces/order-management/app.js`
- Styling: `/workspaces/order-management/styles.css`
- Apps Script: `/workspaces/order-management/apps-script/Code.gs`
- Setup guide: `/workspaces/order-management/DEPLOYMENT.md`

## Production deployment

1. Push this folder to a GitHub repo.
2. Enable GitHub Pages from the repository settings.
3. Publish the main branch root.
4. Set the Google Apps Script web app URL in `app.js`.
5. Open the GitHub Pages URL and login with the static credentials.

## Notes

- The app intentionally keeps the authentication simple for a one-person workflow.
- The field order defaults are centralized in the app constants for easier updates.
- Google Sheet row matching is driven by the header names defined in the Apps Script code.
