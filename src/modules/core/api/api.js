import * as backendApi from './backendApi.js'
import * as localApi from './localApi.js'

// Interruptor de almacenamiento:
//  - true:  todo se guarda en el localStorage del navegador (localApi.js)
//  - false: registro, login y perfil van al backend Spring Boot + MySQL (backendApi.js)
export const USE_LOCAL_STORAGE = true

const api = USE_LOCAL_STORAGE ? localApi : backendApi

export const { registrarCuenta, iniciarSesion, actualizarContacto, cambiarClave, abrirCuenta, solicitarTarjeta, cancelarTarjeta } = api
