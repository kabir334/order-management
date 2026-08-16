# Order Management

A simple mobile-first order entry app for a single user.

## Quick start

```bash
cd /workspaces/order-management
python3 -m http.server 8000
```

Open:

- `http://localhost:8000`

Login:

- Username: `admin`
- Password: `order123`

## Deploy

- Update the Google Apps Script URL in `app.js`
- Deploy the Apps Script as a Web App with:
  - Execute as: Me
  - Who has access: Anyone
- Publish the static app on GitHub Pages

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full production and testing instructions.

