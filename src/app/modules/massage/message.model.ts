import { model, Schema } from "mongoose";
import { TMessage } from "./message.interface";

const messageSchema = new Schema<TMessage>({
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, default: null },
    seen: { type: Boolean, default: false },
    isDelete: { type: Boolean, default: false },
    chat: { type: Schema.Types.ObjectId, ref: "ChatList", required: true },
    file: { type: String, default: null },
}, {
    timestamps: true, 
});

const MessageModel = model<TMessage>("Message", messageSchema);
export default MessageModel