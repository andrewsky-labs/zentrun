// SQLiteQueryExample.jsx
// This is an example React component that demonstrates how to query SQLite databases
// from React artifacts in Zentrun.

function SQLiteExample() {
  const [results, setResults] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [dbPath, setDbPath] = React.useState("/home/dslabglobal/.config/Zentrun/local_db/temp.db");
  const [query, setQuery] = React.useState("SELECT * FROM your_table LIMIT 10");

  const queryDatabase = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await window.electronAPI.querySQLite(dbPath, query);
      setResults(data);
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Error querying database:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">SQLite Query Example</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Database Path:</label>
        <input
          type="text"
          value={dbPath}
          onChange={(e) => setDbPath(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Path to SQLite database"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">SQL Query:</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-2 border rounded"
          rows="3"
          placeholder="Enter SQL query"
        />
      </div>

      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={queryDatabase}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Execute Query'}
      </button>

      {error && (
        <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Results:</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr>
                  {Object.keys(results[0]).map(key => (
                    <th key={key} className="py-2 px-4 border-b border-gray-300 text-left">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    {Object.values(row).map((value, j) => (
                      <td key={j} className="py-2 px-4 border-b border-gray-300">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Render the component
ReactDOM.render(<SQLiteExample />, document.getElementById('root'));
