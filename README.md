# Secret Ink

**Secret Ink** is a web app for **encrypting and decrypting messages**. Write your words in "invisible ink": turn any message into unreadable ciphertext so you can share it with confidence, knowing only the right key can reveal it.

## Tech stack

- **[Remix 3](https://remix.run/)** (`3.0.0-beta.4`) — a web-standards full-stack framework (it does not use React; it uses Remix's own component model).
- **TypeScript**
- **Node.js >= 24.3.0**

## Requirements

- **Node.js 24.3.0 or higher** (check with `node --version`).

## Installation

```bash
npm install
```

## Running the app

### Development mode (with auto-reload)

```bash
npm run dev
```

Then open **http://localhost:44100** in your browser.

### Production mode

```bash
npm start
```

### Changing the port

The default port is `44100`. To use a different one:

```bash
PORT=3000 npm run dev
```

### Other scripts

| Script              | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Development server with auto-reload (watch). |
| `npm start`         | Server in production mode.                    |
| `npm run typecheck` | Type-check the project with TypeScript.       |
| `npm test`          | Run the tests.                                |

## How to use it

The screen is split in two: the app's introduction on the left, and the working panel on the right with two tabs: **Encrypt** and **Decrypt**.

### Encrypt a message (Encrypt tab)

1. In **From** (sender) and **To** (recipient), choose how to identify each person with the **Identify by** menu:
   - **Name** → First Name and Last Name.
   - **Nick Name** → a single nickname field.
   - **Email** → an email field.
   - **Phone Number** → the country calling code (with flag and 3-letter ISO code) and the phone number (digits only).
2. Type your content in the **Message** field.
3. Press **Encrypt**.
4. The result appears in the read-only **Encrypted message** box. Use **Copy** to copy it to the clipboard.

### Decrypt a message (Decrypt tab)

1. Fill in **From** and **To** just like in Encrypt.
2. Paste the ciphertext into the **Encrypted text** field.
3. Press **Decrypt**.
4. The original message appears in **Decrypted message**. Use **Copy** to copy it.

### Validation

When you press **Encrypt** or **Decrypt**, the app checks that **all required fields are filled in** (the From/To fields based on the selected type, plus the message or the ciphertext). If anything is missing, a centered dialog shows exactly what's missing. Close it with the **X** in the corner, the **Escape** key, or by clicking outside the box.

## Project structure

```
app/
  actions/        Route controllers (controller.tsx)
  assets/         Code served to the browser
    country-codes.ts  Calling codes and ISO codes for every country + flags
    theme.ts          Shared color palette and typography
    crypto-app.tsx    Interactive component (tabs, forms, validation)
    entry.ts          Client runtime bootstrap
  middleware/     Server rendering (render.tsx)
  ui/             Shared UI (document.tsx, home-page.tsx)
  router.ts       Router configuration
  routes.ts       Route contract
server.ts         Node HTTP server
```

## Notes

- **Restart the server after visual changes:** in development, server rendering (SSR) uses the module loaded at startup. If you change styles or components, restart `npm run dev` and do a hard refresh (Cmd/Ctrl + Shift + R).
- **`EMFILE: too many open files` warnings:** these come from the file watcher scanning `node_modules`; they are not fatal. If they bother you, raise the limit in that terminal before starting:

  ```bash
  ulimit -n 10240
  ```

- **Country flags:** they are generated as emoji from each country code. They render on macOS/iOS and most modern platforms; Windows does not render them by default.
