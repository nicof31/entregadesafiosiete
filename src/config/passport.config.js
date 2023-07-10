import passport from "passport";
import LocalStrategy from 'passport-local';
import GithubStrategy from 'passport-github2';
import UserModel from "../dao/models/users.model.js";
import {createHashValue, isValidPasswd} from "../utils/encrypt.js"

import { appConfig } from "./config.js";
const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = appConfig;


const initializePassport = () => {

    //LOGIN POR LOCAL 
    passport.use(
        "login",
        new LocalStrategy(
          {
            usernameField: "email",
            passwordField: "password",
          },
          async (email, password, done) => {
            try {
              // Verificar si el usuario existe en la base de datos
              const user = await UserModel.findOne({ email });

              if (!user) {
                return done(null, false, { message: "Credenciales inválidas" });
              }
              // Verificar la contraseña
              const isValidComparePsw = await isValidPasswd(password, user.password);
              if (!isValidComparePsw) {
                return done(null, false, { message: "Credenciales inválidas" });
              }
              return done(null, user);
            } catch (error) {
              return done(error);
            }
          }
        )
      );
    
    //REGISTER POR LOCAL

    passport.use(
        "register",
        new LocalStrategy(
          {
            usernameField: "email",
            passwordField: "password",
            passReqToCallback: true,
          },
          async (req, email, password, done) => {
            try {
              const { first_name, last_name, age, profile_type } = req.body;
    
              // Verificar si el usuario ya existe en la base de datos
              const existingUser = await UserModel.findOne({ email });
              if (existingUser) {
                return done(null, false, { message: "El correo electrónico ya está registrado" });
              }
    
              // Generar hash de la contraseña
              const pswHashed = await createHashValue(password);
             // const hashedPassword = await bcrypt.hash(password, 10);
    
              // Crear el nuevo usuario
              const newUser = await UserModel.create({
                email,
                password,
                first_name,
                last_name,
                age,
                password: pswHashed,
                profile_type,
              });
    
              return done(null, newUser);
            } catch (error) {
              return done(error);
            }
          }
        )
      );

  //RECOVER POR LOCAL
  passport.use(
    "recover-psw",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "new_password",
        passReqToCallback: true,
      },
      async (req, email, new_password, done) => {
        try {
          const existingUser = await UserModel.findOne({ email });
          if (!existingUser) {
            return done(null, false, { message: "El correo electrónico NO está registrado" });
          }
          const newPswHashed = await createHashValue(new_password);
          const updateUser = await UserModel.findByIdAndUpdate(existingUser._id, {
            password: newPswHashed,
          });

          return done(null, updateUser);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

     

    //GITHUB
    passport.use("github", new GithubStrategy({
        clientID: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        callbackURL: "http://localhost:8080/api/session/github/callback",
      }, 
    async (accessToken, refreshToken, profile, done) => {
        console.log("🚀 ~ file: passport.config.js:15 ~ profile:", profile)
        console.log("🚀 ~ file: passport.config.js:16 ~ profile:", profile._json?.email)
        
        try{
            let user = await UserModel.findOne({email: profile._json?.email})
            console.log("🚀 ~ file: passport.config.js:20 ~ user:", user)
            
            if (!user){
                let addNewUser = {
                    first_name: profile._json.name,
                    last_name: "github" ,
                    email: profile._json.email ,
                    age: 19 ,
                    password: "",
                    profile_type: "user",
                }
                let newUser = await UserModel.create(addNewUser);
                done(null,newUser);
            } else {
                //YA EXISTE EL USUARIO
                console.log("ya existe el usario de github")
                done(null, user)
            }
        }catch (error) {
            return done(error)
        }
    })
    );

    
    passport.serializeUser((user, done) => {
        console.log(user._id)
        done(null,user._id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
          let userFind = await UserModel.findById({ _id: id });
            // Creo 'user' con el campo del password ''
          let user = { ...userFind.toObject(), password: '' };
          console.log("🚀 ~ file: passport.config.js:161 ~ passport.deserializeUser ~  user:",  user)
          done(null, user);
        } catch (error) {
          done(error);
        }
      });


}

export default initializePassport