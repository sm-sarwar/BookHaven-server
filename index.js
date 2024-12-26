const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;


const corsOptions = {
  origin: ['http://localhost:5173','https://book-haven-95434.web.app','https://book-haven-95434.firebaseapp.com'],
  credentials: true,
  optionalSuccessStatus : 200,
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bfkro.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


// verify token
const verifyToken = (req, res,next) => {
  const token = req.cookies?.token
  if (!token) return res.status(401).send({ error: "Unauthorized access" });
  jwt.verify(token,process.env.SECRET_KEY,(err,decoded)=>{
    if(err) {
      return res.status(403).send({ error: "Invalid token" });
    }
    req.user = decoded
  })
  // console.log(token)

  next()
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // Books category related apis
    const booksCategoriesCollection = client
      .db("BookHaven")
      .collection("BooksCategory");
    const booksCollection = client.db("BookHaven").collection("Books");
    const borrowBooksCollection = client
      .db("BookHaven")
      .collection("borrowBooks");



    // jwt authorization
    app.post("/jwt", async (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.SECRET_KEY, {
        expiresIn: "365d",
      });
      console.log(token);
      res.cookie('token',token,{
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production'? "none" : "strict",  
      }).send({success:true});
    });

    //  token cleanup
    app.get('/logout', async (req, res) => {
      res.clearCookie('token',{
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production'? "none" : "strict",  
      }).send({success:true});
    })


    app.get("/booksCategory", async (req, res) => {
      const cursor = booksCategoriesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/books", async (req, res) => {
      const cursor = booksCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    
    // all books
    app.get("/book/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.findOne(query);
      res.send(result);
    });


    // update books
    app.put("/book/:id", async (req, res) => {
      const id = req.params.id;
      const book = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedBook = {
        $set: {
          name: book.name,
          category: book.category,
          image: book.image,
          author: book.author,
          rating: book.rating,
        },
      };
      const result = await booksCollection.updateOne(
        filter,
        updatedBook,
        options
      );
      res.send(result);
    });


    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      const query = new ObjectId(id);
      const result = await booksCollection.findOne(query);
      res.send(result);
    });

    // borrowed pages data
    app.get("/borrowBooks", verifyToken,async (req, res) => {
      const decodedEmail = req.user?.email
      const email = req.query.email;
      const query = { userEmail: email };

      // console.log('decoded email',decodedEmail);
      // console.log('email from query',email);

    if(decodedEmail !== email) return res.status(401).send({ error: "Unauthorized access" });

      const result = await borrowBooksCollection.find(query).toArray();
      for (const books of result) {
    
        const query1 = { _id: new ObjectId(books.bookId) };
        const book = await booksCollection.findOne(query1);
        if (book) {
          books.name = book.name;
          books.category = book.category;
          books.image = book.image;
        }
      }
      res.send(result);
    });

    app.post("/AddBook", async (req, res) => {
      const books = req.body;
      const result = await booksCollection.insertOne(books);
      res.send(result);
    });

    //  Borrow books related apis
    app.post("/borrowBooks", async (req, res) => {
      const borrowBooks = req.body;
      const { bookId, userEmail } = borrowBooks;

      const existingBorrow = await borrowBooksCollection.findOne({
        bookId: bookId,
        userEmail: userEmail,
      });

      if (existingBorrow) {
        return res.status(400).send({
          error:
            "You have already borrowed this book. Please return it before borrowing again.",
        });
      }

      const decrementResult = await booksCollection.updateOne(
        { _id: new ObjectId(bookId) },
        { $inc: { quantity: -1 } }
      );
      const result = await borrowBooksCollection.insertOne(borrowBooks);
      res.send(result);
    });

    app.delete("/book/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const bookId = req.query.bookId;

      const incrementResult = await booksCollection.updateOne(
        { _id: new ObjectId(bookId) },
        { $inc: { quantity: 1 } }
      );
      const result = await borrowBooksCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("BookHaven is available");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
