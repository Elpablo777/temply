// Dependencies
import * as mongoose from 'mongoose'

// Validate required environment variables
if (!process.env.MONGO) {
  console.error('ERROR: MONGO environment variable is required')
  process.exit(1)
}

// Connect to mongoose with proper error handling
mongoose.connect(
  process.env.MONGO,
  { 
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  }
).catch((error) => {
  console.error('Failed to connect to MongoDB:', error.message)
  process.exit(1)
})

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.info('Connected to MongoDB successfully')
})

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error.message)
})

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection disconnected')
})

// Export models
export * from './User'
