# Text Command Assistant – Command Language (Phase 1)

This document describes the **text commands** supported by the AI Verbal Assistant (Phase 1 – pure web + text, MERN only).

The commands are sent from the frontend to the backend endpoint:

- `POST /api/commands/execute`
- Request body: `{ "text": "<your command here>" }`

The backend parses the text and performs actions using the existing `Product` and `Sale` models.

---

## 1. Sales commands

### 1.1 English-style `sell` commands

Basic pattern:

```text
sell <quantity> <productName>
```

Optional extensions:

```text
sell <quantity> <productName> to <customerName>
sell <quantity> <unit> <productName>
sell <quantity> <unit> <productName> to <customerName>
```

**Examples**

- `sell 2 sugar`
- `sell 2 kg sugar`
- `sell 1 cola to Ali`

**Behaviour**

- Finds `productName` case-insensitively in `Product` collection.
- Uses `<quantity>` and `pricePerUnit` to compute `totalPrice`.
- Creates a `Sale` document and reduces `Product.stockQuantity`.
- Responds with:

```json
{
  "success": true,
  "type": "sale",
  "message": "Sale recorded successfully via command",
  "data": {
    "sale": { ... },
    "product": {
      "_id": "...",
      "name": "...",
      "remainingStock": 8,
      "unit": "kg"
    }
  }
}
```

### 1.2 Urdu-mix `bech` commands

Pattern (simple):

```text
<quantity> <unit?> <productName> bech ...
```

**Examples**

- `2 kg sugar bech di`
- `1 cola bech diya`
- `5 liter oil bech dia`

**Behaviour**

- Parses `<quantity>` and `<productName>` from the sentence.
- Looks up product name (case-insensitive).
- Creates a sale exactly like the `sell` command.

---

## 2. Product creation commands

Pattern:

```text
add product <name> stock <qty> price <price> [unit <unit>] [low <threshold>]
```

**Examples**

- `add product sugar stock 10 price 100`
- `add product basmati rice stock 25 price 350 unit kg low 5`

**Behaviour**

- Creates a new `Product` with:
  - `name`
  - `stockQuantity = qty`
  - `pricePerUnit = price`
  - `unit` (default: `unit` if not provided)
  - `lowStockThreshold` (default: `5` if not provided)
- Responds with:

```json
{
  "success": true,
  "type": "productCreate",
  "message": "Product created successfully via command",
  "data": { "product": { ... } }
}
```

---

## 3. Product update commands

You can update **price**, **stock**, or **low-stock threshold**.

### 3.1 Update using `update product`

**Price**

```text
update product <name> price <price>
```

Example:

- `update product sugar price 120`

**Stock (set absolute value)**

```text
update product <name> stock <qty>
```

Example:

- `update product sugar stock 50`

**Low-stock threshold**

```text
update product <name> low <threshold>
```

Example:

- `update product sugar low 5`

You can also add extra Urdu words; the parser focuses on the structured part, for example:

- `update product sugar low 5, stock kam ho jaye to batao`

### 3.2 Short form `change price` commands

```text
change price <name> to <price>
change price <name> <price>
```

Examples:

- `change price sugar to 150`
- `change price sugar 120 kr do`

**Behaviour for all update commands**

- Finds product by name (case-insensitive).
- Updates only the requested field(s).
- Responds with:

```json
{
  "success": true,
  "type": "productUpdate",
  "message": "Product ... updated successfully via command",
  "data": { "product": { ...updated product... } }
}
```

---

## 4. Reporting / information commands

### 4.1 Todays sales summary

Recognised patterns (case-insensitive, word order flexible):

- `show today sales`
- `today sales`
- `sales today`

**Behaviour**

- Queries all `Sale` documents for **today**.
- Returns count and total amount:

```json
{
  "success": true,
  "type": "summary",
  "message": "Today's sales summary",
  "data": {
    "count": 3,
    "totalEarned": 1500,
    "sales": [ ... ]
  }
}
```

### 4.2 Low-stock products

Recognised patterns:

- `show low stock`
- `low stock`
- `stock kam hai`

**Behaviour**

- Returns all products where `stockQuantity <= lowStockThreshold`.

---

## 5. Error handling and help

If a command cannot be parsed or validated, the backend responds with a **help** payload, for example:

```json
{
  "success": false,
  "type": "help",
  "message": "Could not understand command. Supported examples:",
  "examples": [
    "sell 2 sugar",
    "sell 2 kg sugar to Ali",
    "2 kg sugar bech di",
    "show today sales",
    "show low stock",
    "add product sugar stock 10 price 100",
    "update product sugar price 120",
    "change price sugar to 120"
  ]
}
```

Other error types include:

- `validation` – invalid numbers (negative quantity, zero price, etc.).
- `notFound` – product name not found in database.
- `stock` – not enough stock available.
- `server` – unexpected server error.

---

## 6. Limitations (for report)

- Parsing is **rule-based**, not full NLP; commands must roughly follow the patterns described above.
- Urdu support is limited to simple patterns like `2 kg sugar bech di` and extra Urdu text after structured parts (e.g. `kr do`, `batao`).
- Product lookup is by **name only** and assumes names are unique enough for case-insensitive matching.
- Stock changes via `update product <name> stock <qty>` overwrite the current stock instead of incrementing.

These limitations are acceptable for Phase 1 and can be addressed in later phases using more advanced NLP or additional product identifiers.