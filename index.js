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
      const container = req.body;
      const {title,subTitle} = req.query;
      const exist = {[title]:{$exists:true}}
      const query = await allProducts.findOne(exist);
      const wrap = {[title]:[{[subTitle]:container}]};

      if(!query){
        await allProducts.insertOne(wrap);
      }else{
        await allProducts.updateOne({_id:new ObjectId(`${query._id}`)},{$push:{[title]:{[subTitle]:container}}});
      }
    })
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port,()=>{
    console.log('working or not')
})