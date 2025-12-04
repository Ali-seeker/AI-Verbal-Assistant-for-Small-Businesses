# Problem
Phase 1 of the FYP is defined as "Pure web + text commands (MERN only)". The current MERN project implements a web dashboard for managing products and sales using standard forms and tables, but it does not yet provide an "assistant-style" text command interface (e.g. a single input where a user can type something like `sell 2 kg sugar to Ali` and the system interprets and executes the action). The user wants this text-command experience completed before moving to voice features.
# Current state
* Backend:
    * `server.js` sets up Express, connects to MongoDB, and mounts product and sales routes under `/api/products` and `/api/sales`.
    * `routes/products.js` provides endpoints to create products, list all products, and list low-stock products.
    * `routes/sales.js` provides endpoints to record a sale and retrieve today's sales summary, updating product stock accordingly.
    * `models/Product.js` and `models/Sale.js` define the data models.
* Frontend:
    * `client/src/App.jsx` implements a simple dashboard with:
        * `ProductForm` and `ProductList` for product management.
        * `SaleForm` to record a sale.
        * `TodaySales` to show today's sales summary.
    * All interactions are via standard web forms and buttons; there is no single "command" input box or natural-language-ish command handling.
# Goal
Implement a **text command assistant** inside the existing MERN app so that:
* A user can type short textual commands into one input box on the web UI.
* The backend receives the command text, interprets it using simple rule-based parsing, and performs the appropriate action (primarily recording sales and fetching summaries/low-stock info).
* The response (success/failure message and any relevant data) is displayed back in the UI.
* No voice/STT/TTS is involved (still Phase 1, web + text only).
# Proposed changes
## 1. Define a simple command language
To keep parsing reliable and FYP-friendly, support a small set of structured but natural-ish commands:
1. **Record a sale**
    * Syntax (English-ish):
        * `sell <quantity> <productName>`
        * `sell <quantity> <productName> to <customerName>`
    * Examples:
        * `sell 2 sugar`
        * `sell 2 kg sugar`
        * `sell 1 cola to Ali`
    * Behaviour:
        * Look up `productName` case-insensitively in `Product` collection.
        * Use `<quantity>` (number) and existing `pricePerUnit` to compute `totalPrice`.
        * Call the same logic as `POST /api/sales` (or reuse the route logic) to create a `Sale` and update stock.
2. **Show today's sales summary**
    * Syntax: `show today sales`, `today sales`, or `sales today`.
    * Behaviour: proxy to `GET /api/sales/today` and return the JSON summary.
3. **Show low-stock products**
    * Syntax: `show low stock`, `low stock`, or `stock kam hai` (treated as low-stock intent with a keyword match).
    * Behaviour: call `GET /api/products/low-stock` and return list of products.
4. **Help / unknown command**
    * Anything else responds with a help message showing the supported patterns and examples.
This is intentionally simple and rule-based to avoid heavy NLP libraries, but still gives an "assistant-style" feel.
## 2. Backend: add a command interpreter route
* Create a new route file `routes/commands.js` that exposes:
    * `POST /api/commands/execute` with body `{ text: string }`.
* Implementation steps:
    1. Normalize the text: trim, collapse spaces, keep both original and lowercased versions.
    2. Detect intent:
        * **Sale intent** if the text starts with `sell` or contains a sale keyword (e.g. `sell`, `sold`, `bech`). For now, to keep it predictable, prefer the pattern that **starts with** `sell`.
        * **Today sales intent** if text includes `today` and `sale`.
        * **Low-stock intent** if text includes phrases like `low stock`, `stock kam`.
    3. For sale intent:
        * Regex match pattern similar to: `^sell\s+(\d+(?:\.\d+)?)\s+(?:[a-zA-Z]+\s+)?(.+?)(?:\s+to\s+(.+))?$`
        * Group 1 = quantity
        * Optional unit word is ignored for now (product uses its own `unit` field).
        * Group 2 = product name
        * Group 3 = optional customer name
        * Find product by case-insensitive `name`.
        * Validate stock and quantity as in `routes/sales.js`.
        * Create sale (either by reusing the `Sale` model directly or by factoring common logic into a helper function shared with `/api/sales`).
        * Respond with a JSON structure like:
        * `{ success: true, type: 'sale', message: 'Sale recorded', data: { sale, remainingStock } }`.
    4. For summary/low-stock intents:
        * Call database directly (similar to existing routes) to compute result.
        * Return `{ success: true, type: 'summary' | 'lowStock', ... }`.
    5. For unknown / parse errors:
        * Return `{ success: false, type: 'help', message: 'Could not understand command', examples: [...] }`.
* Mount the new route in `server.js` under `/api/commands`.
## 3. Frontend: add a Text Command Assistant panel
* In `client/src/App.jsx`:
    * Add a new section (e.g. below current two-column grid or as a third panel) titled **"Text Command Assistant"**.
    * Create a `TextCommandAssistant` component that contains:
        * A single `<textarea>` or `<input>` for the command.
        * A `Run Command` button.
        * State for:
        * `commandText`
        * `loading`
        * `response` (JSON from backend)
        * On submit:
        * POST to `${API_BASE}/commands/execute` with `{ text: commandText }`.
        * Show a formatted result area:
        * For `type: 'sale'`, show message + product name + quantity + remaining stock.
        * For `type: 'summary'`, show total sales and total earned (reuse `TodaySales` style table if desired, or just a quick summary for now).
        * For `type: 'lowStock'`, list product names and their stock quantities.
        * For `type: 'help'` or errors, show the help message and examples.
* Keep styling simple and consistent with existing `.card` and `.app` classes in `App.css`.
## 4. Testing and usage notes
1. **Backend tests (manual):**
    * Start backend server (with Mongo running).
    * Use Postman/curl to call:
        * `POST /api/commands/execute` body `{ "text": "sell 2 sugar" }` with an existing product `sugar`.
        * `POST /api/commands/execute` with `"show today sales"`.
        * `POST /api/commands/execute` with `"show low stock"`.
    * Verify correct JSON responses and stock changes.
2. **Frontend tests:**
    * Run `npm run dev` in `client` and open the app.
    * In the new "Text Command Assistant" box, try the same commands and ensure the UI reflects backend responses.
## 5. Limitations / future improvements
* Current parser focuses on commands that **start with `sell`** for sales; truly free-form sentences like `2 kg sugar bech di` are harder and can be treated as a later enhancement (Phase 2 or 3) using better NLP.
* We can later:
    * Add more patterns (Urdu/English mix).
    * Support more command types (e.g., add product, update price).
    * Integrate with voice input once browser STT is added in Phase 2.
