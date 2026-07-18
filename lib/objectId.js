import { Types } from 'mongoose'

/**
 * Convert a string userId to a Mongoose ObjectId
 * Throws if the string is not a valid ObjectId hex
 */
export function toObjectId(id) {
  return new Types.ObjectId(id)
}
