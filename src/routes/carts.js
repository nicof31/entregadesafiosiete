import cartsManagerMongo from "../dao/managers/cartsManager.mongodb.js";
import cartsModel from "../dao/models/carts.model.js";
import productsModel from "../dao/models/products.model.js";
import { Router } from "express";
const routerCarts = Router();

const cartListMongo = new cartsManagerMongo("src/dao/managers/cartsManager.mongodb.js");

//---------------------GET---------------------
//http://localhost:8080/api/carts/
//http://localhost:8080/api/carts/?limit=2
routerCarts.get("/", async (req, res) => { 
  let cartsFilter = await cartsModel.find();
  try { 
      if (req.query.limit) {
      const cartsFilter = await cartsModel.find().limit(req.query.limit);
      return res.status(200).json({status:"success", message: { cartsFilter }});
    } else {
    return  res.status(200).json({result: "success mongoose", payload: cartsFilter});
    };  
  }
  catch(error){
    console.log("cannot get users with mongoose" + error)
    return res.status(404).json({status:"error",message: `No se puedo obtener productos en BBBD ${error}`});
  };
});
  //---------------------GET POPULATE---------------------
  //http://localhost:8080/api/carts/:cid
  routerCarts.get("/:cid", async (req, res) => { 
    const cartId = req.params.cid;
    try { 
      const cart = await cartsModel.findById(cartId).populate('products.product');
      if (!cart) {
        return res.status(404).json({ message: 'El carrito no existe' });
      } else{
      return  res.status(200).json({result: "success mongoose", payload: cart});
    }  
    }
    catch(error){
      console.log(`No se puedo obtener productos en BBBD ${error}`)
      return res.status(404).json({status:"error",message: `No se puedo obtener productos en BBBD ${error}`});
    };
  });

    //----------BUSQUEDA POR ID---------------------
  //  http://localhost:8080/api/carts/findid/:pid

      routerCarts.get("/findid/:pid", async (req, res) => {
        try{
        const idCarts = req.params.pid;
        const busquedaIdCarts = await cartListMongo.cartById(idCarts)
        if (busquedaIdCarts.length == 0) {
          return res.status(404).json({status:"error",message: "El id de carrito buscado no existe, cargue un nuevo id"});
        }
        return res.status(200).json({status:"success, el id buscado es:",message:{ busquedaIdCarts }});
      } catch (error) {
        console.log(`No se puede procesar la peticion GET '${error}'`);
        return res.status(404).json({status:"error",message: `No se puede procesar la peticion GET '${error}'`});
      };
      });

//---------------------POST ADD CARTS ---------------------
      //-------AGREGAR PRODCUTO AL CARRITO POR BOTON HTML
      //http://localhost:8080/api/carts/crearcarts/:idProducto
routerCarts.post("/crearcarts/:idProducto", async (req, res) => {
  try{
    const idCart = 1;
    const idProductsCart = req.params.idProducto;
    await cartListMongo.addCarts(idCart, idProductsCart)
    return res.status(200).json({ status: "success, Carts created", message: {} });
  }
  catch(error){
    return res.status(404).json({status:"error",message: `No se puede procesar la peticion POST '${error}'`});
  };
  });
  
            //---AGREGAR UN NUEVO PRODUCTO AL CARRITO  / INCREMENT QUANTITY---
  //http://localhost:8080/api/carts/crearcarts/:cid/products/:pid
  routerCarts.post("/crearcarts/:cid/products/:pid", async (req, res) => {
    try {
      const idCart = req.params.cid;
      const idProductsCart = req.params.pid;
      //busco id de carts si existe en carts
      const cartSearch = await cartsModel.find();
      const searchIdCart = cartSearch.find(({ _id }) => _id == idCart);
      console.log(searchIdCart)
      const findCartIdProduct = await productsModel.find();
      const idFindCartProduct = findCartIdProduct.find(({ _id }) => _id == idProductsCart);
        if(!idFindCartProduct){
          console.log(`id product id: ${idProductsCart} no existe`);
          return res.status(404).json({
            status: "error",
            message:
              "El id producto buscado no existe en bbdd, cargue un nuevo id producto",
          });
        } else {
          if (idCart > 0) {
                if(!searchIdCart) {
                  await cartListMongo.addCarts(idCart, idProductsCart);
                  return res.status(200).json({ status: "success, Carts created", message: {} });
                } else {
                  await cartListMongo.addCarts(idCart, idProductsCart);
                  return res.status(200).json({
                     status:
                       "success, el id carts existe en base y se puede agregar el producto",
                     message: {},
                   });
                } 
          }  else {
            return res.status(409).json({
              status: "error",
              message: "Ingrese un ID carts numerico mayor a 0",
            });
          };  
          }
    }
    catch(error){
    };
  });

        //---------------------POST DISCONUNT QUANTITY CARTS---------------------
//http://localhost:8080/api/carts/deletequantitycarts/:cid/products/:pid
routerCarts.post("/deletequantitycarts/:cid/products/:pid", async (req, res) => {
  const idCartQuan = req.params.cid;
  const idProductsCartQuan = req.params.pid;
  //busco id de carts si existe en carts.json
  const cartSearchQuan = await cartsModel.find();
  const searchIdCartQuan = cartSearchQuan.find(({ _id }) => _id == idCartQuan);
  if (!searchIdCartQuan) {
    return res.status(404).json({status:"error",message: `El  carrito _id: ${idCartQuan} buscado no existe, cargue un nuevo id`});
  } else {
    //busco si el producto existe en el carrito
    const quanProductCart = searchIdCartQuan.products;
    const quanFilteredProduct = quanProductCart.find(({ product }) => product == idProductsCartQuan);
    if (!quanFilteredProduct) {
      return res.status(404).json({status:"error",message: `El producto _id:'${idProductsCartQuan}' buscado no existe, cargue un nuevo id`});
    } else { 
      const quanRta = quanFilteredProduct.quantity;
      const quanVerif = 1;
        if (quanRta > quanVerif) {
          await cartListMongo.discountQuantityPro(
            idCartQuan,
            idProductsCartQuan,
            quanRta
          );
          return res.status(200).json({
            status:
              "success, el id producto en carts existe en base y se puede descontar cantidad",
            message: {},
          });
        } else {
          return res.status(409).json({
            status: "error",
            message:
              "La cantidad de producto en carrito es = 1, no se puede descontar mas cantidad",
          });
        }; 
    }
  }
  });

//---------------------PUT MODIFICAR CANTIDAD---------------------
  // http://localhost:8080/api/carts/:cid/products/:pid
routerCarts.put("/:cid/products/:pid", async (req, res) => { 
  try {
  const idCartUpd = req.params.cid;
  const idProdUpd = req.params.pid;  
  const updateQuanityPut = req.body;
 //busco id de carts si existe en carts en base
 const cartSearchUpd = await cartsModel.find();
 const searchIdCartUpd = cartSearchUpd.find(({ _id }) => _id == idCartUpd);
 if (!searchIdCartUpd) {
   return res.status(404).json({status:"error",message: `El  carrito _id: ${idCartUpd} buscado no existe, cargue un nuevo id`});
  } else {
          //busco si el producto existe en el carrito
          const upProductCart = searchIdCartUpd.products;
          const upFilteredProduct = upProductCart .find(({ product }) => product ==  idProdUpd);
          if (!upFilteredProduct) {
            return res.status(404).json({status:"error",message: `El producto _id:'${idProdUpd}' buscado no existe en cart _id:'${idCartUpd}', cargue un nuevo id de producto`});
          } else { 
          await cartListMongo.updateQuantyCarts(idCartUpd,idProdUpd,updateQuanityPut);
          return res.status(200).json({
            status: "success",
            message: `El producto _id: ${idProdUpd} en el carrito _id: ${idCartUpd} se modifico cantidad correctamente`,
          })
        }
      }
  } catch (error) {
    console.log(`No se puede procesar la peticion PUT '${error}'`);
    return res.status(404).json({status:"error",message: `No se puede procesar la peticion PUT '${error}'`});
  }
});

    //---------------------PUT MODIFICAR COMPLETO---------------------
// http://localhost:8080/api/carts/:cid
routerCarts.put("/:cid", async (req, res) => { 
  try {
  const idCartUpd = req.params.cid;
  const updateProductPut = req.body;
 //busco id de carts si existe en carts en base
 const cartSearchUpd = await cartsModel.find();
 const searchIdCartUpd = cartSearchUpd.find(({ _id }) => _id == idCartUpd);
 if (!searchIdCartUpd) {
   return res.status(404).json({status:"error",message: `El  carrito _id: ${idCartUpd} buscado no existe, cargue un nuevo id`});
  } else {
    await cartListMongo.updateProductsCarts(idCartUpd,updateProductPut);
    return res.status(200).json({
      status: "success",
      message: `Se agregaron todos los productos en el carrito _id: ${idCartUpd} y se actualizo correctamente`,
    })    
      }
  } catch (error) {
    console.log(`No se puede procesar la peticion PUT '${error}'`);
    return res.status(404).json({status:"error",message: `No se puede procesar la peticion PUT '${error}'`});
  }
});

//---------------------DELETE PRODUCTO DEL CARRITO---------------------
// http://localhost:8080/api/carts/:cid/products/:pid
routerCarts.delete("/:cid/products/:pid", async (req, res) => {
  const idCartDelete = req.params.cid;
  const idProductsCartDelete = req.params.pid;
  // Busco id de carts si existe en carts.json
  const cartSearchDelete = await cartsModel.find();
  const searchIdCartDelete = cartSearchDelete.find(({ _id }) => _id == idCartDelete );
  if (!searchIdCartDelete) {
    return res.status(404).json({ status: "error", message: `El carrito _id: ${idCartDelete} buscado no existe, cargue un nuevo id` });
  } else {
    // Busco si el producto existe en el carrito
    const deleteProductCart = searchIdCartDelete.products;
    const deleteFilteredProduct = deleteProductCart.find(({ product }) => product == idProductsCartDelete);
    if (!deleteFilteredProduct) {
      console.log("El producto buscado no existe en el carrito");
      return res.status(404).json({ status: "error", message: `El producto _id:'${idProductsCartDelete}' buscado no existe, cargue un nuevo id` });
    } else {
      await cartListMongo.deleteProductCarts(idCartDelete,idProductsCartDelete);
      console.log("El producto buscado existe en el carrito y se puede eliminar");
       return res.status(200).json({
        status: "success",
        message: `El producto _id: ${idProductsCartDelete} en el carrito _id: ${idCartDelete} se eliminó correctamente`,
      });
    }
  }
});

//---------------------DELETE TODOS LOS PRODUCTOS DEL CARRITO---------------------
// http://localhost:8080/api/carts/:cid
routerCarts.delete("/:cid", async (req, res) => {
  const idCartDelete = req.params.cid;
  // Busco id de carts si existe en base datos
  const cartSearchDelete = await cartsModel.find();
  const searchIdCartDelete = cartSearchDelete.find(({ _id }) => _id == idCartDelete );
  if (!searchIdCartDelete) {
    return res.status(404).json({ status: "error", message: `El carrito _id: ${idCartDelete} buscado no existe, cargue un nuevo id` });
  } else {
      await cartListMongo.deleteAllProductsCarts(idCartDelete);
       return res.status(200).json({
        status: "success",
        message: `Los todos los productos del carrito _id: ${idCartDelete} se eliminaron correctamente`,
      });
    }
});







export default routerCarts;
