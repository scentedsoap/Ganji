const express = require("express");
const app = express (); 
const sessions = require('express-session');
const axios = require('axios');

const { MongoClient, ServerApiVersion } = require('mongodb');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended:false}));
const path = require("path"); 
const PORT = 4000; 


const databaseAndCollection = {db: "final", collection: "members"};

require("dotenv").config({path: path.resolve(__dirname, '.env')})
app.use(sessions({
    secret: process.env.SESSION_SECRET,
    saveUninitialized:true,
    cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true },
    resave: false,
}));
const username = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
const spotify_secret = process.env.SPOTIFY_SECRET;

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs"); 

const uri = `mongodb+srv://${username}:${password}@cluster0.usq26r6.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// Need access token to access any data from the spotify API
let getAccessToken = async (req) => {
    try {
        const { data } = await axios.post('https://accounts.spotify.com/api/token', 
        `grant_type=client_credentials&client_id=${spotify_client_id}&client_secret=${spotify_secret}`, {
            headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
            }});
        
        console.log(`new accesstoken: ${data.access_token}`);
        req.session.accessToken = data.access_token;
    } catch (error) {
        console.log(error);
    }
}


// Handles a get request to the spotify API as long as you provide the request object and the endpoint URI
// Why? Access tokens expire in an hour, so this function was created to avoid repeating the same logic
let spotifyGetRequest = async (req, uri) => {
    // Checks if a current access token is saved in the session
    if (req.session.accessToken == null){
        await getAccessToken(req);
    }
    let data = "";

    // Initial attempt to make the get request
    try {
        data = await axios.get(uri, {
            headers: {
              'Authorization': `Bearer ${req.session.accessToken}` 
            }
          });

    } catch (error) {
        // Potential error if the access token has expired; if so, refresh the token
        if (error.response.data.error.message == 'Invalid access token') {
            await getAccessToken(req);
        }
        try {
            data = await axios.get(uri, {
                headers: {
                  'Authorization': `Bearer ${req.session.accessToken}` 
                }
              });
        } catch (error) {
            // If error persists, just print it out
            console.log(error)
        }
    }
    return data;
}

app.get("/", async (request,response) => {
    // Get's data about the 'Favorites' playlist
    const { data } = await spotifyGetRequest(request,'https://api.spotify.com/v1/playlists/3JTaIFOl8i6Yxses3HXq1q?market=US');
    console.log(data);
    response.render("form", {tracks: data.tracks.items});
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