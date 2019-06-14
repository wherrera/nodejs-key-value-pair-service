/*
    Key Value Pair Storage Service
    Copyright (c) 2019 William Herrera
*/

const express = require('express');
const redis = require('redis').createClient(process.env.REDIS_URL);
const {promisify} = require('util');
const getAsync = promisify(redis.get).bind(redis);

const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 8080;

function requiresAuth(req, res, next)
{
    let api_key = null;
    if(req.query.API_KEY) {
        api_key = req.query.API_KEY;
    }
    else if(req.body.API_KEY) {
        api_key = req.body.API_KEY;
    } else {
        res.status(401).json({"error":"missing API_KEY"});
        return;
    }
    if(api_key !== API_KEY) {
        res.status(500).json({"error":"auth failed"});
    } else {
        next();
    }
}

var app = express();

//app.use(express.json());

app.post("/", requiresAuth, function(req, res) {

    let key = req.query.key;

    if(!key) {
        res.status(500).json({"error":"missing parameters"});
        return;
    }

    var body = [];
    req.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body).toString();
      let result = redis.set(key, body);
      if(result) {
        res.status(200).json({"result": result});
      } else {
        res.status(500).json({"result": result});
      }
    });
});

app.get("/", requiresAuth, async function(req, res) {

    let key = req.query.key;

    if(!key) {
        res.status(500).json({"error":"missing parameters"});
        return;
    }

    let value = await getAsync(key);

    if (value != null)
    {
        res.send(value);
        res.end();
    }
    else {
        res.status(500).json({"error":"invalid key"});
    }
});

app.listen(PORT);