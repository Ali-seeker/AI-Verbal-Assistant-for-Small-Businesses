import { useEffect, useRef, useState } from 'react';
import './App.css';

// Prefer env override for deployment; fallback to localhost for development
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

function App() {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/products`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Error loading products', err);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI Verbal Assistant (Phase 1 - Web Dashboard)</h1>
        <p>Simple web-based panel for managing products and sales.</p>
      </header>

      <main className="grid">
        <section>
          <h2>Products</h2>
          <ProductForm onCreated={loadProducts} />
          <ProductList
            products={products}
            loading={productsLoading}
            onRefresh={loadProducts}
          />
          <h3 style={{ marginTop: '1.5rem' }}>Low-stock Products</h3>
          <LowStockList />
        </section>

        <section>
          <h2>Record Sale</h2>
          <SaleForm products={products} onSaleRecorded={loadProducts} />

          <h2 style={{ marginTop: '2rem' }}>Today&apos;s Sales Summary</h2>
          <TodaySales />
        </section>

        <section>
          <h2>Text Command Assistant</h2>
          <TextCommandAssistant />
        </section>
      </main>
    </div>
  );
}

function ProductForm({ onCreated }) {
  const [form, setForm] = useState({
    name: '',
    unit: 'kg',
    stockQuantity: 0,
    pricePerUnit: 0,
    lowStockThreshold: 5,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          stockQuantity: Number(form.stockQuantity),
          pricePerUnit: Number(form.pricePerUnit),
          lowStockThreshold: Number(form.lowStockThreshold),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create product');
      }
      setMessage('Product created successfully');
      setForm({ name: '', unit: 'kg', stockQuantity: 0, pricePerUnit: 0, lowStockThreshold: 5 });
      if (onCreated) onCreated();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3>Add New Product</h3>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Unit
          <input name="unit" value={form.unit} onChange={handleChange} />
        </label>
        <label>
          Stock Quantity
          <input
            type="number"
            name="stockQuantity"
            value={form.stockQuantity}
            onChange={handleChange}
          />
        </label>
        <label>
          Price per Unit
          <input
            type="number"
            name="pricePerUnit"
            value={form.pricePerUnit}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Low Stock Threshold
          <input
            type="number"
            name="lowStockThreshold"
            value={form.lowStockThreshold}
            onChange={handleChange}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Product'}
        </button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
}

function ProductList({ products, loading, onRefresh }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Product List</h3>
        <button onClick={onRefresh} disabled={loading}>
          Refresh
        </button>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : products.length === 0 ? (
        <p>No products yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Unit</th>
              <th>Stock</th>
              <th>Price/Unit</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>{p.unit}</td>
                <td>{p.stockQuantity}</td>
                <td>{p.pricePerUnit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SaleForm({ products, onSaleRecorded }) {
  const [form, setForm] = useState({ productId: '', quantity: 1, customerName: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: form.productId,
          quantity: Number(form.quantity),
          customerName: form.customerName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to record sale');
      }
      setMessage('Sale recorded successfully');
      setForm({ productId: '', quantity: 1, customerName: '' });
      if (onSaleRecorded) onSaleRecorded();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Product
          <select name="productId" value={form.productId} onChange={handleChange} required>
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.stockQuantity} {p.unit} available)
              </option>
            ))}
          </select>
        </label>
        <label>
          Quantity
          <input type="number" name="quantity" value={form.quantity} onChange={handleChange} />
        </label>
        <label>
          Customer Name (optional)
          <input name="customerName" value={form.customerName} onChange={handleChange} />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Record Sale'}
        </button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
}

function LowStockList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/products/low-stock`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to load low-stock products');
      }
      setItems(data);
    } catch (err) {
      console.error('Error loading low-stock products', err);
      setError(err.message || 'Error loading low-stock products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="card" style={{ marginTop: '0.75rem' }}>
      <div className="card-header">
        <h4>Low-stock products</h4>
        <button onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>
      {loading && <p>Loading low-stock products...</p>}
      {error && <p className="message">{error}</p>}
      {!loading && !error && (!items || items.length === 0) && (
        <p>No low-stock products.</p>
      )}
      {!loading && !error && items && items.length > 0 && (
        <ul>
          {items.map((p) => (
            <li key={p._id}>
              {p.name}: {p.stockQuantity} {p.unit}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TodaySales() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sales/today`);
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error('Error loading today sales', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  if (loading) return <div className="card"><p>Loading...</p></div>;

  if (!summary || summary.count === 0) {
    return (
      <div className="card">
        <p>No sales recorded today.</p>
        <button onClick={loadSummary}>Refresh</button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p>Total Sales: {summary.count}</p>
          <p>Total Earned: {summary.totalEarned}</p>
        </div>
        <button onClick={loadSummary}>Refresh</button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Total Price</th>
            <th>Customer</th>
          </tr>
        </thead>
        <tbody>
          {summary.sales.map((s) => (
            <tr key={s._id}>
              <td>{s.product?.name}</td>
              <td>{s.quantity}</td>
              <td>{s.totalPrice}</td>
              <td>{s.customerName || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TextCommandAssistant() {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Phase 2: voice → text via Web Speech API
  const [isListening, setIsListening] = useState(false);
  const [canUseSpeech, setCanUseSpeech] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setCanUseSpeech(true);
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognitionRef.current = recognition;
    } else {
      setCanUseSpeech(false);
    }
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) {
      setSpeechError('Voice input is not supported in this browser.');
      return;
    }

    const recognition = recognitionRef.current;
    setSpeechError('');

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0]?.transcript || '')
        .join(' ')
        .trim();
      if (transcript) {
        setCommand(transcript);
      }
    };

    recognition.onerror = (event) => {
      setSpeechError(event.error || 'Error during speech recognition');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch (err) {
      setSpeechError('Could not start voice recognition.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!command.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/commands/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: command }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setError(data.message || 'Command failed');
        setResult(data);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Network error while executing command');
    } finally {
      setLoading(false);
    }
  };

  const renderResult = () => {
    if (!result) return null;

    if (result.type === 'sale' && result.data) {
      const { product, sale } = result.data;
      return (
        <div>
          <p>{result.message}</p>
          {product && (
            <p>
              Product: {product.name} — Remaining stock: {product.remainingStock}{' '}
              {product.unit}
            </p>
          )}
          {sale && (
            <p>
              Quantity: {sale.quantity}, Total price: {sale.totalPrice}
            </p>
          )}
        </div>
      );
    }

    if (result.type === 'productCreate' && result.data) {
      const { product } = result.data;
      return (
        <div>
          <p>{result.message}</p>
          {product && (
            <p>
              New product: {product.name} — Stock: {product.stockQuantity}{' '}
              {product.unit}, Price per unit: {product.pricePerUnit}, Low-stock threshold:{' '}
              {product.lowStockThreshold}
            </p>
          )}
        </div>
      );
    }

    if (result.type === 'productUpdate' && result.data) {
      const { product } = result.data;
      return (
        <div>
          <p>{result.message}</p>
          {product && (
            <p>
              Product: {product.name} — Stock: {product.stockQuantity}{' '}
              {product.unit}, Price per unit: {product.pricePerUnit}, Low-stock threshold:{' '}
              {product.lowStockThreshold}
            </p>
          )}
        </div>
      );
    }

    if (result.type === 'summary' && result.data) {
      return (
        <div>
          <p>
            Today&apos;s sales: {result.data.count}, Total earned: {result.data.totalEarned}
          </p>
        </div>
      );
    }

    if (result.type === 'lowStock' && result.data) {
      const { products = [] } = result.data;
      if (!products.length) return <p>No low-stock products.</p>;
      return (
        <ul>
          {products.map((p) => (
            <li key={p._id}>
              {p.name}: {p.stockQuantity} {p.unit}
            </li>
          ))}
        </ul>
      );
    }

    if (result.type === 'help') {
      return (
        <div>
          <p>{result.message}</p>
          {Array.isArray(result.examples) && (
            <ul>
              {result.examples.map((ex) => (
                <li key={ex}>{ex}</li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    return <pre>{JSON.stringify(result, null, 2)}</pre>;
  };

  return (
    <div className="card">
      <p className="note">
        Try commands like: "sell 2 sugar", "2 kg sugar bech di", "show today sales",
        "show low stock", "add product sugar stock 10 price 100", or
        "update product sugar price 120".
      </p>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Command
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="e.g. sell 2 sugar to Ali"
          />
        </label>
        <div className="button-row">
          <button type="submit" disabled={loading}>
            {loading ? 'Running...' : 'Run Command'}
          </button>
          {canUseSpeech && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
            >
              {isListening ? 'Stop Voice' : 'Start Voice'}
            </button>
          )}
          {!canUseSpeech && (
            <span className="note">Voice input not supported in this browser.</span>
          )}
        </div>
      </form>
      {error && <p className="message">{error}</p>}
      {speechError && <p className="message">{speechError}</p>}
      {renderResult()}
    </div>
  );
}

export default App;
