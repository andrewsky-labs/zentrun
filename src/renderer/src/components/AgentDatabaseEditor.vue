<template>
  <div class="agent-db-editor">
<!--    <h2>{{ t('agent.database.title', 'Agent Database Editor') }}</h2>-->

    <div class="form-group">
      <label for="table-select">{{ t('agent.database.selectTable', 'Select Table:') }}</label>
      <select
        id="table-select"
        v-model="selectedTable"
        class="select"
        @change="loadTableData"
      >
        <option value="">{{ t('agent.database.selectTablePrompt', 'Select a table...') }}</option>
        <option v-for="table in tables" :key="table" :value="table">{{ table }}</option>
      </select>
    </div>

    <div v-if="error" class="error-message">
      <p>{{ t('agent.database.error', 'Error:') }} {{ error }}</p>
    </div>

    <div v-if="selectedTable && tableData.length > 0" class="results">
      <div class="table-header">
        <h3>{{ t('agent.database.tableData', 'Table Data:') }} {{ selectedTable }}</h3>
        <div class="pagination-controls">
          <button
            @click="prevPage"
            class="button"
            :disabled="currentPage === 1"
          >
            {{ t('agent.database.prevPage', 'Previous') }}
          </button>
          <span class="pagination-info">
            {{ t('agent.database.pageInfo', 'Page {current} of {total}', { current: currentPage, total: totalPages }) }}
          </span>
          <button
            @click="nextPage"
            class="button"
            :disabled="currentPage >= totalPages"
          >
            {{ t('agent.database.nextPage', 'Next') }}
          </button>
          <button
            @click="showAddRowModal = true"
            class="button add-button"
          >
            {{ t('agent.database.addRow', 'Add Row') }}
          </button>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th v-for="column in tableColumns" :key="column">{{ column }}</th>
              <th>{{ t('agent.database.actions', 'Actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in paginatedData" :key="index">
              <td v-for="(value, key) in row" :key="key">
                <template v-if="isExpanded(row, key)">
                  <div class="cell-content-expanded">
                    {{ typeof value === 'object' ? JSON.stringify(value) : value }}
                    <button @click="toggleExpand(row, key)" class="show-more-button">
                      {{ t('agent.database.showLess', 'Show Less') }}
                    </button>
                  </div>
                </template>
                <template v-else>
                  <div class="cell-content-truncated">
                    {{ typeof value === 'object' ? JSON.stringify(value) : value }}
                  </div>
                  <button v-if="shouldShowMoreButton(value)" @click="toggleExpand(row, key)" class="show-more-button">
                    {{ t('agent.database.showMore', 'Show More') }}
                  </button>
                </template>
              </td>
              <td class="actions-cell">
                <button @click="editRow(row)" class="button edit-button">
                  {{ t('agent.database.edit', 'Edit') }}
                </button>
                <button @click="confirmDeleteRow(row)" class="button delete-button">
                  {{ t('agent.database.delete', 'Delete') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit Row Modal -->
    <Dialog :open="showEditModal" @update:open="showEditModal = $event">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('agent.database.editRow', 'Edit Row') }}</DialogTitle>
        </DialogHeader>
        <div class="edit-form">
          <div v-for="(value, key) in editingRow" :key="key" class="form-group">
            <label :for="`edit-${key}`">{{ key }}:</label>
            <input
              :id="`edit-${key}`"
              v-model="editingRow[key]"
              type="text"
              class="input"
            />
          </div>
        </div>
        <DialogFooter>
          <Button @click="saveEditedRow">{{ t('agent.database.save', 'Save') }}</Button>
          <Button variant="outline" @click="showEditModal = false">{{ t('agent.database.cancel', 'Cancel') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Add Row Modal -->
    <Dialog :open="showAddRowModal" @update:open="showAddRowModal = $event">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('agent.database.addRow', 'Add Row') }}</DialogTitle>
        </DialogHeader>
        <div class="edit-form">
          <div v-for="column in tableColumns" :key="column" class="form-group">
            <label :for="`add-${column}`">{{ column }}:</label>
            <input
              :id="`add-${column}`"
              v-model="newRow[column]"
              type="text"
              class="input"
            />
          </div>
        </div>
        <DialogFooter>
          <Button @click="addNewRow">{{ t('agent.database.add', 'Add') }}</Button>
          <Button variant="outline" @click="showAddRowModal = false">{{ t('agent.database.cancel', 'Cancel') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Modal -->
    <Dialog :open="showDeleteModal" @update:open="showDeleteModal = $event">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('agent.database.confirmDelete', 'Confirm Delete') }}</DialogTitle>
        </DialogHeader>
        <div>
          <p>{{ t('agent.database.deleteConfirmMessage', 'Are you sure you want to delete this row? This action cannot be undone.') }}</p>
        </div>
        <DialogFooter>
          <Button @click="deleteRow" variant="destructive">{{ t('agent.database.delete', 'Delete') }}</Button>
          <Button variant="outline" @click="showDeleteModal = false">{{ t('agent.database.cancel', 'Cancel') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePresenter } from '../composables/usePresenter'
import { useToast } from '@/components/ui/toast/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const props = defineProps({
  dbPath: {
    type: String,
    required: true
  }
})

const { t } = useI18n()
const { toast } = useToast()
const genericSQLitePresenter = usePresenter('genericSQLitePresenter')

// State
const tables = ref([])
const selectedTable = ref('')
const tableData = ref([])
const tableColumns = ref([])
const error = ref('')
const isLoading = ref(false)
const currentPage = ref(1)
const rowsPerPage = ref(10)
const showEditModal = ref(false)
const showAddRowModal = ref(false)
const showDeleteModal = ref(false)
const editingRow = ref({})
const newRow = ref({})
const originalRow = ref({})
const rowToDelete = ref({})
const expandedCells = ref(new Map())

// Computed properties
const totalPages = computed(() => {
  return Math.ceil(tableData.value.length / rowsPerPage.value)
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value
  const end = start + rowsPerPage.value
  return tableData.value.slice(start, end)
})

// Load tables when component is mounted
onMounted(async () => {
  await loadTables()
})

// Watch for changes in dbPath
watch(() => props.dbPath, async () => {
  await loadTables()
}, { immediate: true })

// Load tables from the database
async function loadTables() {
  console.log("props.dbPath");
  console.log(props.dbPath);
  if (!props.dbPath) {
    error.value = t('agent.database.noDbPath', 'No database path provided')
    return
  }

  error.value = ''
  isLoading.value = true

  try {
    // Query sqlite_master table to get all tables
    const result = await genericSQLitePresenter.executeQuery(
      props.dbPath,
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )

    tables.value = result.map(row => row.name)

    if (tables.value.length === 0) {
      error.value = t('agent.database.noTables', 'No tables found in the database')
    }
  } catch (err) {
    console.error('Error loading tables:', err)
    error.value = err.message || t('agent.database.loadTablesError', 'An error occurred while loading tables')
    tables.value = []
  } finally {
    isLoading.value = false
  }
}

// Load data from the selected table
async function loadTableData() {
  if (!selectedTable.value) {
    tableData.value = []
    return
  }

  error.value = ''
  isLoading.value = true
  currentPage.value = 1

  try {
    // Get table data
    tableData.value = await genericSQLitePresenter.executeQuery(
      props.dbPath,
      `SELECT * FROM ${selectedTable.value}`
    )

    // Get column names from the first row
    if (tableData.value.length > 0) {
      tableColumns.value = Object.keys(tableData.value[0])
    } else {
      tableColumns.value = []
      // If table is empty, get column names from table info
      const tableInfo = await genericSQLitePresenter.executeQuery(
        props.dbPath,
        `PRAGMA table_info(${selectedTable.value})`
      )
      if (tableInfo.length > 0) {
        tableColumns.value = tableInfo.map(col => col.name)
        // Initialize an empty row with the columns
        const emptyRow = {}
        tableColumns.value.forEach(col => {
          emptyRow[col] = ''
        })
        newRow.value = { ...emptyRow }
      }
    }
  } catch (err) {
    console.error('Error loading table data:', err)
    error.value = err.message || t('agent.database.loadDataError', 'An error occurred while loading table data')
    tableData.value = []
    tableColumns.value = []
  } finally {
    isLoading.value = false
  }
}

// Pagination functions
function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

// Edit row functions
function editRow(row) {
  originalRow.value = { ...row }
  editingRow.value = { ...row }
  showEditModal.value = true
}

async function saveEditedRow() {
  isLoading.value = true
  error.value = ''

  try {
    // Find the primary key column (assuming it's the first column or named 'id')
    const primaryKeyColumn = tableColumns.value[0]
    const primaryKeyValue = originalRow.value[primaryKeyColumn]

    // Build SET clause for UPDATE statement
    const setClauses = []
    const params = []

    for (const [key, value] of Object.entries(editingRow.value)) {
      setClauses.push(`${key} = ?`)
      params.push(value)
    }

    // Add WHERE clause parameter
    params.push(primaryKeyValue)

    // Execute UPDATE query
    const query = `UPDATE ${selectedTable.value} SET ${setClauses.join(', ')} WHERE ${primaryKeyColumn} = ?`
    await genericSQLitePresenter.executeQuery(props.dbPath, query, params)

    // Reload table data
    await loadTableData()

    showEditModal.value = false
    toast({
      title: t('agent.database.rowUpdated', 'Row Updated'),
      description: t('agent.database.rowUpdatedDesc', 'The row has been successfully updated'),
      variant: 'default'
    })
  } catch (err) {
    console.error('Error updating row:', err)
    error.value = err.message || t('agent.database.updateError', 'An error occurred while updating the row')
  } finally {
    isLoading.value = false
  }
}

// Add row functions
function prepareNewRow() {
  const emptyRow = {}
  tableColumns.value.forEach(col => {
    emptyRow[col] = ''
  })
  newRow.value = { ...emptyRow }
}

async function addNewRow() {
  isLoading.value = true
  error.value = ''

  try {
    // Build column names and placeholders for INSERT statement
    const columns = Object.keys(newRow.value)
    const placeholders = columns.map(() => '?')
    const values = columns.map(col => newRow.value[col])

    // Execute INSERT query
    const query = `INSERT INTO ${selectedTable.value} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`
    await genericSQLitePresenter.executeQuery(props.dbPath, query, values)

    // Reload table data
    await loadTableData()

    showAddRowModal.value = false
    toast({
      title: t('agent.database.rowAdded', 'Row Added'),
      description: t('agent.database.rowAddedDesc', 'The new row has been successfully added'),
      variant: 'default'
    })
  } catch (err) {
    console.error('Error adding row:', err)
    error.value = err.message || t('agent.database.addError', 'An error occurred while adding the row')
  } finally {
    isLoading.value = false
  }
}

// Watch for changes in selectedTable to reset pagination
watch(selectedTable, () => {
  currentPage.value = 1
})

// Watch for showAddRowModal to prepare new row
watch(showAddRowModal, (newValue) => {
  if (newValue) {
    prepareNewRow()
  }
})

// Functions for row deletion
function confirmDeleteRow(row) {
  rowToDelete.value = { ...row }
  showDeleteModal.value = true
}

async function deleteRow() {
  isLoading.value = true
  error.value = ''

  try {
    // Find the primary key column (assuming it's the first column or named 'id')
    const primaryKeyColumn = tableColumns.value[0]
    const primaryKeyValue = rowToDelete.value[primaryKeyColumn]

    // Execute DELETE query
    const query = `DELETE FROM ${selectedTable.value} WHERE ${primaryKeyColumn} = ?`
    await genericSQLitePresenter.executeQuery(props.dbPath, query, [primaryKeyValue])

    // Reload table data
    await loadTableData()

    showDeleteModal.value = false
    toast({
      title: t('agent.database.rowDeleted', 'Row Deleted'),
      description: t('agent.database.rowDeletedDesc', 'The row has been successfully deleted'),
      variant: 'default'
    })
  } catch (err) {
    console.error('Error deleting row:', err)
    error.value = err.message || t('agent.database.deleteError', 'An error occurred while deleting the row')
  } finally {
    isLoading.value = false
  }
}

// Functions for text truncation and expansion
function shouldShowMoreButton(value) {
  if (value === null || value === undefined) return false
  const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
  // Check if the content is likely to overflow 2 lines
  // This is a rough estimate - the actual overflow will be handled by CSS
  return stringValue.length > 50
}

function getCellKey(row, key) {
  // Create a unique key for the cell based on row and column
  // Using the primary key (first column) value and the column name
  const primaryKeyColumn = tableColumns.value[0]
  const primaryKeyValue = row[primaryKeyColumn]
  return `${primaryKeyValue}-${key}`
}

function isExpanded(row, key) {
  return expandedCells.value.get(getCellKey(row, key)) === true
}

function toggleExpand(row, key) {
  const cellKey = getCellKey(row, key)
  const currentState = expandedCells.value.get(cellKey) === true
  expandedCells.value.set(cellKey, !currentState)
  // Force reactivity update
  expandedCells.value = new Map(expandedCells.value)
}
</script>

<style scoped>
.agent-db-editor {
  max-width: 100%;
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

.input, .select, .textarea {
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
  margin-right: 5px;
}

.button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.edit-button {
  background-color: #2196F3;
}

.delete-button {
  background-color: #f44336;
  margin-left: 5px;
}

.add-button {
  background-color: #2196F3;
}

.error-message {
  color: red;
  margin-top: 10px;
}

.results {
  margin-top: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.pagination-controls {
  display: flex;
  align-items: center;
}

.pagination-info {
  margin: 0 10px;
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

.actions-cell {
  white-space: nowrap;
}

.edit-form {
  max-height: 400px;
  overflow-y: auto;
}

.cell-content-truncated {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: calc(1.2em * 2); /* Adjust based on your line-height */
  line-height: 1.2em;
}

.cell-content-expanded {
  white-space: pre-wrap;
  word-break: break-word;
}

.show-more-button {
  margin-left: 5px;
  padding: 2px 5px;
  background-color: #2196F3;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 0.8em;
  cursor: pointer;
  color: #fff;
  display: block;
  margin-top: 4px;
}

.show-more-button:hover {
  background-color: #e0e0e0;
}
</style>
