import { Schema, model } from "mongoose";

const productSchema = new Schema({
    title: { type: String, require: true },
    price: { type: Number, require: true },
    thumbnail: { type: String, require: true },
});

const productModel = model("product", productSchema);

export default productModel;
