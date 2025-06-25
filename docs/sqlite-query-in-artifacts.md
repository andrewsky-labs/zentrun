# SQLite Query in Artifacts

This document explains how to use the SQLite query feature in React artifacts within Zentrun.

## Overview

Zentrun now supports querying SQLite databases directly from React artifacts. This feature allows you to:

- Query any SQLite database accessible to the Electron process
- Display query results in your React components
- Build data-driven visualizations and reports

## How It Works

The SQLite query functionality is exposed to React artifacts through the `window.electronAPI.querySQLite` method. This method communicates with the Electron main process, which executes the query using the `better-sqlite3-multiple-ciphers` library.

## API Reference

### `window.electronAPI.querySQLite(dbPath, query, params = [])`

Executes a SQL query on a SQLite database.

**Parameters:**

- `dbPath` (string): The full path to the SQLite database file
- `query` (string): The SQL query to execute
- `params` (array, optional): An array of parameters for the query (for parameterized queries)

**Returns:**

- A Promise that resolves to an array of objects representing the query results

**Example:**

```javascript
// Query a SQLite database
const results = await window.electronAPI.querySQLite(
  "/path/to/database.db",
  "SELECT * FROM users WHERE age > ?",
  [18]
);

// Display the results
console.log(results);
```

## Example Component

Here's a complete example of a React component that queries a SQLite database:

```jsx
function SQLiteExample() {
  const [results, setResults] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [dbPath, setDbPath] = React.useState("/path/to/your/database.db");
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
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">SQL Query:</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-2 border rounded"
          rows="3"
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
```

## Security Considerations

When using the SQLite query feature, keep the following security considerations in mind:

1. **Access Control**: The feature allows access to any SQLite database that the Electron process can access. Be careful about which database paths you expose to users.

2. **SQL Injection**: Always use parameterized queries when dealing with user input to prevent SQL injection attacks.

3. **Data Validation**: Validate and sanitize all user inputs before using them in queries.

## Common Use Cases

- Querying application databases for data visualization
- Building custom reporting tools
- Creating data-driven dashboards
- Analyzing local data without needing a server

## Troubleshooting

If you encounter issues when using the SQLite query feature:

1. **Check the database path**: Make sure the database file exists and is accessible to the Electron process.

2. **Verify the SQL syntax**: Ensure your SQL query is valid for SQLite.

3. **Check the console for errors**: Look for error messages in the browser console that might provide more information.

4. **Database permissions**: Ensure the Electron process has read/write permissions for the database file.
