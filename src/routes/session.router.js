import { Router } from "express";
import UserModel from "../dao/models/users.model.js";
import UserManager from "../dao/managers/UserManager.js";

import {createHashValue, isValidPasswd} from "../utils/encrypt.js"
import passport from "passport";

const routerSession = Router();
const userManager = new UserManager();



//--------RUTA ALTA USUARIO ---------------
routerSession.post("/register", passport.authenticate('register',{failureRedirect:'/registererror '} ), async (req, res) => {
  try {
    console.log("estoy saliendo por aqui")
    res.redirect('/login');

  } catch (error) {
    console.error("Error en el registro de usuario:", error);
    return res.render("user/registererror", { error: 'Ocurrió un error en el registro de usuario' });
  }
});
 
//--------RUTA INICIO DE SESION----------------

routerSession.post("/login", (req, res, next) => {
  passport.authenticate('login', (err, user, info) => {
    if (err) {
      console.error("Error en la autenticación:", err);
      return res.render("user/loginerror", { error: '(401): Ocurrió un error en la autenticación' });
    }
    if (!user) {
      return res.render("user/loginerror", { error: '(401): Credenciales inválidas' });
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error("Error en la autenticación:", err);
        return res.render("user/loginerror", { error: '(401): Ocurrió un error en la autenticación' });
      }

      req.session.name = `${req.user.first_name} ${req.user.last_name}`;
      req.session.email = req.body.email;
      req.session.rol = req.user.profile_type;
      return res.redirect("/products");
    });
  })(req, res, next);
});


//--------LOG OUT----------------
routerSession.get("/logout", async (req, res) => {
  try {
    req.logout(); 
    req.session.destroy((err) => {
      if (!err) {
        res.redirect("/login");
        res.clearCookie('start-solo');
      }
      else {
        res.render("user/profile", {
          title: "Registro",
          style: "home",
          user: null,
          logued: false,
          error: { message: err, status: true },
        });
      }
    });
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    res.status(500).send({ error: "Ocurrió un error al cerrar sesión" });
  }
});

//--------RECOVER----------------
routerSession.post("/recover-psw", passport.authenticate('recover-psw', { failureRedirect: '/login' }), async (req, res) => {
  try {
    console.log("Contraseña cambiada exitosamente. Inicia sesión con tu nueva contraseña.");
    return res.redirect('/login');
  } catch (error) {
    console.log("🚀 ~ file: session.routes.js:117 ~ router.post ~ error:", error);
  }
});

//--------LOG IN GITHUB---------------

routerSession.get("/github", passport.authenticate("github", { scope: ["user:mail"] }),
  async (req, res) => {}
);
routerSession.get("/github/callback", passport.authenticate("github", { failureRedirect: "/login" }),
  async (req, res) => {
    try {
      const user = req.user
      console.log("🚀 ~ file: session.router.js:91 ~ user:", user)
      req.session.name = `${user.first_name} ${user.last_name}`;
      req.session.email = user.email;
      req.session.rol = user.profile_type;
     
      return res.redirect("/products");
    } catch (error) {
      console.log("🚀 ~ file: session.router.js:148 ~ error:", error);
    }
  }
);




export default routerSession;