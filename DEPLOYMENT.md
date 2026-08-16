# Deployment and Testing Guide

This project is built as a lightweight mobile-first static app for GitHub Pages, with a Google Apps Script web app acting as the data connector to the Google Sheet.

## Project path

- Workspace: `/workspaces/order-management`
- Main app file: `/workspaces/order-management/index.html`
- Frontend logic: `/workspaces/order-management/app.js`
- Styling: `/workspaces/order-management/styles.css`
- Google Apps Script: `/workspaces/order-management/apps-script/Code.gs`

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

1. Open Google Apps Script.
2. Create a new project.
3. Paste the contents of `apps-script/Code.gs` into the script editor.
4. Save the project.
5. Deploy it as a Web App:
   - Execute as: Me
   - Who has access: Anyone
6. After deployment, copy the Web App URL.
7. Update this value in the frontend file:

```js
const APP_CONFIG = {
  SHEET_WEB_APP_URL: 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE',
};
```

If you prefer not to edit the file directly, keep the same structure and replace the value in `/workspaces/order-management/app.js` before publishing.

## 3. GitHub Pages deployment

1. Create a GitHub repository and push the project files.
2. In GitHub, open the repository settings.
3. Go to Pages.
4. Under Source, choose the main branch and root folder.
5. Save the settings.
6. GitHub Pages will give you a URL similar to:

```text
https://your-user-name.github.io/your-repo-name/
```

7. Open the deployed page.
8. Log in with:
   - Username: `admin`
   - Password: `order123`
9. Set the final Apps Script URL in the deployed app source before publishing, or update it after deployment by editing the same file in the repo and pushing again.

## 4. Sheet structure and matching

The sheet must include these header names in row 1:

- Order ID
- Customer name
- Product
- Size
- Delivery address
- Delivery charge paid status
- Order Price
- Order date
- Additional accessories
- Package ready
- Out for delivery
- Order status
- Delivery ID
- Delivery status link
- Order delivered date
- Customer no
- Note

The app maps submitted values to those columns using the constants in the codebase.

## 5. Test flow

1. Run the app locally or on GitHub Pages.
2. Login with the static credentials.
3. Paste a sample order message like:

```text
name: nafijul islam
phone:01910186978
Address: Shoni akhra Nurpur 1 number road matrikunjonibash 1333 Dhaka1236
Size:41
shoe name : supreme milk red 
pp: 2550
```

4. Click Parse order.
5. Confirm that the fields appear in the default order.
6. Edit values if needed.
7. Click Submit order.
8. Confirm the response includes an order ID and a success toast.

## 6. Useful notes

- The app is intentionally simple and mobile-first.
- The login is static and not secure by design, because this is a single-user workflow.
- The cookie lasts 7 days.
- Everything that may need updating is kept in constants so the app is easier to maintain.
