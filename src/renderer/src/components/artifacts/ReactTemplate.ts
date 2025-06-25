export const formatTemplate = (title: string, reactCode: string) => {
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="deepcdn://react.production.min.js"></script>
    <script src="deepcdn://react-dom.production.min.js"></script>
    <script src="deepcdn://babel.min.js"></script>
    <script src="deepcdn://lucide.js"></script>
    <script src="deepcdn://prop-types.min.js"></script>
    <script src="deepcdn://Recharts.js"></script>
    <link
      href="deepcdn://tailwind.min.css"
      rel="stylesheet"
    />
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html, body {
        height: 100%;
        font-family: Arial, sans-serif;
      }
      img {
        max-width: 100%;
        height: auto;
      }
      a {
        text-decoration: none;
        color: inherit;
      }
    </style>
    <script>
      // Expose SQLite query function to React code
      window.electronAPI = {
        querySQLite: async (dbPath, query, params = []) => {
          try {
            return await window.parent.api.querySQLite(dbPath, query, params);
          } catch (error) {
            console.error('SQLite query error:', error);
            throw error;
          }
        }
      };
    </script>
  </head>
  <body>
     <div id="root"></div>
    <script type="text/babel">
     ${reactCode}
    </script>
  </body>
</html>`
}
