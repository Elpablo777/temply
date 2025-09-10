// Dependencies
import { prop, Typegoose, arrayProp } from 'typegoose'

// Input sanitization function
function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string')
  }
  
  // Remove potentially dangerous HTML/script content
  const sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
  
  // Limit length
  return sanitized.length > maxLength 
    ? sanitized.substring(0, maxLength) 
    : sanitized
}

export class Template {
  @prop({ required: true, index: true })
  name: string
  @prop({ required: true })
  text: string
  
  // Add method to sanitize template data
  sanitize(): void {
    if (this.name) {
      this.name = sanitizeString(this.name, 60)
    }
    if (this.text) {
      this.text = sanitizeString(this.text, 4096)
    }
  }
}

export class User extends Typegoose {
  @prop({ required: true, index: true, unique: true })
  id: number
  @arrayProp({ items: Template, default: [] })
  templates: Template[]

  @prop({ required: true, default: 'en' })
  language: string
  @prop({ required: true, default: false })
  hidePreview: boolean
}

// Get User model
const UserModel = new User().getModelForClass(User, {
  schemaOptions: { timestamps: true },
})

// Get or create user with improved error handling
export async function findUser(id: number) {
  try {
    if (!id || typeof id !== 'number') {
      throw new Error('Invalid user ID provided')
    }
    
    let user = await UserModel.findOne({ id })
    if (!user) {
      try {
        user = await new UserModel({ id }).save()
      } catch (err) {
        // Handle duplicate key error
        if (err.code === 11000) {
          user = await UserModel.findOne({ id })
        } else {
          throw err
        }
      }
    }
    return user
  } catch (error) {
    console.error('Error finding/creating user:', error.message)
    throw error
  }
}
