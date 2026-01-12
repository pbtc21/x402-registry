/**
 * Frontend HTML for x402 Registry
 */

export function renderHomePage(data: { endpoints: any[]; agents: any[]; stats: any }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>x402 Registry - The App Store for AI Agents</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #e5e5e5;
      min-height: 100vh;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }

    /* Header */
    header {
      text-align: center;
      padding: 3rem 0;
      border-bottom: 1px solid #222;
      margin-bottom: 3rem;
    }
    h1 {
      font-size: 2.5rem;
      background: linear-gradient(135deg, #f7931a, #ff6b00);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .tagline { color: #888; font-size: 1.2rem; }

    /* Stats */
    .stats {
      display: flex;
      justify-content: center;
      gap: 3rem;
      margin: 2rem 0;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #f7931a;
    }
    .stat-label { color: #666; font-size: 0.9rem; }

    /* Sections */
    section { margin-bottom: 3rem; }
    h2 {
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    h2::before {
      content: '';
      width: 4px;
      height: 24px;
      background: #f7931a;
      border-radius: 2px;
    }

    /* Cards */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }
    .card {
      background: #141414;
      border: 1px solid #222;
      border-radius: 12px;
      padding: 1.5rem;
      transition: border-color 0.2s, transform 0.2s;
    }
    .card:hover {
      border-color: #f7931a;
      transform: translateY(-2px);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    .card-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: #fff;
    }
    .card-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      background: #1a1a1a;
      color: #f7931a;
      border: 1px solid #333;
    }
    .card-badge.verified {
      background: #0f2d1a;
      color: #4ade80;
      border-color: #166534;
    }
    .card-description {
      color: #888;
      font-size: 0.9rem;
      line-height: 1.5;
      margin-bottom: 1rem;
    }
    .card-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .tag {
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      background: #1a1a1a;
      border-radius: 4px;
      color: #666;
    }
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid #222;
    }
    .price {
      font-weight: 600;
      color: #f7931a;
    }
    .price span { color: #666; font-weight: normal; }

    /* Capabilities */
    .capabilities {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .capability {
      font-size: 0.75rem;
      padding: 0.3rem 0.6rem;
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border-radius: 4px;
      color: #7dd3fc;
    }

    /* Empty state */
    .empty {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    /* API section */
    .api-info {
      background: #141414;
      border: 1px solid #222;
      border-radius: 12px;
      padding: 2rem;
    }
    .api-info h3 { color: #fff; margin-bottom: 1rem; }
    .endpoint-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 0.5rem;
    }
    .endpoint {
      font-family: monospace;
      font-size: 0.85rem;
      padding: 0.5rem;
      background: #0a0a0a;
      border-radius: 4px;
    }
    .method {
      display: inline-block;
      width: 50px;
      color: #4ade80;
    }
    .method.post { color: #f7931a; }
    .method.delete { color: #ef4444; }
    .path { color: #888; }

    /* Footer */
    footer {
      text-align: center;
      padding: 2rem;
      color: #444;
      border-top: 1px solid #222;
      margin-top: 2rem;
    }
    footer a { color: #f7931a; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>x402 Registry</h1>
      <p class="tagline">The App Store for AI Agents</p>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${data.endpoints.length}</div>
          <div class="stat-label">Endpoints</div>
        </div>
        <div class="stat">
          <div class="stat-value">${data.agents.length}</div>
          <div class="stat-label">Agents</div>
        </div>
        <div class="stat">
          <div class="stat-value">sBTC</div>
          <div class="stat-label">Native Token</div>
        </div>
      </div>
    </header>

    <section>
      <h2>Endpoints</h2>
      ${data.endpoints.length === 0 ? '<div class="empty">No endpoints registered yet</div>' : `
      <div class="grid">
        ${data.endpoints.map(ep => `
        <div class="card">
          <div class="card-header">
            <div class="card-title">${escapeHtml(ep.name)}</div>
            <div class="card-badge ${ep.verified ? 'verified' : ''}">${ep.verified ? 'Verified' : ep.category}</div>
          </div>
          <div class="card-description">${escapeHtml(ep.description)}</div>
          <div class="card-meta">
            ${ep.tags.map((t: string) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
          </div>
          <div class="card-footer">
            <div class="price">${ep.price} <span>${ep.token}</span></div>
            <div style="color: #666; font-size: 0.85rem;">${ep.calls24h} calls/24h</div>
          </div>
        </div>
        `).join('')}
      </div>
      `}
    </section>

    <section>
      <h2>Agents</h2>
      ${data.agents.length === 0 ? '<div class="empty">No agents registered yet</div>' : `
      <div class="grid">
        ${data.agents.map(agent => `
        <div class="card">
          <div class="card-header">
            <div class="card-title">${escapeHtml(agent.name)}</div>
            <div class="card-badge">${agent.pricing.model}</div>
          </div>
          <div class="card-description">${escapeHtml(agent.description)}</div>
          <div class="capabilities">
            ${agent.capabilities.map((c: string) => `<span class="capability">${escapeHtml(c)}</span>`).join('')}
          </div>
          <div class="card-footer">
            <div class="price">${agent.pricing.basePrice} <span>${agent.pricing.token}/call</span></div>
          </div>
        </div>
        `).join('')}
      </div>
      `}
    </section>

    <section>
      <h2>API</h2>
      <div class="api-info">
        <h3>REST API Endpoints</h3>
        <div class="endpoint-list">
          <div class="endpoint"><span class="method">GET</span> <span class="path">/registry/discover</span></div>
          <div class="endpoint"><span class="method">GET</span> <span class="path">/registry/search</span></div>
          <div class="endpoint"><span class="method post">POST</span> <span class="path">/registry/register</span></div>
          <div class="endpoint"><span class="method">GET</span> <span class="path">/agents</span></div>
          <div class="endpoint"><span class="method post">POST</span> <span class="path">/agents/register</span></div>
          <div class="endpoint"><span class="method post">POST</span> <span class="path">/agents/execute</span></div>
          <div class="endpoint"><span class="method post">POST</span> <span class="path">/payments/verify</span></div>
          <div class="endpoint"><span class="method">GET</span> <span class="path">/dev/pricing-calculator</span></div>
        </div>
      </div>
    </section>

    <footer>
      Powered by <a href="https://stacks.co">Stacks</a> &bull;
      <a href="https://github.com/pbtc21/x402-registry">GitHub</a>
    </footer>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderMyEndpointsPage(data: { endpoints: any[]; address: string; stats: any }) {
  const totalCalls = data.endpoints.reduce((sum, ep) => sum + (ep.calls24h || 0), 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Endpoints - x402 Registry</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #e5e5e5;
      min-height: 100vh;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }

    /* Header */
    header {
      text-align: center;
      padding: 2rem 0;
      border-bottom: 1px solid #222;
      margin-bottom: 2rem;
    }
    h1 {
      font-size: 2rem;
      background: linear-gradient(135deg, #f7931a, #ff6b00);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .subtitle { color: #888; font-size: 1rem; }
    .address {
      font-family: monospace;
      font-size: 0.85rem;
      color: #666;
      background: #141414;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      display: inline-block;
      margin-top: 1rem;
      word-break: break-all;
    }

    /* Stats */
    .stats {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin: 1.5rem 0;
      flex-wrap: wrap;
    }
    .stat {
      text-align: center;
      padding: 1rem 1.5rem;
      background: #141414;
      border: 1px solid #222;
      border-radius: 8px;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #f7931a;
    }
    .stat-label { color: #666; font-size: 0.85rem; margin-top: 0.25rem; }

    /* Navigation */
    .nav {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .nav a {
      color: #888;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      transition: all 0.2s;
    }
    .nav a:hover { background: #141414; color: #f7931a; }

    /* Sections */
    section { margin-bottom: 2rem; }
    h2 {
      font-size: 1.3rem;
      margin-bottom: 1rem;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    h2::before {
      content: '';
      width: 4px;
      height: 20px;
      background: #f7931a;
      border-radius: 2px;
    }

    /* Cards */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
    }
    .card {
      background: #141414;
      border: 1px solid #222;
      border-radius: 10px;
      padding: 1.25rem;
      transition: border-color 0.2s;
    }
    .card:hover { border-color: #f7931a; }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }
    .card-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #fff;
    }
    .card-badge {
      font-size: 0.7rem;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      background: #1a1a1a;
      color: #f7931a;
      border: 1px solid #333;
    }
    .card-badge.verified {
      background: #0f2d1a;
      color: #4ade80;
      border-color: #166534;
    }
    .card-description {
      color: #888;
      font-size: 0.85rem;
      line-height: 1.4;
      margin-bottom: 0.75rem;
    }
    .card-url {
      font-family: monospace;
      font-size: 0.75rem;
      color: #666;
      background: #0a0a0a;
      padding: 0.4rem 0.6rem;
      border-radius: 4px;
      margin-bottom: 0.75rem;
      word-break: break-all;
    }
    .card-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 0.75rem;
    }
    .tag {
      font-size: 0.7rem;
      padding: 0.15rem 0.4rem;
      background: #1a1a1a;
      border-radius: 4px;
      color: #666;
    }
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid #222;
    }
    .price {
      font-weight: 600;
      color: #f7931a;
    }
    .price span { color: #666; font-weight: normal; }
    .calls {
      color: #666;
      font-size: 0.8rem;
    }

    /* Empty state */
    .empty {
      text-align: center;
      padding: 3rem;
      color: #666;
    }
    .empty-cta {
      margin-top: 1rem;
    }
    .empty-cta a {
      color: #f7931a;
      text-decoration: none;
    }

    /* Register form hint */
    .register-hint {
      background: #141414;
      border: 1px dashed #333;
      border-radius: 10px;
      padding: 1.5rem;
      text-align: center;
      margin-top: 1rem;
    }
    .register-hint h3 {
      color: #fff;
      margin-bottom: 0.5rem;
    }
    .register-hint p {
      color: #666;
      font-size: 0.9rem;
    }
    .register-hint code {
      display: block;
      margin-top: 1rem;
      background: #0a0a0a;
      padding: 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      color: #4ade80;
      text-align: left;
      overflow-x: auto;
    }

    /* Footer */
    footer {
      text-align: center;
      padding: 1.5rem;
      color: #444;
      border-top: 1px solid #222;
      margin-top: 2rem;
      font-size: 0.9rem;
    }
    footer a { color: #f7931a; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>My Endpoints</h1>
      <p class="subtitle">Your registered x402 services</p>
      <div class="address">${escapeHtml(data.address)}</div>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${data.endpoints.length}</div>
          <div class="stat-label">Endpoints</div>
        </div>
        <div class="stat">
          <div class="stat-value">${totalCalls}</div>
          <div class="stat-label">Calls (24h)</div>
        </div>
        <div class="stat">
          <div class="stat-value">${data.endpoints.filter(e => e.verified).length}</div>
          <div class="stat-label">Verified</div>
        </div>
      </div>
    </header>

    <nav class="nav">
      <a href="/">Browse All</a>
      <a href="/registry/search?owner=${encodeURIComponent(data.address)}">API View</a>
    </nav>

    <section>
      <h2>Registered Endpoints</h2>
      ${data.endpoints.length === 0 ? `
      <div class="empty">
        <p>No endpoints registered yet</p>
        <div class="empty-cta">
          <a href="/registry/register">Register your first endpoint</a>
        </div>
      </div>
      ` : `
      <div class="grid">
        ${data.endpoints.map(ep => `
        <div class="card">
          <div class="card-header">
            <div class="card-title">${escapeHtml(ep.name)}</div>
            <div class="card-badge ${ep.verified ? 'verified' : ''}">${ep.verified ? 'Verified' : ep.category || 'endpoint'}</div>
          </div>
          <div class="card-description">${escapeHtml(ep.description)}</div>
          <div class="card-url">${escapeHtml(ep.url || '')}</div>
          <div class="card-meta">
            ${(ep.tags || []).map((t: string) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
          </div>
          <div class="card-footer">
            <div class="price">${ep.price} <span>${ep.token}</span></div>
            <div class="calls">${ep.calls24h || 0} calls</div>
          </div>
        </div>
        `).join('')}
      </div>
      `}

      ${data.endpoints.length > 0 ? `
      <div class="register-hint">
        <h3>Add Another Endpoint</h3>
        <p>POST to /registry/register with your endpoint details</p>
        <code>curl -X POST ${escapeHtml('https://stacksx402.com/registry/register')} \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://...", "name":"...", "owner":"${escapeHtml(data.address)}"}'</code>
      </div>
      ` : ''}
    </section>

    <footer>
      <a href="/">x402 Registry</a> &bull; Powered by <a href="https://stacks.co">Stacks</a>
    </footer>
  </div>
</body>
</html>`;
}
