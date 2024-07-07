import User from './models/User.js';
import Shipment from './models/Shipment.js';
import Address from './models/Address.js';
import Beer from './models/Beer.js';
import connectDB from './lib/connectDB.js';
import 'dotenv/config';

import { signInWithEmailAndPassword } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from './lib/firebaseConfig.js';
import multer from 'multer'; 

import express from 'express';

const app = express();
const port = 3000;

// Configurar multer para manejar la subida de archivos
const upload = multer({ storage: multer.memoryStorage() });

// Middleware para parsear JSON
app.use(express.json());

// Middleware para permitir solicitudes de origen cruzado (CORS)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', async (req, res) => {

      await connectDB()
      const x =  await User.find({})


 
    res.json({data: x });
});

app.get('/pedidos/:id', async (req, res) => {

  await connectDB()
  //const x =  await Pedido.find({})
  const userId = req.params.id;
  try {
    const user = await User.findOne({ _id: userId }).populate({
      path: 'shipments',
      populate: [
        { path: 'beers.beer', model: 'Beer' },
        { path: 'user', model: 'User' },
        { path: 'address', model: 'Address' },
      ],
    });

    if (user) {
      res.json(user.shipments);
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.log('Error al cargas los pedidos'); // Solo para verificar que se esté ejecutando correctamente
    console.error('Error fetching user data:', error);
    res.status(500).send('Server error');
  }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body; // Obtener email y password del cuerpo de la solicitud
        if (!email || !password) {
            return res.status(400).json({ message: 'Datos de usuario incompletos' });
        }
  
        console.log('Entra al endpoint /login'); // Solo para verificar que se esté ejecutando correctamente
  
        // Función para validar y autenticar al usuario
        const validateUser = async (email, password) => {
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const userFB = userCredential.user;
                
                // Conectar a la base de datos
                await connectDB();
                
                // Buscar al usuario en la base de datos local
                const user = await User.findOne({ uid: userFB.uid }).exec();
        
                if (!user) {
                    throw new Error('Usuario no encontrado');
                }
        
                // Si el usuario está autenticado y encontrado en la base de datos, devolverlo
                console.log('Usuario Autenticado Correctamente'); // Solo para verificar que se esté ejecutando correctamente
                return user;
            } catch (error) {
                console.error('Error al autenticar usuario:', error.message);
                throw new Error('Email o contraseña incorrectos');
            }
        };
  
        const user = await validateUser(email, password);
        
        res.json({ data: user });
    } catch (error) {
        console.error('Error en la autenticación:', error.message);
        res.status(400).json({ error: error.message });
    }
  });

  app.post('/upload', upload.single('image'), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).send('No se ha subido ningún archivo.');
      }
  
      // Crear una referencia en Firebase Storage
      const storageRef = ref(storage, `images/${file.originalname}`);
  
      // Subir el archivo
      const snapshot = await uploadBytes(storageRef, file.buffer);
  
      // Obtener la URL de descarga de la imagen subida
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('URL de descarga:', downloadURL);
  
      res.status(200).send({ url: downloadURL });
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      res.status(500).send('Error al subir la imagen.');
    }
  });

  app.put('/pedidos/:id', async (req, res) => {
    console.log('Entra al endpoint /pedidos/:id'); // Solo para verificar que se esté ejecutando correctamente
    try {
      const pedidoId = req.params.id;
      const { imagen } = req.body;

      // Validar si se proporcionó una imagen
      if (!imagen) {
        return res.status(400).json({ message: 'Imagen requerida' });
      }

      // Conectar a la base de datos
      await connectDB();

      // Buscar el pedido por su ID
      const pedido = await  Shipment.findById(pedidoId);

      // Verificar si el pedido existe
      if (!pedido) {
        return res.status(404).json({ message: 'Pedido no encontrado' });
      }

      // Actualizar la imagen del pedido
      pedido.evidence = imagen;
      pedido.status = 'completed';
      console.log(pedido); // Solo para verificar que se esté ejecutando correctamente
      await pedido.save();

      res.json({ message: 'Pedido actualizado correctamente' });
    } catch (error) {
      console.error('Error al modificar el pedido:', error);
      res.status(500).json({ message: 'Error al modificar el pedido' });
    }
  });


app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});