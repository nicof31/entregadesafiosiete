import { Router } from "express";

const routerCookie = Router();
   
   //----------------------COOKIE---------------------------------//
   routerCookie.get("/", (req, res) => {
    console.log("ENTRO AL GET COOKIES", req.cookies);
    res.json({ cookie: req.cookies });// si quiero escribir el nombre seria res.json({ cookie: req.cookies.nombredelacookie })
    //
  });
  
  routerCookie.post("/create", (req, res) => {
    console.log("BODY****", req.body);
  
    res
      .cookie("cookieUser",
      { user: `${req.body.email}` },
      { maxAge: 200000 })
      .send();
  });
  
  routerCookie.get("/delete", (req, res) => {
    console.log("ENTRO AL DELETE COOKIES*****", req.cookies);
    res.clearCookie("cookieUser").send("cookies reset OK");
  });
export default routerCookie;

