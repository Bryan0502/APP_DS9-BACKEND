import User from './models/User.js';
import Pedido from './models/Pedidos.js';
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

app.get('/pedidostodos', async (req, res) => {

  await connectDB()
 const x =  await Pedido.find({})



res.json({data: x });
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
      console.log('Imagen subida con éxito:', snapshot);
  
      // Obtener la URL de descarga de la imagen subida
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('URL de descarga:', downloadURL);
  
      res.status(200).send({ url: downloadURL });
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      res.status(500).send('Error al subir la imagen.');
    }
  });


app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});