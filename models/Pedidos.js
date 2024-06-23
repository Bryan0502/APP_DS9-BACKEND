import mongoose from 'mongoose';

const Schema = mongoose.Schema;

// Definir subesquema para cervezas
const CervezaSchema = new Schema({
  nombre: String,
  tipo: String,
  cantidad: Number,
  // Otros campos relevantes de la cerveza
});

// Definir subesquema para el souvenir (si es necesario)
const SouvenirSchema = new Schema({
  nombre: String,
  descripcion: String,
  precio: Number,
  // Otros campos relevantes del souvenir
});

// Definir subesquema para la dirección
const DireccionSchema = new Schema({
  direccion: String,
  descripcion: String,
  lng: Number,
  lat: Number,
  // Otros campos relevantes de la dirección
});

// Esquema principal para Pedidos
const PedidoSchema = new Schema({
  cervezas: [CervezaSchema], // Array de cervezas usando el subesquema CervezaSchema
  souvenir: SouvenirSchema, // Souvenir usando el subesquema SouvenirSchema
  fechaEnvio: Date,
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario', // Referencia al modelo de usuario
  },
  repartidor: {
    type: Schema.Types.ObjectId,
    ref: 'Repartidor', // Referencia al modelo de repartidor
  },
  direccion: DireccionSchema, // Dirección usando el subesquema DireccionSchema
  estado: {
    type: String,
    enum: ['pendiente', 'en camino', 'entregado'],
    default: 'pendiente',
  },
  evidencia: String,
});

const Pedido = mongoose.model('Pedido', PedidoSchema);

export default Pedido;
