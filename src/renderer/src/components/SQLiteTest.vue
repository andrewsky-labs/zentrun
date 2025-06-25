<template>
  <div class="sqlite-test">
    <h2>SQLite Query Test</h2>

    <div class="form-group">
      <label for="db-path">Database Path:</label>
      <input
        id="db-path"
        v-model="dbPath"
        type="text"
        placeholder="/path/to/your/database.db"
        class="input"
      />
    </div>

    <div class="form-group">
      <label for="query">SQL Query:</label>
      <textarea
        id="query"
        v-model="query"
        placeholder="SELECT * FROM your_table"
        class="textarea"
        rows="4"
      ></textarea>
    </div>

    <div class="form-group">
      <button @click="executeQuery" class="button" :disabled="isLoading">
        {{ isLoading ? 'Executing...' : 'Execute Query' }}
      </button>
    </div>

    <div v-if="error" class="error-message">
      <p>Error: {{ error }}</p>
    </div>

    <div v-if="results.length > 0" class="results">
      <h3>Results:</h3>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th v-for="(_, key) in results[0]" :key="key">{{ key }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in results" :key="index">
              <td v-for="(value, key) in row" :key="key">
                {{ typeof value === 'object' ? JSON.stringify(value) : value }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePresenter } from '../composables/usePresenter'

const genericSQLitePresenter = usePresenter('genericSQLitePresenter')

const dbPath = ref('')
const query = ref('')
const results = ref([])
const error = ref('')
const isLoading = ref(false)

async function executeQuery() {
  if (!dbPath.value || !query.value) {
    error.value = 'Please provide both database path and query'
    return
  }

  error.value = ''
  isLoading.value = true

  try {
    results.value = await genericSQLitePresenter.executeQuery(dbPath.value, query.value)
    console.log('Query results:', results.value)
  } catch (err) {
    console.error('Error executing query:', err)
    error.value = err.message || 'An error occurred while executing the query'
    results.value = []
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.sqlite-test {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.input, .textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  color: red;
  margin-top: 10px;
}

.results {
  margin-top: 20px;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}
</style>
