const express = require('express')
const app = express()
const port = 3000
app.use(express.json())

let data = [
    {
        "id": "1",
        "title": "a title",
        "views": 100
    },
    {
        "id": "2",
        "title": "another title",
        "views": 200
    },
    {
        "id": "3",
        "title": "haha",
        "views": 3000
    },
    {
        "id": "7",
        "title": "kem10",
        "views": 1000
    },
    {
        "id": "6",
        "title": "h50",
        "views": 200
    },
    {
        "id": "8",
        "title": "nghiep",
        "views": 700
    },
    {
        "id": "15",
        "title": "Mu",
        "views": 99,
        "isDeleted": true
    },
    {
        "title": "Chu tu",
        "views": 90,
        "id": "4",
        "isDeleted": true
    }
]

app.get('/api/v1/products/:ids', (req, res) => {
    let id = req.params.ids
    let result = data.find(
        function (e) {
            return !(e.isDeleted) && e.id == id
        }
    )
    if (result) {
        res.status(200).send(result)
    } else {
        res.status(404).send({
            message: "ID NOT FOUND"
        })
    }

})
//api/v1/products?title=a
app.get('/api/v1/products', (req, res) => {
    let queries = req.query;
    let titleQ = queries.title ? queries.title : '';
    let maxView = queries.maxview ? queries.maxview : 1E4;
    let minView = queries.minview ? queries.minview : 0;
    let page = queries.page ? queries.page : 1;
    let limit = queries.limit ? queries.limit : 5;
    let result = data.filter(
        function (e) {
            return !(e.isDeleted) && e.title.includes(titleQ)
                && minView <= e.views && e.views <= maxView
        }
    )
    result = result.splice(limit * (page - 1), limit)
    res.status(200).send(result)
})
app.post('/api/v1/products', function (req, res) {
    let id = req.body.id;
    if (id) {
        let result = data.find(function (e) {
            return e.id == id
        })
        if (result) {
            res.status(404).send({
                message: "duplicated id"
            });
            return;
        }
    } else {
        id = Math.max(...(data.map(function (e) {
            return Number.parseInt(e.id)
        }))) + 1 + "";
    }
    let newObj = {
        id: id,
        title: req.body.title,
        views: req.body.views
    }
    data.push(newObj);
    res.send(newObj);

})
app.put('/api/v1/products/:ids', function (req, res) {
    let id = req.params.ids
    let result = data.find(
        function (e) {
            return !(e.isDeleted) && e.id == id
        }
    )
    if (result) {
        let keys = Object.keys(req.body);
        for (const key of keys) {
            if (result[key]) {
                result[key] = req.body[key]
            }
        }
        res.status(200).send(result)
    } else {
        res.status(404).send({
            message: "ID NOT FOUND"
        })
    }
})
app.delete('/api/v1/products/:ids', function (req, res) {
    let id = req.params.ids
    let result = data.find(
        function (e) {
            return !(e.isDeleted) && e.id == id
        }
    )
    if (result) {
        result.isDeleted=true
        res.status(200).send(result)
    } else {
        res.status(404).send({
            message: "ID NOT FOUND"
        })
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
