const express = require("express");
const app = express (); 
const { MongoClient, ServerApiVersion } = require('mongodb');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended:false}));
const path = require("path"); 
const PORT = 4000; 

const databaseAndCollection = {db: "final", collection: "members"};

require("dotenv").config({path: path.resolve(__dirname, '.env')})
const username = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs"); 

const uri = `mongodb+srv://${username}:${password}@cluster0.usq26r6.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.get("/", (request,response) => {
    response.render("form");
});

app.post("/memberInfo", (request,response) => {
    (async () => {

        await client.connect();
        let n = request.body.name;
        let e = request.body.email;
        let c = request.body.comments;

        const info = {
            name : n,
            email: e,
            comments: c
        };
    

        await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne({name:n,email:e,comments:c});
        response.render("postForm", info); 
        await client.close();

    })();
});

app.listen(PORT, () => {
    console.log(`Web server started and running at http://localhost:${PORT}`);
})