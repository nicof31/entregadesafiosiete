
import productManager from "../dao/managers/productManager.js";
const productList = new productManager("src/files/products.json");

import productManagerMongo from "../dao/managers/productManager.mongodb.js";
import productsModel from "../dao/models/products.model.js";
import mongoosePaginate from 'mongoose-paginate-v2';
const productListMongo = new productManagerMongo("src/dao/managers/productManager.mongodb.js");

import { Router } from "express";
import { io } from '../app.js';

import UserManager from "../dao/managers/UserManager.js";
import { sessionExist, auth } from "../middleware/usersession.js";
import session from "express-session";

//import FileStore from "session-file-store";
import MongoStore from "connect-mongo";

import { appConfig } from "../config/config.js";
const { NODE_ENV, PORT, DB_URL } = appConfig;

import UserModel from "../dao/models/users.model.js";

import passport from "passport";

const routerView = Router();



   //-----------------------CHAT Handlebars---------------------------------//
   //http://localhost:8080/chat
   routerView.get("/chat", async (req, res) => {
    const chat = "prueba chat web soket"
       return res.render('chat',{
        chat});
   });
  

//-------------------------LOGIN USER------------------------------------------//

routerView.get("/", sessionExist, async (req, res) => {
  try {
    res.render("user/login", {
      title: "Login",
      style: "home",
      logued: false,
    });
  } catch (error) {
    console.error("Error al renderizar la página de inicio:", error);
    return res.render("user/loginerror", { error: "Ocurrió un error al renderizar la página de inicio" });
  }
});

routerView.get("/login", sessionExist, async (req, res) => {
  try {
    res.render("user/login", {
      title: "Login",
      style: "home",
      logued: false,
    });
  } catch (error) {
    console.error("Error al renderizar la página de login:", error);
    return res.render("user/loginerror", { error: "Ocurrió un error al renderizar la página de login" });
  }
});


  //-------------------------DATOS DE LA SESION EN MONGO------------------------------------------//
  routerView.get('/session-data', (req, res) => {
    try {
      const user = {
        first_name: req.session.name,
        last_name: '', 
        email: req.session.email,
        age: '', 
        rol: req.session.rol,
      };
  
      res.json({ user });
    } catch (error) {
      console.error("Error al obtener los datos de sesión:", error);
      res.status(500).json({ error: "Ocurrió un error al obtener los datos de sesión" });
    }
  });


  //-------------------------LOG OUT------------------------------------------//
  
  routerView.get('/logout', (req, res) => {
    try {
      req.session.destroy();
      res.redirect('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      res.status(500).send({ error: "Ocurrió un error al cerrar sesión" });
    }
  });

   //---------------------PRODUCTS LOGIN-------------------------------//
 
 //http://localhost:8080/products

  routerView.get("/products",auth,  async (req, res) => {
  try {
    const limitDefault = 10;
    const pageDefault = 1;
    
    //const findPage = parseInt(req.params.ppg) || parseInt(pageDefault); 
    const findPage = parseInt(req.query.page) || parseInt(pageDefault);
    const findLimit = parseInt(req.query.limit) || parseInt(limitDefault); 
    const sortOrder = req.query.sort == 'desc' ? -1 : 1;
    const queryCategory = req.query.category;
    const queryId =  parseInt(req.query.id);

    //Busco por categoria
    const findCategory = {}; 
    if (queryCategory) {
      findCategory.category = queryCategory;
    };
    // Busco por _id 
    if (queryId) {
      findCategory._id = queryId;
    };
    //Parametros de filtro
    const findBdProd = {
      page: findPage,
      limit: findLimit,
      sort: { price: sortOrder },
      lean: true
    };

    const productsPagination = await productsModel.paginate(findCategory, findBdProd);

    //le paso a respuesta de products los link
    productsPagination.prevLink = productsPagination.hasPrevPage === true
        ? `http://localhost:8080/products/?page=${productsPagination.prevPage}&limit=5&sort=&category=&id=`
        : null;

    productsPagination.nextLink = productsPagination.hasNextPage === true
      ? `http://localhost:8080/products/?page=${productsPagination.nextPage}&limit=5&sort=&category=&id=`
      : null;

    productsPagination.isValid= !(findPage<=0||findPage> productsPagination.totalPages)

    //Renderizo respuesta
    res.render('products', productsPagination);
   
  } catch(error) {
    console.log(`Error al realizar la búsqueda paginada: ${error}`);

    return res.status(404).json({status:"error",message: `Error al realizar la búsqueda paginada en BBBD ${error}`});
  }
});

   //---------------------PROFILE-------------------------------//

routerView.get("/profile", auth, async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.session.email }).select("-password");
        if (!user) {
      return res.status(404).json({ status: "error", message: "Usuario no encontrado" });
    }
        res.render("user/profile", { user });
  } catch (error) {
    console.error("Error al obtener los datos de perfil del usuario:", error);
    return res.status(500).json({ status: "error", message: "Error al obtener los datos de perfil del usuario" });
  }
});

   //---------------------REGISTER-------------------------------//
//routerView.get("/register", auth, async (req, res) => {
routerView.get("/register",  async (req, res) => {
  try {
    res.render("user/register", {
      title: "Registro",
      style: "home",
      logued: false,
    });
  } catch (error) {
    console.error("Error al renderizar el formulario de registro:", error);
    res.status(500).send({ error: "Ocurrió un error al mostrar el formulario de registro" });
  }
});


   //---------------------RECOVER-------------------------------//
routerView.get("/recover", async (req, res) => {
  res.render("user/recover");
})



export default routerView;

