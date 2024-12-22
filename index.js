const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bfkro.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // Books category related apis 
    const booksCategoriesCollection = client.db('BookHaven').collection('BooksCategory');
    const booksCollection = client.db('BookHaven').collection('Books');

    app.get('/booksCategory',async(req,res)=>{
        const cursor = booksCategoriesCollection.find()
        const result = await cursor.toArray();
        res.send(result);
    })


    app.get('/books',async(req,res)=>{
        const cursor = booksCollection.find()
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get ('/books/:id', async(req,res)=>{
        const id = req.params.id
        const query = new ObjectId(id);
        const result = await booksCollection.findOne(query);
        res.send(result);
   })
    


    app.post('/AddBook',async(req,res)=>{
        const books = req.body
        const result = await booksCollection.insertOne(books);
        res.send(result);
       })


  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('BookHaven is available');
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
