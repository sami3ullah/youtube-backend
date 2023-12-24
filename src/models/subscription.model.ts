import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    // one who is subscribing to the channel
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    // channel is also a user in reality
    channel: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
