import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import hbs from "express-handlebars";
import bCrypt from "bcrypt";
import mongoose from "mongoose";
import UsuariosSchema from "./models/usersModel.js";
import productModel from "./models/productModel.js";
import rutaNueva from "./router/routers.js";
import * as dotenv from 'dotenv'
dotenv.config();
import MongoStore from "connect-mongo";
import yargs from "yargs";
import pino from "pino";

//passport imports
import passport from "passport";
import { Strategy } from "passport-local";

const localStrategy = Strategy;

const app = express();
const loggerError = pino('error.log')
const loggerWarn = pino('warning.log')
const loggerInfo = pino()

loggerError.level = 'error'
loggerWarn.level = 'warn'
loggerInfo.level = 'info'

//servidor
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/*----------- Session -----------*/
app.use(cookieParser());
app.use(
	session({
		secret: "SECRETO",
		resave: false,
		saveUninitialized: false,
		store: new MongoStore({
			mongoUrl: process.env.URL_BD,
			retries: 0,
			ttl: 10 * 60,
		}),
		cookie: {
			maxAge: 10000,
		},
	})
);

//middlewares passport
app.use(passport.initialize());
app.use(passport.session());
app.use(rutaNueva);

//container
class Productos {
    constructor() {
        this.url = process.env.URL_BD
        this.mongodb = mongoose.connect
    } 

    async getAll() {
        try {
            await this.mongodb(this.url)
            return await productModel.find().lean()
        } catch (error) {
            console.log(error);
        }
    }
}

const claseProductos = new Productos();


//estrategias
passport.use(
	"register",
	new localStrategy(
		{ passReqToCallback: true, usernameField: 'correo', passwordField: 'password' },
		async (req, username, password, done) => {
			console.log("register", username + password);
			mongoose.connect(process.env.URL_BD);
			try {
				UsuariosSchema.create(
					{
						username,
						password: createHash(password),
						correo: req.body.correo,
					},
					(err, userWithId) => {
						if (err) {
							console.log(err)
							return done(err, null);
						}
						return done(null, userWithId);
					}
				);
			} catch (e) {
				return done(e, null);
			}
		}
	)
);

passport.use(
	"login",
	new localStrategy((username, password, done) => {
		mongoose.connect(process.env.URL_BD);
		try {
			UsuariosSchema.findOne(
				{
					username,
				
				},
				(err, user) => {
					if (err) {
						return done(err, null);
					}
					

					if (!user){
						return done(null, false)
					}

					if(!isValidPassword(user, password)){
						return done(null, false)
					}

					return done(null, user)
				}
			);
		} catch (e) {
			return done(e, null);
		}
	})
);

//serializar y deserializar

passport.serializeUser((usuario, done) => {
	console.log(usuario);
	done(null, usuario._id);
});

passport.deserializeUser((id, done) => {
	UsuariosSchema.findById(id, done);
});

//
function createHash(password) {
	return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

function isValidPassword(user, password) {
	return bCrypt.compareSync(password, user.password);
}

// motor de vistas
app.set("views", "./src/views");

app.engine(
	".hbs",
	hbs.engine({
		defaultLayout: "main",
		layoutsDir: "./src/views/layouts",
		extname: ".hbs",
	})
);
app.set("view engine", ".hbs");
//rutas

app.use((req, res, next) => {
	loggerInfo.info(`Petición entrante --> Ruta: ${req.url}, Metodo: ${req.method}`)
	next()
})

app.use('*', (req, res) => {
    loggerWarn.warn('ruta incorrecta');
    loggerInfo.warn('ruta incorrecta');
    res.send("ruta incorrecta");
});

app.get("/", (req, res) => {
	res.redirect("/login");
});

app.post(
	"/login",
	passport.authenticate("login", {
		failureRedirect: "/login-error",
	}), function (req, res){
		claseProductos.getAll().then(result => {
			console.log(result),
			res.render("datos", {username: req.body.username, hayProductos: result.length > 0, productos: result})});
	}
);

app.get("/login", (req, res) => {
	res.render("login");
});

app.get("/login-error", (req, res) => {
	loggerError.error('error de datos'),
	loggerInfo.error('error de datos')
	res.render("login-error");
});

app.post(
	"/registrar",
	passport.authenticate("register", {
		successRedirect: "/login",
		failureRedirect: "/register-error",
	})
);

app.get("/registrar", (req, res) => {
	res.render("register");
});

app.get("/register-error", (req, res) => {
	loggerError.error('error de datos'),
	loggerInfo.error('error de datos')
	res.render("register-error");
});

app.get("/logout", function (req, res) {
	res.render("logout");
});

//servidor
const args = yargs(process.argv.slice(2))
.alias({
	m: "modo",
	p: "puerto",
	d: "debug",
})
.default({
	modo: "prod",
	puerto: 8080,
	debug: false,
}).argv;

const PORT = 8080 || parseInt(args.p)

app.get("/datos", (req, res) => {
	console.log(`port ${PORT} -> FYH ${Date.now()}`);
	res.send(`servidor express <span style="color:blueviolet;"> (NGINX)</span> 
		en ${PORT} <b>PID: ${process.pid}</b> - ${new Date().toLocaleString()} as ${
		process.argv
	}`);
});

const server = app.listen(args.p, () => {
		console.log(`Http server started on port ${server.address().port}`)
	})
	server.on("error", (error) => console.log(`Error in server ${error}`))