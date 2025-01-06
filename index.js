const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();

app.use(express.json());
app.use(cors());

const port = process.env.PORT || 5000;


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ebhbc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

        const database = client.db("libraryDB");
        const booksColllection = database.collection("books");

        app.get('/allBooks', async (req, res) => {
            const cursor = booksColllection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/allBooks/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await booksColllection.findOne(query)
            res.send(result)
        })

        app.post('/allBooks', async (req, res) => {
            const newBook = req.body;
            console.log(newBook)
            const result = await booksColllection.insertOne(newBook)
            res.send(result)
        })

        app.put('/allBooks/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const updatedBook = req.body;
            console.log(updatedBook)
            const updatedDocument = {
                $set: {
                    image: updatedBook.image,
                    title: updatedBook.title,
                    quantity: updatedBook.quantity,
                    author: updatedBook.author,
                    category: updatedBook.category,
                    short_description: updatedBook.short_description,
                    rating: updatedBook.rating,
                    book_content: updatedBook.book_content
                }
            }

            const result = await booksColllection.updateOne(query, updatedDocument)
            res.send(result)
        })

        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send(`Book is opening on port ${port}`);
});

app.listen(port, () => {
    console.log(`Book is waiting at port ${port}`);
});
