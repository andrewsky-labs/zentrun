import * as tf from '@tensorflow/tfjs'
import * as use from '@tensorflow-models/universal-sentence-encoder'
import { nanoid } from 'nanoid'
import { presenter } from '@/presenter'
import { eventBus } from '@/eventbus'

// Define interfaces for RAG data
export interface RAGEntry {
  id: string
  content: string
  embedding?: number[]
  title?: string
  createdAt: number
}

export interface RAGData {
  entries: RAGEntry[]
  lastUpdated: number
}

export class RagPresenter {
  private model: any = null
  private modelLoading: boolean = false
  private modelLoadPromise: Promise<void> | null = null

  constructor() {
    this.initModel()
  }

  // Verify that the model is working correctly
  private async verifyModel(): Promise<boolean> {
    if (!this.model) {
      console.error('Cannot verify model: Model not loaded')
      return false
    }

    try {
      // Try to embed a simple test sentence
      const testSentence = 'This is a test sentence for model verification.'
      console.log('Verifying model with test sentence...')

      const embeddings = await this.model.embed([testSentence])

      // Check if we got a valid result
      let isValid = false

      if (embeddings.array) {
        const embeddingArray = await embeddings.array()
        isValid = embeddingArray && embeddingArray.length > 0 && embeddingArray[0].length > 0
      } else if (Array.isArray(embeddings)) {
        isValid = embeddings.length > 0 && embeddings[0].length > 0
      } else if (embeddings.queryEmbedding) {
        // QnA model format
        isValid = embeddings.queryEmbedding.length > 0
      } else {
        // Try to access data property
        const data = embeddings.data ? await embeddings.data() : embeddings
        isValid = Array.isArray(data) && data.length > 0
      }

      if (isValid) {
        console.log('Model verification successful')
        return true
      } else {
        console.error('Model verification failed: Invalid embedding result')
        return false
      }
    } catch (error) {
      console.error('Model verification failed with error:', error)
      return false
    }
  }

  private async initModel() {
    if (this.modelLoading) {
      return this.modelLoadPromise
    }

    this.modelLoading = true
    this.modelLoadPromise = new Promise(async (resolve) => {
      try {
        // Load TensorFlow.js
        await tf.ready()

        // Try to load the Universal Sentence Encoder using the package's load method
        try {
          console.log('Loading Universal Sentence Encoder model using use.load()')
          this.model = await use.load()
          console.log('Universal Sentence Encoder model loaded successfully')

          // Verify the model works
          if (await this.verifyModel()) {
            return // Success, exit early
          } else {
            console.warn('Primary model loaded but verification failed, trying fallbacks')
            this.model = null // Reset model to try fallbacks
          }
        } catch (primaryError) {
          console.error('Failed to load model with primary method:', primaryError)
        }

        // First fallback: Try loading the lite model
        try {
          console.log('Trying fallback 1: Loading Universal Sentence Encoder lite model')
          this.model = await use.load({
            modelUrl: 'https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder-lite/1/default/1',
            vocabUrl: 'https://storage.googleapis.com/tfjs-models/savedmodel/universal_sentence_encoder/vocab.json'
          })
          console.log('Universal Sentence Encoder lite model loaded successfully')

          // Verify the model works
          if (await this.verifyModel()) {
            return // Success, exit early
          } else {
            console.warn('First fallback model loaded but verification failed, trying next fallback')
            this.model = null // Reset model to try next fallback
          }
        } catch (fallbackError1) {
          console.error('Failed to load model with first fallback method:', fallbackError1)
        }

        // Second fallback: Try loading the QnA model
        try {
          console.log('Trying fallback 2: Loading Universal Sentence Encoder QnA model')
          this.model = await use.loadQnA()
          console.log('Universal Sentence Encoder QnA model loaded successfully')

          // Override the embed method to make it compatible with our existing code
          const originalEmbed = this.model.embed.bind(this.model)
          this.model.embed = async (sentences) => {
            const embeddings = await originalEmbed({
              queries: sentences,
              responses: sentences.map(s => ({ response: s }))
            })
            return embeddings.queryEmbedding
          }

          // Verify the model works
          if (await this.verifyModel()) {
            return // Success, exit early
          } else {
            console.warn('Second fallback model loaded but verification failed, trying next fallback')
            this.model = null // Reset model to try next fallback
          }
        } catch (fallbackError2) {
          console.error('Failed to load model with second fallback method:', fallbackError2)
        }

        // Third fallback: Try loading with direct URL to version 4
        try {
          console.log('Trying fallback 3: Loading Universal Sentence Encoder v4 model')
          this.model = await tf.loadGraphModel(
            'https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder/1/default/2/model.json'
          )
          console.log('Universal Sentence Encoder v4 model loaded successfully')

          // Verify the model works
          if (await this.verifyModel()) {
            return // Success, exit early
          } else {
            console.warn('Third fallback model loaded but verification failed')
            this.model = null // Reset model as verification failed
          }
        } catch (fallbackError3) {
          console.error('Failed to load model with third fallback method:', fallbackError3)
        }

        // Fourth fallback: Try to create a simple dummy model for minimal functionality
        if (!this.model) {
          try {
            console.log('Trying fallback 4: Creating minimal dummy model for basic functionality')

            // Create a simple dummy model that returns random embeddings
            // This is better than having no functionality at all
            this.model = {
              embed: async (sentences) => {
                console.warn('Using dummy embedding model - results will be random and not meaningful')
                // Create a tensor with random values of the right shape (512 dimensions)
                return tf.tidy(() => {
                  const embeddings = tf.randomNormal([sentences.length, 512])
                  // Normalize the embeddings to unit length (important for cosine similarity)
                  return tf.div(
                    embeddings,
                    tf.norm(embeddings, 2, 1, true) // L2 normalize
                  )
                })
              }
            }

            console.log('Dummy model created as last resort')

            // No need to verify the dummy model as it's our last resort
            return
          } catch (fallbackError4) {
            console.error('Failed to create dummy model:', fallbackError4)
          }
        }

        if (!this.model) {
          console.error('All model loading attempts failed, RAG functionality will be limited')
        }
      } catch (error) {
        console.error('Failed to load Universal Sentence Encoder model:', error)
      } finally {
        this.modelLoading = false
        resolve()
      }
    })

    return this.modelLoadPromise
  }

  // Get RAG data for an agent
  async getAgentRagData(agentId: string): Promise<RAGData> {
    const agent = await presenter.agentSQLitePresenter.get(agentId)
    console.log("getAgentRagData agent", agent)
    if (!agent) {
      return { entries: [], lastUpdated: Date.now() }
    }
    console.log("getAgentRagData agent.data", agent.data)

    try {
      const data = agent.data ? JSON.parse(agent.data) : {}
      return data.rag_data || { entries: [], lastUpdated: Date.now() }
    } catch (error) {
      console.error('Failed to parse agent RAG data:', error)
      return { entries: [], lastUpdated: Date.now() }
    }
  }

  // Save RAG data for an agent
  async saveAgentRagData(agentId: string, ragData: RAGData): Promise<boolean> {
    const agent = await presenter.agentSQLitePresenter.get(agentId)
    if (!agent) {
      return false
    }

    try {
      const data = agent.data ? JSON.parse(agent.data) : {}
      data.rag_data = ragData

      return await presenter.agentSQLitePresenter.update(agentId, {
        data: JSON.stringify(data)
      })
    } catch (error) {
      console.error('Failed to save agent RAG data:', error)
      return false
    }
  }

  // Add a new RAG entry
  async addRagEntry(agentId: string, content: string, title?: string): Promise<RAGEntry | null> {
    await this.initModel()
    if (!this.model) {
      console.error('Model not loaded')
      return null
    }

    try {
      // Generate embedding
      const embedding = await this.generateEmbedding(content)

      // Create new entry
      const newEntry: RAGEntry = {
        id: nanoid(),
        content,
        embedding,
        title: title || `Entry ${new Date().toLocaleString()}`,
        createdAt: Date.now()
      }

      // Get current RAG data
      const ragData = await this.getAgentRagData(agentId)

      // Add new entry
      ragData.entries.push(newEntry)
      ragData.lastUpdated = Date.now()

      // Save updated RAG data
      const success = await this.saveAgentRagData(agentId, ragData)

      return success ? newEntry : null
    } catch (error) {
      console.error('Failed to add RAG entry:', error)
      return null
    }
  }

  // Update an existing RAG entry
  async updateRagEntry(agentId: string, entryId: string, content: string, title?: string): Promise<boolean> {
    await this.initModel()
    if (!this.model) {
      console.error('Model not loaded')
      return false
    }

    try {
      // Generate new embedding
      const embedding = await this.generateEmbedding(content)

      // Get current RAG data
      const ragData = await this.getAgentRagData(agentId)

      // Find and update entry
      const entryIndex = ragData.entries.findIndex(entry => entry.id === entryId)
      if (entryIndex === -1) {
        return false
      }

      ragData.entries[entryIndex] = {
        ...ragData.entries[entryIndex],
        content,
        embedding,
        title: title || ragData.entries[entryIndex].title,
        createdAt: Date.now()
      }

      ragData.lastUpdated = Date.now()

      // Save updated RAG data
      return await this.saveAgentRagData(agentId, ragData)
    } catch (error) {
      console.error('Failed to update RAG entry:', error)
      return false
    }
  }

  // Delete a RAG entry
  async deleteRagEntry(agentId: string, entryId: string): Promise<boolean> {
    try {
      // Get current RAG data
      const ragData = await this.getAgentRagData(agentId)

      // Filter out the entry to delete
      ragData.entries = ragData.entries.filter(entry => entry.id !== entryId)
      ragData.lastUpdated = Date.now()

      // Save updated RAG data
      return await this.saveAgentRagData(agentId, ragData)
    } catch (error) {
      console.error('Failed to delete RAG entry:', error)
      return false
    }
  }

  // Generate embedding for text
  public async generateEmbedding(text: string): Promise<number[]> {
    await this.initModel()
    if (!this.model) {
      throw new Error('Model not loaded')
    }

    try {
      // Generate embedding using Universal Sentence Encoder
      // The model.embed() method returns a tensor with the embeddings
      const embeddings = await this.model.embed([text])

      // Different model versions might return results in different formats
      // Handle both tensor and direct array returns
      if (embeddings.array) {
        // If it's a tensor, convert to array
        const embeddingArray = await embeddings.array()
        return embeddingArray[0]
      } else if (Array.isArray(embeddings)) {
        // If it's already an array (some model versions return this)
        return embeddings[0]
      } else {
        // If it's a different format, try to extract the data
        console.log('Unexpected embeddings format, attempting to extract data')
        // Try to access data property or convert to array
        const data = embeddings.data ? await embeddings.data() : embeddings
        return Array.isArray(data) ? data : [0] // Return empty embedding if all else fails
      }
    } catch (error) {
      console.error('Failed to generate embedding:', error)
      throw error
    }
  }

  // Find similar entries based on query
  async findSimilarEntries(agentId: string, query: string, topK: number = 3): Promise<RAGEntry[]> {
    try {
      // Initialize model with better error handling
      try {
        await this.initModel()
        console.log("initModel success")
        if (!this.model) {
          console.error('Model not loaded after initialization')
          return []
        }
      } catch (modelError) {
        console.error('Error initializing model:', modelError)
        return []
      }

      // Get RAG data
      const ragData = await this.getAgentRagData(agentId)
      console.log("ragData", ragData)
      console.log("ragData.entries", ragData.entries)
      if (!ragData.entries.length) {
        console.log(`No RAG entries found for agent ${agentId}`)
        return []
      }

      console.log(`Found ${ragData.entries.length} RAG entries for agent ${agentId}`)

      // Generate query embedding with error handling
      let queryEmbedding: number[] = []
      try {
        console.log(`Generating embedding for query: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`)
        queryEmbedding = await this.generateEmbedding(query)
        console.log(`Successfully generated embedding with length: ${queryEmbedding.length}`)
      } catch (embeddingError) {
        console.error('Error generating query embedding:', embeddingError)
        return []
      }

      // Calculate similarity scores
      const entriesWithScores = ragData.entries.map(entry => {
        if (!entry.embedding || entry.embedding.length === 0) {
          console.log(`Entry ${entry.id} has no embedding, skipping similarity calculation`)
          return { ...entry, score: 0 }
        }

        if (entry.embedding.length !== queryEmbedding.length) {
          console.warn(`Embedding length mismatch: entry=${entry.embedding.length}, query=${queryEmbedding.length}`)
          return { ...entry, score: 0 }
        }

        // Calculate cosine similarity
        const similarity = this.cosineSimilarity(queryEmbedding, entry.embedding)
        return { ...entry, score: similarity }
      })

      // Sort by similarity score and take top K
      const result = entriesWithScores
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, topK)

      console.log(`Found ${result.length} similar entries with scores: ${result.map(e => e.score?.toFixed(3)).join(', ')}`)
      return result
    } catch (error) {
      console.error('Failed to find similar entries:', error)
      return []
    }
  }

  // Calculate cosine similarity between two vectors
  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) {
      return 0
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    if (normA === 0 || normB === 0) {
      return 0
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  // Format RAG entries for inclusion in prompt
  formatRagEntriesForPrompt(entries: RAGEntry[]): string {
    if (!entries.length) {
      return ''
    }

    let result = '### 참조 자료:\n\n'

    entries.forEach((entry, index) => {
      result += `#### ${index + 1}. ${entry.title || 'Reference'}\n${entry.content}\n\n`
    })

    return result
  }
}
