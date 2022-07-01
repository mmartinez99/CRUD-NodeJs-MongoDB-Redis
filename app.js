const express = require("express"),
    path = require('path')
app = express(),
    mongoose = require("mongoose"),
    bodyParser = require("body-parser"),
    multer = require("multer"),
    upload = multer()
clearCache = require('./services/cache')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

// MONGODB SETUP
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


mongoose.connect('mongodb://localhost:27017/bibliothequeredismongo', {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})
mongoose.connection
    .once('open', () => console.log('connected to database'))
    .on('error', (err) => console.log("connection to database failed!!", err))

const bibliotheque = require('./models/bibliotheque');

app.use(upload.array());
app.use(express.static('public'));

// ROUTES


//Index
app.get('/', (req, res) => {
    res.render('index', {title: 'Les Bibliotheques'});

})

//Toutes les bibliotheques JSON
app.get('/All', (req, res) => {
    bibliotheque.find({})
        .then((data) => {
            res.json({found: true, data: data});
        })
        .catch((err) => {
            console.log(err)
            res.json({found: false, data: null});
        })
    //res.render('alls', {tabloBibli: datas});

})
//Toutes les bibliotheques en PUG
app.get('/AllBibliotheque', (req, res) => {
    bibliotheque.find({})
        .then(data => res.render('allBiblio', {tableaubibli: data}), {title: 'Toutes les Bibliotheques'})
})


//Formualire ADD
app.get('/AddNewBibli', (req, res) => {
    res.render('bibliotheque', {title: 'Les Bibliotheques'});
})
//ADD Bibli
app.post('/bibliotheque', (req, res) => {
    new bibliotheque(req.body)
        .save()
        .then((v_data) => {
            console.log(v_data);
            res.json({save: true})
            clearCache(v_data._doc.nometablissement) // supprime dans Redis

        })
        .catch((err) => {
            console.log(err)
            res.json({save: false})
        })
})

app.get('/:id/', (req, res) => {
    bibliotheque.find({_id: req.params['id']})
        .cache(req.body.nometablissement) // ecrit la 1 ere fois dans Redis Si dans Redis id existe alors elle l'affiche sinon elle l'insere (Gain de temps + rapide)
        .then((data) => {
            if (data) {
                res.json({found: true, data: data})
            } else {
                res.json({found: false, data: null})
            }
        })
        .catch((err) => {
            console.log(err)
            res.json({found: false, data: null})
        })
});

app.get('/bibli/:id/', (req, res) => {
    bibliotheque.find({_id: req.params['id']})
         .cache(req.params['id']) // ecrit la 1 ere fois dans Redis Si dans Redis id existe alors elle l'affiche sinon elle l'insere
        .then((data) => {
            if (data) {
                res.render('editBibli', {data: data})

            }

        })

});

//DELETE PUG
app.get('/bibliotheque/delete/:id', function (req, res) {
    // bibliotheque.del(req.params['id']);
    bibliotheque.deleteOne({_id: req.params['id']})
        .then(
            () => {

                res.redirect('/AllBibliotheque');

            }
        ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
});


//DELETE JSON
app.delete('/bibli/delete/:id', (req, res, next) => {
    bibliotheque.deleteOne({_id: req.params['id']})
        .then(
        () => {
            res.status(200).json({
                message: 'Bibli Supprimé!'
            });
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
});

app.put('/edit/:id', (req, res, next) => {
    const bibliothequeUpdate = bibliotheque({
        _id: req.params['id'],
        telephone: req.body['telephone'],
        commune: req.body.commune,
        services_proposes: req.body.services_proposes,
        nomrue: req.body.nomrue,
        descoll: req.body.descoll,
        codepostal: req.body.codepostal,
        nometablissement: req.body.nometablissement,
        heuresouverture: req.body.heuresouverture
    });
    bibliotheque.updateOne({_id: req.params['id']}, bibliothequeUpdate)
        .then(
        () => {
            res.json({save: true})
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
});
app.post('/edit/:id', (req, res, next) => {
    const bibliothequeUpdate = bibliotheque({
        _id: req.params['id'],
        telephone: req.body['telephone'],
        commune: req.body.commune,
        services_proposes: req.body.services_proposes,
        nomrue: req.body.nomrue,
        descoll: req.body.descoll,
        codepostal: req.body.codepostal,
        nometablissement: req.body.nometablissement,
        heuresouverture: req.body.heuresouverture
    });
    bibliotheque.updateOne({_id: req.params['id']}, bibliothequeUpdate).then(
        () => {
            res.redirect('/AllBibliotheque')
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
});
app.listen(3000, () => console.log("server started at port:3000"))

