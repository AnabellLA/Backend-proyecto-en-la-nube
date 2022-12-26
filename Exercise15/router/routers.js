import { Router } from 'express'
import path from 'path'
import { fork } from "child_process"
import numCpu from "os"
import compression from 'compression'

const procesador = numCpu.cpus().length
const rutaNueva = new Router()

rutaNueva.use(compression());

rutaNueva.get("/info", (req, res) => {
    let datos = {
        title: process.title,
        path: process.argv[1],
        sistema: process.platform,
        processId: process.pid,
        version: process.version,
        carpeta: process.cwd(),
        memoria: process.memoryUsage().rss,
        procesadores: procesador,
    }
    console.log(datos)
    res.render("info", datos);
});

rutaNueva.route("/api/randoms").get(async(req, res) => {
    const forked = fork(path.join('calculo.js'))
    //Se dejó en 100000 porque la computar no soportaba calcular más números
    const random = req.query.cant||100000
    forked.send(random)
    forked.on('message', msg =>{
        res.send(msg)
    });      
});

export default rutaNueva