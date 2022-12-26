import { Schema, model } from "mongoose";

const UsuariosSchema = new Schema({
    username: { type: String, require: true, unique: true },
    password: { type: String, require: true },
    correo: { type: String, require: true },
});

export default model("Usuarios", UsuariosSchema);
