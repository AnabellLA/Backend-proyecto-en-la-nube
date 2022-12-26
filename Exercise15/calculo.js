process.on("message", msg =>{
    let numeros = [];
    let objetoNumeros = [];
    const generarNumeros = () => {
        for (let i = 0; i < msg; i++) { 		
            numeros.push(parseInt(Math.random() * 1000 + 1)); 	
        }
        verificar(); 
        return objetoNumeros
    }; 
    const verificar = () => { 	
        for (let j = 0; j <= (msg - 1); ) {
            let contador = 0; 	
            let valor = numeros[j]; 
            let arraycontador = numeros.filter(element => element === valor)
            contador = arraycontador.length
            objetoNumeros.push({
                id: parseInt(valor),
                cant: contador,
                num: j+1}); 			
            j++;	
        }
    };  
    process.send(generarNumeros());
})