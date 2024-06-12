// REQUIRES & IMPORTS

const ejs = require('ejs')
const express = require('express')
const body_parser = require('body-parser')
const mongoose = require('mongoose')
const _ = require('lodash')
// fecha = require(__dirname + '/fecha.js')

// BASE DE DATOS (MONGOOSE)
usuario = encodeURIComponent('ominon')
contraseña = encodeURIComponent('bo9aUkXMHquMRubv')
base_de_datos = 'listaDB'
url = 'mongodb://localhost:27017/'
uri = "mongodb+srv://" + usuario + ":" + contraseña + "@cluster0.yplqi7l.mongodb.net/" + base_de_datos

conectar = async () => {
// Conectar //
    mongoose.connect(uri);
}
conectar().catch(error => console.log(error));
    
// Esquemas //
esquema_elemento = new mongoose.Schema({
    name:{
        type: String,
        required: true
    }
})

esquema_lista = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    elementos:[esquema_elemento]
})
// Modelos //
Elemento = mongoose.model('elemento', esquema_elemento);
Lista = mongoose.model('lista', esquema_lista)

// APP
app = express()
app.set('view engine', 'ejs')
app.use(body_parser.urlencoded({extended: true}));
app.use(express.static('public'));

// VARIABLES GLOBALES
elemento_1 = new Elemento ({
    name: 'comprar'
})

elemento_2 = new Elemento ({
    name: 'cocinar'
})

elemento_3 = new Elemento ({
    name: 'comer'
})

elementos_Xdefecto = [elemento_1, elemento_2, elemento_3]

// FUNCIONES GLOBALES 
buscar_varios = async (coleccion, filtro) => {
    busqueda = await coleccion.find(filtro)
    return busqueda
}

buscar = async (coleccion, filtro) =>{
    busqueda = await coleccion.findOne(filtro)
    return busqueda
}

eliminar_xid = async (coleccion, filtro) =>{
    busqueda = await coleccion.findByIdAndDelete(filtro)
    return busqueda
}

buscar_actualizar = async (coleccion, filtro, elemento) => {
    busqueda = await coleccion.findOneAndUpdate(filtro, elemento)
    return busqueda
}

// GET
app.get('/', (demnd, resp) => {
    filtro = {}
    lista_de_elementos = buscar_varios(Elemento, filtro).then((listas, err) => {
        if (!err) {
            if (listas.length === 0) {
                Elemento.insertMany(elementos_Xdefecto);
                resp.redirect('/')
            } else {
                resp.render('base', {lista_de: 'hoy', mi_lista: listas})
            }
        } else {
            console.log(err);
        }
    })
});

app.get('/:lista', (demnd, resp) => {
    nombre_lista = _.lowerCase(demnd.params.lista)
    filtro = {name: nombre_lista} 
    lista_q = buscar(Lista, filtro).then(async (lista,err) => {
        if (!err) {
            if (!lista) {
                    // CREAR LISTA //
                lista_nueva = new Lista ({
                    name: nombre_lista,
                    elementos: elementos_Xdefecto
                })
                await lista_nueva.save()
        
                    // REDIRECT //
                resp.redirect('/' + nombre_lista)
            } else {
                // MOSTRAR LISTA //
                resp.render('base', {lista_de: lista.name, mi_lista: lista.elementos})
            }
        }
    })
});

// POST
app.post('/', (demnd, resp) => {
    nuevo_input = demnd.body.nuevo
    nombre_lista = demnd.body.lista_de
    nuevo_elemento = new Elemento ({
            name: nuevo_input
    })
    if (nombre_lista === 'hoy' ) {
        nuevo_elemento.save()
        resp.redirect('/')
    } else {
        filtro = {name: nombre_lista}
        listas_q = buscar(Lista, filtro).then(async (lista, err) => {
            await lista.elementos.push(nuevo_elemento)
            lista.save()
            resp.redirect('/' + nombre_lista)
        })
    }


});
 
app.post('/eliminar', (demnd, resp) => {
    id_elemento_marcado = demnd.body.marcado
    nombre_lista = demnd.body.lista_de
    if (nombre_lista === 'hoy') {
        eliminar_xid(Elemento, id_elemento_marcado)
        resp.redirect('/')
    } else {
        filtro = {name: nombre_lista}
        pull = {$pull: {elementos: {_id: id_elemento_marcado}}}
        eliminar = buscar_actualizar(Lista, filtro, pull).then((elemento, err) => {
            if (!err) {
                resp.redirect('/' + nombre_lista)
            }
        })
    }
});


// PUERTO
const puerto = process.env.PORT || 3000

app.listen(puerto, () => {
    console.log(puerto + ' OK')
});
