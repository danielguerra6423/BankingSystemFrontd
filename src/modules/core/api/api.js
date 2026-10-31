import * as backendApi from './backendApi.js'
import * as localApi from './localApi.js'

// Interruptor de almacenamiento:
//  - false: todo va al backend Spring Boot y se guarda en MySQL (backendApi.js)
//  - true:  todo se guarda en el localStorage del navegador (localApi.js); útil
//           solo para una demostración sin backend
export const USE_LOCAL_STORAGE = false

const api = USE_LOCAL_STORAGE ? localApi : backendApi

export const {
  registrarCuenta, iniciarSesion, actualizarContacto, cambiarClave, abrirCuenta,
  solicitarTarjeta, cancelarTarjeta, buscarCuentaDestino, buscarDestinoPorCelular,
} = api

// Operaciones con dinero: solo existen en el backend. En modo local las
// calcula App.jsx en memoria y las guarda con saveBalances.
export const { consignar, retirar, transferir, comprarConTarjeta, pagarTarjeta, bloquearTarjeta } = backendApi
