const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://library-management-syste-a1fc2.web.app',
        'https://library-management-syste-a1fc2.firebaseapp.com'
    ],
    credentials: true
}));

const logger = (req, res, next) => {
    console.log('inside the logger');
    next();
}

const verifyToken = (req, res, next) => {
    console.log('inside verify token');
    console.log('cok cok cookies: ', req.cookies);
    const token = req?.cookies?.token
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorized access' })
        }
        req.user = decoded;
        next();
    })

}

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
        // await client.connect();
        // Send a ping to confirm a successful connection

        const database = client.db("libraryDB");
        const booksColllection = database.collection("books");
        const borrowColllection = database.collection("borrowedBooks");

        //auth related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.JWT_SECRET, {
                expiresIn: '5h'
            })
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'

                })
                .send({ success: true })
        })

        app.post('/logout', (req, res) => {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
            })
                .send({ success: true })
        })

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
            newBook.quantity = Number(newBook.quantity);
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
                    quantity: Number(updatedBook.quantity),
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


        app.post('/allBooks/:id/borrow', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            try {
                const result = await booksColllection.updateOne(
                    { _id: new ObjectId(id) },
                    { $inc: { quantity: -1 } }
                );
                res.send(result)

            } catch (error) {
                res.status(500).send('Error borrowing book.');
                console.log(error)
            }
        });

        app.post('/borrowed/:title/return', async (req, res) => {
            const title = req.params.title;
            console.log(title)
            try {
                const result = await booksColllection.updateOne(
                    { title: title },
                    { $inc: { quantity: 1 } }
                );
                res.send(result)

            } catch (error) {
                res.status(500).send('Error return book.');
                console.log(error)
            }
        });


        app.get('/borrow', verifyToken, async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            if (req.user.email !== req.query.email) {
                return res.status(403).send({ message: 'Forbiden access' })
            }
            const cursor = borrowColllection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })

        app.delete('/borrow/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await borrowColllection.deleteOne(query);
            res.send(result);
        })

        app.post('/borrow', async (req, res) => {
            // const id = req.params.id;
            // console.log(id);
            // const customBookId = new ObjectId(id); // Replace with your custom ID

            const userInfoWithBook = req.body;
            // userInfoWithBook._id = customBookId;
            console.log(userInfoWithBook)
            const result = await borrowColllection.insertOne(userInfoWithBook)
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
