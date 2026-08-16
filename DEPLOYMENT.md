# Deployment and Testing Guide

This project is built as a lightweight mobile-first static app for GitHub Pages, with a Google Apps Script web app acting as the data connector to the Google Sheet.

## Project path

- Workspace: `/workspaces/order-management`
- Main app file: `/workspaces/order-management/index.html`
- Frontend logic: `/workspaces/order-management/app.js`
- Styling: `/workspaces/order-management/styles.css`
- Google Apps Script: `/workspaces/order-management/apps-script/Code.gs`
- Sheet link: `https://docs.google.com/spreadsheets/d/1_3r-eRoJKzeS985_7Bc1Sruv28q1WOsRstFo_K5a2-E/edit?gid=204875660#gid=204875660`

## 1. Local run and test

From the project folder:

```bash
cd /workspaces/order-management
python3 -m http.server 8000
```

Then open:

- `http://localhost:8000`

Default login details:

- Username: `admin`
- Password: `order123`

The login is stored in a browser cookie for 7 days.

## 2. Configure the Google Sheets endpoint

1. Open the Google Sheet linked above.
2. Open Apps Script from the sheet or from the script project.
3. Paste the content of `/workspaces/order-management/apps-script/Code.gs` into the script editor.
4. Save the project.
5. Deploy it as a Web App:
   - Execute as: Me
   - Who has access: Anyone
   - Copy the final Web App URL after deployment
6. Update the frontend value in `/workspaces/order-management/app.js`:

```js
const APP_CONFIG = {
  SHEET_WEB_APP_URL: 'https://script.google.com/macros/s/PASTE_YOUR_DEPLOYED_WEB_APP_ID/exec',
};
```

Important: if the browser still shows a CORS error, it usually means the script was not deployed as a public web app, or the URL in the frontend is still the old script URL.

## 3. GitHub Pages deployment

1. Push the repo to GitHub.
2. Open the repo settings.
3. Go to Pages.
4. Under Source, choose the main branch and root folder.
5. Save the settings.
6. GitHub Pages will give a public URL like:

```text
https://ruso-studio.github.io/order-management/
```

7. Open the deployed page.
8. Log in with:
   - Username: `admin`
   - Password: `order123`
9. Confirm the Apps Script URL is the current public web app URL before submitting.

## 4. Sheet structure and matching

The Google Sheet header row must contain these columns in order:

- Order ID
- Customer name
- Product
- Size
- Delivary address
- Delivary charge paid status
- Order Price
- Order date
- Additional accessories
- Package ready
- Out for delivary
- Order status
- Delivary ID
- Delivary status link
- Order delivered date
- Customer no
- Note

The app maps the values using the constants in the frontend and script code.

## 5. Test flow

1. Run the app locally or on GitHub Pages.
2. Login with the static credentials.
3. Paste a sample order message in any freeform line-by-line format, for example:

```text
John Doe
john@example.com
Acme Corporation
This is a description
40
2500
```

4. Click Parse order.
5. Confirm the values map into the editable field rows.
6. Change the field dropdown from the left-hand label if needed.
7. Click Submit order.
8. Confirm the API responds with a success message and order ID.

## 6. Useful notes

- The app is intentionally simple and mobile-first.
- The login is static and not secure by design, because this is a single-user workflow.
- The cookie lasts 7 days.
- All field mappings and defaults are kept in constants so they are easy to maintain.
- The Google Apps Script does an OPTIONS preflight response so browser submissions from GitHub Pages do not fail on CORS.
