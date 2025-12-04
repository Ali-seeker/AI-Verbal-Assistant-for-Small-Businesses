# AI Verbal Assistant for Small Businesses (Phase 1)

This project is a **Phase 1 MERN-based web and text assistant** for small shop owners. It lets you manage products and sales through a simple dashboard and a single text command box where you can type instructions like:

- `sell 2 kg sugar to Ali`
- `2 kg sugar bech di`
- `show today sales`
- `show low stock`

Voice is *optional*: in supported browsers, you can use speech-to-text to fill the command box, but all understanding and actions are still done via text commands.

## Tech stack

- **MongoDB** for storing products and sales
- **Express + Node.js** backend (`server.js`)
- **React + Vite** frontend (in `client/`)
- **Mongoose** models for `Product` and `Sale`

## Main features

1. **Product management**
   - Add products with name, unit (kg, liter, piece, etc.), stock quantity, price per unit, and low-stock threshold
   - View all products in a table
   - View a dedicated list of **low-stock products** (`stockQuantity <= lowStockThreshold`)

2. **Sales management**
   - Record a sale via standard form (select product, quantity, optional customer name)
   - Stock is reduced automatically when a sale is recorded
   - View **today's sales summary** (total number of sales and total amount earned)

3. **Text Command Assistant**
   - Single input box where you can type commands
   - Backend parses commands using simple **rule-based patterns** (no heavy NLP)
   - Supports:
     - Recording sales (`sell 2 sugar`, `2 kg sugar bech di`)
     - Showing today's sales (`show today sales`, `today sales`)
     - Showing low-stock products (`show low stock`, `stock kam hai`)
     - Creating products (`add product sugar stock 10 price 100`)
     - Updating products (`update product sugar price 120`, `change price sugar to 150`)
   - Returns structured JSON which the frontend renders as friendly messages

4. **(Optional) Voice input helper**
   - Uses the browser's SpeechRecognition API (where available) to convert speech into text in the command box
   - The command is then processed by the same text-based parser
   - Clearly marked as **experimental / Phase 2 helper** in the UI

## Getting started

### 1. Backend setup

1. Install dependencies in the root folder:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root based on `.env.example` and set:

   ```bash
   MONGO_URI=mongodb://localhost:27017/ai-verbal-assistant
   PORT=5000
   ```

3. Start the backend server:

   ```bash
   npm run dev
   ```

   This starts Express on `http://localhost:5000`.

### 2. Frontend setup

1. Go to the `client` folder and install dependencies:

   ```bash
   cd client
   npm install
   ```

2. (Optional) Configure API base URL for production using Vite env variables:

   ```bash
   # client/.env
   VITE_API_BASE=http://localhost:5000/api
   ```

   If `VITE_API_BASE` is not set, the app falls back to `http://localhost:5000/api`.

3. Start the frontend:

   ```bash
   npm run dev
   ```

4. Open the URL printed by Vite (usually `http://localhost:5173`).

## How to use the Text Command Assistant

Open the app in the browser and scroll to the **"Text Command Assistant"** section.

You can try commands like:

- Record a sale (English-ish):
  - `sell 2 sugar`
  - `sell 2 kg sugar`
  - `sell 1 cola to Ali`
- Record a sale (Urdu-mix):
  - `2 kg sugar bech di`
  - `1 cola bech diya`
- Show today's sales:
  - `show today sales`
  - `today sales`
  - `sales today`
- Show low-stock products:
  - `show low stock`
  - `low stock`
  - `stock kam hai`
- Create a product:
  - `add product sugar stock 10 price 100`
  - `add product basmati rice stock 25 price 350 unit kg low 5`
- Update a product:
  - `update product sugar price 120`
  - `update product sugar stock 50`
  - `update product sugar low 5`
  - `change price sugar to 150`

If the system cannot understand a command, it responds with a **help** payload that includes example commands.

## Design and limitations

- Parsing is **rule-based**, using regular expressions and keyword checks. This keeps the system:
  - Simple to implement
  - Deterministic and easy to test
  - Suitable for an FYP Phase 1 without external NLP services
- Urdu support is limited to simple patterns like `2 kg sugar bech di` and extra Urdu phrases such as `kr do`, `batao` are mostly ignored by the parser.
- Products are looked up by **name** (case-insensitive). It assumes names are unique enough for small shops.
- Stock updates via `update product ... stock <qty>` set the **absolute** stock value, not increment/decrement.

These limitations are documented and can be addressed in later phases (e.g. more flexible NLP parsing, product codes, or full voice assistants).

## Folder structure (high level)

- `server.js` – Express app entry point, mounts routes under `/api/*`
- `config/db.js` – MongoDB connection helper
- `models/Product.js` – Product schema and model
- `models/Sale.js` – Sale schema and model
- `routes/products.js` – REST endpoints for product CRUD and low-stock listing
- `routes/sales.js` – REST endpoints for recording sales and today&apos;s summary
- `routes/commands.js` – Text command interpreter (`POST /api/commands/execute`)
- `client/` – React + Vite frontend (dashboard UI and Text Command Assistant)

## Future work (beyond Phase 1)

- More flexible natural language understanding (NLP models)
- Richer Urdu/English mixed commands
- Stronger validation and user permissions
- Full voice assistant with continuous listening and spoken responses
