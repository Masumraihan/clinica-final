import { Schema } from "mongoose"

export type THealthRecord = {
    user:Schema.Types.ObjectId
    file: string
}