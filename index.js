import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3000;
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "book_notes",
  password: "password",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function checkBooks() {
    const result = await db.query("SELECT * FROM books, rating WHERE books.id = rating.id;");
    return result.rows;
};

app.get("/", async (req, res) => {
    const booksData = await checkBooks();
    res.render("index.ejs", {
        books: booksData
    });
    // console.log(booksData);
});

app.get("/add", async (req, res) => {
    res.render("add.ejs");
});

app.post("/add/new", async (req, res) => {
    const result = await db.query("INSERT INTO books (isbn, title, summary, notes, link, date_read) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id", [parseInt(req.body.isbn), req.body.title, req.body.summary, req.body.notes, req.body.link, req.body.date]);
    const id = result.rows[0].id;
    await db.query("INSERT INTO rating VALUES ($1, $2)", [parseInt(id), parseInt(req.body.rating)])
    if (true) {
        await db.query("INSERT INTO books_read (id) VALUES ($1)", [parseInt(id)]);
        console.log("Yes");
    }
    console.log("inserted")
    res.redirect("/");
});

app.get("/edit/:id", async (req, res) => {
    try {
        const iD = req.params.id;
        // console.log(req.params);
        const result = await db.query("SELECT * FROM books, rating WHERE books.id = $1 AND books.id = rating.id", [iD]);
        const bookData = result.rows[0];
        // console.log(bookData);
        res.render("edit.ejs", {
            book: bookData
        });
    } catch (error) {
        console.log(error);
        res.send(error);
    }
});

app.post("/modify/:id", async (req, res) => {
    try {
        const id = req.params.id;
    
        await db.query("UPDATE books SET isbn=$1, title=$2, summary=$3, notes=$4, link=$5, date_read=$6 WHERE id = $7", [parseInt(req.body.isbn), req.body.title, req.body.summary, req.body.notes, req.body.link, new Date(req.body.date), id]);
        await db.query("UPDATE rating SET rating=$1 WHERE id = $2", [req.body.rating, id]);
    
        res.redirect("/");
    } catch (error) {
        console.log(error);
        res.json("Error editing book:");
    }

})

app.get("/buy/:id", async (req, res) => {
    const id = req.params.id;
    const result = await db.query("SELECT link FROM books WHERE id = $1", [id]);
    const link = result.rows[0].link
    // console.log(link);
    res.redirect(link);
    // console.log(typeof(link));
})

app.get("/notes/:id", async (req, res) => {
    const id = req.params.id;
    const result = await db.query("SELECT * FROM books, rating WHERE books.id = $1 AND books.id = rating.id", [id]);
    const bookData = result.rows[0];
    res.render("notes.ejs", {
        book: bookData
    });
});



app.get("/api/:id", async (req, res) => {
    const id = req.params.id;
    const result = await db.query("SELECT isbn from books where id = $1", [id]);
    const isbn = result.rows[0];    

});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });