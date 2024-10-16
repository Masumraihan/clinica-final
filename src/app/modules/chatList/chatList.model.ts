import { model, Schema } from "mongoose";
import { TChatList } from "./chatList.interface";

//const TParticipant = new Schema<TParticipant>({
//    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
//    isActive: { type: Boolean, default: true },
//    isBlocked: { type: Boolean, default: false },
//    isDelete: { type: Boolean, default: false },
//})

const ChatListSchema = new Schema<TChatList>({
  participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

const ChatListModel = model<TChatList>("ChatList", ChatListSchema);
export default ChatListModel;
