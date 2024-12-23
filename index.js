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
    const borrowBooksCollection = client.db('BookHaven').collection('borrowBooks');

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

    app.get('/book/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await booksCollection.findOne(query);
      res.send(result);
    })


    app.put('/book/:id',async(req,res)=>{
      const id = req.params.id;
      const book = req.body
      const filter = {_id: new ObjectId(id)}
      const options = {upsert:true}
      const updatedBook = {
        $set:{
          name: book.name,
          category: book.category,
          image: book.image,
          author: book.author,
          rating: book.rating,
        }
      }
      const result = await booksCollection.updateOne(filter,updatedBook,options);
      res.send(result)
    })

    app.get ('/books/:id', async(req,res)=>{
        const id = req.params.id
        const query = new ObjectId(id);
        const result = await booksCollection.findOne(query);
        res.send(result);
   })

   
   app.get('/borrowBooks',async(req,res)=>{
    const email = req.query.email;
    const query = {userEmail: email}
    const result = await borrowBooksCollection.find(query).toArray();
    for(const books of result)
      {
        // console.log(application.job_id)
        const query1 = {_id: new ObjectId(books.bookId)}
        const book = await booksCollection.findOne(query1);
        if(book){
          books.name = book.name;
          books.category = book.category;
          books.image = book.image;
        }
      }
    res.send(result);
   })


    app.post('/AddBook',async(req,res)=>{
        const books = req.body
        const result = await booksCollection.insertOne(books);
        res.send(result);
       })

      //  Borrow books related apis 
      app.post('/borrowBooks',async(req,res)=>{
        const borrowBooks = req.body
        const result = await borrowBooksCollection.insertOne(borrowBooks);
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
