const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sqywi72.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const app = express();
const port= 3000;

app.use(cors());
app.use(express.json());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    const database = client.db("e-commerce");
    const userInfo = database.collection("userInfo");
    const allProducts=database.collection("allProducts");

    // create new account
    app.post('/createNewAccount', async(req,res)=>{
        const container = req.body;
        const result = await userInfo.insertOne(container);
    })
    // get user info
    app.get('/userInfo',async (req,res)=>{
      const container = req.query.email;
      const query = {email:container};
      const option={
        projection:{_id:0,type:1}
      }

      const result = await userInfo.findOne(query,option);

      res.send(result);
    })
    // add new products
    app.post('/addNewProduct', async(req,res)=>{
      const {title} = req.query;
      const container = req.body;
      const docs = {[title]:[container]};
      const checkExisting = await allProducts.findOne({[title]:{$exists:true,$ne:null}},{projection:{[title]:0}})
      // const result = await allProducts.insertOne(docs);

      if(checkExisting){
        const trackId = checkExisting;
        
        await allProducts.updateOne({_id:trackId["_id"]},{$push:{[title]:container}})

        res.send().status(200)
      }else{
        await allProducts.insertOne(docs);

        res.send().status(200)
      }
    })
    // retrieve all products info
    app.get('/allProductsInfo', async (req,res)=>{
      const result = await allProducts.find().toArray();

      res.send(result);
    })
    // retrieve specific product info for editForm
    app.get('/specificProduct',async (req,res)=>{
      const {trackId,title,sku} = req.query;
      const result = await allProducts.aggregate([
        {$match:{_id:new ObjectId(`${trackId}`)}},
        {$project:{
          [title]:{
            $filter:{
              input:`$${title}`,
              as: "item",
              cond:{$eq:["$$item.sku",sku]}
            }
          }
        }}
      ]).toArray()

      res.send(result[0][title])
    })
    // update a products info
    app.put('/updateProductsInfo', async (req,res)=>{
      const {title,sku,trackId} = req.query;
      const container = req.body;
      const filter = {_id:new ObjectId(`${trackId}`)};
      const updateDoc = [
        {$set:{
          [title]:{
            $map:{
              input:`$${title}`,
              as:"items",
              in:{$cond:[{$eq:["$$items.sku",sku]},container,"$$items"]}
            }
          }
        }}
      ]
      const result = await allProducts.updateOne(filter,updateDoc);

      res.send().status(200);
    })
    // remove a items
    
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port,()=>{
    console.log('working or not')
})