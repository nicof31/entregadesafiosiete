
import express from "express";
import prodRouter from "./routes/products.js";
import cartRouter from "./routes/carts.js";
import viewsRouter from "./routes/views.router.js";
import __dirname from "./utils.js";
import uploadRouter from "./routes/uploadfiles.router.js";

import handlebars from "express-handlebars";
import { Server } from "socket.io";
import mongoose from "mongoose";
import messagesModel from "./dao/models/messages.model.js";

import { appConfig } from "./config/config.js";
const { NODE_ENV, PORT, DB_URL } = appConfig;
import dotenv from "dotenv";
import conexionBaseDatos from "./db/mongo.config.js";

import cookieParser from "cookie-parser";
import cookiesRouter from "./routes/cookies.router.js";
import sessionRouter from "./routes/session.router.js";

import MongoStore from "connect-mongo";
import displayRoutes from "express-routemap";
import session from "express-session";

import passport from "passport";
import initializePassport from './config/passport.config.js'


const app = express();

//Inicio servidor
const onBaseDb = async () => {
  try {
    conexionBaseDatos();
    dotenv.config();
    } catch (error) {
    console.log(`Base de datos no conectada: ${error}`);
  }
};
onBaseDb();

//Inicio Servidor
const env = NODE_ENV || "development";
const PUERTO = PORT || 8080;
const httpServer = app.listen(PUERTO, () => {
  try {  
  console.log(`El servidor está escuchando en el puerto ${PUERTO}...`);
  configurarRoutes();
  iniciarWebsoket();
  initializePassport();
}catch (error){
  console.log(`Servidor no coenctado: ${error}`);
}
});
const io = new Server(httpServer);

//Configurar routes express
const configurarRoutes = async () => {
  try { 
    console.log("Configuración de rutas correcta...");
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(`${__dirname}/public`));
    app.use(cookieParser());

    app.use(
      session({
        store: MongoStore.create({
          mongoUrl: DB_URL,
          mongoOptions: { useNewUrlParser: true, useUnifiedTopology: true },
          ttl: 15,  //60*3600
        }),
        secret: "coderSecret",
        resave: false, //true
        saveUninitialized: false, //true
      })
    );
    app.use(passport.initialize());
    app.use(passport.session());
       
    app.engine("handlebars", handlebars.engine());
    app.set("views", `${__dirname}/views`);
    app.set("view engine", "handlebars");
    app.use("/", viewsRouter);
    
    app.set("products", `${__dirname}/api`);
    app.set("product engine", "handlebars");
    app.use("/api/products/", prodRouter);
    
    app.use("/api/carts/", cartRouter);
    app.use("/api/upload/", uploadRouter);

    app.use(cookieParser());
    app.use("/api/cookies/", cookiesRouter);

    app.use("/api/session/", sessionRouter);
  
    //detalle de rutas por consola
    //displayRoutes(app);
  }
  catch (error){
    console.log(`No se pudo configurar rutas: ${error}`);
  }
}

//Iniciar websoket
const iniciarWebsoket = async () => {
  try { 
      io.on("connection", (socketClient) => {
      console.log(`Cliente conectado por socket: ${socketClient.id}`);
      socketClient.on("message", (data) => {
        console.log(data);
      });
      socketClient.emit("evento_para_mi_usuario", "Actualización de datos");
      socketClient.broadcast.emit(
        "evento_para_todos_menos_el_actual",
        "Actualización de datos"
      );
      io.emit("evento_para_todos", "Actualización de datos global");
    });
    
    const messages = [];
    io.on("connection", (socket) => {
      console.log("Nuevo cliente conectado");
    
      socket.on("message", (dataM) => {
        messages.push(dataM);
        io.emit("messageLogs", messages);
        //console.log("Creación del producto exitosa");
        const message = new messagesModel(dataM);
        message
          .save()
          .then(() => {
            console.log("Mensaje guardado en la base de datos");
          })
          .catch((error) => {
            console.log(
              "Error al guardar el mensaje en la base de datos: " + error
            );
          });
      });

      socket.on("authenticated", (data) => {
        socket.emit("messageLogs", messages);
        socket.broadcast.emit("newUserConected", data);
      });
    });
  }
  catch (error){
    console.log(`No se pudo inciar websoket: ${error}`);
  }
}

//iniciar aplicación
const start= async () => {
  try{
    onBaseDb();
    configurarRoutes();
    iniciarWebsoket();
  }
    catch(error){
    console.error(`Error al iniciar la aplicación: ${error}`);
    };
    }

export { app, io , start };
