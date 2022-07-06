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


mongoose.connect('mongodb://localhost:27017/bibliothequeredismongo2', {
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
        .cache()
        .then((data) => {
            res.json({found: true, data: data});
        })
        .catch((err) => {
            console.log(err)
            res.json({found: false, data: null});
        })

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
            clearCache(v_data._doc.refBibli)
            // supprime dans Redis

        })
        .catch((err) => {
            console.log(err)
            res.json({save: false})
        })
})

app.get('/:id/', (req, res) => {
    bibliotheque.find({refBibli: req.params['id']})// demande serveur
      //  .toto()// a partir id recup nom dans document et le transmet dans le .cache
    .cache(req.params['id'])
        // ecrit la 1 ere fois dans Redis Si dans Redis id existe alors elle l'affiche sinon elle l'insere (Gain de temps + rapide)
        .then((data) => {
            if (data) {
                res.json({found: true, data: data})
                //console.log(data["0"]._doc.nometablissement)
            } else {
                res.json({found: false, data: null})
            }

        })
        .catch((err) => {
            console.log(err)
            res.json({found: false, data: null})
        })
    //console.log(req.body);

});

app.get('/bibli/:id/', (req, res) => {
    bibliotheque.find({refBibli: req.params['id']})
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
    bibliotheque.deleteOne({refBibli: req.params['id']})
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
    bibliotheque.deleteOne({refBibli: req.params['id']})
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
        _id:  req.body.id,
        telephone: req.body['telephone'],
        commune: req.body.commune,
        services_proposes: req.body.services_proposes,
        nomrue: req.body.nomrue,
        descoll: req.body.descoll,
        codepostal: req.body.codepostal,
        nometablissement: req.body.nometablissement,
        heuresouverture: req.body.heuresouverture,
        refBibli:req.params['id']
    });
    bibliotheque.updateOne({refBibli: req.params['id']}, bibliothequeUpdate)
        .cache(req.body.refBibli)
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
        heuresouverture: req.body.heuresouverture,
        refBibli: req.body.refBibli

    });
    bibliotheque.updateOne({_id: req.params['id']}, bibliothequeUpdate)
        .cache(req.body.refBibli)
        .then(
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

